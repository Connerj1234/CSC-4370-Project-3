<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../response.php';

$userId = require_login();

// Totals
$stmt = $pdo->prepare('SELECT COUNT(*) AS c FROM game_sessions WHERE user_id = :uid');
$stmt->execute([':uid' => $userId]);
$totalSessions = (int)($stmt->fetch()['c'] ?? 0);

$stmt = $pdo->prepare('SELECT COUNT(*) AS c FROM game_sessions WHERE user_id = :uid AND completed = 1');
$stmt->execute([':uid' => $userId]);
$totalWins = (int)($stmt->fetch()['c'] ?? 0);

// Best time
$stmt = $pdo->prepare(
  'SELECT MIN(completion_time_s) AS best_time
   FROM game_sessions
   WHERE user_id = :uid AND completed = 1 AND completion_time_s IS NOT NULL'
);
$stmt->execute([':uid' => $userId]);
$bestTime = $stmt->fetch()['best_time'];
$bestTime = $bestTime === null ? null : (int)$bestTime;

// Best moves
$stmt = $pdo->prepare(
  'SELECT MIN(moves_count) AS best_moves
   FROM game_sessions
   WHERE user_id = :uid AND completed = 1 AND moves_count > 0'
);
$stmt->execute([':uid' => $userId]);
$bestMoves = $stmt->fetch()['best_moves'];
$bestMoves = $bestMoves === null ? null : (int)$bestMoves;

// Story progress
$pdo->prepare(
  'INSERT INTO user_story_progress (user_id, puzzles_solved_total, story_stage)
   VALUES (:uid, 0, 1)
   ON DUPLICATE KEY UPDATE user_id = user_id'
)->execute([':uid' => $userId]);

$stmt = $pdo->prepare(
  'SELECT puzzles_solved_total, story_stage, last_updated_at
   FROM user_story_progress
   WHERE user_id = :uid
   LIMIT 1'
);
$stmt->execute([':uid' => $userId]);
$story = $stmt->fetch() ?: ['puzzles_solved_total' => 0, 'story_stage' => 1, 'last_updated_at' => null];

// Recent sessions
$stmt = $pdo->prepare(
  'SELECT id, grid_size, started_at, ended_at, completed, completion_time_s, moves_count, difficulty_level, magic_used
   FROM game_sessions
   WHERE user_id = :uid
   ORDER BY started_at DESC
   LIMIT 10'
);
$stmt->execute([':uid' => $userId]);
$recentSessions = $stmt->fetchAll();

// Earned achievements
$stmt = $pdo->prepare(
  'SELECT a.code, a.title, a.description, ua.awarded_at, ua.session_id
   FROM user_achievements ua
   JOIN achievements a ON a.id = ua.achievement_id
   WHERE ua.user_id = :uid
   ORDER BY ua.awarded_at DESC
   LIMIT 50'
);
$stmt->execute([':uid' => $userId]);
$earned = $stmt->fetchAll();

json_response([
  'ok' => true,
  'insights' => [
    'totals' => [
      'sessions' => $totalSessions,
      'wins' => $totalWins
    ],
    'personal_bests' => [
      'best_time_s' => $bestTime,
      'best_moves' => $bestMoves
    ],
    'story' => [
      'puzzles_solved_total' => (int)$story['puzzles_solved_total'],
      'story_stage' => (int)$story['story_stage'],
      'last_updated_at' => $story['last_updated_at']
    ],
    'recent_sessions' => $recentSessions,
    'achievements' => $earned
  ]
]);
