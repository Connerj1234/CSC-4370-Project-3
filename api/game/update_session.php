<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../response.php';

$userId = require_login();
$body = read_json_body();

$sessionId = (int)($body['session_id'] ?? ($_SESSION['active_session_id'] ?? 0));
if ($sessionId <= 0) {
  json_response(['ok' => false, 'error' => 'No active session'], 400);
}

$moves = (int)($body['moves_count'] ?? 0);
$difficultyLevel = (int)($body['difficulty_level'] ?? 1);
$magicUsed = (int)($body['magic_used'] ?? 0);

$powerupsUsed = $body['powerups_used'] ?? null;   // object or JSON string
$finalState   = $body['final_state'] ?? null;    // array or JSON string

$powerupsJson = null;
if ($powerupsUsed !== null) {
  $powerupsJson = is_string($powerupsUsed) ? $powerupsUsed : json_encode($powerupsUsed);
  if (json_decode((string)$powerupsJson, true) === null) $powerupsJson = null;
}

$finalJson = null;
if ($finalState !== null) {
  $finalJson = is_string($finalState) ? $finalState : json_encode($finalState);
  if (json_decode((string)$finalJson, true) === null) $finalJson = null;
}

$stmt = $pdo->prepare(
  'UPDATE game_sessions
   SET moves_count = :m,
       difficulty_level = :dl,
       magic_used = :mu,
       powerups_used = :pu,
       final_state = :fs
   WHERE id = :sid AND user_id = :uid
   LIMIT 1'
);

$stmt->execute([
  ':m' => max(0, $moves),
  ':dl' => max(1, $difficultyLevel),
  ':mu' => max(0, $magicUsed),
  ':pu' => $powerupsJson,
  ':fs' => $finalJson,
  ':sid' => $sessionId,
  ':uid' => $userId
]);

json_response(['ok' => true]);
