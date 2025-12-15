Below is a clean, fully formatted Markdown README you can copy directly into README.md.
Everything is structured, consistent, and presentation ready.
No plain text sections remain.

⸻


# 🎄 Santa’s Workshop Fifteen Puzzle

A Santa-themed Fifteen Puzzle game featuring user accounts, persistent progress, dynamic difficulty, achievements, story progression, and gameplay assistance.
Built as an **undergraduate project** using **HTML, CSS, JavaScript, PHP, and MySQL** and deployed on the school server.

---

## 📌 Project Overview

Santa’s Workshop Fifteen Puzzle is an enhanced version of the classic sliding puzzle game.
Players can play as guests or log in to unlock persistent features such as saved progress, achievements, story mode, analytics, and difficulty progression.

We selected the **Santa’s Workshop project option** and implemented all undergraduate-required features with additional polish and persistence.

---

## ✨ Key Features

### Core Puzzle Gameplay
- Classic Fifteen Puzzle mechanics
- Grid sizes: **3x3, 4x4, 6x6, 8x8, 10x10**
- Legal move validation and movable tile highlighting
- Shuffle-based game start
- Move counter and timer
- Win detection with visual and audio celebration

### Santa Workshop Enhancements
- 🎨 **Festive Theme System**
  Automatically switches between Day and Night themes based on local time
- 📈 **Dynamic Difficulty Progression**
  Higher difficulty levels unlock only after completing easier levels
- 🪄 **Magic Assistance**
  Limited heuristic-based hint system
- ⚡ **Power Ups**
  - Time Freeze (pause timer for 10 seconds)
  - Swap Pass (swap empty tile with a valid 2-away tile)
  - Completion Insight (estimate remaining effort)
- 🎁 **Reward System**
  Achievements earned and persisted in the database
- 📖 **Christmas Story Mode**
  Narrative progression unlocked through puzzle completion
- 📊 **Progress Dashboard**
  Sessions, wins, best time, best moves, story stage, recent sessions, achievements

---

## ▶️ How to Play

1. Open the website.
2. Choose a grid size (default is 4x4).
3. Click **Shuffle** to begin the game.
   - Timer starts on Shuffle
   - Power ups reset for the run
4. Solve the puzzle by sliding tiles into the empty space.
5. On completion:
   - The session ends
   - Celebration effects play
   - Progress is saved (if logged in)
6. Use **Reset Puzzle** to stop the run and reset the board.

Guest users can play freely. Logging in enables progress tracking and story mode.

---

## 🏗 Architecture

### Frontend
- **HTML & CSS**
  - Layout, panels, and themed UI
- **JavaScript**
  - Puzzle generation and rendering
  - Move validation and win detection
  - Timer, audio, and UI updates
  - Difficulty progression
  - Magic and power up logic
  - API communication

### Backend
- **PHP API**
  - Authentication endpoints
  - Game session tracking
  - Progress, achievements, and story updates
  - JSON request/response handling

### Database
- **MySQL**
  - User accounts
  - Game sessions
  - Puzzle states
  - Achievements
  - Story progress
  - Analytics events

---

## 📂 File Structure

### Root Files
- `index.html` – Main UI layout
- `styles.css` – App styling and themes
- `puzzle.js` – Game logic and UI behavior
- `api.js` – Frontend API helper
- `schema.sql` – Database schema and seed data

### API Folder (`/api`)
- `db.php` – PDO database connection
- `response.php` – JSON helpers
- `auth.php` – Session setup and auth middleware
- `auth/` – Register, login, logout, me
- `game/` – Start, update, and end session
- `insights/` – Progress dashboard data
- `analytics/` – Event logging

---

## 🗄 Database Design

### Setup
1. Create a MySQL database on the school server.
2. Import `schema.sql`.
3. Update credentials in `api/db.php`.

