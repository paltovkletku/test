const STORAGE_KEY = 'todo_tasks';

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function render() {
  list.innerHTML = '';

  if (tasks.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'Задач пока нет';
    list.appendChild(empty);
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.done) li.classList.add('completed');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = task.done;
    check.addEventListener('change', () => {
      task.done = !task.done;
      saveTasks();
      render();
    });
    li.appendChild(check);

    const span = document.createElement('span');
    span.textContent = `${task.title} — ${task.date || 'Не указана'}`;
    li.appendChild(span);

    const btnDel = document.createElement('button');
    btnDel.textContent = 'Удалить';
    btnDel.addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      render();
    });
    li.appendChild(btnDel);

    list.appendChild(li);
  });
}


function addTask(title, date) {
  const newTask = { id: Date.now(), title, date, done: false };
  tasks.push(newTask);
  saveTasks();
  render();
}

const container = document.createElement('div');
container.className = 'container';
document.body.appendChild(container);

const card = document.createElement('section');
card.className = 'card';
container.appendChild(card);

const header = document.createElement('header');
header.className = 'header';
card.appendChild(header);

const title = document.createElement('h1');
title.className = 'title';
title.textContent = 'Мой ToDo-лист';
header.appendChild(title);

// форма
const form = document.createElement('form');
form.className = 'form-row';
card.appendChild(form);

const inputTitle = document.createElement('input');
inputTitle.className = 'input';
inputTitle.type = 'text';
inputTitle.placeholder = 'Что нужно сделать?';
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

// список задач
const list = document.createElement('ul');
list.className = 'list';
card.appendChild(list);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = inputTitle.value.trim();
  const date = inputDate.value;
  if (!title) return alert('Нужно ввести задачу!');
  addTask(title, date);
  inputTitle.value = '';
  inputDate.value = '';
});

render();
