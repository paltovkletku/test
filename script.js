/* script.js
   ToDo Лабораторная работа :)
   Всё создаётся через JS. 
   Постарался ничего не писать в HTML кроме <script>.
*/

// Ключ для localStorage
var STORAGE_KEY = 'todo_lab_tasks_v1';

// Массив с задачами
var tasks = [];

// Настройки
var sortAsc = true; // сортировка по дате
var filterMode = 'all'; // all | active | done
var searchQuery = ''; // строка поиска

// Загружаем задачи из localStorage (если есть)
function loadTasks() {
  var data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    tasks = JSON.parse(data);
  } else {
    tasks = [];
  }
}

// Сохраняем задачи
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Простая функция для генерации id
function generateId() {
  return Date.now().toString() + Math.random().toString().slice(2, 6);
}

// Создание всей страницы
var container = document.createElement('div');
container.className = 'container';
document.body.appendChild(container);

var card = document.createElement('section');
card.className = 'card';
container.appendChild(card);

// Заголовок
var header = document.createElement('header');
header.className = 'header';
card.appendChild(header);

var title = document.createElement('h1');
title.textContent = 'Мой ToDo список';
header.appendChild(title);

// Панель с управлением
var controls = document.createElement('div');
controls.className = 'controls';
header.appendChild(controls);

// Поиск
var inputSearch = document.createElement('input');
inputSearch.type = 'search';
inputSearch.placeholder = 'Поиск...';
controls.appendChild(inputSearch);

// Фильтр
var selectFilter = document.createElement('select');
var opt1 = document.createElement('option');
opt1.value = 'all';
opt1.textContent = 'Все';
selectFilter.appendChild(opt1);

var opt2 = document.createElement('option');
opt2.value = 'active';
opt2.textContent = 'Невыполненные';
selectFilter.appendChild(opt2);

var opt3 = document.createElement('option');
opt3.value = 'done';
opt3.textContent = 'Выполненные';
selectFilter.appendChild(opt3);

controls.appendChild(selectFilter);

// Кнопка сортировки
var btnSort = document.createElement('button');
btnSort.textContent = 'Сортировать ↑';
controls.appendChild(btnSort);

// Форма добавления задачи
var form = document.createElement('form');
form.className = 'form-row';
card.appendChild(form);

var inputTitle = document.createElement('input');
inputTitle.type = 'text';
inputTitle.placeholder = 'Название задачи';
inputTitle.required = true;
form.appendChild(inputTitle);

var inputDate = document.createElement('input');
inputDate.type = 'date';
form.appendChild(inputDate);

var btnAdd = document.createElement('button');
btnAdd.type = 'submit';
btnAdd.textContent = 'Добавить';
form.appendChild(btnAdd);

// Список задач
var list = document.createElement('ul');
list.className = 'list';
card.appendChild(list);

// Пустое сообщение
var emptyNote = document.createElement('div');
emptyNote.className = 'empty-note';
emptyNote.textContent = 'Задач пока нет...';
card.appendChild(emptyNote);

// Нижняя панель
var footer = document.createElement('footer');
footer.className = 'footer';
card.appendChild(footer);

var counter = document.createElement('div');
counter.textContent = '';
footer.appendChild(counter);

var btnClearDone = document.createElement('button');
btnClearDone.textContent = 'Удалить выполненные';
footer.appendChild(btnClearDone);

// Формат даты для человека
function formatDate(dateStr) {
  if (!dateStr) return 'Без даты';
  var d = new Date(dateStr);
  return d.toLocaleDateString();
}

