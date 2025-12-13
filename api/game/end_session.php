<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

$userId = require_login();
$body = read_json_body();

$sessionId = (int)($body['session_id'] ?? ($_SESSION['active_session_id'] ?? 0));
$completed = (int)($body['completed'] ?? 0) === 1 ? 1 : 0;

$moves = (int)($body['moves_count'] ?? 0);
$time = (int)($body['time_seconds'] ?? 0);
$difficultyEnd = (int)($body['difficulty_end'] ?? 1);

if ($sessionId <= 0) {
  json_response(['ok' => false, 'error' => 'No active session'], 400);
}

$pdo->beginTransaction();

try {
  $stmt = $pdo->prepare(
    'UPDATE game_sessions
     SET ended_at = NOW(),
         completed = :c,
         moves_count = :m,
         time_seconds = :t,
         difficulty_end = :de
     WHERE id = :sid AND user_id = :uid
     LIMIT 1'
  );

  $stmt->execute([
    ':c' => $completed,
    ':m' => max(0, $moves),
    ':t' => max(0, $time),
    ':de' => max(1, $difficultyEnd),
    ':sid' => $sessionId,
    ':uid' => $userId
  ]);

  // If win, update story progress counters
  if ($completed === 1) {
    $pdo->prepare(
      'UPDATE user_story_progress
       SET total_wins = total_wins + 1,
           chapter_unlocked = LEAST(10, GREATEST(chapter_unlocked, FLOOR((total_wins + 1) / 3) + 1))
       WHERE user_id = :uid'
    )->execute([':uid' => $userId]);
  }

  $pdo->commit();
  unset($_SESSION['active_session_id']);

  json_response(['ok' => true]);
} catch (Throwable $e) {
  $pdo->rollBack();
  json_response(['ok' => false, 'error' => 'Failed to end session'], 500);
}
