/* =========================================================
   Santa's Workshop Fifteen Puzzle (Version 1) - DB Schema
   MariaDB / MySQL (InnoDB, utf8mb4)
   ========================================================= */

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =========================
-- 1) USER MANAGEMENT
-- =========================

CREATE TABLE users (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email           VARCHAR(255) NOT NULL,
  display_name    VARCHAR(80)  NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at   TIMESTAMP NULL DEFAULT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Server-side session tokens (store only a hash, not the raw token)
CREATE TABLE auth_sessions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  token_hash      CHAR(64) NOT NULL,            -- SHA-256 hex digest
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      TIMESTAMP NOT NULL,
  revoked_at      TIMESTAMP NULL DEFAULT NULL,
  ip_address      VARCHAR(45) NULL DEFAULT NULL, -- IPv4/IPv6
  user_agent      VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_token_hash (token_hash),
  KEY idx_auth_user_id (user_id),
  KEY idx_auth_expires_at (expires_at),
  CONSTRAINT fk_auth_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 2) PUZZLE STORAGE
-- =========================

CREATE TABLE puzzles (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grid_size         SMALLINT UNSIGNED NOT NULL,     -- 3,4,6,8,10
  theme_key         VARCHAR(40) NOT NULL DEFAULT 'santa',  -- e.g. santa/day/night
  difficulty_level  SMALLINT UNSIGNED NOT NULL DEFAULT 1,  -- your progression level
  shuffle_steps     INT UNSIGNED NOT NULL DEFAULT 0,       -- how many legal moves used to create it
  initial_state     LONGTEXT NOT NULL,                      -- JSON array or string encoding
  solved_state      LONGTEXT NOT NULL,                      -- JSON array or string encoding
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_puzzles_grid (grid_size),
  KEY idx_puzzles_difficulty (difficulty_level),
  KEY idx_puzzles_created_at (created_at),
  CONSTRAINT chk_puzzles_grid_size CHECK (grid_size IN (3,4,6,8,10)),
  CONSTRAINT chk_puzzles_json_initial CHECK (JSON_VALID(initial_state)),
  CONSTRAINT chk_puzzles_json_solved  CHECK (JSON_VALID(solved_state))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 3) GAME SESSIONS
-- =========================

CREATE TABLE game_sessions (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id            BIGINT UNSIGNED NOT NULL,
  puzzle_id          BIGINT UNSIGNED NULL,                 -- can be NULL if you generate on the fly and don't store
  grid_size          SMALLINT UNSIGNED NOT NULL,
  started_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at           TIMESTAMP NULL DEFAULT NULL,
  completed          TINYINT(1) NOT NULL DEFAULT 0,
  completion_time_s  INT UNSIGNED NULL DEFAULT NULL,       -- seconds
  moves_count        INT UNSIGNED NOT NULL DEFAULT 0,
  difficulty_level   SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  magic_used         INT UNSIGNED NOT NULL DEFAULT 0,
  powerups_used      LONGTEXT NULL DEFAULT NULL,           -- JSON summary
  final_state        LONGTEXT NULL DEFAULT NULL,           -- JSON
  PRIMARY KEY (id),
  KEY idx_sessions_user_started (user_id, started_at),
  KEY idx_sessions_completed (completed),
  KEY idx_sessions_fastest (completion_time_s),
  KEY idx_sessions_grid (grid_size),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_sessions_puzzle
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
    ON DELETE SET NULL,
  CONSTRAINT chk_sessions_grid_size CHECK (grid_size IN (3,4,6,8,10)),
  CONSTRAINT chk_sessions_json_powerups CHECK (powerups_used IS NULL OR JSON_VALID(powerups_used)),
  CONSTRAINT chk_sessions_json_final    CHECK (final_state IS NULL OR JSON_VALID(final_state))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 4) GIFT & REWARD SYSTEM
-- =========================

CREATE TABLE achievements (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code            VARCHAR(60) NOT NULL,        -- e.g. FIRST_WIN, FAST_WIN_60, TEN_WINS
  title           VARCHAR(80) NOT NULL,
  description     VARCHAR(255) NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_achievements_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_achievements (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT UNSIGNED NOT NULL,
  achievement_id   BIGINT UNSIGNED NOT NULL,
  awarded_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  session_id       BIGINT UNSIGNED NULL,       -- which session triggered it
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_achievement (user_id, achievement_id),
  KEY idx_user_ach_awarded_at (awarded_at),
  CONSTRAINT fk_user_ach_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_ach_achievement
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_ach_session
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 5) CHRISTMAS STORY MODE
-- =========================

CREATE TABLE user_story_progress (
  user_id              BIGINT UNSIGNED NOT NULL,
  puzzles_solved_total INT UNSIGNED NOT NULL DEFAULT 0,
  story_stage          SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  last_updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_story_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- ANALYTICS
-- =========================

CREATE TABLE analytics_events (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NULL,            -- NULL allowed for guest analytics if you ever want it, but you can keep it logged-in only
  session_id    BIGINT UNSIGNED NULL,
  event_type    VARCHAR(60) NOT NULL,            -- e.g. SESSION_START, MOVE, POWERUP_USED, WIN, THEME_CHANGED
  event_time    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  meta          LONGTEXT NULL DEFAULT NULL,       -- JSON: {gridSize:4, moveCount:12, powerup:"freeze", ...}
  PRIMARY KEY (id),
  KEY idx_analytics_time (event_time),
  KEY idx_analytics_type_time (event_type, event_time),
  KEY idx_analytics_user_time (user_id, event_time),
  CONSTRAINT fk_analytics_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_analytics_session
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    ON DELETE SET NULL,
  CONSTRAINT chk_analytics_json_meta CHECK (meta IS NULL OR JSON_VALID(meta))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Seed achievement definitions
-- =========================

INSERT INTO achievements (code, title, description) VALUES
('FIRST_WIN',      'First Toy Built',        'Solve your first puzzle.'),
('FAST_WIN_60',    'Santa Speedrun',         'Solve a puzzle in 60 seconds or less.'),
('TEN_WINS',       'Workshop Regular',       'Solve 10 puzzles total.'),
('NO_MAGIC_WIN',   'Pure Skill',             'Win without using any magic.'),
('HARD_MODE_WIN',  'Master Elf',             'Win on higher difficulty levels.');
