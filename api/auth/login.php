<?php
declare(strict_types=1);

require_once __DIR__ . '/../response.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../db.php';

start_api_session();
$body = read_json_body();

$email = trim((string)($body['email'] ?? $body['identity'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($email === '' || $password === '') {
  json_response(['ok' => false, 'error' => 'Missing email or password'], 400);
}

$stmt = $pdo->prepare(
  'SELECT id, email, display_name, password_hash
   FROM users
   WHERE email = :e
   LIMIT 1'
);
$stmt->execute([':e' => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, (string)$user['password_hash'])) {
  json_response(['ok' => false, 'error' => 'Invalid credentials'], 401);
}

$_SESSION['user_id'] = (int)$user['id'];

$pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = :id')
    ->execute([':id' => (int)$user['id']]);

json_response([
  'ok' => true,
  'user' => [
    'id' => (int)$user['id'],
    'email' => (string)$user['email'],
    'display_name' => (string)$user['display_name']
  ]
]);
