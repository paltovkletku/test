/* script.js
   Весь DOM создаётся через этот файл.
   Никакого innerHTML, всё через createElement / appendChild.
*/

/* ====== Настройки ====== */
const STORAGE_KEY = 'todo_lab_tasks_v1';

/* ====== Вспомогательные функции ====== */
// Простая уникалка для id
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}
function formatDateReadable(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

/* ====== Работа с localStorage ====== */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Ошибка чтения localStorage', err);
    return [];
  }
}
function saveTasks(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error('Ошибка записи localStorage', err);
  }
}

/* ====== Состояние приложения ====== */
let tasks = loadTasks();         // массив задач
let sortAsc = true;             // сортировка по дате: сначала старые
let filterMode = 'all';         // all | active | done
let searchQuery = '';           // строка поиска

/* ====== Создаем базовую структуру страницы (через DOM) ====== */
const body = document.body;

const container = document.createElement('div');
container.className = 'container';
body.appendChild(container);

const card = document.createElement('section');
card.className = 'card';
container.appendChild(card);

/* Header */
const header = document.createElement('header');
header.className = 'header';
card.appendChild(header);

const title = document.createElement('h1');
title.className = 'title';
title.textContent = 'ToDo — лабораторная';
header.appendChild(title);

const headerControls = document.createElement('div');
headerControls.className = 'controls';
header.appendChild(headerControls);

// Поиск
const inputSearch = document.createElement('input');
inputSearch.className = 'search';
inputSearch.type = 'search';
inputSearch.placeholder = 'Поиск по названию...';
headerControls.appendChild(inputSearch);

// Фильтр
const selectFilter = document.createElement('select');
selectFilter.className = 'select';
[['all','Все'], ['active','Невыполненные'], ['done','Выполненные']].forEach(([val, txt]) => {
  const opt = document.createElement('option');
  opt.value = val;
  opt.textContent = txt;
  selectFilter.appendChild(opt);
});
headerControls.appendChild(selectFilter);

// Сортировка
const btnSort = document.createElement('button');
btnSort.className = 'button ghost';
btnSort.type = 'button';
btnSort.textContent = 'Сортировать по дате ↑';
headerControls.appendChild(btnSort);

/* Форма добавления задач */
const form = document.createElement('form');
form.className = 'form-row';
card.appendChild(form);

const inputTitle = document.createElement('input');
inputTitle.className = 'input';
inputTitle.type = 'text';
inputTitle.placeholder = 'Название задачи';
inputTitle.required = true;
form.appendChild(inputTitle);

const inputDate = document.createElement('input');
inputDate.className = 'input';
inputDate.type = 'date';
form.appendChild(inputDate);

const btnAdd = document.createElement('button');
btnAdd.className = 'button';
btnAdd.type = 'submit';
btnAdd.textContent = 'Добавить';
form.appendChild(btnAdd);

/* Список задач и пустая заметка */
const list = document.createElement('ul');
list.className = 'list';
card.appendChild(list);

const emptyNote = document.createElement('div');
emptyNote.className = 'empty-note';
emptyNote.textContent = 'Задач пока нет — добавь первую!';
card.appendChild(emptyNote);

/* Footer */
const footer = document.createElement('div');
footer.className = 'footer';
card.appendChild(footer);

const counter = document.createElement('div');
counter.textContent = '';
footer.appendChild(counter);

const actionsFooter = document.createElement('div');
actionsFooter.className = 'controls';
footer.appendChild(actionsFooter);

const btnClearDone = document.createElement('button');
btnClearDone.className = 'button ghost small';
btnClearDone.type = 'button';
btnClearDone.textContent = 'Удалить выполненные';
actionsFooter.appendChild(btnClearDone);

