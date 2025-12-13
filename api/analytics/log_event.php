<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../response.php';

$userId = require_login();
$body = read_json_body();

// Support either {event_type, meta} or older {type, value, data}
$eventType = trim((string)($body['event_type'] ?? $body['type'] ?? ''));
if ($eventType === '') {
  json_response(['ok' => false, 'error' => 'Missing event_type'], 400);
}

$meta = $body['meta'] ?? null;

if ($meta === null && (isset($body['value']) || isset($body['data']))) {
  $meta = [
    'value' => $body['value'] ?? null,
    'data' => $body['data'] ?? null
  ];
}

$metaJson = null;
if ($meta !== null) {
  $metaJson = is_string($meta) ? $meta : json_encode($meta);
  if (json_decode((string)$metaJson, true) === null) $metaJson = null;
}

$sessionId = (int)($_SESSION['active_session_id'] ?? 0);
if ($sessionId <= 0) $sessionId = null;

$stmt = $pdo->prepare(
  'INSERT INTO analytics_events (user_id, session_id, event_type, meta)
   VALUES (:uid, :sid, :t, :m)'
);

$stmt->execute([
  ':uid' => $userId,
  ':sid' => $sessionId,
  ':t' => substr($eventType, 0, 60),
  ':m' => $metaJson
]);

json_response(['ok' => true]);
