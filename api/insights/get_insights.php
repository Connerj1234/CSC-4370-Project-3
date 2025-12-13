<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

$userId = require_login();

// totals
$totalWins = (int)$pdo->prepare('SELECT COUNT(*) AS c FROM game_sessions WHERE user_id = :uid AND completed = 1')
  ->execute([':uid' => $userId]) ?: 0;

$stmt = $pdo->prepare('SELECT COUNT(*) AS c FROM game_sessions WHERE user_id = :uid AND completed = 1');
$stmt->execute([':uid' => $userId]);
$totalWins = (int)($stmt->fetch()['c'] ?? 0);

// fastest win time
$stmt = $pdo->prepare(
  'SELECT MIN(time_seconds) AS best_time
   FROM game_sessions
   WHERE user_id = :uid AND completed = 1 AND time_seconds > 0'
);
$stmt->execute([':uid' => $userId]);
$bestTime = $stmt->fetch()['best_time'];
$bestTime = $bestTime === null ? null : (int)$bestTime;

// best moves
$stmt = $pdo->prepare(
  'SELECT MIN(moves_count) AS best_moves
   FROM game_sessions
   WHERE user_id = :uid AND completed = 1 AND moves_count > 0'
);
$stmt->execute([':uid' => $userId]);
$bestMoves = $stmt->fetch()['best_moves'];
$bestMoves = $bestMoves === null ? null : (int)$bestMoves;

// story progress
$stmt = $pdo->prepare('SELECT total_wins, chapter_unlocked FROM user_story_progress WHERE user_id = :uid LIMIT 1');
$stmt->execute([':uid' => $userId]);
$story = $stmt->fetch() ?: ['total_wins' => 0, 'chapter_unlocked' => 1];

// rewards
$stmt = $pdo->prepare(
  'SELECT reward_code, earned_at
   FROM user_rewards
   WHERE user_id = :uid
   ORDER BY earned_at DESC
   LIMIT 20'
);
$stmt->execute([':uid' => $userId]);
$rewards = $stmt->fetchAll();

json_response([
  'ok' => true,
  'insights' => [
    'total_wins' => $totalWins,
    'best_time_seconds' => $bestTime,
    'best_moves' => $bestMoves,
    'story' => [
      'total_wins' => (int)$story['total_wins'],
      'chapter_unlocked' => (int)$story['chapter_unlocked']
    ],
    'rewards' => $rewards
  ]
]);