// Создание одной задачи
function createTaskElement(task) {
  var li = document.createElement('li');
  li.className = 'task-item';
  if (task.done) li.classList.add('done');
  li.setAttribute('draggable', 'true');
  li.dataset.taskId = task.id;

  // чекбокс
  var check = document.createElement('button');
  check.className = 'checkbox';
  check.textContent = task.done ? '✓' : '';
  li.appendChild(check);

  // текст
  var textDiv = document.createElement('div');
  textDiv.className = 'task-title';
  textDiv.textContent = task.title;
  li.appendChild(textDiv);

  // дата / крайний срок
  var meta = document.createElement('div');
  meta.className = 'task-meta';
  if (task.date) {
    meta.textContent = 'Крайний срок: ' + formatDate(task.date);
  } else {
    meta.textContent = 'Крайний срок: без даты';
  }
  li.appendChild(meta);

  // кнопки
  var actions = document.createElement('div');
  actions.className = 'actions';
  li.appendChild(actions);

  var btnEdit = document.createElement('button');
  btnEdit.textContent = 'Изменить';
  actions.appendChild(btnEdit);

  var btnDelete = document.createElement('button');
  btnDelete.textContent = 'Удалить';
  actions.appendChild(btnDelete);

  // события
  check.addEventListener('click', function() {
    toggleDone(task.id);
  });
  btnDelete.addEventListener('click', function() {
    deleteTask(task.id);
  });
  btnEdit.addEventListener('click', function() {
    openEditDialog(task);
  });

  // drag and drop
  li.addEventListener('dragstart', function(e) {
    e.dataTransfer.setData('text/plain', task.id);
    li.classList.add('dragging');
  });
  li.addEventListener('dragend', function() {
    li.classList.remove('dragging');
  });

  return li;
}

// Рендеринг задач
function renderTasks() {
  list.innerHTML = '';

  var visibleTasks = tasks.slice();

  // Поиск
  if (searchQuery.trim() !== '') {
    var q = searchQuery.toLowerCase();
    visibleTasks = visibleTasks.filter(function(t) {
      return t.title.toLowerCase().includes(q);
    });
  }

  // Фильтр
  if (filterMode === 'active') visibleTasks = visibleTasks.filter(t => !t.done);
  if (filterMode === 'done') visibleTasks = visibleTasks.filter(t => t.done);

  // Сортировка
  visibleTasks.sort(function(a, b) {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });
  if (!sortAsc) visibleTasks.reverse();

  // Отображаем
  if (visibleTasks.length === 0) {
    emptyNote.style.display = 'block';
  } else {
    emptyNote.style.display = 'none';
    for (var i = 0; i < visibleTasks.length; i++) {
      list.appendChild(createTaskElement(visibleTasks[i]));
    }
  }

  // Счётчик
  var doneCount = tasks.filter(t => t.done).length;
  counter.textContent = 'Всего: ' + tasks.length + ' | Выполнено: ' + doneCount;
}

// Добавление задачи
function addTask(title, date) {
  var newTask = {
    id: generateId(),
    title: title,
    date: date,
    done: false
  };
  tasks.push(newTask);
  saveTasks();
  renderTasks();
}

// Удаление
function deleteTask(id) {
  tasks = tasks.filter(function(t) {
    return t.id !== id;
  });
  saveTasks();
  renderTasks();
}

// Переключение выполненности
function toggleDone(id) {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === id) {
      tasks[i].done = !tasks[i].done;
    }
  }
  saveTasks();
  renderTasks();
}

/* ==========================
   Простая самодельная модалка
   ========================== */
var modalOverlay = document.createElement('div');
modalOverlay.className = 'modal-overlay';
modalOverlay.style.display = 'none';
document.body.appendChild(modalOverlay);

var modalWindow = document.createElement('div');
modalWindow.className = 'modal-window';
modalOverlay.appendChild(modalWindow);

var modalTitle = document.createElement('h3');
modalWindow.appendChild(modalTitle);

var modalContent = document.createElement('div');
modalContent.className = 'modal-content';
modalWindow.appendChild(modalContent);

var modalButtons = document.createElement('div');
modalButtons.className = 'modal-buttons';
modalWindow.appendChild(modalButtons);

