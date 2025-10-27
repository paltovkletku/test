// === Простое ToDo-приложение на чистом JavaScript ===

// ключ для хранения данных в localStorage
const LOCAL_STORAGE_KEY = 'todo_lab_v1';

// массив задач
let taskList = [];

// состояние фильтров и сортировки
let sortAscending = true;
let currentFilter = 'all';
let searchText = '';

// ===== Работа с localStorage =====
function loadTasks() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  taskList = saved ? JSON.parse(saved) : [];
}

function saveTasks() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(taskList));
}

// простая генерация ID
function generateTaskId() {
  return Date.now() + Math.random().toString().substring(2, 5);
}

// ===== Создание интерфейса =====
const container = document.createElement('div');
container.className = 'container';
document.body.appendChild(container);

// заголовок
const pageTitle = document.createElement('h1');
pageTitle.textContent = 'Список дел';
container.appendChild(pageTitle);

// === Панель управления ===
const controlPanel = document.createElement('div');
controlPanel.className = 'controls';
container.appendChild(controlPanel);

const searchInput = document.createElement('input');
searchInput.placeholder = 'Поиск...';
controlPanel.appendChild(searchInput);

const filterSelect = document.createElement('select');
[
  { value: 'all', text: 'Все' },
  { value: 'active', text: 'Активные' },
  { value: 'done', text: 'Выполненные' }
].forEach(opt => {
  const option = document.createElement('option');
  option.value = opt.value;
  option.textContent = opt.text;
  filterSelect.appendChild(option);
});
controlPanel.appendChild(filterSelect);

const sortButton = document.createElement('button');
sortButton.textContent = 'Сортировать ↑';
controlPanel.appendChild(sortButton);

// === Форма добавления задачи ===
const addForm = document.createElement('form');
addForm.className = 'form-row';
container.appendChild(addForm);

const newTaskInput = document.createElement('input');
newTaskInput.placeholder = 'Новая задача';
newTaskInput.required = true;
addForm.appendChild(newTaskInput);

const newTaskDate = document.createElement('input');
newTaskDate.type = 'date';
addForm.appendChild(newTaskDate);

const addTaskButton = document.createElement('button');
addTaskButton.type = 'submit';
addTaskButton.textContent = 'Добавить';
addForm.appendChild(addTaskButton);

// === Список задач ===
const taskListElement = document.createElement('ul');
taskListElement.className = 'list';
container.appendChild(taskListElement);

// === Блок “нет задач” ===
const emptyMessage = document.createElement('div');
emptyMessage.className = 'empty-note';
emptyMessage.textContent = 'Нет задач...';
container.appendChild(emptyMessage);

// ====== Создание одного элемента задачи ======
function buildTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.id = task.id;
  li.draggable = true;

  if (task.done) li.classList.add('done');

  const checkButton = document.createElement('button');
  checkButton.className = 'checkbox';
  checkButton.textContent = task.done ? '✓' : '';
  li.appendChild(checkButton);

  const infoBlock = document.createElement('div');
  li.appendChild(infoBlock);

  const titleDiv = document.createElement('div');
  titleDiv.className = 'task-title';
  titleDiv.textContent = task.title;
  infoBlock.appendChild(titleDiv);

  const dateDiv = document.createElement('div');
  dateDiv.className = 'task-meta';
  dateDiv.textContent = task.date || 'Без даты';
  infoBlock.appendChild(dateDiv);

  const editButton = document.createElement('button');
  editButton.textContent = 'Изменить';
  li.appendChild(editButton);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Удалить';
  li.appendChild(deleteButton);

  // события
  checkButton.onclick = () => toggleTaskDone(task.id);
  deleteButton.onclick = () => deleteTask(task.id);
  editButton.onclick = () => openEditModal(task);

  return li;
}