/* ====== Рендеринг ====== */
function render() {
  // Очищаем список
  while (list.firstChild) list.removeChild(list.firstChild);

  // Копируем и применяем фильтры/поиск/сортировку
  let visible = tasks.slice();

  // Поиск
  if (searchQuery.trim() !== '') {
    const q = searchQuery.trim().toLowerCase();
    visible = visible.filter(t => t.title.toLowerCase().includes(q));
  }

  // Фильтр по статусу
  if (filterMode === 'active') visible = visible.filter(t => !t.done);
  if (filterMode === 'done') visible = visible.filter(t => t.done);

  // Сортировка по дате: пустая дата в конец
  visible.sort((a,b) => {
    const da = a.date ? new Date(a.date) : null;
    const db = b.date ? new Date(b.date) : null;
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  });
  if (!sortAsc) visible.reverse();

  // Показать / скрыть пустую заметку
  emptyNote.style.display = visible.length === 0 ? 'block' : 'none';

  // Создать элементы
  visible.forEach(task => {
    const el = createTaskElement(task);
    el.draggable = true;
    el.dataset.taskId = task.id;
    list.appendChild(el);
  });

  // Счётчик
  const doneCount = tasks.filter(t => t.done).length;
  counter.textContent = `Всего: ${tasks.length} · Выполнено: ${doneCount}`;
}

/* ====== Создание DOM-элемента задачи ====== */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  if (task.done) li.classList.add('completed');

  // drag handle
  const dragHandle = document.createElement('span');
  dragHandle.className = 'drag-handle';
  dragHandle.textContent = '☰';
  dragHandle.title = 'Перетащить';
  li.appendChild(dragHandle);

  // чекбокс (кнопка)
  const check = document.createElement('button');
  check.className = 'checkbox';
  check.setAttribute('aria-pressed', task.done ? 'true' : 'false');
  check.title = task.done ? 'Отметить как невыполненное' : 'Отметить как выполненное';
  check.textContent = task.done ? '✓' : '';
  li.appendChild(check);

  // основная часть
  const main = document.createElement('div');
  main.className = 'task-main';
  li.appendChild(main);

  const t = document.createElement('div');
  t.className = 'task-title';
  t.textContent = task.title;
  main.appendChild(t);

  const meta = document.createElement('div');
  meta.className = 'task-meta';
  meta.textContent = task.date ? `Крайний срок: ${formatDateReadable(task.date)}` : 'Без даты';
  main.appendChild(meta);

  // действия
  const actions = document.createElement('div');
  actions.className = 'actions';
  li.appendChild(actions);

  const btnEdit = document.createElement('button');
  btnEdit.className = 'small btn-edit';
  btnEdit.type = 'button';
  btnEdit.textContent = 'Изменить';
  actions.appendChild(btnEdit);

  const btnDelete = document.createElement('button');
  btnDelete.className = 'small btn-delete';
  btnDelete.type = 'button';
  btnDelete.textContent = 'Удалить';
  actions.appendChild(btnDelete);

  // События
  check.addEventListener('click', () => toggleDone(task.id));
  btnDelete.addEventListener('click', () => removeTask(task.id));
  btnEdit.addEventListener('click', () => openEditDialog(task));

  // drag events для визуалки
  li.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    li.classList.add('dragging');
  });
  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
  });

  return li;
}

/* ====== CRUD операции ====== */
function addTask(titleText, dateText) {
  const newTask = {
    id: uid(),
    title: titleText,
    date: dateText || '',
    done: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  saveTasks(tasks);
  render();
}
function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  render();
}
function toggleDone(id) {
  tasks = tasks.map(t => t.id === id ? {...t, done: !t.done} : t);
  saveTasks(tasks);
  render();
}
function updateTask(id, newData) {
  tasks = tasks.map(t => t.id === id ? {...t, ...newData} : t);
  saveTasks(tasks);
  render();
}