```sql
SOURCE schema.sql;

Key Tables
	•	users
	•	game_sessions
	•	puzzles
	•	achievements
	•	user_achievements
	•	user_story_progress
	•	analytics_events

Achievements are seeded directly from SQL and awarded server-side.

⸻

🔐 Security and Data Integrity
	•	Password hashing using password_hash and password_verify
	•	PDO prepared statements with emulation disabled
	•	PHP session hardening
	•	session.use_strict_mode
	•	session.cookie_httponly
	•	session.cookie_secure (HTTPS aware)
	•	Authorization middleware (require_login)
	•	Transaction-based session completion
	•	Server-side achievement awarding
	•	Uniqueness constraints to prevent duplicate achievements

⸻

📈 Dynamic Difficulty System
	•	Difficulty levels unlock sequentially
	•	Performance score based on moves and time
	•	Difficulty persists using localStorage
	•	Higher difficulty reduces available magic

Difficulty labels:
	•	Easy
	•	Normal
	•	Hard
	•	Expert
	•	Master

⸻

🪄 Magic and Power Ups

Magic
	•	Heuristic-based suggested move
	•	Does not increment move counter
	•	Usage tracked and affects achievements

Power Ups
	•	Time Freeze: pauses timer and music
	•	Swap Pass: swaps empty tile with best valid 2-away tile
	•	Completion Insight: estimates remaining effort

All usage is stored per session in JSON format.

⸻

🏆 Achievements and Rewards

Achievements are defined in the database and awarded server-side.

Examples:
	•	First Toy Built – First win
	•	Santa Speedrun – Win in 60 seconds
	•	Workshop Regular – 10 wins
	•	Pure Skill – Win without magic
	•	Master Elf – Win on higher difficulty

Achievements cannot be duplicated or client-forced.

⸻

📖 Christmas Story Mode
	•	Story progression saved per user
	•	Story stage increases every few completed puzzles
	•	Max stage cap applied
	•	Guest users prompted to log in

⸻

📊 Progress Dashboard

Displays:
	•	Total wins and sessions
	•	Best time and best moves
	•	Story stage and puzzles solved
	•	Recent sessions table
	•	Earned achievements

All data is retrieved from the backend and persisted.

⸻

🧩 Kanban Methodology and Communication
	•	Kanban-style workflow
	•	Regular Discord standups (every 2 days)
	•	Weekly sprint planning
	•	Task ownership and collaboration via Discord

A reconstructed Kanban board was created based on completed tasks for documentation and presentation clarity.

⸻

🧪 Development Journal Highlights
	•	Database schema planning for persistence
	•	Secure authentication implementation
	•	Session lifecycle management
	•	Fixing timer behavior (start on Shuffle only)
	•	Server-side achievement logic
	•	Assistance features designed to reduce frustration while preserving challenge
	•	Story progression tied strictly to completed sessions

⸻

✅ Testing Checklist
	•	Timer starts only on Shuffle
	•	Reset stops timer and clears board
	•	Only legal tile moves allowed
	•	Move counter increments correctly
	•	Session saves on completion
	•	Achievements awarded once
	•	Difficulty progression enforced
	•	Progress persists across refresh and login
	•	Power ups decrement correctly
	•	Story stage updates correctly

⸻

🚧 Known Limitations and Future Improvements
	•	DB credentials stored in code due to class environment
	•	No CSRF tokens (acceptable for class scope)
	•	Token-based auth schema included but unused
	•	Additional achievements and story chapters possible

⸻

🤖 AI Disclosure

AI tools were used as development assistants for debugging, architectural validation, and UI refinement.
All AI-assisted output was reviewed, tested, modified, and integrated intentionally.
No AI-generated code was used without understanding or validation.
Final functionality, structure, and testing were completed by the project authors.

---

If you want, I can also:
- Split this into **README + Presentation Notes**
- Shorten it for a **submission-only README**
- Add **screenshots sections** with captions
- Create a **slide outline derived directly from this README**

Just tell me.
