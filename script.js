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
let undoState = null;
let tileIdCounter = 1;

/* ======= УПРАВЛЕНИЕ УСТРОЙСТВАМИ ======= */

// Определяем один раз при загрузке
let isMobileDevice = false;

function detectDeviceTypeOnce() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Проверяем мобильные устройства по User Agent
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Проверяем тач-устройства
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Проверяем тип указателя (надежнее чем ширина окна)
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  
  // Если это мобильное устройство по UA И есть тач-события
  // ИЛИ есть грубый указатель (характерно для тач-устройств)
  isMobileDevice = (isMobileUA && hasTouch) || hasCoarsePointer;
  
  console.log('Device detection (once):', {
    isMobileDevice,
    userAgent: navigator.userAgent,
    hasTouch,
    hasCoarsePointer,
    isMobileUA
  });
  
  return isMobileDevice;
}

function updateMobileControlsVisibility() {
  const modalsOpen = !gameOverModal.classList.contains('hidden') || 
                     !leaderboardModal.classList.contains('hidden');
  
  if (isMobileDevice && !modalsOpen) {
    mobileControls.classList.add('visible');
    mobileControls.classList.remove('hidden');
  } else {
    mobileControls.classList.remove('visible');
    mobileControls.classList.add('hidden');
  }
}

/* ======= ИНИЦИАЛИЗАЦИЯ ИГРЫ ======= */

function createGridUI() {
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

/* ======= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======= */

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

/* Сохранение/загрузка состояния */
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

/* Лидерборд */
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

/* ======= ИГРОВАЯ ЛОГИКА ======= */

function rotateGrid(g) {
  const ng = createEmptyGrid();
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      ng[c][SIZE-1-r] = g[r][c];
    }
  }
  return ng;
}

function processRowLeft(row) {
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
  
  for (let i=0;i<SIZE;i++){
    if (newRow[i] !== original[i]) { moved = true; break; }
  }
  
  return { newRow, gained, moved };
}

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
  const rev = board.map(row => row.slice().reverse());
  const res = moveLeft(rev);
  const back = res.grid.map(row => row.slice().reverse());
  return { grid: back, moved: res.moved, gained: res.gained };
}

function moveUp(board) {
  let rot = cloneGrid(board);
  rot = rotateGrid(rotateGrid(rotateGrid(board)));
  const res = moveLeft(rot);
  const back = rotateGrid(res.grid);
  return { grid: back, moved: res.moved, gained: res.gained };
}

function moveDown(board) {
  const rot = rotateGrid(board);
  const res = moveLeft(rot);
  const back = rotateGrid(rotateGrid(rotateGrid(res.grid)));
  return { grid: back, moved: res.moved, gained: res.gained };
}

function hasMoves(g) {
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      if (g[r][c] === 0) return true;
    }
  }
  
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

function spawnNewTiles(board, count=1) {
  const empties = [];
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      if (board[r][c] === 0) empties.push({r,c});
    }
  }
  
  if (empties.length === 0) return board;
  
  const toSpawn = Math.min(count, empties.length);
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

/* ======= РЕНДЕРИНГ И АНИМАЦИИ ======= */

function calculateTileSize() {
  const gridRect = gridEl.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tile-gap')) || 12;
  const cellSize = (gridRect.width - gap * (SIZE + 1)) / SIZE;
  return { cellSize, gap };
}

function calculateFontSize(value, cellSize) {
  let baseSize = cellSize * 0.4;
  
  if (value >= 1024) baseSize = cellSize * 0.3;
  else if (value >= 128) baseSize = cellSize * 0.35;
  
  return Math.max(12, Math.min(32, baseSize));
}

