<?php
declare(strict_types=1);

require_once __DIR__ . '/../response.php';
require_once __DIR__ . '/../auth.php';
require_once __DIR__ . '/../db.php';

start_api_session();

if (!isset($_SESSION['user_id'])) {
  json_response(['ok' => true, 'user' => null]);
}

$userId = (int)$_SESSION['user_id'];

$stmt = $pdo->prepare('SELECT id, email, display_name FROM users WHERE id = :id LIMIT 1');
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

if (!$user) {
  // Session exists but DB row missing
  $_SESSION = [];
  json_response(['ok' => true, 'user' => null]);
}

json_response([
  'ok' => true,
  'user' => [
    'id' => (int)$user['id'],
    'email' => (string)$user['email'],
    'display_name' => (string)$user['display_name']
  ]
]);
