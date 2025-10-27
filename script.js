var STORAGE_KEY = 'todo_minimal_v1';
var tasks = [];
var sortAsc = true;
var filterMode = 'all';
var searchQuery = '';

function loadTasks(){
  var saved = localStorage.getItem(STORAGE_KEY);
  tasks = saved ? JSON.parse(saved) : [];
}
function saveTasks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
function generateId(){
  return Date.now() + Math.random().toString().substring(2,5);
}

/* UI */
var container = document.createElement('div');
container.className = 'container';
document.body.appendChild(container);

var title = document.createElement('h1');
title.textContent = "Список дел";
container.appendChild(title);

/* Поиск и фильтры */
var controls = document.createElement('div');
controls.className = 'controls';
container.appendChild(controls);

var inputSearch = document.createElement('input');
inputSearch.placeholder = "Поиск";
controls.appendChild(inputSearch);

var selectFilter = document.createElement('select');
controls.appendChild(selectFilter);

[
  {value:'all', text:'Все'},
  {value:'active', text:'Активные'},
  {value:'done', text:'Выполненные'}
].forEach(optData=>{
  var opt=document.createElement('option');
  opt.value=optData.value;
  opt.textContent=optData.text;
  selectFilter.appendChild(opt);
});

var btnSort = document.createElement('button');
btnSort.textContent = "Сортировать ↑";
controls.appendChild(btnSort);

/* Форма */
var form = document.createElement('form');
form.className = 'form-row';
container.appendChild(form);

var inputTitle = document.createElement('input');
inputTitle.placeholder = "Новая задача";
inputTitle.required = true;
form.appendChild(inputTitle);

var inputDate = document.createElement('input');
inputDate.type = 'date';
form.appendChild(inputDate);

var btnAdd = document.createElement('button');
btnAdd.type = 'submit';
btnAdd.textContent = "Добавить";
form.appendChild(btnAdd);

/* Список */
var list = document.createElement('ul');
list.className = 'list';
container.appendChild(list);

/* Пусто */
var emptyNote = document.createElement('div');
emptyNote.className = 'empty-note';
emptyNote.textContent = "Нет задач...";
container.appendChild(emptyNote);

/* Создание элемента списка */
function createTaskElement(task){
  var li = document.createElement('li');
  li.className = 'task-item';
  if(task.done) li.classList.add('done');
  li.draggable = true;
  li.dataset.id = task.id;

  var check = document.createElement('button');
  check.className = 'checkbox';
  check.textContent = task.done ? '✓' : '';
  li.appendChild(check);

  var block = document.createElement('div');
  li.appendChild(block);

  var title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;
  block.appendChild(title);

  var date = document.createElement('div');
  date.className = 'task-meta';
  date.textContent = task.date ? task.date : "Без даты";
  block.appendChild(date);

  var btnEdit = document.createElement('button');
  btnEdit.textContent = '✎';
  li.appendChild(btnEdit);

  var btnDel = document.createElement('button');
  btnDel.textContent = '✕';
  li.appendChild(btnDel);

  check.onclick = () => toggleDone(task.id);
  btnDel.onclick = () => removeTask(task.id);
  btnEdit.onclick = () => editTask(task);

  return li;
}

/* Рендер */
function render(){
  while (list.firstChild)
    list.removeChild(list.firstChild);

  var arr = tasks.slice();

  if(searchQuery){
    arr = arr.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if(filterMode=='active') arr = arr.filter(t => !t.done);
  if(filterMode=='done') arr = arr.filter(t => t.done);

  arr.sort((a,b)=>{
    if(!a.date) return 1;
    if(!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
  if(!sortAsc) arr.reverse();

  emptyNote.style.display = arr.length === 0 ? 'block' : 'none';

  arr.forEach(t => list.appendChild(createTaskElement(t)));
}

/* Логика */
function addTask(title,date){
  tasks.push({ id:generateId(), title, date, done:false });
  saveTasks(); render();
}
function removeTask(id){
  tasks = tasks.filter(t=>t.id!==id);
  saveTasks(); render();
}
function toggleDone(id){
  var t = tasks.find(t=>t.id===id);
  if(t){
    t.done = !t.done;
    saveTasks(); render();
  }
}
function editTask(task){
  var newTitle = prompt("Новое имя",task.title);
  if(newTitle!==null && newTitle.trim()){
    task.title = newTitle.trim();
  }
  var newDate = prompt("Новая дата YYYY-MM-DD",task.date||"");
  if(newDate!==null) task.date=newDate;
  saveTasks(); render();
}

/* Слушатели */
form.onsubmit = e=>{
  e.preventDefault();
  addTask(inputTitle.value,inputDate.value);
  inputTitle.value='';
  inputDate.value='';
};
inputSearch.oninput=()=>{ searchQuery=inputSearch.value; render(); };
selectFilter.onchange=()=>{ filterMode=selectFilter.value; render(); };
btnSort.onclick=()=>{
  sortAsc=!sortAsc;
  btnSort.textContent = sortAsc?"Сортировать ↑":"Сортировать ↓";
  render();
};

/* Drag & Drop порядок */
list.addEventListener('dragstart', e=>{
  e.target.classList.add('dragging');
});
list.addEventListener('dragend', e=>{
  e.target.classList.remove('dragging');
  var newOrder=[];
  list.querySelectorAll('.task-item').forEach(li=>{
    var t=tasks.find(x=>x.id==li.dataset.id);
    if(t) newOrder.push(t);
  });
  tasks = newOrder;
  saveTasks();
});
list.addEventListener('dragover', e=>{
  e.preventDefault();
  let dragging = list.querySelector('.dragging');
  let after = [...list.children].find(li=>{
    return e.clientY <= li.getBoundingClientRect().top + li.offsetHeight/2;
  });
  list.insertBefore(dragging,after);
});

/* Запуск */
loadTasks();
render();
