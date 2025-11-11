/* script.js — все динамически создаётся через чистый JS (без innerHTML/outerHTML) */

/* ======= Конфигурации ======= */
const SIZE = 4;
const STORAGE_KEY = 'game2048_state_v1';
const UNDO_KEY = 'game2048_undo_v1';
const LEADERS_KEY = 'game2048_leaders_v1';

/* DOM элементы */
const gameContainer = document.getElementById('gameContainer');
const gridEl = gameContainer.querySelector('.grid');
const tilesLayer = gameContainer.querySelector('.tiles-layer');
const scoreEl = document.getElementById('score');
const newGameBtn = document.getElementById('newGameBtn');
const undoBtn = document.getElementById('undoBtn');
const leaderBtn = document.getElementById('leaderBtn');

/* Мобильные элементы управления */
const mobileControls = document.getElementById('mobileControls');
const upBtn = document.getElementById('upBtn');
const leftBtn = document.getElementById('leftBtn');
const downBtn = document.getElementById('downBtn');
const rightBtn = document.getElementById('rightBtn');

const gameOverModal = document.getElementById('gameOverModal');
const modalMessage = document.getElementById('modalMessage');
const saveRow = document.getElementById('saveRow');
const playerNameInput = document.getElementById('playerName');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const modalRestartBtn = document.getElementById('modalRestartBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');

const leaderboardModal = document.getElementById('leaderboardModal');
const leadersTableBody = document.querySelector('#leadersTable tbody');
const closeLeadersBtn = document.getElementById('closeLeadersBtn');
const clearLeadersBtn = document.getElementById('clearLeadersBtn');

/* Состояние игры */
let grid = createEmptyGrid();
let score = 0;
let gameOver = false;

/* Для undo: сохраняем прошлое состояние (грид, score) */
let undoState = null;

/* Уникальные id для DOM-плиток */
let tileIdCounter = 1;

/* Инициализация интерфейса: создаём визуальные ячейки (фон) динамически */
function createGridUI() {
  // Очистка
  while (gridEl.firstChild) gridEl.removeChild(gridEl.firstChild);

  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = r;
      cell.dataset.col = c;
      gridEl.appendChild(cell);
    }
  }
}

createGridUI();

/* --- ВСПОМОГАТЕЛИ --- */
function createEmptyGrid() {
  const g = [];
  for (let i=0;i<SIZE;i++){
    g.push(new Array(SIZE).fill(0));
  }
  return g;
}

function cloneGrid(g) {
  return g.map(row => row.slice());
}

