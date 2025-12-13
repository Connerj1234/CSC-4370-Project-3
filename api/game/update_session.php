<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

$userId = require_login();
$body = read_json_body();

$sessionId = (int)($body['session_id'] ?? ($_SESSION['active_session_id'] ?? 0));
if ($sessionId <= 0) {
  json_response(['ok' => false, 'error' => 'No active session'], 400);
}

$moves = (int)($body['moves_count'] ?? 0);
$time = (int)($body['time_seconds'] ?? 0);
$difficultyEnd = (int)($body['difficulty_end'] ?? 1);

$magicUsed = (int)($body['magic_used_count'] ?? 0);
$freezeUsed = (int)($body['freeze_used_count'] ?? 0);
$swapUsed = (int)($body['swap_used_count'] ?? 0);
$insightUsed = (int)($body['insight_used_count'] ?? 0);

$stmt = $pdo->prepare(
  'UPDATE game_sessions
   SET moves_count = :m,
       time_seconds = :t,
       difficulty_end = :de,
       magic_used_count = :mu,
       freeze_used_count = :fu,
       swap_used_count = :su,
       insight_used_count = :iu
   WHERE id = :sid AND user_id = :uid
   LIMIT 1'
);

$stmt->execute([
  ':m' => max(0, $moves),
  ':t' => max(0, $time),
  ':de' => max(1, $difficultyEnd),
  ':mu' => max(0, $magicUsed),
  ':fu' => max(0, $freezeUsed),
  ':su' => max(0, $swapUsed),
  ':iu' => max(0, $insightUsed),
  ':sid' => $sessionId,
  ':uid' => $userId
]);

json_response(['ok' => true]);