// ====== Отрисовка всего списка ======
function updateTaskList() {
  // очищаем список
  while (taskListElement.firstChild) {
    taskListElement.removeChild(taskListElement.firstChild);
  }

  let visibleTasks = taskList.slice();

  // поиск
  if (searchText) {
    visibleTasks = visibleTasks.filter(t =>
      t.title.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  // фильтрация
  if (currentFilter === 'active') visibleTasks = visibleTasks.filter(t => !t.done);
  if (currentFilter === 'done') visibleTasks = visibleTasks.filter(t => t.done);

  // сортировка по дате
  visibleTasks.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
  if (!sortAscending) visibleTasks.reverse();

  emptyMessage.style.display = visibleTasks.length === 0 ? 'block' : 'none';

  // добавляем элементы в DOM
  visibleTasks.forEach(task => taskListElement.appendChild(buildTaskItem(task)));
}

// ====== Логика работы ======
function addTask(title, date) {
  taskList.push({
    id: generateTaskId(),
    title,
    date,
    done: false
  });
  saveTasks();
  updateTaskList();
}

function deleteTask(id) {
  taskList = taskList.filter(t => t.id !== id);
  saveTasks();
  updateTaskList();
}

function toggleTaskDone(id) {
  const task = taskList.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks();
    updateTaskList();
  }
}

// ====== Модальное окно редактирования ======
const modalOverlay = document.createElement('div');
modalOverlay.className = 'modal-overlay';

const modalWindow = document.createElement('div');
modalWindow.className = 'modal-window';

const modalTitle = document.createElement('h3');
modalTitle.textContent = 'Редактирование';
modalWindow.appendChild(modalTitle);

const modalContent = document.createElement('div');
modalContent.className = 'modal-content';
modalWindow.appendChild(modalContent);

const modalTaskTitle = document.createElement('input');
modalTaskTitle.className = 'modal-input';
modalTaskTitle.placeholder = 'Название';
modalContent.appendChild(modalTaskTitle);

const modalTaskDate = document.createElement('input');
modalTaskDate.className = 'modal-input';
modalTaskDate.type = 'date';
modalContent.appendChild(modalTaskDate);

const modalButtons = document.createElement('div');
modalButtons.className = 'modal-buttons';
modalWindow.appendChild(modalButtons);

const modalSaveButton = document.createElement('button');
modalSaveButton.textContent = 'Сохранить';
modalButtons.appendChild(modalSaveButton);

const modalCancelButton = document.createElement('button');
modalCancelButton.textContent = 'Отмена';
modalButtons.appendChild(modalCancelButton);

modalOverlay.appendChild(modalWindow);
document.body.appendChild(modalOverlay);

let currentTaskToEdit = null;

function openEditModal(task) {
  currentTaskToEdit = task;
  modalTaskTitle.value = task.title;
  modalTaskDate.value = task.date || '';
  modalOverlay.style.display = 'flex';
}

function closeEditModal() {
  modalOverlay.style.display = 'none';
  currentTaskToEdit = null;
}

modalCancelButton.onclick = closeEditModal;

modalSaveButton.onclick = function () {
  if (currentTaskToEdit) {
    const newTitle = modalTaskTitle.value.trim();
    if (newTitle) {
      currentTaskToEdit.title = newTitle;
    }
    currentTaskToEdit.date = modalTaskDate.value || null;
    saveTasks();
    updateTaskList();
  }
  closeEditModal();
};

// ====== Обработчики ======
addForm.onsubmit = e => {
  e.preventDefault();
  addTask(newTaskInput.value, newTaskDate.value);
  newTaskInput.value = '';
  newTaskDate.value = '';
  newTaskInput.focus();
};

searchInput.oninput = () => {
  searchText = searchInput.value;
  updateTaskList();
};

filterSelect.onchange = () => {
  currentFilter = filterSelect.value;
  updateTaskList();
};

sortButton.onclick = () => {
  sortAscending = !sortAscending;
  sortButton.textContent = sortAscending ? 'Сортировать ↑' : 'Сортировать ↓';
  updateTaskList();
};

// ====== Drag & Drop ======
taskListElement.addEventListener('dragstart', e => {
  e.target.classList.add('dragging');
});

taskListElement.addEventListener('dragend', e => {
  e.target.classList.remove('dragging');
  const newOrder = [];
  taskListElement.querySelectorAll('.task-item').forEach(li => {
    const task = taskList.find(t => t.id === li.dataset.id);
    if (task) newOrder.push(task);
  });
  taskList = newOrder;
  saveTasks();
});

taskListElement.addEventListener('dragover', e => {
  e.preventDefault();
  const dragging = taskListElement.querySelector('.dragging');
  const afterElement = [...taskListElement.children].find(li => {
    return e.clientY <= li.getBoundingClientRect().top + li.offsetHeight / 2;
  });
  taskListElement.insertBefore(dragging, afterElement);
});

// ====== Запуск ======
loadTasks();
updateTaskList();
