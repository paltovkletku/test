// Основные настройки
const SIZE = 4;
const STORAGE_KEY = 'game2048_state';
const UNDO_KEY = 'game2048_undo';
const LEADERS_KEY = 'game2048_leaders';

// Получаем элементы со страницы
const gameContainer = document.getElementById('gameContainer');
const gridEl = gameContainer.querySelector('.grid');
const tilesLayer = gameContainer.querySelector('.tiles-layer');
const scoreEl = document.getElementById('score');
const newGameBtn = document.getElementById('newGameBtn');
const undoBtn = document.getElementById('undoBtn');
const leaderBtn = document.getElementById('leaderBtn');

// Мобильное управление
const mobileControls = document.getElementById('mobileControls');
const upBtn = document.getElementById('upBtn');
const leftBtn = document.getElementById('leftBtn');
const downBtn = document.getElementById('downBtn');
const rightBtn = document.getElementById('rightBtn');

// Модальные окна
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

// Состояние игры
let grid = [];
let score = 0;
let gameOver = false;
let undoState = null;
let tileIdCounter = 1;
let isMobileDevice = false;

// Определяем тип устройства
function checkDeviceType() {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  
  isMobileDevice = (isMobileUA && hasTouch) || hasCoarsePointer;
  return isMobileDevice;
}

// Показываем/скрываем мобильные кнопки
function updateMobileControls() {
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

// Создаем пустое поле
function createEmptyGrid() {
  const newGrid = [];
  for (let i = 0; i < SIZE; i++) {
    newGrid.push(new Array(SIZE).fill(0));
  }
  return newGrid;
}

// Копируем поле
function copyGrid(originalGrid) {
  return originalGrid.map(row => row.slice());
}

// Сохраняем игру
function saveGame() {
  const state = { grid, score, gameOver };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.log('Не удалось сохранить игру');
  }
}

// Загружаем игру
function loadGame() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    
    const state = JSON.parse(saved);
    grid = state.grid;
    score = state.score || 0;
    gameOver = !!state.gameOver;
    return true;
  } catch (e) {
    return false;
  }
}

// Сохраняем состояние для отмены хода
function saveForUndo() {
  undoState = { grid: copyGrid(grid), score, gameOver };
  try {
    localStorage.setItem(UNDO_KEY, JSON.stringify(undoState));
  } catch (e) {}
}

// Загружаем для отмены хода
function loadForUndo() {
  try {
    const saved = localStorage.getItem(UNDO_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

// Таблица лидеров
function getLeaders() {
  try {
    const saved = localStorage.getItem(LEADERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function saveLeadersList(leaders) {
  try {
    localStorage.setItem(LEADERS_KEY, JSON.stringify(leaders));
  } catch (e) {}
}

function addToLeaders(name, playerScore) {
  const leaders = getLeaders();
  leaders.push({ 
    name: name || 'Игрок', 
    score: playerScore, 
    date: new Date().toISOString() 
  });
  
  // Сортируем по убыванию очков и берем топ-10
  leaders.sort((a, b) => b.score - a.score);
  const topLeaders = leaders.slice(0, 10);
  
  saveLeadersList(topLeaders);
}

// Создаем сетку на странице
function createGrid() {
  gridEl.innerHTML = '';
  
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = row;
      cell.dataset.col = col;
      gridEl.appendChild(cell);
    }
  }
}

// Поворачиваем поле
function rotateGameGrid(gameGrid) {
  const rotated = createEmptyGrid();
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      rotated[col][SIZE - 1 - row] = gameGrid[row][col];
    }
  }
  return rotated;
}

// Обрабатываем ряд при движении влево
function processRow(row) {
  const originalRow = row.slice();
  const nonZero = row.filter(cell => cell !== 0);
  const newRow = [];
  let pointsGained = 0;
  let hasMoved = false;
  let skipNext = false;
  
  for (let i = 0; i < nonZero.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const mergedValue = nonZero[i] * 2;
      newRow.push(mergedValue);
      pointsGained += mergedValue;
      skipNext = true;
      hasMoved = true;
    } else {
      newRow.push(nonZero[i]);
    }
  }
  
  while (newRow.length < SIZE) {
    newRow.push(0);
  }
  
  // Проверяем, изменился ли ряд
  for (let i = 0; i < SIZE; i++) {
    if (newRow[i] !== originalRow[i]) {
      hasMoved = true;
      break;
    }
  }
  
  return { newRow, pointsGained, hasMoved };
}

// Движение влево
function moveLeft(gameGrid) {
  let totalMoved = false;
  let totalPoints = 0;
  const newGrid = createEmptyGrid();
  
  for (let row = 0; row < SIZE; row++) {
    const result = processRow(gameGrid[row]);
    totalPoints += result.pointsGained;
    if (result.hasMoved) totalMoved = true;
    newGrid[row] = result.newRow;
  }
  
  return { grid: newGrid, moved: totalMoved, gained: totalPoints };
}

// Движение вправо
function moveRight(gameGrid) {
  const reversed = gameGrid.map(row => row.slice().reverse());
  const result = moveLeft(reversed);
  const restored = result.grid.map(row => row.slice().reverse());
  return { grid: restored, moved: result.moved, gained: result.gained };
}

// Движение вверх
function moveUp(gameGrid) {
  const rotated = rotateGameGrid(rotateGameGrid(rotateGameGrid(gameGrid)));
  const result = moveLeft(rotated);
  const restored = rotateGameGrid(result.grid);
  return { grid: restored, moved: result.moved, gained: result.gained };
}

// Движение вниз
function moveDown(gameGrid) {
  const rotated = rotateGameGrid(gameGrid);
  const result = moveLeft(rotated);
  const restored = rotateGameGrid(rotateGameGrid(rotateGameGrid(result.grid)));
  return { grid: restored, moved: result.moved, gained: result.gained };
}

// Проверяем, есть ли возможные ходы
function canMove(gameGrid) {
  // Проверяем пустые клетки
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (gameGrid[row][col] === 0) return true;
    }
  }
  
  // Проверяем соседние клетки по горизонтали
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE - 1; col++) {
      if (gameGrid[row][col] === gameGrid[row][col + 1]) return true;
    }
  }
  
  // Проверяем соседние клетки по вертикали
  for (let col = 0; col < SIZE; col++) {
    for (let row = 0; row < SIZE - 1; row++) {
      if (gameGrid[row][col] === gameGrid[row + 1][col]) return true;
    }
  }
  
  return false;
}

