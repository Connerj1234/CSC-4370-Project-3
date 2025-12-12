"use strict";

class SantaPuzzleGame {
  constructor(options) {
    this.gridEl = options.gridEl;
    this.timerEl = options.timerEl;
    this.movesEl = options.movesEl;
    this.magicEl = options.magicEl;

    this.moveSound = options.moveSound;
    this.bgMusic = options.bgMusic;
    this.winSound = options.winSound;

    this.isRunning = false;

    this.resetDifficultyBtn = options.resetDifficultyBtn;
    this.tileElsByValue = new Map();
    this.handleResetDifficulty = this.handleResetDifficulty.bind(this);

    this.shuffleBtn = options.shuffleBtn;
    this.resetBtn = options.resetBtn;
    this.magicBtn = options.magicBtn;

    this.winOverlay = options.winOverlay;
    this.winStatsEl = options.winStatsEl;
    this.playAgainBtn = options.playAgainBtn;

    this.gridSizeSelect = options.gridSizeSelect;

    this.difficultyLabelEl = options.difficultyLabelEl;
    this.difficultyTextEl = options.difficultyTextEl;
    this.difficultyFillEl = options.difficultyFillEl;

    this.version = options.version || "santas_workshop";
    this.emptyValue = 0;

    this.imageKey = options.imageKey || "santa.jpg";

    this.maxDifficultyLevel = 5;
    this.difficultyStorageKey = "santa_difficulty_level";
    this.gridStorageKey = "santa_grid_size";

    this.gridSize = options.gridSize || 4;

    this.total = this.gridSize * this.gridSize;
    this.state = [];
    this.emptyIndex = this.total - 1;

    this.moves = 0;
    this.seconds = 0;
    this.timerId = null;
    this.solved = false;

    this.difficultyLevel = 1;
    this.magicUses = 3;
    this.defaultMagicUses = 3;

    this.startedAtISO = null;
    this.endedAtISO = null;

    this.handleGridClick = this.handleGridClick.bind(this);
    this.handleShuffle = this.handleShuffle.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleMagic = this.handleMagic.bind(this);
    this.handlePlayAgain = this.handlePlayAgain.bind(this);
    this.handleGridSizeChange = this.handleGridSizeChange.bind(this);
  }

  init() {
    this.gridEl.addEventListener("click", this.handleGridClick);
    this.shuffleBtn.addEventListener("click", this.handleShuffle);
    this.resetBtn.addEventListener("click", this.handleReset);
    this.magicBtn.addEventListener("click", this.handleMagic);
    this.playAgainBtn.addEventListener("click", this.handlePlayAgain);

    if (this.gridSizeSelect) {
      this.gridSizeSelect.addEventListener("change", this.handleGridSizeChange);
    }

    if (this.resetDifficultyBtn) {
        this.resetDifficultyBtn.addEventListener("click", this.handleResetDifficulty);
      }

    this.loadProgress();
    this.applyGridCSSVars();
    this.applyDifficultyUI();

    this.resetGame();
    this.setRunning(false);
  }

  loadProgress() {
    const savedLevel = Number(localStorage.getItem(this.difficultyStorageKey));
    if (!Number.isNaN(savedLevel) && savedLevel >= 1 && savedLevel <= this.maxDifficultyLevel) {
      this.difficultyLevel = savedLevel;
    } else {
      this.difficultyLevel = 1;
    }

    const savedGrid = Number(localStorage.getItem(this.gridStorageKey));
    if (!Number.isNaN(savedGrid) && [3, 4, 6, 8, 10].includes(savedGrid)) {
      this.gridSize = savedGrid;
    }

    if (this.gridSizeSelect) {
      this.gridSizeSelect.value = String(this.gridSize);
    }

    this.recomputeTotals();
  }

  saveProgress() {
    localStorage.setItem(this.difficultyStorageKey, String(this.difficultyLevel));
    localStorage.setItem(this.gridStorageKey, String(this.gridSize));
  }

  recomputeTotals() {
    this.total = this.gridSize * this.gridSize;
    this.emptyIndex = this.total - 1;
    this.state = [];
  }

  applyGridCSSVars() {
    this.gridEl.style.setProperty("--grid-size", String(this.gridSize));
    document.documentElement.style.setProperty("--grid-size", String(this.gridSize));
  }

  getDifficultyName(level) {
    if (level <= 1) return "Easy";
    if (level === 2) return "Normal";
    if (level === 3) return "Hard";
    if (level === 4) return "Expert";
    return "Master";
  }

  getShuffleMovesForDifficulty() {
    const base = 220;
    const perLevel = 90;
    return base + (this.difficultyLevel - 1) * perLevel;
  }