/* ====== Редактирование — простая модалка ====== */
function openEditDialog(task) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.background = 'rgba(0,0,0,0.35)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 9999;

  const modal = document.createElement('div');
  modal.style.background = 'white';
  modal.style.padding = '16px';
  modal.style.borderRadius = '12px';
  modal.style.width = 'min(520px, 92%)';

  const h = document.createElement('h3');
  h.textContent = 'Редактировать задачу';
  modal.appendChild(h);

  const f = document.createElement('form');
  f.style.display = 'grid';
  f.style.gap = '8px';

  const inpTitle = document.createElement('input');
  inpTitle.type = 'text';
  inpTitle.className = 'input';
  inpTitle.value = task.title;
  f.appendChild(inpTitle);

  const inpDate = document.createElement('input');
  inpDate.type = 'date';
  inpDate.className = 'input';
  inpDate.value = task.date || '';
  f.appendChild(inpDate);

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.justifyContent = 'flex-end';
  row.style.gap = '8px';

  const btnCancel = document.createElement('button');
  btnCancel.type = 'button';
  btnCancel.className = 'button ghost';
  btnCancel.textContent = 'Отмена';
  row.appendChild(btnCancel);

  const btnSave = document.createElement('button');
  btnSave.type = 'submit';
  btnSave.className = 'button';
  btnSave.textContent = 'Сохранить';
  row.appendChild(btnSave);

  f.appendChild(row);
  modal.appendChild(f);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  btnCancel.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTitle = inpTitle.value.trim();
    const newDate = inpDate.value || '';
    if (!newTitle) return alert('Название не может быть пустым');
    updateTask(task.id, { title: newTitle, date: newDate });
    overlay.remove();
  });
}

/* ====== Drag & Drop для перестановки задач ====== */
// Простая реализация: при drop получаем id перетаскиваемой задачи и id задачи-цели,
// затем переставляем элементы в массиве tasks в новый порядок.
list.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
});
list.addEventListener('drop', (e) => {
  e.preventDefault();
  const draggedId = e.dataTransfer.getData('text/plain');
  if (!draggedId) return;

  // Куда бросили: ближайший li под курсором
  const targetLi = e.target.closest('li.task-item');
  const draggedTaskIndex = tasks.findIndex(t => t.id === draggedId);
  if (draggedTaskIndex === -1) return;

  let newIndex;
  if (!targetLi) {
    // Бросили в пустое место списка -> в конец
    newIndex = tasks.length - 1;
  } else {
    const targetId = targetLi.dataset.taskId;
    newIndex = tasks.findIndex(t => t.id === targetId);
    if (newIndex === -1) return;
  }

  // Если перетаскиваем вниз/вверх, учесть смещение при удалении
  const draggedTask = tasks.splice(draggedTaskIndex, 1)[0];

  // Если удалили элемент до новой позиции, newIndex уже сдвинут на -1, поэтому корректируем:
  if (draggedTaskIndex < newIndex) {
    // вставляем после newIndex (потому что мы уже удалили элемент выше)
    tasks.splice(newIndex, 0, draggedTask);
  } else {
    // вставляем перед newIndex
    tasks.splice(newIndex, 0, draggedTask);
  }

  saveTasks(tasks);
  render();
});

/* ====== Слушатели интерфейса ====== */
// Форма добавления
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = inputTitle.value.trim();
  const date = inputDate.value || '';
  if (!title) return alert('Введите название задачи');
  addTask(title, date);
  inputTitle.value = '';
  inputDate.value = '';
});

// Поиск
inputSearch.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  render();
});

// Фильтр
selectFilter.addEventListener('change', (e) => {
  filterMode = e.target.value;
  render();
});

// Сортировка
btnSort.addEventListener('click', () => {
  sortAsc = !sortAsc;
  btnSort.textContent = sortAsc ? 'Сортировать по дате ↑' : 'Сортировать по дате ↓';
  render();
});

// Удалить выполненные
btnClearDone.addEventListener('click', () => {
  if (!confirm('Удалить все выполненные задачи?')) return;
  tasks = tasks.filter(t => !t.done);
  saveTasks(tasks);
  render();
});

/* ====== Инициализация ====== */
render();
