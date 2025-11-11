// ===== 2048 GAME LOGIC =====
const boardSize = 4;
let board = [];
let history = [];
let score = 0;
let best = Number(localStorage.getItem("bestScore") || 0);

const tileSize = 90; // px, совпадает с CSS
const gap = 12;      // px, совпадает с CSS

// Elements
const boardEl = document.getElementById("board");
const grid = document.getElementById("grid");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const inputName = document.getElementById("player");
const saveScoreBtn = document.getElementById("save");
const restartBtn = document.getElementById("restart");
const undoBtn = document.getElementById("undo");
const lbBtn = document.getElementById("openLB");
const closeLB = document.getElementById("closeLB");
const lbModal = document.getElementById("leaderboard");
const lbList = document.getElementById("lbList");

// ===== Grid =====
function createGrid() {
  for (let i = 0; i < boardSize * boardSize; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    grid.appendChild(cell);
  }
}

// ===== Board Helpers =====
function getEmptyCells() {
  const empty = [];
  for (let r = 0; r < boardSize; r++)
    for (let c = 0; c < boardSize; c++)
      if (board[r][c] === 0) empty.push({ r, c });
  return empty;
}

function addTile(count = 1) {
  const empty = getEmptyCells();
  if (empty.length === 0) return;
  count = Math.min(count, empty.length);
  for (let i = 0; i < count; i++) {
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

function saveState() {
  history.push(JSON.parse(JSON.stringify(board)));
}

// ===== Undo =====
function undo() {
  if (history.length === 0 || overlay.style.display !== "none") return;
  board = history.pop();
  render();
}

// ===== Moves =====
function moveLeftRow(row) {
  const filtered = row.filter(x => x !== 0);
  const merged = [];
  let points = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      points += val;
      i++;
    } else merged.push(filtered[i]);
  }
  while (merged.length < boardSize) merged.push(0);
  return { row: merged, points };
}

function moveLeft() { return moveCore(r => r); }
function moveRight() { return moveCore(r => r.reverse(), true); }
function moveUp() { return moveCoreTranspose(moveLeft); }
function moveDown() { return moveCoreTranspose(moveRight); }

function moveCore(mapFn, reverse = false) {
  let changed = false;
  let pointsThisMove = 0;
  for (let r = 0; r < boardSize; r++) {
    const { row, points } = moveLeftRow(mapFn([...board[r]]));
    pointsThisMove += points;
    const newRow = reverse ? row.slice().reverse() : row;
    if (newRow.some((v, i) => v !== board[r][i])) changed = true;
    board[r] = newRow;
  }
  if (changed) {
    score += pointsThisMove;
    if(score > best) best = score;
    saveState();
    addTile(1 + (Math.random() < 0.3));
    render();
  }
  checkGameOver();
  return changed;
}

function moveCoreTranspose(moveFunc) {
  // transpose
  board = board[0].map((_, c) => board.map(row => row[c]));
  const changed = moveFunc();
  // transpose back
  board = board[0].map((_, c) => board.map(row => row[c]));
  return changed;
}

// ===== Render =====
function render() {
  scoreEl.textContent = score;
  bestEl.textContent = best;

  document.querySelectorAll(".tile").forEach(t => t.remove());

  board.forEach((row, r) => {
    row.forEach((v, c) => {
      if (v === 0) return;
      const tile = document.createElement("div");
      tile.className = `tile v${v} new`;
      tile.textContent = v;
      const x = c * (tileSize + gap);
      const y = r * (tileSize + gap);
      tile.style.transform = `translate(${x}px, ${y}px)`;
      boardEl.appendChild(tile);
    });
  });
}

// ===== Game Over =====
function checkGameOver() {
  if (getEmptyCells().length > 0) return;
  const clone = JSON.parse(JSON.stringify(board));
  if (moveLeft() || moveRight() || moveUp() || moveDown()) {
    board = clone;
    return;
  }
  overlay.style.display = "flex";
}

// ===== Leaderboard =====
function saveScore() {
  const name = inputName.value.trim();
  if (!name) return;
  const data = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  data.push({ name, score, date: new Date().toLocaleString() });
  data.sort((a,b) => b.score - a.score);
  localStorage.setItem("leaderboard", JSON.stringify(data.slice(0,10)));
  inputName.style.display = "none";
  saveScoreBtn.textContent = "Сохранено";
}

function renderLB() {
  lbList.innerHTML = "";
  const data = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  data.forEach(r => {
    const row = document.createElement("div");
    row.className = "row";
    row.textContent = `${r.name} — ${r.score} — ${r.date}`;
    lbList.appendChild(row);
  });
}

// ===== Restart =====
function restart() {
  score = 0;
  history = [];
  board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(0));
  addTile(2);
  overlay.style.display = "none";
  inputName.style.display = "block";
  saveScoreBtn.textContent = "Сохранить";
  render();
}

// ===== Controls =====
undoBtn.onclick = undo;
restartBtn.onclick = restart;
saveScoreBtn.onclick = saveScore;
lbBtn.onclick = () => { renderLB(); lbModal.style.display = "block"; };
closeLB.onclick = () => lbModal.style.display = "none";

document.addEventListener("keydown", e => {
  if (overlay.style.display !== "none") return;
  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === "ArrowUp") moveUp();
  if (e.key === "ArrowDown") moveDown();
});

// ===== Mobile buttons =====
document.getElementById("upBtn").onclick = moveUp;
document.getElementById("downBtn").onclick = moveDown;
document.getElementById("leftBtn").onclick = moveLeft;
document.getElementById("rightBtn").onclick = moveRight;

// ===== Start game =====
createGrid();
restart();
