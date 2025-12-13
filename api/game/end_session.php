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

$completed = (int)($body['completed'] ?? 0) === 1 ? 1 : 0;

$moves = (int)($body['moves_count'] ?? 0);
$completionTime = isset($body['completion_time_s']) ? (int)$body['completion_time_s'] : null;
$difficultyLevel = (int)($body['difficulty_level'] ?? 1);
$magicUsed = (int)($body['magic_used'] ?? 0);

$powerupsUsed = $body['powerups_used'] ?? null;
$finalState   = $body['final_state'] ?? null;

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

$awardedCodes = [];

function award_achievement(PDO $pdo, int $userId, int $sessionId, string $code): bool {
  $stmt = $pdo->prepare('SELECT id FROM achievements WHERE code = :c LIMIT 1');
  $stmt->execute([':c' => $code]);
  $row = $stmt->fetch();
  if (!$row) return false;

  $aid = (int)$row['id'];

  // Unique constraint prevents duplicates
  $ins = $pdo->prepare(
    'INSERT IGNORE INTO user_achievements (user_id, achievement_id, session_id)
     VALUES (:uid, :aid, :sid)'
  );
  $ins->execute([
    ':uid' => $userId,
    ':aid' => $aid,
    ':sid' => $sessionId
  ]);

  return $ins->rowCount() > 0;
}

$pdo->beginTransaction();

try {
  $stmt = $pdo->prepare(
    'UPDATE game_sessions
     SET ended_at = NOW(),
         completed = :c,
         completion_time_s = :ts,
         moves_count = :m,
         difficulty_level = :dl,
         magic_used = :mu,
         powerups_used = :pu,
         final_state = :fs
     WHERE id = :sid AND user_id = :uid
     LIMIT 1'
  );

  $stmt->execute([
    ':c' => $completed,
    ':ts' => ($completed === 1 && $completionTime !== null) ? max(0, $completionTime) : null,
    ':m' => max(0, $moves),
    ':dl' => max(1, $difficultyLevel),
    ':mu' => max(0, $magicUsed),
    ':pu' => $powerupsJson,
    ':fs' => $finalJson,
    ':sid' => $sessionId,
    ':uid' => $userId
  ]);

  if ($completed === 1) {
    // Ensure story row exists, then increment puzzles_solved_total and stage
    $pdo->prepare(
      'INSERT INTO user_story_progress (user_id, puzzles_solved_total, story_stage)
       VALUES (:uid, 0, 1)
       ON DUPLICATE KEY UPDATE user_id = user_id'
    )->execute([':uid' => $userId]);

    // Simple stage rule: +1 stage every 3 solves, capped at 10
    $pdo->prepare(
      'UPDATE user_story_progress
       SET puzzles_solved_total = puzzles_solved_total + 1,
           story_stage = LEAST(10, GREATEST(story_stage, FLOOR((puzzles_solved_total + 1) / 3) + 1))
       WHERE user_id = :uid'
    )->execute([':uid' => $userId]);

    // Achievement checks
    $stmt = $pdo->prepare('SELECT COUNT(*) AS c FROM game_sessions WHERE user_id = :uid AND completed = 1');
    $stmt->execute([':uid' => $userId]);
    $wins = (int)($stmt->fetch()['c'] ?? 0);

    // FIRST_WIN
    if ($wins === 1 && award_achievement($pdo, $userId, $sessionId, 'FIRST_WIN')) {
      $awardedCodes[] = 'FIRST_WIN';
    }

    // FAST_WIN_60
    if ($completionTime !== null && $completionTime <= 60) {
      if (award_achievement($pdo, $userId, $sessionId, 'FAST_WIN_60')) {
        $awardedCodes[] = 'FAST_WIN_60';
      }
    }

    // TEN_WINS
    if ($wins >= 10 && award_achievement($pdo, $userId, $sessionId, 'TEN_WINS')) {
      $awardedCodes[] = 'TEN_WINS';
    }

    // NO_MAGIC_WIN
    if ($magicUsed === 0 && award_achievement($pdo, $userId, $sessionId, 'NO_MAGIC_WIN')) {
      $awardedCodes[] = 'NO_MAGIC_WIN';
    }

    // HARD_MODE_WIN (you can adjust threshold)
    if ($difficultyLevel >= 3 && award_achievement($pdo, $userId, $sessionId, 'HARD_MODE_WIN')) {
      $awardedCodes[] = 'HARD_MODE_WIN';
    }
  }

  $pdo->commit();
  unset($_SESSION['active_session_id']);

  json_response(['ok' => true, 'awarded' => $awardedCodes]);
} catch (Throwable $e) {
  $pdo->rollBack();
  json_response(['ok' => false, 'error' => 'Failed to end session'], 500);
}
