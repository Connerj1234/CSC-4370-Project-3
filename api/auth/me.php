<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth.php';

start_api_session();

if (!isset($_SESSION['user_id'])) {
  json_response(['ok' => true, 'user' => null]);
}

json_response([
  'ok' => true,
  'user' => [
    'id' => (int)$_SESSION['user_id'],
    'username' => (string)($_SESSION['username'] ?? '')
  ]
]);