  getMagicUsesForDifficulty() {
    const base = 3;
    const reduction = Math.floor((this.difficultyLevel - 1) / 2);
    return Math.max(1, base - reduction);
  }

  applyDifficultyUI() {
    const level = this.difficultyLevel;
    const name = this.getDifficultyName(level);

    if (this.difficultyLabelEl) this.difficultyLabelEl.textContent = `Level ${level}`;
    if (this.difficultyTextEl) this.difficultyTextEl.textContent = name;

    if (this.difficultyFillEl) {
      const denom = Math.max(1, this.maxDifficultyLevel - 1);
      const pct = ((level - 1) / denom) * 100;
      this.difficultyFillEl.style.width = `${pct}%`;
    }

    this.defaultMagicUses = this.getMagicUsesForDifficulty();
    if (!this.solved) {
      this.magicUses = Math.min(this.magicUses, this.defaultMagicUses);
    }
    this.magicEl.textContent = String(this.magicUses);
  }

  setRunning(running) {
    this.isRunning = running;

    if (!running) {
      this.stopTimer();
      this.pauseBgMusic();
    } else {
      this.startTimer();
      this.playBgMusic();
    }
  }

  playMoveSound() {
    if (!this.isRunning) return;
    if (!this.moveSound) return;

    try {
      this.moveSound.currentTime = 0;
      this.moveSound.play().catch(() => {});
    } catch {}
  }

  playBgMusic() {
    if (!this.bgMusic) return;

    try {
      this.bgMusic.volume = 0.25;
      this.bgMusic.play().catch(() => {});
    } catch {}
  }

  pauseBgMusic() {
    if (!this.bgMusic) return;

    try {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    } catch {}
  }

  playWinSound() {
    if (!this.winSound) return;

    try {
      this.winSound.currentTime = 0;
      this.winSound.play().catch(() => {});
    } catch {}
  }

  resetGame() {
    this.state = this.getSolvedState();
    this.emptyIndex = this.total - 1;

    this.moves = 0;
    this.seconds = 0;
    this.solved = false;

    this.magicUses = this.getMagicUsesForDifficulty();

    this.startedAtISO = new Date().toISOString();
    this.endedAtISO = null;

    this.updateHUD();
    this.hideWinOverlay();

    this.magicBtn.disabled = this.magicUses === 0;

    this.applyGridCSSVars();
    this.buildTiles();
    this.setRunning(false);
  }

  startNewGame() {
    const shuffleMoves = this.getShuffleMovesForDifficulty();
    this.shuffleGame(shuffleMoves);
  }

  shuffleGame(iterations = 250) {
    this.solved = false;
    this.hideWinOverlay();

    this.state = this.getSolvedState();
    this.emptyIndex = this.total - 1;

    this.moves = 0;
    this.seconds = 0;
    this.magicUses = this.getMagicUsesForDifficulty();

    this.startedAtISO = new Date().toISOString();
    this.endedAtISO = null;

    this.updateHUD();
    this.applyDifficultyUI();

    this.magicBtn.disabled = this.magicUses === 0;

    const last = { idx: -1 };

    for (let k = 0; k < iterations; k++) {
      const neighbors = this.getNeighborIndices(this.emptyIndex);
      const filtered = neighbors.filter((n) => n !== last.idx);
      const options = filtered.length ? filtered : neighbors;

      const pick = options[Math.floor(Math.random() * options.length)];
      last.idx = this.emptyIndex;

      this.swap(pick, this.emptyIndex);
      this.emptyIndex = pick;
    }

    this.updateTilePositions();
    this.setRunning(true);
  }

  moveTile(tileIndex) {
    if (!this.canMove(tileIndex)) return false;

    this.swap(tileIndex, this.emptyIndex);
    this.emptyIndex = tileIndex;

    this.moves += 1;
    this.movesEl.textContent = String(this.moves);

    this.updateTilePositions();
    this.playMoveSound();

    if (this.checkWin()) this.handleWin();
    return true;
  }

  useMagic() {
    if (this.solved) return;
    if (this.magicUses <= 0) return;

    const bestMove = this.findBestAdjacentMove();
    if (!bestMove) return;

    this.magicUses -= 1;
    this.magicEl.textContent = String(this.magicUses);

    // Free move: does not increase move count
    this.swap(bestMove.tileIndex, this.emptyIndex);
    this.emptyIndex = bestMove.tileIndex;

    this.updateTilePositions();
    this.playMoveSound();

    if (this.checkWin()) this.handleWin();

    if (this.magicUses === 0) this.magicBtn.disabled = true;
  }

