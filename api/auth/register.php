<?php
declare(strict_types=1);

require_once __DIR__ . '/../response.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../db.php';

start_api_session();
$body = read_json_body();

$email = trim((string)($body['email'] ?? ''));
$displayName = trim((string)($body['name'] ?? $body['display_name'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($email === '' || $displayName === '' || $password === '') {
  json_response(['ok' => false, 'error' => 'Missing email, name, or password'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  json_response(['ok' => false, 'error' => 'Invalid email'], 400);
}
if (strlen($password) < 6) {
  json_response(['ok' => false, 'error' => 'Password must be at least 6 characters'], 400);
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :e LIMIT 1');
$stmt->execute([':e' => $email]);
if ($stmt->fetch()) {
  json_response(['ok' => false, 'error' => 'Email already registered'], 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare(
  'INSERT INTO users (email, display_name, password_hash)
   VALUES (:e, :n, :p)'
);
$stmt->execute([':e' => $email, ':n' => $displayName, ':p' => $hash]);

$userId = (int)$pdo->lastInsertId();

// Initialize story
$pdo->prepare('INSERT INTO user_story_progress (user_id) VALUES (:uid)')
    ->execute([':uid' => $userId]);

$_SESSION['user_id'] = $userId;

json_response([
  'ok' => true,
  'user' => [
    'id' => $userId,
    'email' => $email,
    'display_name' => $displayName
  ]
]);