/* Сохранение/загрузка game state */
function saveGameState() {
  const state = { grid, score, gameOver };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { console.warn('LocalStorage save failed', e); }
}
function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s) return false;
    grid = s.grid;
    score = s.score || 0;
    gameOver = !!s.gameOver;
    return true;
  } catch (e) { return false; }
}
function saveUndoState() {
  undoState = { grid: cloneGrid(grid), score, gameOver };
  try {
    localStorage.setItem(UNDO_KEY, JSON.stringify(undoState));
  } catch (e) {}
}
function loadUndoState() {
  try {
    const raw = localStorage.getItem(UNDO_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

/* ====== Лидерборд ====== */
function loadLeaders() {
  try {
    const raw = localStorage.getItem(LEADERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) { return []; }
}
function saveLeaders(list) {
  try {
    localStorage.setItem(LEADERS_KEY, JSON.stringify(list));
  } catch (e) {}
}
function addLeader(name, scoreValue) {
  const list = loadLeaders();
  list.push({ name: name || '---', score: scoreValue, date: new Date().toISOString() });
  list.sort((a,b)=>b.score - a.score);
  const top = list.slice(0,10);
  saveLeaders(top);
}

/* ====== Игровая логика (движение/слияние) ====== */

/* utility: rotate grid to reuse left-move logic */
function rotateGrid(g) {
  // rotate clockwise
  const ng = createEmptyGrid();
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      ng[c][SIZE-1-r] = g[r][c];
    }
  }
  return ng;
}

/* slide & merge single row to the left. Возвращает {newRow, gainedScore, moved, mergedPositions} */
function processRowLeft(row) {
  // убираем нули
  const original = row.slice();
  const nonZero = row.filter(v=>v!==0);
  const newRow = [];
  let gained = 0;
  let moved = false;
  let skip = false;
  for (let i=0;i<nonZero.length;i++){
    if (skip) { skip = false; continue; }
    if (i+1 < nonZero.length && nonZero[i] === nonZero[i+1]) {
      const val = nonZero[i]*2;
      newRow.push(val);
      gained += val;
      skip = true;
      moved = true;
    } else {
      newRow.push(nonZero[i]);
    }
  }
  while (newRow.length < SIZE) newRow.push(0);
  // moved if any difference
  for (let i=0;i<SIZE;i++){
    if (newRow[i] !== original[i]) { moved = true; break; }
  }
  return { newRow, gained, moved };
}

/* Возвращает {grid: newGrid, moved: bool, gained: points} */
function moveLeft(board) {
  let movedOverall = false;
  let totalGain = 0;
  const newGrid = createEmptyGrid();
  for (let r=0;r<SIZE;r++){
    const { newRow, gained, moved } = processRowLeft(board[r]);
    totalGain += gained;
    if (moved) movedOverall = true;
    newGrid[r] = newRow;
  }
  return { grid: newGrid, moved: movedOverall, gained: totalGain };
}
function moveRight(board) {
  // reverse rows, moveLeft, reverse back
  const rev = board.map(row => row.slice().reverse());
  const res = moveLeft(rev);
  const back = res.grid.map(row => row.slice().reverse());
  return { grid: back, moved: res.moved, gained: res.gained };
}
function moveUp(board) {
  // rotate anticlockwise, moveLeft, rotate clockwise
  let rot = cloneGrid(board);
  rot = rotateGrid(rotateGrid(rotateGrid(board))); // 3 clockwise == anticlockwise
  const res = moveLeft(rot);
  // rotate back (1 clockwise)
  const back = rotateGrid(res.grid);
  return { grid: back, moved: res.moved, gained: res.gained };
}
function moveDown(board) {
  // rotate clockwise once, moveLeft, rotate anticlockwise once
  const rot = rotateGrid(board); // clockwise
  const res = moveLeft(rot);
  // rotate back 3 times (anticlockwise)
  const back = rotateGrid(rotateGrid(rotateGrid(res.grid)));
  return { grid: back, moved: res.moved, gained: res.gained };
}

/* Проверка доступных ходов */
function hasMoves(g) {
  // empty cell?
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      if (g[r][c] === 0) return true;
    }
  }
  // adjacent equal?
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE-1;c++){
      if (g[r][c] === g[r][c+1]) return true;
    }
  }
  for (let c=0;c<SIZE;c++){
    for (let r=0;r<SIZE-1;r++){
      if (g[r][c] === g[r+1][c]) return true;
    }
  }
  return false;
}

/* Генерация 1-2 новых плиток в случайные пустые клетки (значения 2 или 4) */
function spawnNewTiles(board, count=1) {
  const empties = [];
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      if (board[r][c] === 0) empties.push({r,c});
    }
  }
  if (empties.length === 0) return board;
  // если запрошено более доступного, сократить
  const toSpawn = Math.min(count, empties.length);
  // выбираем случайные уникальные индексы
  const chosen = [];
  while (chosen.length < toSpawn){
    const idx = Math.floor(Math.random()*empties.length);
    if (!chosen.includes(idx)) chosen.push(idx);
  }
  chosen.forEach(idx => {
    const pos = empties[idx];
    const v = Math.random() < 0.9 ? 2 : 4;
    board[pos.r][pos.c] = v;
  });
  return board;
}