  findBestAdjacentMove() {
    const candidates = this.getNeighborIndices(this.emptyIndex).filter(
      (idx) => this.state[idx] !== this.emptyValue
    );

    if (candidates.length === 0) return null;

    let best = null;

    for (const tileIndex of candidates) {
      const score = this.scoreIfMoved(tileIndex);

      if (!best || score < best.score) {
        best = { tileIndex, score };
        continue;
      }

      if (best && score === best.score) {
        const wouldPlaceCorrectly = this.wouldPlaceTileCorrectly(tileIndex);
        const bestWouldPlaceCorrectly = this.wouldPlaceTileCorrectly(best.tileIndex);

        if (wouldPlaceCorrectly && !bestWouldPlaceCorrectly) {
          best = { tileIndex, score };
        } else if (wouldPlaceCorrectly === bestWouldPlaceCorrectly && Math.random() < 0.5) {
          best = { tileIndex, score };
        }
      }
    }

    return best;
  }

  wouldPlaceTileCorrectly(tileIndex) {
    const val = this.state[tileIndex];
    if (val === this.emptyValue) return false;

    // After move, tile goes to current emptyIndex
    const newIndex = this.emptyIndex;
    const goalIndex = val - 1;
    return newIndex === goalIndex;
  }

  scoreIfMoved(tileIndex) {
    const simulated = [...this.state];
    const tmp = simulated[tileIndex];
    simulated[tileIndex] = simulated[this.emptyIndex];
    simulated[this.emptyIndex] = tmp;

    return this.totalManhattanDistance(simulated);
  }

  totalManhattanDistance(arr) {
    let total = 0;

    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      if (val === this.emptyValue) continue;

      const current = this.indexToRC(i);
      const goalIndex = val - 1;
      const goal = this.indexToRC(goalIndex);

      total += Math.abs(current.r - goal.r) + Math.abs(current.c - goal.c);
    }