function renderGrid(oldGrid = null) {
  scoreEl.textContent = String(score);

  while (tilesLayer.firstChild) {
    tilesLayer.removeChild(tilesLayer.firstChild);
  }

  const { cellSize, gap } = calculateTileSize();

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      
      const tile = document.createElement('div');
      tile.classList.add('tile', 'v' + val);
      tile.textContent = String(val);
      
      tile.style.width = `${cellSize}px`;
      tile.style.height = `${cellSize}px`;
      tile.style.left = `${gap + c * (cellSize + gap)}px`;
      tile.style.top = `${gap + r * (cellSize + gap)}px`;
      
      const fontSize = calculateFontSize(val, cellSize);
      tile.style.fontSize = `${fontSize}px`;
      tile.style.lineHeight = `${cellSize}px`;
      
      tile.dataset.row = r;
      tile.dataset.col = c;
      tile.dataset.val = val;
      tile.dataset.key = `${r}-${c}-${val}-${tileIdCounter++}`;

      if (oldGrid) {
        const wasEmpty = (oldGrid[r][c] === 0);
        const wasMerged = (oldGrid[r][c] !== 0 && val === oldGrid[r][c] * 2);
        
        if (wasEmpty) {
          tile.classList.add('new');
        } else if (wasMerged) {
          tile.classList.add('merge');
        }
      } else {
        tile.classList.add('new');
      }

      tilesLayer.appendChild(tile);
    }
  }
}

/* ======= ОСНОВНЫЕ ФУНКЦИИ ИГРЫ ======= */

function startNewGame() {
  grid = createEmptyGrid();
  score = 0;
  gameOver = false;
  
  const initial = Math.floor(Math.random() * 2) + 2;
  spawnNewTiles(grid, initial);
  saveUndoState();
  saveGameState();
  
  renderGrid();
  hideGameOverModal();
  updateMobileControlsVisibility();
}

function performMove(direction) {
  if (gameOver) return false;
  
  const oldGrid = cloneGrid(grid);
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
  
  grid = result.grid;
  score += result.gained;

  const spawnCount = (Math.random() < 0.25) ? 2 : 1;
  spawnNewTiles(grid, spawnCount);

  if (!hasMoves(grid)) {
    gameOver = true;
    showGameOverModal();
  }

  saveGameState();
  renderGrid(oldGrid);
  updateMobileControlsVisibility();
  return true;
}

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
  updateMobileControlsVisibility();
}

/* ======= МОДАЛЬНЫЕ ОКНА ======= */

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

/* ======= ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ ======= */

function initGame() {
  // Определяем тип устройства ОДИН РАЗ
  detectDeviceTypeOnce();
  
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

/* Обработчики событий */
saveScoreBtn.addEventListener('click', ()=>{
  const name = playerNameInput.value.trim() || '—';
  addLeader(name, score);
  playerNameInput.style.display = 'none';
  saveScoreBtn.style.display = 'none';
  modalMessage.textContent = 'Ваш рекорд сохранён';
});

modalRestartBtn.addEventListener('click', ()=>{
  hideGameOverModal();
  startNewGame();
});

modalCloseBtn.addEventListener('click', hideGameOverModal);

leaderBtn.addEventListener('click', ()=>{
  showLeaderboard();
});

closeLeadersBtn.addEventListener('click', hideLeaderboard);

clearLeadersBtn.addEventListener('click', ()=>{
  saveLeaders([]);
  showLeaderboard();
});

newGameBtn.addEventListener('click', ()=> startNewGame());
undoBtn.addEventListener('click', ()=> undoMove());

/* Мобильные кнопки управления */
upBtn.addEventListener('click', () => performMove('up'));
leftBtn.addEventListener('click', () => performMove('left'));
downBtn.addEventListener('click', () => performMove('down'));
rightBtn.addEventListener('click', () => performMove('right'));

/* Клавиатура */
window.addEventListener('keydown', (e)=>{
  if (leaderboardModal.classList.contains('hidden') === false) return;
  if (gameOver && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
  if (e.key === 'ArrowLeft') { performMove('left'); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { performMove('right'); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { performMove('up'); e.preventDefault(); }
  else if (e.key === 'ArrowDown') { performMove('down'); e.preventDefault(); }
});

/* Изменение размера окна - только для рендеринга */
window.addEventListener('resize', function() {
  renderGrid();
});

window.addEventListener('orientationchange', function() {
  setTimeout(() => {
    renderGrid();
  }, 300);
});

/* Сохранение состояния */
window.addEventListener('beforeunload', ()=>{
  saveGameState();
  try { localStorage.setItem(UNDO_KEY, JSON.stringify(undoState)); } catch (e) {}
});

/* Запуск игры */
document.addEventListener('DOMContentLoaded', function() {
  initGame();
});
