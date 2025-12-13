<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

start_api_session();

$body = read_json_body();
$identity = trim((string)($body['identity'] ?? '')); // username or email
$password = (string)($body['password'] ?? '');

if ($identity === '' || $password === '') {
  json_response(['ok' => false, 'error' => 'Missing identity or password'], 400);
}

$stmt = $pdo->prepare(
  'SELECT id, username, email, password_hash FROM users
   WHERE username = :id OR email = :id
   LIMIT 1'
);
$stmt->execute([':id' => $identity]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
  json_response(['ok' => false, 'error' => 'Invalid credentials'], 401);
}

$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['username'] = (string)$user['username'];

$pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = :uid')
    ->execute([':uid' => (int)$user['id']]);

json_response([
  'ok' => true,
  'user' => ['id' => (int)$user['id'], 'username' => (string)$user['username'], 'email' => (string)$user['email']]
]);