// Добавляем новые плитки
function addNewTiles(gameGrid, count = 1) {
  const emptyCells = [];
  
  // Находим все пустые клетки
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (gameGrid[row][col] === 0) {
        emptyCells.push({ row, col });
      }
    }
  }
  
  if (emptyCells.length === 0) return gameGrid;
  
  const tilesToAdd = Math.min(count, emptyCells.length);
  const usedIndexes = [];
  
  // Добавляем плитки в случайные пустые клетки
  while (usedIndexes.length < tilesToAdd) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    if (!usedIndexes.includes(randomIndex)) {
      usedIndexes.push(randomIndex);
      const position = emptyCells[randomIndex];
      // 90% chance for 2, 10% for 4
      const value = Math.random() < 0.9 ? 2 : 4;
      gameGrid[position.row][position.col] = value;
    }
  }
  
  return gameGrid;
}

// Рассчитываем размер плитки
function getTileSize() {
  const gridRect = gridEl.getBoundingClientRect();
  const gap = 12; // стандартный отступ
  const cellSize = (gridRect.width - gap * (SIZE + 1)) / SIZE;
  return { cellSize, gap };
}

// Рассчитываем размер шрифта
function getFontSize(value, cellSize) {
  let size = cellSize * 0.4;
  
  if (value >= 1024) {
    size = cellSize * 0.3;
  } else if (value >= 128) {
    size = cellSize * 0.35;
  }
  
  return Math.max(12, Math.min(32, size));
}

