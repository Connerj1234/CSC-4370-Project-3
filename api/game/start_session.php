<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

$userId = require_login();
$body = read_json_body();

$gridSize = (int)($body['grid_size'] ?? 4);
$difficultyStart = (int)($body['difficulty_start'] ?? 1);
$clientTheme = isset($body['client_theme']) ? (string)$body['client_theme'] : null;

if ($gridSize < 3 || $gridSize > 10) $gridSize = 4;
if ($difficultyStart < 1) $difficultyStart = 1;

$stmt = $pdo->prepare(
  'INSERT INTO game_sessions
   (user_id, grid_size, difficulty_start, difficulty_end, completed, moves_count, time_seconds, client_theme, client_user_agent)
   VALUES
   (:uid, :gs, :ds, :de, 0, 0, 0, :theme, :ua)'
);

$stmt->execute([
  ':uid' => $userId,
  ':gs' => $gridSize,
  ':ds' => $difficultyStart,
  ':de' => $difficultyStart,
  ':theme' => $clientTheme,
  ':ua' => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255)
]);

$sessionId = (int)$pdo->lastInsertId();
$_SESSION['active_session_id'] = $sessionId;

json_response(['ok' => true, 'session_id' => $sessionId]);
