<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

start_api_session();

$body = read_json_body();
$username = trim((string)($body['username'] ?? ''));
$email = trim((string)($body['email'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($username === '' || $email === '' || $password === '') {
  json_response(['ok' => false, 'error' => 'Missing username, email, or password'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  json_response(['ok' => false, 'error' => 'Invalid email'], 400);
}

if (strlen($password) < 6) {
  json_response(['ok' => false, 'error' => 'Password must be at least 6 characters'], 400);
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
  $stmt = $pdo->prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (:u, :e, :p)'
  );
  $stmt->execute([':u' => $username, ':e' => $email, ':p' => $passwordHash]);

  $userId = (int)$pdo->lastInsertId();

  // Initialize story progress row
  $stmt2 = $pdo->prepare('INSERT INTO user_story_progress (user_id) VALUES (:uid)');
  $stmt2->execute([':uid' => $userId]);

  $_SESSION['user_id'] = $userId;
  $_SESSION['username'] = $username;

  json_response(['ok' => true, 'user' => ['id' => $userId, 'username' => $username, 'email' => $email]]);
} catch (Throwable $e) {
  // Likely duplicate username/email
  json_response(['ok' => false, 'error' => 'Username or email already exists'], 409);
}