function showModal(title, contentNode, buttons) {
  modalTitle.textContent = title;
  modalContent.innerHTML = '';
  modalContent.appendChild(contentNode);
  modalButtons.innerHTML = '';
  buttons.forEach(function(btn) {
    modalButtons.appendChild(btn);
  });
  modalOverlay.style.display = 'flex';
}

function closeModal() {
  modalOverlay.style.display = 'none';
}

// Редактирование задачи
function openEditDialog(task) {
  var wrapper = document.createElement('div');

  var lbl1 = document.createElement('label');
  lbl1.textContent = 'Название:';
  var input1 = document.createElement('input');
  input1.type = 'text';
  input1.value = task.title;
  input1.style.display = 'block';
  input1.style.marginBottom = '10px';

  var lbl2 = document.createElement('label');
  lbl2.textContent = 'Дата (YYYY-MM-DD):';
  var input2 = document.createElement('input');
  input2.type = 'date';
  input2.value = task.date || '';

  wrapper.appendChild(lbl1);
  wrapper.appendChild(input1);
  wrapper.appendChild(lbl2);
  wrapper.appendChild(input2);

  var btnOk = document.createElement('button');
  btnOk.textContent = 'Сохранить';
  btnOk.addEventListener('click', function() {
    task.title = input1.value.trim() || task.title;
    task.date = input2.value;
    saveTasks();
    renderTasks();
    closeModal();
  });

  var btnCancel = document.createElement('button');
  btnCancel.textContent = 'Отмена';
  btnCancel.addEventListener('click', closeModal);

  showModal('Изменение задачи', wrapper, [btnOk, btnCancel]);
}

// drag & drop перестановка
// dragover — вставка на место, куда тащим
list.addEventListener('dragover', function(e) {
  e.preventDefault();
  const draggingEl = list.querySelector('.dragging');
  const afterElement = getDragAfterElement(list, e.clientY);
  if (afterElement == null) {
    list.appendChild(draggingEl);
  } else {
    list.insertBefore(draggingEl, afterElement);
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// drop — обновляем массив tasks по новому порядку
list.addEventListener('drop', function(e) {
  e.preventDefault();
  const newTasks = [];
  list.querySelectorAll('.task-item').forEach(li => {
    const task = tasks.find(t => t.id === li.dataset.taskId);
    if (task) newTasks.push(task);
  });
  tasks = newTasks;
  saveTasks();
  renderTasks();
});


// Слушатели
form.addEventListener('submit', function(e) {
  e.preventDefault();
  var title = inputTitle.value.trim();
  var date = inputDate.value;
  if (title === '') {
    alert('Введите название задачи');
    return;
  }
  addTask(title, date);
  inputTitle.value = '';
  inputDate.value = '';
});

inputSearch.addEventListener('input', function() {
  searchQuery = inputSearch.value;
  renderTasks();
});

selectFilter.addEventListener('change', function() {
  filterMode = selectFilter.value;
  renderTasks();
});

btnSort.addEventListener('click', function() {
  sortAsc = !sortAsc;
  btnSort.textContent = sortAsc ? 'Сортировать ↑' : 'Сортировать ↓';
  renderTasks();
});

// Новая версия удаления выполненных через модалку
btnClearDone.addEventListener('click', function() {
  var wrapper = document.createElement('div');
  wrapper.textContent = 'Удалить все выполненные задачи?';

  var btnYes = document.createElement('button');
  btnYes.textContent = 'Да';
  btnYes.addEventListener('click', function() {
    tasks = tasks.filter(t => !t.done);
    saveTasks();
    renderTasks();
    closeModal();
  });

  var btnNo = document.createElement('button');
  btnNo.textContent = 'Отмена';
  btnNo.addEventListener('click', closeModal);

  showModal('Подтверждение', wrapper, [btnYes, btnNo]);
});

// Запуск
loadTasks();
renderTasks();
