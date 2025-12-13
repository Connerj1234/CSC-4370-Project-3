"use strict";

function applyTimeOfDayTheme() {
  const hour = new Date().getHours();
  // Day: 6am-5:59pm, Night: 6pm-5:59am
  const theme = (hour >= 6 && hour < 18) ? "day" : "night";

  document.body.dataset.theme = theme;

  // Small UI badge near the title
  const badge = document.getElementById("themeBadge");
  if (badge) {
    badge.textContent = `Theme: ${theme.charAt(0).toUpperCase()}${theme.slice(1)}`;
  }

  // Re-apply at the next hour boundary (in case the page stays open)
  const now = new Date();
  const msToNextHour =
    (60 - now.getMinutes()) * 60 * 1000
    - now.getSeconds() * 1000
    - now.getMilliseconds();

  window.setTimeout(() => this.applyTimeOfDayTheme(), Math.max(1_000, msToNextHour));
}

async function refreshAuthUI() {
    let user = null;
    try {
      const res = await API.me();
      user = res && res.ok ? res.user : null;
    } catch (_) {
      user = null;
    }

    window.__currentUser = user;

    const greetingEl = document.getElementById("userGreeting");
    if (greetingEl) {
      greetingEl.textContent = user
        ? `Welcome: ${user.display_name || user.email || "User"}`
        : "Welcome: Guest";
    }

    // Auth button label (modal logic will handle open/close)
    const authBtnEl = document.getElementById("authBtn");
    if (authBtnEl) authBtnEl.textContent = user ? "Logout" : "Login";

    // Update progress panel, if game has been created
    if (window.__game && typeof window.__game.refreshProgressUI === "function") {
      window.__game.refreshProgressUI();
    }

    return user;
  }