// Отрисовываем поле
function drawGrid(previousGrid = null) {
  scoreEl.textContent = String(score);
  tilesLayer.innerHTML = '';

  const { cellSize, gap } = getTileSize();

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const value = grid[row][col];
      if (value === 0) continue;
      
      const tile = document.createElement('div');
      tile.classList.add('tile', 'v' + value);
      tile.textContent = String(value);
      
      tile.style.width = `${cellSize}px`;
      tile.style.height = `${cellSize}px`;
      tile.style.left = `${gap + col * (cellSize + gap)}px`;
      tile.style.top = `${gap + row * (cellSize + gap)}px`;
      
      const fontSize = getFontSize(value, cellSize);
      tile.style.fontSize = `${fontSize}px`;
      tile.style.lineHeight = `${cellSize}px`;
      
      tile.dataset.row = row;
      tile.dataset.col = col;
      tile.dataset.val = value;
      tile.dataset.key = `${row}-${col}-${value}-${tileIdCounter++}`;

      // Добавляем анимации
      if (previousGrid) {
        const wasEmpty = (previousGrid[row][col] === 0);
        const wasMerged = (previousGrid[row][col] !== 0 && value === previousGrid[row][col] * 2);
        
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

// Начинаем новую игру
function startNewGame() {
  grid = createEmptyGrid();
  score = 0;
  gameOver = false;
  
  // Добавляем 2-3 начальные плитки
  const initialTiles = Math.floor(Math.random() * 2) + 2;
  addNewTiles(grid, initialTiles);
  
  saveForUndo();
  saveGame();
  drawGrid();
  hideGameOverModal();
  updateMobileControls();
}

// Выполняем ход
function makeMove(direction) {
  if (gameOver) return false;
  
  const oldGrid = copyGrid(grid);
  saveForUndo();

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

  // Добавляем 1-2 новые плитки
  const newTilesCount = Math.random() < 0.25 ? 2 : 1;
  addNewTiles(grid, newTilesCount);

  // Проверяем конец игры
  if (!canMove(grid)) {
    gameOver = true;
    showGameOverModal();
  }

  saveGame();
  drawGrid(oldGrid);
  updateMobileControls();
  return true;
}

// Отменяем ход
function undoMove() {
  if (gameOver) return;
  
  const previousState = loadForUndo();
  if (!previousState) {
    alert('Нет хода для отмены');
    return;
  }
  
  grid = previousState.grid;
  score = previousState.score;
  gameOver = previousState.gameOver;
  
  saveGame();
  drawGrid();
  updateMobileControls();
}

// Показываем окно конца игры
function showGameOverModal() {
  modalMessage.textContent = `Игра окончена — ваш счёт: ${score}`;
  saveRow.classList.remove('hidden');
  playerNameInput.value = '';
  playerNameInput.style.display = '';
  saveScoreBtn.style.display = '';
  gameOverModal.classList.remove('hidden');
  updateMobileControls();
}

function hideGameOverModal() {
  gameOverModal.classList.add('hidden');
  updateMobileControls();
}

// Показываем таблицу лидеров
function showLeaderboard() {
  const leaders = getLeaders();
  leadersTableBody.innerHTML = '';
  
  leaders.forEach((player, index) => {
    const row = document.createElement('tr');
    
    const numberCell = document.createElement('td');
    numberCell.textContent = String(index + 1);
    
    const nameCell = document.createElement('td');
    nameCell.textContent = player.name;
    
    const scoreCell = document.createElement('td');
    scoreCell.textContent = String(player.score);
    
    const dateCell = document.createElement('td');
    dateCell.textContent = new Date(player.date).toLocaleString();
    
    row.appendChild(numberCell);
    row.appendChild(nameCell);
    row.appendChild(scoreCell);
    row.appendChild(dateCell);
    
    leadersTableBody.appendChild(row);
  });
  
  leaderboardModal.classList.remove('hidden');
  updateMobileControls();
}

function hideLeaderboard() {
  leaderboardModal.classList.add('hidden');
  updateMobileControls();
}

// Запускаем игру
function initializeGame() {
  checkDeviceType();
  createGrid();
  
  const loaded = loadGame();
  if (!loaded) {
    startNewGame();
  } else {
    if (!grid || grid.length !== SIZE) {
      startNewGame();
      return;
    }
    drawGrid();
  }
  
  undoState = loadForUndo();
  updateMobileControls();
}

// Назначаем обработчики событий
saveScoreBtn.addEventListener('click', () => {
  const name = playerNameInput.value.trim() || 'Игрок';
  addToLeaders(name, score);
  playerNameInput.style.display = 'none';
  saveScoreBtn.style.display = 'none';
  modalMessage.textContent = 'Ваш рекорд сохранён';
});

modalRestartBtn.addEventListener('click', () => {
  hideGameOverModal();
  startNewGame();
});

modalCloseBtn.addEventListener('click', hideGameOverModal);

leaderBtn.addEventListener('click', showLeaderboard);
closeLeadersBtn.addEventListener('click', hideLeaderboard);

clearLeadersBtn.addEventListener('click', () => {
  saveLeadersList([]);
  showLeaderboard();
});

newGameBtn.addEventListener('click', startNewGame);
undoBtn.addEventListener('click', undoMove);

// Мобильные кнопки
upBtn.addEventListener('click', () => makeMove('up'));
leftBtn.addEventListener('click', () => makeMove('left'));
downBtn.addEventListener('click', () => makeMove('down'));
rightBtn.addEventListener('click', () => makeMove('right'));

// Управление с клавиатуры
window.addEventListener('keydown', (event) => {
  if (!leaderboardModal.classList.contains('hidden')) return;
  if (gameOver && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) return;
  
  if (event.key === 'ArrowLeft') { makeMove('left'); event.preventDefault(); }
  else if (event.key === 'ArrowRight') { makeMove('right'); event.preventDefault(); }
  else if (event.key === 'ArrowUp') { makeMove('up'); event.preventDefault(); }
  else if (event.key === 'ArrowDown') { makeMove('down'); event.preventDefault(); }
});

// Перерисовываем при изменении размера
window.addEventListener('resize', () => {
  drawGrid();
});

window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    drawGrid();
  }, 300);
});

// Сохраняем при закрытии
window.addEventListener('beforeunload', () => {
  saveGame();
  try { 
    localStorage.setItem(UNDO_KEY, JSON.stringify(undoState)); 
  } catch (e) {}
});

// Запускаем когда страница загрузится
document.addEventListener('DOMContentLoaded', initializeGame);
