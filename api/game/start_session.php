<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../response.php';

$userId = require_login();
$body = read_json_body();

$gridSize = (int)($body['grid_size'] ?? 4);
$difficultyLevel = (int)($body['difficulty_level'] ?? 1);
$puzzleId = isset($body['puzzle_id']) ? (int)$body['puzzle_id'] : null;

if (!in_array($gridSize, [3,4,6,8,10], true)) $gridSize = 4;
if ($difficultyLevel < 1) $difficultyLevel = 1;

$puzzlePayload = $body['puzzle'] ?? null;

/**
 * Optionally store the puzzle in `puzzles` and link it to the session.
 * This matches schema.sql and is useful for progress tracking + story mode.
 */
if (($puzzleId === null || $puzzleId <= 0) && is_array($puzzlePayload)) {
  $themeKey = (string)($puzzlePayload['theme_key'] ?? ($body['theme_key'] ?? 'santa'));
  $shuffleSteps = (int)($puzzlePayload['shuffle_steps'] ?? 0);

  $initialState = $puzzlePayload['initial_state'] ?? null;
  $solvedState  = $puzzlePayload['solved_state'] ?? null;

  // Normalize JSON fields to JSON strings (schema has JSON_VALID checks)
  $initialJson = is_string($initialState) ? $initialState : json_encode($initialState);
  $solvedJson  = is_string($solvedState)  ? $solvedState  : json_encode($solvedState);

  $initialOk = is_string($initialJson) && json_decode($initialJson, true) !== null;
  $solvedOk  = is_string($solvedJson)  && json_decode($solvedJson, true) !== null;

  if ($initialOk && $solvedOk) {
    $stmt = $pdo->prepare(
      'INSERT INTO puzzles (grid_size, theme_key, difficulty_level, shuffle_steps, initial_state, solved_state)
       VALUES (:gs, :tk, :dl, :ss, :init, :solved)'
    );
    $stmt->execute([
      ':gs' => $gridSize,
      ':tk' => substr($themeKey, 0, 40),
      ':dl' => $difficultyLevel,
      ':ss' => max(0, $shuffleSteps),
      ':init' => $initialJson,
      ':solved' => $solvedJson,
    ]);

    $puzzleId = (int)$pdo->lastInsertId();
  }
}

$stmt = $pdo->prepare(
  'INSERT INTO game_sessions (user_id, puzzle_id, grid_size, difficulty_level, moves_count, magic_used, powerups_used)
   VALUES (:uid, :pid, :gs, :dl, 0, 0, NULL)'
);

$stmt->execute([
  ':uid' => $userId,
  ':pid' => ($puzzleId && $puzzleId > 0) ? $puzzleId : null,
  ':gs'  => $gridSize,
  ':dl'  => $difficultyLevel,
]);

$sessionId = (int)$pdo->lastInsertId();
$_SESSION['active_session_id'] = $sessionId;

json_response([
  'ok' => true,
  'session_id' => $sessionId,
  'puzzle_id' => ($puzzleId && $puzzleId > 0) ? $puzzleId : null
]);