    return total;
  }

  getSessionSnapshot() {
    const ended = this.endedAtISO ? this.endedAtISO : new Date().toISOString();

    return {
      version: this.version,
      puzzle_size: this.gridSize,
      image_key: this.imageKey,
      difficulty_level: this.difficultyLevel,
      difficulty_name: this.getDifficultyName(this.difficultyLevel),
      started_at: this.startedAtISO,
      ended_at: ended,
      duration_seconds: this.seconds,
      moves: this.moves,
      magic_used: this.getMagicUsesForDifficulty() - this.magicUses,
      solved: this.solved,
      final_state: [...this.state],
    };
  }

  updateDifficultyAfterWin() {
    // Performance score: lower is better
    const score = this.seconds + this.moves * 2;

    // Targets scale with grid size and difficulty
    const sizeFactor = Math.max(1, (this.gridSize / 4));
    const targets = {
      1: 260,
      2: 220,
      3: 190,
      4: 165,
      5: 150,
    };

    const currentTarget = Math.round((targets[this.difficultyLevel] || 200) * sizeFactor);

    if (score <= currentTarget && this.difficultyLevel < this.maxDifficultyLevel) {
      this.difficultyLevel += 1;
      this.saveProgress();
      this.applyDifficultyUI();
    } else {
      this.saveProgress();
    }
  }

  handleWin() {
    this.solved = true;
    this.endedAtISO = new Date().toISOString();
    this.setRunning(false);
    this.playWinSound();

    this.updateDifficultyAfterWin();

    this.winStatsEl.textContent =
      `Time: ${this.seconds}s   Moves: ${this.moves}   Difficulty: ${this.getDifficultyName(this.difficultyLevel)}`;
    this.showWinOverlay();

    this.magicBtn.disabled = true;
  }

  updateHUD() {
    this.movesEl.textContent = String(this.moves);
    this.timerEl.textContent = String(this.seconds);
    this.magicEl.textContent = String(this.magicUses);
    this.applyDifficultyUI();
  }

  startTimer() {
    this.stopTimer();

    this.timerId = setInterval(() => {
      if (!this.isRunning) return;
      if (this.solved) return;

      this.seconds += 1;
      this.timerEl.textContent = String(this.seconds);
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
  }

  getSolvedState() {
    const arr = [];
    for (let i = 1; i < this.total; i++) arr.push(i);
    arr.push(this.emptyValue);
    return arr;
  }

  indexToRC(idx) {
    return { r: Math.floor(idx / this.gridSize), c: idx % this.gridSize };
  }

  isAdjacent(aIdx, bIdx) {
    const a = this.indexToRC(aIdx);
    const b = this.indexToRC(bIdx);
    const dr = Math.abs(a.r - b.r);
    const dc = Math.abs(a.c - b.c);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  canMove(tileIndex) {
    if (this.solved) return false;
    if (tileIndex === this.emptyIndex) return false;
    return this.isAdjacent(tileIndex, this.emptyIndex);
  }

  swap(i, j) {
    const tmp = this.state[i];
    this.state[i] = this.state[j];
    this.state[j] = tmp;
  }

  getNeighborIndices(idx) {
    const { r, c } = this.indexToRC(idx);
    const out = [];

    if (r > 0) out.push((r - 1) * this.gridSize + c);
    if (r < this.gridSize - 1) out.push((r + 1) * this.gridSize + c);
    if (c > 0) out.push(r * this.gridSize + (c - 1));
    if (c < this.gridSize - 1) out.push(r * this.gridSize + (c + 1));

    return out;
  }

  checkWin() {
    for (let i = 0; i < this.total - 1; i++) {
      if (this.state[i] !== i + 1) return false;
    }
    return this.state[this.total - 1] === this.emptyValue;
  }

  setTileBackground(tileEl, tileValue) {
    if (tileValue === this.emptyValue) return;

    const correctIndex = tileValue - 1;
    const { r, c } = this.indexToRC(correctIndex);

    const denom = Math.max(1, this.gridSize - 1);
    const xPercent = (c / denom) * 100;
    const yPercent = (r / denom) * 100;

    tileEl.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
  }


  buildTiles() {
    this.gridEl.innerHTML = "";
    this.tileElsByValue.clear();

    for (let v = 0; v < this.total; v++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.value = String(v);

      if (v === this.emptyValue) {
        tile.classList.add("empty");
      }

      this.tileElsByValue.set(v, tile);
      this.gridEl.appendChild(tile);
    }

    this.updateTilePositions();
  }

  updateTilePositions() {
    // remove movable class from all
    for (const el of this.tileElsByValue.values()) {
      el.classList.remove("movable");
    }

    for (let i = 0; i < this.state.length; i++) {
      const val = this.state[i];
      const el = this.tileElsByValue.get(val);
      if (!el) continue;

      const { r, c } = this.indexToRC(i);

      el.style.setProperty("--r", String(r));
      el.style.setProperty("--c", String(c));
      el.dataset.index = String(i);

      if (val !== this.emptyValue) {
        this.setTileBackground(el, val);
        if (this.canMove(i)) el.classList.add("movable");
      }
    }
  }

  handleResetDifficulty() {
    this.difficultyLevel = 1;
    this.saveProgress();
    this.applyDifficultyUI();
    this.resetGame();
  }

  showWinOverlay() {
    this.winOverlay.classList.add("show");
    this.winOverlay.setAttribute("aria-hidden", "false");
  }

  hideWinOverlay() {
    this.winOverlay.classList.remove("show");
    this.winOverlay.setAttribute("aria-hidden", "true");
  }

  handleGridSizeChange(e) {
    const val = Number(e.target.value);
    if (![3, 4, 6, 8, 10].includes(val)) return;

    // Update size + persist
    this.gridSize = val;
    this.saveProgress();

    // Recompute board totals for new size
    this.recomputeTotals();

    // Reset game handles: applyGridCSSVars + buildTiles + timer + HUD
    this.resetGame();
  }

  handleGridClick(e) {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains("tile")) return;

    const idx = Number(target.dataset.index);
    if (Number.isNaN(idx)) return;

    this.moveTile(idx);
  }

  handleShuffle() {
    this.startNewGame();
  }

  handleReset() {
    this.resetGame();
  }

  handleMagic() {
    this.useMagic();
  }

  handlePlayAgain() {
    this.startNewGame();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new SantaPuzzleGame({
    gridEl: document.getElementById("grid"),
    timerEl: document.getElementById("timer"),
    movesEl: document.getElementById("moves"),
    magicEl: document.getElementById("magic"),

    resetDifficultyBtn: document.getElementById("resetDifficultyBtn"),

    shuffleBtn: document.getElementById("shuffleBtn"),
    resetBtn: document.getElementById("resetBtn"),
    magicBtn: document.getElementById("magicBtn"),

    winOverlay: document.getElementById("winOverlay"),
    winStatsEl: document.getElementById("winStats"),
    playAgainBtn: document.getElementById("playAgainBtn"),

    gridSizeSelect: document.getElementById("gridSizeSelect"),

    difficultyLabelEl: document.getElementById("difficultyLabel"),
    difficultyTextEl: document.getElementById("difficultyText"),
    difficultyFillEl: document.getElementById("difficultyFill"),

    moveSound: document.getElementById("moveSound"),
    bgMusic: document.getElementById("bgMusic"),
    winSound: document.getElementById("winSound"),

    version: "santas_workshop",
    gridSize: 4,
    imageKey: "santa.jpg",
  });

  game.init();
  window.__SANTA_GAME__ = game;
});
