<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

$userId = require_login();
$body = read_json_body();

$type = trim((string)($body['type'] ?? ''));
$value = isset($body['value']) ? (int)$body['value'] : null;
$data = isset($body['data']) ? json_encode($body['data']) : null;

if ($type === '') {
  json_response(['ok' => false, 'error' => 'Missing event type'], 400);
}

$sessionId = (int)($_SESSION['active_session_id'] ?? 0);
if ($sessionId <= 0) $sessionId = null;

$stmt = $pdo->prepare(
  'INSERT INTO analytics_events (user_id, session_id, event_type, event_value, event_data)
   VALUES (:uid, :sid, :t, :v, :d)'
);

$stmt->execute([
  ':uid' => $userId,
  ':sid' => $sessionId,
  ':t' => substr($type, 0, 40),
  ':v' => $value,
  ':d' => $data
]);

json_response(['ok' => true]);
