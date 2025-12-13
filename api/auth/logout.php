<?php
declare(strict_types=1);

require_once __DIR__ . '/../auth.php';

start_api_session();

// Clear all session variables
$_SESSION = [];

// Expire the session cookie
if (ini_get('session.use_cookies')) {
  $params = session_get_cookie_params();
  setcookie(
    session_name(),
    '',
    time() - 42000,
    $params['path'] ?? '/',
    $params['domain'] ?? '',
    (bool)($params['secure'] ?? false),
    (bool)($params['httponly'] ?? true)
  );
}

session_destroy();

json_response(['ok' => true]);