/* ====== Рендеринг плиток (DOM) ====== */
function renderGrid(oldPositions = null, mergedInfo = null) {
  // Обновляем счет
  scoreEl.textContent = String(score);

  // Запомним старые прямоугольники
  const oldRects = new Map();
  Array.from(tilesLayer.children).forEach(el=>{
    const key = el.dataset.key;
    oldRects.set(key, el.getBoundingClientRect());
  });

  // Сохраняем старые элементы (для расчёта анимации)
  const oldEls = Array.from(tilesLayer.children);
  // Очистим слой
  while (tilesLayer.firstChild) tilesLayer.removeChild(tilesLayer.firstChild);

  // вычислим размеры клетки в пикселях
  const gridRect = gridEl.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tile-gap')) || 12;
  const cellSize = (gridRect.width - gap * (SIZE+1)) / SIZE;

  // создаём плитки по текущему grid
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      const val = grid[r][c];
      if (val === 0) continue;
      const tile = document.createElement('div');
      tile.classList.add('tile');
      tile.classList.add('v' + val);
      tile.textContent = String(val);
      // позиционируем абсолютно
      tile.style.width = `${cellSize}px`;
      tile.style.height = `${cellSize}px`;
      tile.style.left = `${gap + c*(cellSize + gap)}px`;
      tile.style.top  = `${gap + r*(cellSize + gap)}px`;
      tile.dataset.row = r;
      tile.dataset.col = c;
      tile.dataset.val = val;
      // уникальный ключ (включаем id counter, чтобы каждое создание было уникальным)
      const uid = tileIdCounter++;
      tile.dataset.key = `${r}-${c}-${val}-${uid}`;

      // Если недавно созданная плитка (новая) — добавим класс для pop-анимации
      if (oldPositions) {
        const wasEmpty = (oldPositions[r][c] === 0);
        if (wasEmpty) tile.classList.add('new');
      } else {
        tile.classList.add('new');
      }

      tilesLayer.appendChild(tile);
    }
  }

  // АНИМАЦИЯ ПЕРЕМЕЩЕНИЯ:
  const newRects = new Map();
  Array.from(tilesLayer.children).forEach(el=>{
    newRects.set(el.dataset.key, el.getBoundingClientRect());
  });

  const oldRectsArr = Array.from(oldRects.entries());
  Array.from(tilesLayer.children).forEach(newEl=>{
    const val = Number(newEl.dataset.val);
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i=0;i<oldRectsArr.length;i++){
      const [key, rect] = oldRectsArr[i];
      const parts = key.split('-');
      const oldVal = Number(parts[2]);
      if (oldVal !== val) continue;
      const newRect = newEl.getBoundingClientRect();
      const dx = newRect.left - rect.left;
      const dy = newRect.top - rect.top;
      const dist = Math.hypot(dx,dy);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }
    if (bestIdx >= 0) {
      const [oldKey, oldRect] = oldRectsArr[bestIdx];
      const newRect = newEl.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      newEl.style.transform = `translate(${dx}px, ${dy}px)`;
      newEl.getBoundingClientRect();
      newEl.style.transition = 'transform 140ms ease';
      newEl.style.transform = '';
      oldRectsArr.splice(bestIdx,1);
    }
  });

  // Merge animation
  if (mergedInfo && mergedInfo.length) {
    mergedInfo.forEach(pos=>{
      Array.from(tilesLayer.children).forEach(el=>{
        if (Number(el.dataset.row) === pos.r && Number(el.dataset.col) === pos.c) {
          el.classList.add('merge');
          setTimeout(()=> el.classList.remove('merge'), 260);
        }
      });
    });
  }
}

/* ====== Управление видимостью мобильных кнопок ====== */
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth <= 768;
}

function updateMobileControlsVisibility() {
  if (isMobileDevice() && 
      gameOverModal.classList.contains('hidden') && 
      leaderboardModal.classList.contains('hidden')) {
    mobileControls.classList.remove('hidden');
  } else {
    mobileControls.classList.add('hidden');
  }
}

/* ====== Игровые действия (API для UI) ====== */
function startNewGame() {
  grid = createEmptyGrid();
  score = 0;
  gameOver = false;
  // в начале 1-3 случайных тайла
  const initial = Math.floor(Math.random()*3) + 1; // 1..3
  spawnNewTiles(grid, initial);
  saveUndoState(); // сохраняем начальное для отмены
  saveGameState();
  renderGrid();
  hideGameOverModal();
  updateMobileControlsVisibility();
}

function performMove(direction) {
  if (gameOver) return false;
  // сохраняем undo
  saveUndoState();

  let result;
  if (direction === 'left') result = moveLeft(grid);
  else if (direction === 'right') result = moveRight(grid);
  else if (direction === 'up') result = moveUp(grid);
  else if (direction === 'down') result = moveDown(grid);
  else return false;

  if (!result.moved) {
    return false;
  }
  // применяем новую сетку
  grid = result.grid;
  score += result.gained;

  // Генерируем 1 или 2 новых плитки (случайно)
  const spawnCount = (Math.random() < 0.25) ? 2 : 1;
  spawnNewTiles(grid, spawnCount);

  // Проверка окончания игры
  if (!hasMoves(grid)) {
    gameOver = true;
    showGameOverModal();
  }

  saveGameState();
  renderGrid();
  return true;
}