class SantaPuzzleGame {
  constructor(options) {
    this.gridEl = options.gridEl;
    this.timerEl = options.timerEl;
    this.movesEl = options.movesEl;
    this.magicEl = options.magicEl;

    this.confettiCanvas = options.confettiCanvas;
    this.confettiCtx = this.confettiCanvas ? this.confettiCanvas.getContext("2d") : null;
    this.confetti = [];
    this.confettiAnimId = null;

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
    this.handleResize();

    this.moveSound = options.moveSound;
    this.bgMusic = options.bgMusic;
    this.winSound = options.winSound;

    // Progress / Insights UI
    this.progressRefreshBtn = document.getElementById("progressRefreshBtn");
    this.progressLoggedOutEl = document.getElementById("progressLoggedOut");
    this.progressContentEl = document.getElementById("progressContent");
    this.progressUpdatedAtEl = document.getElementById("progressUpdatedAt");

    this.statWinsEl = document.getElementById("statWins");
    this.statSessionsEl = document.getElementById("statSessions");
    this.statBestTimeEl = document.getElementById("statBestTime");
    this.statBestMovesEl = document.getElementById("statBestMoves");
    this.statStoryStageEl = document.getElementById("statStoryStage");
    this.statSolvedEl = document.getElementById("statSolved");

    this.achievementsListEl = document.getElementById("achievementsList");
    this.sessionsTbodyEl = document.getElementById("sessionsTbody");

    if (this.progressRefreshBtn) {
      this.progressRefreshBtn.addEventListener("click", () => this.refreshProgressUI(true));
    }

    this.isRunning = false;

    // --- DB session tracking (schema.sql-aligned) ---
    this.sessionId = null;
    this.sessionPuzzleId = null;
    this.lastSessionSyncAt = 0;
    this.sessionSyncIntervalMs = 1500;
    this.magicUsedCount = 0;
    this.powerupsUsedCounts = { freeze: 0, swap: 0, insight: 0 };


    // Power-ups (non-DB feature)
    this.puFreezeBtn = options.puFreezeBtn;
    this.puFreezeUsesEl = options.puFreezeUsesEl;
    this.puSwapBtn = options.puSwapBtn;
    this.puSwapUsesEl = options.puSwapUsesEl;
    this.puInsightBtn = options.puInsightBtn;
    this.puInsightText = options.puInsightText;

    // Story mode panel (DB-backed)
    this.storyPlayBtn = options.storyPlayBtn;
    this.storyLoggedOutEl = options.storyLoggedOutEl;
    this.storyContentEl = options.storyContentEl;
    this.storyStageEl = options.storyStageEl;
    this.storySolvedEl = options.storySolvedEl;
    this.storyBarFillEl = options.storyBarFillEl;
    this.storyGoalEl = options.storyGoalEl;
    this.storyTextEl = options.storyTextEl;

    this.powerups = {
      freeze: 1,
      swap: 1,
    };

    // If > 0, timer is paused for this many seconds
    this.freezeTimerSecondsLeft = 0;

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
    document.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "w") {
          this.debugForceWin();
        }
      });

    if (!this.gridEl) {
      console.error("Missing #grid element");
      return;
    }

    this.gridEl.addEventListener("click", this.handleGridClick);

    if (!this.shuffleBtn) console.error("Missing #shuffleBtn");
    else this.shuffleBtn.addEventListener("click", this.handleShuffle);

    if (!this.resetBtn) console.error("Missing #resetBtn");
    else this.resetBtn.addEventListener("click", this.handleReset);

    if (!this.magicBtn) console.error("Missing #magicBtn");
    else this.magicBtn.addEventListener("click", this.handleMagic);

    if (!this.playAgainBtn) console.error("Missing #playAgainBtn");
    else this.playAgainBtn.addEventListener("click", this.handlePlayAgain);

    // Power-ups
    if (this.puFreezeBtn) {
      this.puFreezeBtn.addEventListener("click", () => this.useTimeFreeze());
    }
    if (this.puSwapBtn) {
      this.puSwapBtn.addEventListener("click", () => this.useSwapPass());
    }
    if (this.puInsightBtn) {
      this.puInsightBtn.addEventListener("click", () => this.showCompletionInsight());
    }

    if (this.storyPlayBtn) {
      this.storyPlayBtn.addEventListener("click", () => this.playStoryChallenge());
    }

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

  debugForceWin() {
    // Set solved board state
    this.setSolvedState();          // if you have this helper
    this.moves += 1;                // optional, just so HUD changes
    this.updateHUD();
    this.updateTilePositions();

    // Trigger normal win flow (confetti, overlay, sounds, stop timer/music)
    this.handleWin();
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

    this.updatePowerupsUI();

    if (!running) {
      this.stopTimer();
      this.pauseBgMusic();
    } else {
      this.startTimer();
      this.playBgMusic();
    }

    this.updatePowerupsUI(this.isRunning);
  }

  // -------------------------------
  // DB wiring (schema.sql-aligned)
  // -------------------------------

  isLoggedIn() {
    return !!__currentUser;
  }

  async beginDbSession() {
    if (!this.isLoggedIn()) return;

    // If a previous session is still open, end it as incomplete.
    if (this.sessionId) {
      await this.endDbSession(false);
    }

    try {
      const res = await API.startSession({
        grid_size: this.gridSize,
        difficulty_level: this.difficultyLevel,
      });

      this.sessionId = res.session_id || null;
      this.sessionPuzzleId = res.puzzle_id || null;
      this.lastSessionSyncAt = 0;
      this.magicUsedCount = 0;
      this.powerupsUsedCounts = { freeze: 0, swap: 0, insight: 0 };

      // Optional analytics
      try {
        await API.logEvent({
          event_type: "SESSION_STARTED",
          meta: { grid_size: this.gridSize, difficulty_level: this.difficultyLevel, session_id: this.sessionId },
        });
      } catch (_) {}
    } catch (err) {
      console.warn("Failed to start DB session:", err);
      this.sessionId = null;
      this.sessionPuzzleId = null;
    }
  }

  async syncDbSession(force = false) {
    if (!this.isLoggedIn()) return;
    if (!this.sessionId) return;

    const now = Date.now();
    if (!force && now - this.lastSessionSyncAt < this.sessionSyncIntervalMs) return;
    this.lastSessionSyncAt = now;

    const payload = {
      session_id: this.sessionId,
      moves_count: this.moves,
      difficulty_level: this.difficultyLevel,
      magic_used: this.magicUsedCount,
      powerups_used: this.powerupsUsedCounts,
      final_state: this.state,
    };

    try {
      await API.updateSession(payload);
    } catch (err) {
      console.warn("Failed to update DB session:", err);
    }
  }

  async endDbSession(completed) {
    if (!this.isLoggedIn()) {
      this.sessionId = null;
      this.sessionPuzzleId = null;
      return;
    }
    if (!this.sessionId) return;

    const payload = {
      session_id: this.sessionId,
      completed: completed ? 1 : 0,
      completion_time_s: completed ? this.seconds : null,
      moves_count: this.moves,
      difficulty_level: this.difficultyLevel,
      magic_used: this.magicUsedCount,
      powerups_used: this.powerupsUsedCounts,
      final_state: this.state,
    };

    try {
      const res = await API.endSession(payload);

      // If the server awarded achievements, show a tiny hint in the win overlay area.
      if (completed && res && Array.isArray(res.awarded) && res.awarded.length && this.winStatsEl) {
        const earned = res.awarded.join(", ");
        this.winStatsEl.textContent += `\nAchievements: ${earned}`;
      }

      // Optional: refresh insights after ending a session
      try {
        const ins = await API.getInsights();
        window.__lastInsights = ins;
      } catch (_) {}

      // Refresh story panel if present
      try { await this.refreshStoryPanel(); } catch (_) {}
    } catch (err) {
      console.warn("Failed to end DB session:", err);
    } finally {
      this.sessionId = null;
      this.sessionPuzzleId = null;
    }
  }

  formatDuration(seconds) {
    if (seconds === null || seconds === undefined) return "—";
    const s = Math.max(0, Number(seconds) || 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m <= 0) return `${r}s`;
    return `${m}m ${String(r).padStart(2, "0")}s`;
  }

  formatDateTime(dtStr) {
    if (!dtStr) return "—";
    // Works with MariaDB DATETIME strings like "2025-12-13 14:42:40"
    const iso = dtStr.replace(" ", "T") + "Z";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return dtStr;
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  setProgressLoggedOut() {
    if (this.progressLoggedOutEl) this.progressLoggedOutEl.hidden = false;
    if (this.progressContentEl) this.progressContentEl.hidden = true;
    if (this.progressUpdatedAtEl) this.progressUpdatedAtEl.textContent = "";
  }

  renderInsights(insightsPayload) {
    const ins = insightsPayload && (insightsPayload.insights || insightsPayload);

    const totals = ins?.totals || {};
    const bests = ins?.personal_bests || {};
    const story = ins?.story || {};
    const achievements = ins?.achievements || [];
    const recent = ins?.recent_sessions || [];

    if (this.statWinsEl) this.statWinsEl.textContent = String(totals.wins ?? "0");
    if (this.statSessionsEl) this.statSessionsEl.textContent = String(totals.sessions ?? "0");

    if (this.statBestTimeEl) {
      this.statBestTimeEl.textContent =
        bests.best_time_s === null || bests.best_time_s === undefined
          ? "—"
          : this.formatDuration(bests.best_time_s);
    }

    if (this.statBestMovesEl) {
      this.statBestMovesEl.textContent =
        bests.best_moves === null || bests.best_moves === undefined ? "—" : String(bests.best_moves);
    }

    if (this.statStoryStageEl) this.statStoryStageEl.textContent = String(story.story_stage ?? "1");
    if (this.statSolvedEl) this.statSolvedEl.textContent = String(story.puzzles_solved_total ?? "0");

    // Achievements list
    if (this.achievementsListEl) {
      this.achievementsListEl.innerHTML = "";
      if (!achievements.length) {
        const li = document.createElement("li");
        li.className = "achievement-item";
        li.innerHTML = `<div class="achievement-title">No achievements yet</div>
                        <div class="achievement-desc">Win a puzzle to earn your first badge.</div>`;
        this.achievementsListEl.appendChild(li);
      } else {
        achievements.slice(0, 8).forEach((a) => {
          const li = document.createElement("li");
          li.className = "achievement-item";
          const awarded = a.awarded_at ? this.formatDateTime(a.awarded_at) : "";
          li.innerHTML = `
            <div class="achievement-title">${a.title || a.code}</div>
            <div class="achievement-desc">${a.description || ""}</div>
            ${awarded ? `<div class="achievement-meta">Awarded: ${awarded}</div>` : ""}
          `;
          this.achievementsListEl.appendChild(li);
        });
      }
    }

    // Recent sessions
    if (this.sessionsTbodyEl) {
      this.sessionsTbodyEl.innerHTML = "";
      if (!recent.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="6" style="color: var(--muted); padding: 10px 8px;">No sessions yet.</td>`;
        this.sessionsTbodyEl.appendChild(tr);
      } else {
        recent.forEach((s) => {
          const tr = document.createElement("tr");
          const started = this.formatDateTime(s.started_at);
          const grid = `${s.grid_size}×${s.grid_size}`;
          const diff = `L${s.difficulty_level ?? 1}`;
          const resultPill =
            Number(s.completed) === 1
              ? `<span class="pill success">Win</span>`
              : `<span class="pill fail">Incomplete</span>`;
          const time = s.completion_time_s == null ? "—" : this.formatDuration(s.completion_time_s);
          const moves = s.moves_count == null ? "—" : String(s.moves_count);

          tr.innerHTML = `
            <td>${started}</td>
            <td>${grid}</td>
            <td>${diff}</td>
            <td>${resultPill}</td>
            <td>${time}</td>
            <td>${moves}</td>
          `;
          this.sessionsTbodyEl.appendChild(tr);
        });
      }
    }

    if (this.progressLoggedOutEl) this.progressLoggedOutEl.hidden = true;
    if (this.progressContentEl) this.progressContentEl.hidden = false;

    if (this.progressUpdatedAtEl) {
      const last = story.last_updated_at ? this.formatDateTime(story.last_updated_at) : null;
      this.progressUpdatedAtEl.textContent = last ? `Story last updated: ${last}` : "";
    }
  }

  async refreshProgressUI(showToast = false) {
    // Only meaningful for logged in users
    if (!window.__currentUser) {
      this.setProgressLoggedOut();
      return;
    }

    try {
      const data = await API.getInsights();
      this.renderInsights(data);

      if (showToast && this.progressUpdatedAtEl) {
        // Small feedback without adding new UI elements
        const now = new Date();
        const stamp = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
        this.progressUpdatedAtEl.textContent = `Updated: ${stamp}`;
      }
    } catch (err) {
      console.warn("Failed to load insights:", err);
    }
  }

  resetPowerupsForNewGame() {
    this.powerups.freeze = 1;
    this.powerups.swap = 1;
    this.freezeTimerSecondsLeft = 0;

    if (this.puInsightText) {
      this.puInsightText.textContent = "Playing... click Completion Insight to estimate moves remaining.";
    }

    this.updatePowerupsUI(true);
  }

  updatePowerupsUI(isRunning) {
    if (this.puFreezeUsesEl) this.puFreezeUsesEl.textContent = String(this.powerups.freeze);
    if (this.puSwapUsesEl) this.puSwapUsesEl.textContent = String(this.powerups.swap);

    if (this.puFreezeBtn) this.puFreezeBtn.disabled = !isRunning || this.powerups.freeze <= 0;
    if (this.puSwapBtn) this.puSwapBtn.disabled = !isRunning || this.powerups.swap <= 0;
    if (this.puInsightBtn) this.puInsightBtn.disabled = !isRunning;
  }

  useTimeFreeze() {
    if (!this.isRunning) return;
    if (this.solved) return;
    if (this.powerups.freeze <= 0) return;
    if (this.freezeTimerSecondsLeft > 0) return; // already frozen

    this.powerups.freeze -= 1;
    this.powerupsUsedCounts.freeze += 1;
    this.syncDbSession(true);
    try { API.logEvent({ event_type: "POWERUP_USED", meta: { type: "freeze" } }); } catch (_) {}
    this.freezeTimerSecondsLeft = 10;
    this.updatePowerupsUI(true);

    if (this.puInsightText) {
      this.puInsightText.textContent = "Time Freeze active: 10s remaining.";
    }

    // Pause music during freeze for a clear "pause" feel
    this.pauseBgMusic();
  }

  getSwapPassTargets() {
    const { r, c } = this.indexToRC(this.emptyIndex);
    const targets = [];

    const pushIfValid = (rr, cc) => {
      if (rr < 0 || rr >= this.gridSize || cc < 0 || cc >= this.gridSize) return;
      targets.push(this.rcToIndex(rr, cc));
    };

    // Two-away in four directions
    pushIfValid(r - 2, c);
    pushIfValid(r + 2, c);
    pushIfValid(r, c - 2);
    pushIfValid(r, c + 2);

    return targets.filter((idx) => this.state[idx] !== this.emptyValue);
  }

  useSwapPass() {
    if (!this.isRunning) return;
    if (this.solved) return;
    if (this.powerups.swap <= 0) return;

    const targets = this.getSwapPassTargets();
    if (targets.length === 0) {
      if (this.puInsightText) {
        this.puInsightText.textContent = "Swap Pass unavailable right now (no 2-away tile aligned with the empty space).";
      }
      return;
    }

    // Pick the target that reduces Manhattan distance the most
    let bestIdx = targets[0];
    let bestScore = Infinity;

    for (const idx of targets) {
      const simulated = [...this.state];
      const tmp = simulated[idx];
      simulated[idx] = simulated[this.emptyIndex];
      simulated[this.emptyIndex] = tmp;
      const score = this.totalManhattanDistance(simulated);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    }

    this.powerups.swap -= 1;
    this.powerupsUsedCounts.swap += 1;
    this.syncDbSession(true);
    try { API.logEvent({ event_type: "POWERUP_USED", meta: { type: "swap" } }); } catch (_) {}
    this.updatePowerupsUI(true);

    // Swap counts as a move
    this.swap(bestIdx, this.emptyIndex);
    this.emptyIndex = bestIdx;
    this.moves += 1;
    this.movesEl.textContent = String(this.moves);

    this.updateTilePositions();
    this.playMoveSound();

    this.syncDbSession();

    if (this.checkWin()) {
      this.handleWin();
      return;
    }

    if (this.puInsightText) {
      this.puInsightText.textContent = "Swap Pass used!";
    }
  }

  showCompletionInsight() {
    if (!this.isRunning) return;
    if (this.solved) return;

    this.powerupsUsedCounts.insight += 1;
    this.syncDbSession(true);
    try { API.logEvent({ event_type: "POWERUP_USED", meta: { type: "insight" } }); } catch (_) {}

    const manhattan = this.totalManhattanDistance(this.state);
    const estimate = Math.max(0, Math.ceil(manhattan / 2));

    if (this.puInsightText) {
      this.puInsightText.textContent = `Estimated moves remaining: ~${estimate} (Manhattan: ${manhattan}).`;
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
    // If a game was in progress, close the DB session as incomplete.
    this.endDbSession(false);

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

    this.gridEl.classList.remove("win-glow", "win-pulse");
    this.stopConfettiLoop();
    this.confetti = [];

    this.applyGridCSSVars();
    this.buildTiles();
    this.setRunning(false);

    this.freezeTimerSecondsLeft = 0;
    if (this.puInsightText) this.puInsightText.textContent = "Shuffle to start a game.";
    this.updatePowerupsUI(false);
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

    // Per-game power-ups reset on shuffle
    this.resetPowerupsForNewGame();

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

    // Start DB session after a shuffle starts the game
    this.beginDbSession();

    this.setRunning(true);
    this.syncDbSession(true);
  }

  moveTile(tileIndex) {
    if (!this.canMove(tileIndex)) return false;

    this.swap(tileIndex, this.emptyIndex);
    this.emptyIndex = tileIndex;

    this.moves += 1;
    this.movesEl.textContent = String(this.moves);

    this.updateTilePositions();
    this.playMoveSound();

    this.syncDbSession();

    if (this.checkWin()) this.handleWin();
    return true;
  }

  useMagic() {
    if (this.solved) return;
    if (this.magicUses <= 0) return;

    const bestMove = this.findBestAdjacentMove();
    if (!bestMove) return;

    this.magicUses -= 1;
    this.magicUsedCount += 1;
    this.magicEl.textContent = String(this.magicUses);

    // Free move: does not increase move count
    this.swap(bestMove.tileIndex, this.emptyIndex);
    this.emptyIndex = bestMove.tileIndex;

    this.updateTilePositions();
    this.playMoveSound();

    this.syncDbSession();

    if (this.checkWin()) this.handleWin();

    if (this.magicUses === 0) this.magicBtn.disabled = true;
  }

  getNeighborIndicesOfEmpty() {
    const { r, c } = this.indexToRC(this.emptyIndex);
    const neighbors = [];

    const add = (rr, cc) => {
      if (rr < 0 || rr >= this.gridSize || cc < 0 || cc >= this.gridSize) return;
      neighbors.push(this.rcToIndex(rr, cc));
    };

    add(r - 1, c);
    add(r + 1, c);
    add(r, c - 1);
    add(r, c + 1);

    return neighbors;
  }

  setSolvedState() {
    this.state = [];
    for (let v = 1; v < this.total; v++) this.state.push(v);
    this.state.push(this.emptyValue);
    this.emptyIndex = this.total - 1;
  }

  shuffleByMoves(movesAway) {
    // start from solved
    this.setSolvedState();         // or whatever your “reset to solved” function is
    this.moves = 0;
    this.seconds = 0;
    this.solved = false;

    let prevEmpty = null;

    for (let i = 0; i < movesAway; i++) {
      const options = this.getNeighborIndicesOfEmpty();

      // avoid undoing last move if possible
      const filtered = prevEmpty !== null ? options.filter(idx => idx !== prevEmpty) : options;
      const pickFrom = filtered.length ? filtered : options;

      const choice = pickFrom[Math.floor(Math.random() * pickFrom.length)];

      prevEmpty = this.emptyIndex;
      this.swap(choice, this.emptyIndex);
      this.emptyIndex = choice;
    }

    this.updateHUD();
    this.updateTilePositions();
  }

  getShuffleMoveCount() {
    // You can tune these numbers
    if (this.difficultyLevel <= 1) return 5;     // Easy
    if (this.difficultyLevel === 2) return 25;   // Normal
    if (this.difficultyLevel === 3) return 60;   // Hard
    return 120;                                  // Expert+
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

    this.gridEl.classList.add("win-glow", "win-pulse");
    this.spawnConfettiBurst(180);

    setTimeout(() => {
      this.gridEl.classList.remove("win-pulse");
    }, 650);

    this.updateDifficultyAfterWin();

    this.winStatsEl.textContent =
      `Time: ${this.seconds}s   Moves: ${this.moves}   Difficulty: ${this.getDifficultyName(this.difficultyLevel)}`;
    this.showWinOverlay();

    this.magicBtn.disabled = true;

    if (this.puInsightText) this.puInsightText.textContent = "Solved!";
    this.updatePowerupsUI(false);

    // Finalize DB session as completed (awards achievements + updates story)
    this.endDbSession(true);

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

      // Time Freeze: pause timer for 10 seconds
      if (this.freezeTimerSecondsLeft > 0) {
        this.freezeTimerSecondsLeft -= 1;
        if (this.puInsightText) {
          this.puInsightText.textContent = `Time Freeze active: ${this.freezeTimerSecondsLeft}s remaining.`;
        }

        // Resume music when freeze ends (still playing)
        if (this.freezeTimerSecondsLeft === 0 && this.isRunning && !this.solved) {
          this.playBgMusic();
        }

        return;
      }

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

  rcToIndex(r, c) {
    return r * this.gridSize + c;
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

  handleResize() {
    if (!this.confettiCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.confettiCanvas.width = Math.floor(window.innerWidth * dpr);
    this.confettiCanvas.height = Math.floor(window.innerHeight * dpr);
    this.confettiCanvas.style.width = `${window.innerWidth}px`;
    this.confettiCanvas.style.height = `${window.innerHeight}px`;
    if (this.confettiCtx) this.confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  spawnConfettiBurst(count = 160) {
    if (!this.confettiCanvas || !this.confettiCtx) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;

      this.confetti.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 6,
        life: 60 + Math.floor(Math.random() * 60),
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        color: ["#2ee59d", "#f44336", "#ffd54f", "#64b5f6", "#ffffff"][Math.floor(Math.random() * 5)]
      });
    }

    this.startConfettiLoop();
  }

  startConfettiLoop() {
    if (this.confettiAnimId) return;

    const tick = () => {
      this.confettiAnimId = requestAnimationFrame(tick);
      this.updateConfetti();
      this.drawConfetti();
      if (this.confetti.length === 0) this.stopConfettiLoop();
    };

    tick();
  }

  stopConfettiLoop() {
    if (this.confettiAnimId) cancelAnimationFrame(this.confettiAnimId);
    this.confettiAnimId = null;
    if (this.confettiCtx) {
      this.confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  updateConfetti() {
    const gravity = 0.18;
    const drag = 0.985;

    this.confetti = this.confetti
      .map(p => {
        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1;
        return p;
      })
      .filter(p => p.life > 0 && p.y < window.innerHeight + 40);
  }

  drawConfetti() {
    if (!this.confettiCtx) return;
    const ctx = this.confettiCtx;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of this.confetti) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    }
  }

  async refreshStoryPanel() {
    // If story panel isn't present on this page, do nothing.
    if (!this.storyContentEl || !this.storyLoggedOutEl) return;

    try {
      const me = await API.me();
      const user = me && me.ok ? me.user : null;

      if (!user) {
        this.storyLoggedOutEl.style.display = "";
        this.storyContentEl.style.display = "none";
        return;
      }

      this.storyLoggedOutEl.style.display = "none";
      this.storyContentEl.style.display = "";

      const ins = await API.getInsights();
      if (ins && ins.ok && ins.insights) {
        this.renderStoryFromInsights(ins.insights);
      }
    } catch (err) {
      // If API fails, just show a soft message
      this.storyLoggedOutEl.style.display = "";
      this.storyLoggedOutEl.textContent = "Story Mode is unavailable right now.";
      this.storyContentEl.style.display = "none";
    }
  }

  renderStoryFromInsights(insights) {
    const story = insights.story || {};
    const stage = Number(story.story_stage || 1);
    const solved = Number(story.puzzles_solved_total || 0);

    if (this.storyStageEl) this.storyStageEl.textContent = String(stage);
    if (this.storySolvedEl) this.storySolvedEl.textContent = String(solved);

    // Backend stage rule: stage increases every 3 solves (capped at 10)
    const prevThreshold = Math.max(0, (stage - 1) * 3);
    const nextThreshold = Math.min(30, stage * 3); // 10 stages * 3 solves
    const inStageSolved = Math.max(0, solved - prevThreshold);
    const neededThisStage = Math.max(1, nextThreshold - prevThreshold);

    const pct = Math.max(0, Math.min(100, Math.round((inStageSolved / neededThisStage) * 100)));
    if (this.storyBarFillEl) this.storyBarFillEl.style.width = pct + "%";

    if (this.storyGoalEl) {
      if (stage >= 10) {
        this.storyGoalEl.textContent = "Final stage reached. Keep solving to polish the workshop!";
      } else {
        const remaining = Math.max(0, nextThreshold - solved);
        this.storyGoalEl.textContent = remaining === 0
          ? "Chapter unlocked! Win one more puzzle to lock it in."
          : `Next chapter in ${remaining} solve${remaining === 1 ? "" : "s"}.`;
      }
    }

    if (this.storyTextEl) {
      this.storyTextEl.textContent = this.getStoryNarration(stage);
    }
  }

  getStoryNarration(stage) {
    const chapters = {
      1: "Chapter 1: The Missing Blueprint\nFind the lost blueprint by solving puzzles and warming up the workshop.",
      2: "Chapter 2: Reindeer Run Mix-up\nThe delivery route got scrambled. Prove your skills with steady wins.",
      3: "Chapter 3: Elf Assembly Line\nThe elves need help staying on schedule. Keep your solves consistent.",
      4: "Chapter 4: The Frozen Clock\nTime is slipping. Use your power-ups wisely and keep moving.",
      5: "Chapter 5: The Gift Vault\nA special gift is locked away. Earn it with smart, clean wins.",
      6: "Chapter 6: Naughty List Glitch\nA sorting error is spreading. Solve more puzzles to stabilize the system.",
      7: "Chapter 7: Workshop Upgrade\nNew tools arrive. Your progress keeps the magic flowing.",
      8: "Chapter 8: Sleigh Systems Check\nEverything must be perfect. Push through and unlock the final prep.",
      9: "Chapter 9: Christmas Eve Countdown\nOne last stretch. Finish strong to reach the final chapter.",
      10:"Chapter 10: Ready for Takeoff\nThe sleigh is ready. You’ve mastered the workshop!"
    };
    return chapters[stage] || chapters[1];
  }

  async playStoryChallenge() {
    // A simple “story mode” action: set a recommended difficulty + grid, then shuffle.
    // You can tweak these rules anytime.
    const recommendedGrid = 4;
    const recommendedDifficulty = Math.max(1, Math.min(this.maxDifficultyLevel, this.difficultyLevel));

    if (this.gridSizeSelect) {
      this.gridSizeSelect.value = String(recommendedGrid);
      this.handleGridSizeChange({ target: this.gridSizeSelect });
    }

    // Nudge difficulty up a bit later in the story if you want (kept gentle).
    // We don't force the label UI here if you manage difficulty elsewhere.
    if (this.difficultyLevel < recommendedDifficulty) {
      this.difficultyLevel = recommendedDifficulty;
    }

    // Start a run
    if (typeof this.handleShuffle === "function") {
      this.handleShuffle();
    }
  }

}

document.addEventListener("DOMContentLoaded", () => {
  applyTimeOfDayTheme();
  refreshAuthUI();

  const game = new SantaPuzzleGame({
    gridEl: document.getElementById("grid"),
    timerEl: document.getElementById("timer"),
    movesEl: document.getElementById("moves"),
    magicEl: document.getElementById("magic"),

    resetDifficultyBtn: document.getElementById("resetDifficultyBtn"),

    shuffleBtn: document.getElementById("shuffleBtn"),
    resetBtn: document.getElementById("resetBtn"),
    magicBtn: document.getElementById("magicBtn"),

    puFreezeBtn: document.getElementById("puFreezeBtn"),
    puFreezeUsesEl: document.getElementById("puFreezeUses"),
    puSwapBtn: document.getElementById("puSwapBtn"),
    puSwapUsesEl: document.getElementById("puSwapUses"),
    puInsightBtn: document.getElementById("puInsightBtn"),
    puInsightText: document.getElementById("puInsightText"),

    storyPlayBtn: document.getElementById("storyPlayBtn"),
    storyLoggedOutEl: document.getElementById("storyLoggedOut"),
    storyContentEl: document.getElementById("storyContent"),
    storyStageEl: document.getElementById("storyStage"),
    storySolvedEl: document.getElementById("storySolved"),
    storyBarFillEl: document.getElementById("storyBarFill"),
    storyGoalEl: document.getElementById("storyGoal"),
    storyTextEl: document.getElementById("storyText"),

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

    confettiCanvas: document.getElementById("confettiCanvas"),

    version: "santas_workshop",
    gridSize: 4,
    imageKey: "santa.jpg",
  });

  game.init();
  window.__SANTA_GAME__ = game;
  // Populate story panel on load (if present)
  window.__game = game;
  game.refreshProgressUI();
  game.refreshStoryPanel();

  // Auth UI (login/register/logout) - optional for playing, required for DB tracking later
  setupAuthUI();
});


/* =========================
   Auth Modal UI (frontend)
   ========================= */

let __authMode = "login"; // "login" | "register"
let __currentUser = null;

function setupAuthUI() {
  const authBtn = document.getElementById("authBtn");
  const modal = document.getElementById("authModal");
  const closeBtn = document.getElementById("authCloseBtn");

  const title = document.getElementById("authTitle");
  const form = document.getElementById("authForm");
  const nameWrap = document.getElementById("authNameWrap");
  const nameInput = document.getElementById("authName");
  const emailInput = document.getElementById("authEmail");
  const pwInput = document.getElementById("authPassword");
  const submitBtn = document.getElementById("authSubmitBtn");
  const helper = document.getElementById("authHelper");
  const switchBtn = document.getElementById("switchAuthModeBtn");
  const errorEl = document.getElementById("authError");
  const togglePwBtn = document.getElementById("togglePwBtn");

  if (!authBtn || !modal) return;

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = msg ? "block" : "none";
  }

  function openModal(mode) {
    __authMode = mode || "login";
    showError("");
    syncModeUI();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    // focus first input
    setTimeout(() => {
      if (__authMode === "register" && nameInput) nameInput.focus();
      else if (emailInput) emailInput.focus();
    }, 0);
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    showError("");
    if (pwInput) pwInput.value = "";
  }

  function setButtonLoggedOut() {
    authBtn.textContent = "Login";
    authBtn.dataset.state = "logged_out";
  }

  function setButtonLoggedIn() {
    authBtn.textContent = "Logout";
    authBtn.dataset.state = "logged_in";
  }

  function syncModeUI() {
    const isRegister = __authMode === "register";
    if (title) title.textContent = isRegister ? "Create Account" : "Login";
    if (submitBtn) submitBtn.textContent = isRegister ? "Create Account" : "Login";
    if (nameWrap) nameWrap.style.display = isRegister ? "flex" : "none";

    if (helper) {
      helper.innerHTML = isRegister
        ? `Already have an account? <button id="switchAuthModeBtn" class="link-btn" type="button">Login</button>`
        : `Don’t have an account? <button id="switchAuthModeBtn" class="link-btn" type="button">Create Account</button>`;
      // rebind switch button because we replaced innerHTML
      const newSwitchBtn = document.getElementById("switchAuthModeBtn");
      if (newSwitchBtn) {
        newSwitchBtn.addEventListener("click", () => {
          __authMode = isRegister ? "login" : "register";
          syncModeUI();
          showError("");
        });
      }
    }
  }

  async function refreshMe() {
    const res = await API.me();
    __currentUser = res.user || null;
    if (__currentUser) setButtonLoggedIn();
    else setButtonLoggedOut();
  }

  authBtn.addEventListener("click", async () => {
    const state = authBtn.dataset.state;
    if (state === "logged_in") {
      await API.logout();
      __currentUser = null;
      setButtonLoggedOut();
      await refreshAuthUI();
      return;
    }
    openModal("login");
  });

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  if (togglePwBtn && pwInput) {
    togglePwBtn.addEventListener("click", () => {
      const isPw = pwInput.type === "password";
      pwInput.type = isPw ? "text" : "password";
      togglePwBtn.textContent = isPw ? "🙈" : "👁";
      togglePwBtn.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");

    const email = (emailInput?.value || "").trim();
    const password = pwInput?.value || "";
    const name = (nameInput?.value || "").trim();

    if (!email || !password) {
      showError("Please enter an email and password.");
      return;
    }
    if (__authMode === "register" && !name) {
      showError("Please enter a name.");
      return;
    }

    try {
      if (__authMode === "register") {
        const reg = await API.register({ name, email, password });
        if (!reg.ok) throw new Error(reg.error || "Registration failed.");
      }

      const log = await API.login({ email, password });
      if (!log.ok) throw new Error(log.error || "Login failed.");

      __currentUser = log.user || (await API.me()).user || null;
      setButtonLoggedIn();
      refreshAuthUI();
      closeModal();
    } catch (err) {
      showError(err?.message || "Something went wrong.");
    }
  });

  // initial state
  refreshMe();
}
