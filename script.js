const LOCAL_STORAGE_KEY = 'todo_lab_v1';

let taskList = [];

let sortAscending = true;
let currentFilter = 'all';
let searchText = '';

function loadTasks() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  taskList = saved ? JSON.parse(saved) : [];
}

function saveTasks() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(taskList));
}

function generateTaskId() {
  return Date.now() + Math.random().toString().substring(2, 5);
}

// интерфейс
const container = document.createElement('div');
container.className = 'container';
document.body.appendChild(container);

const pageTitle = document.createElement('h1');
pageTitle.textContent = 'Список дел';
container.appendChild(pageTitle);

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

const taskListElement = document.createElement('ul');
taskListElement.className = 'list';
container.appendChild(taskListElement);

const emptyMessage = document.createElement('div');
emptyMessage.className = 'empty-note';
emptyMessage.textContent = 'Нет задач...';
container.appendChild(emptyMessage);

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

  checkButton.onclick = () => toggleTaskDone(task.id);
  deleteButton.onclick = () => deleteTask(task.id);
  editButton.onclick = () => openEditModal(task);

  return li;
}

function updateTaskList() {
  while (taskListElement.firstChild) {
    taskListElement.removeChild(taskListElement.firstChild);
  }

  let visibleTasks = taskList.slice();
  if (searchText) {
    visibleTasks = visibleTasks.filter(t =>
      t.title.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  if (currentFilter === 'active') visibleTasks = visibleTasks.filter(t => !t.done);
  if (currentFilter === 'done') visibleTasks = visibleTasks.filter(t => t.done);

  visibleTasks.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
  if (!sortAscending) visibleTasks.reverse();

  emptyMessage.style.display = visibleTasks.length === 0 ? 'block' : 'none';

  visibleTasks.forEach(task => taskListElement.appendChild(buildTaskItem(task)));
}

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

loadTasks();
updateTaskList();