/* Undo */
function undoMove() {
  if (gameOver) return;
  const raw = loadUndoState();
  if (!raw) {
    alert('Нет доступного хода для отмены');
    return;
  }
  grid = raw.grid;
  score = raw.score;
  gameOver = raw.gameOver;
  saveGameState();
  renderGrid();
}

/* Модалки */
function showGameOverModal() {
  modalMessage.textContent = `Игра окончена — ваш счёт: ${score}`;
  saveRow.classList.remove('hidden');
  playerNameInput.value = '';
  playerNameInput.style.display = '';
  saveScoreBtn.style.display = '';
  gameOverModal.classList.remove('hidden');
  updateMobileControlsVisibility();
}
function hideGameOverModal() {
  gameOverModal.classList.add('hidden');
  updateMobileControlsVisibility();
}

/* Лидерборд UI */
function showLeaderboard() {
  const list = loadLeaders();
  while (leadersTableBody.firstChild) leadersTableBody.removeChild(leadersTableBody.firstChild);
  list.forEach((entry, idx) => {
    const tr = document.createElement('tr');
    const tdN = document.createElement('td'); tdN.textContent = String(idx+1);
    const tdName = document.createElement('td'); tdName.textContent = entry.name;
    const tdScore = document.createElement('td'); tdScore.textContent = String(entry.score);
    const tdDate = document.createElement('td'); tdDate.textContent = (new Date(entry.date)).toLocaleString();
    tr.appendChild(tdN); tr.appendChild(tdName); tr.appendChild(tdScore); tr.appendChild(tdDate);
    leadersTableBody.appendChild(tr);
  });
  leaderboardModal.classList.remove('hidden');
  updateMobileControlsVisibility();
}
function hideLeaderboard() {
  leaderboardModal.classList.add('hidden');
  updateMobileControlsVisibility();
}

/* ====== ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ ====== */
function initGame() {
  const ok = loadGameState();
  if (!ok) {
    startNewGame();
  } else {
    if (!grid || grid.length !== SIZE) {
      startNewGame();
      return;
    }
    renderGrid();
  }
  
  undoState = loadUndoState();
  updateMobileControlsVisibility();
}

/* Save score from modal */
saveScoreBtn.addEventListener('click', ()=>{
  const name = playerNameInput.value.trim() || '—';
  addLeader(name, score);
  playerNameInput.style.display = 'none';
  saveScoreBtn.style.display = 'none';
  modalMessage.textContent = 'Ваш рекорд сохранён';
});

/* Кнопки модалки */
modalRestartBtn.addEventListener('click', ()=>{
  hideGameOverModal();
  startNewGame();
});
modalCloseBtn.addEventListener('click', hideGameOverModal);

/* Leaderboard buttons */
leaderBtn.addEventListener('click', ()=>{
  showLeaderboard();
});
closeLeadersBtn.addEventListener('click', hideLeaderboard);
clearLeadersBtn.addEventListener('click', ()=>{
  if (!confirm('Очистить таблицу лидеров?')) return;
  saveLeaders([]);
  showLeaderboard();
});

/* Навешивание кнопок UI */
newGameBtn.addEventListener('click', ()=> startNewGame());
undoBtn.addEventListener('click', ()=> undoMove());

/* Мобильные кнопки управления */
upBtn.addEventListener('click', () => performMove('up'));
leftBtn.addEventListener('click', () => performMove('left'));
downBtn.addEventListener('click', () => performMove('down'));
rightBtn.addEventListener('click', () => performMove('right'));

/* Слушаем клавиатуру (desktop) */
window.addEventListener('keydown', (e)=>{
  if (leaderboardModal.classList.contains('hidden') === false) return;
  if (gameOver && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
  if (e.key === 'ArrowLeft') { performMove('left'); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { performMove('right'); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { performMove('up'); e.preventDefault(); }
  else if (e.key === 'ArrowDown') { performMove('down'); e.preventDefault(); }
});

/* Обновляем видимость кнопок при изменении размера окна */
window.addEventListener('resize', updateMobileControlsVisibility);

/* Сохранение состояния перед выгрузкой */
window.addEventListener('beforeunload', ()=>{
  saveGameState();
  try { localStorage.setItem(UNDO_KEY, JSON.stringify(undoState)); } catch (e) {}
});

/* Инициализация игры при загрузке страницы */
document.addEventListener('DOMContentLoaded', initGame);
