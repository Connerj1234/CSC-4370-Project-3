<?php
// api/auth.php
declare(strict_types=1);

require_once __DIR__ . '/response.php';

function start_api_session(): void {
  if (session_status() === PHP_SESSION_NONE) {
    // Reasonable defaults for class projects
    ini_set('session.use_strict_mode', '1');
    ini_set('session.cookie_httponly', '1');

    // If your codd site is HTTPS, set to 1.
    // If not HTTPS, keep 0 or login cookies might not set.
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    ini_set('session.cookie_secure', $isHttps ? '1' : '0');

    session_start();
  }
}

function require_login(): int {
  start_api_session();
  if (!isset($_SESSION['user_id'])) {
    json_response(['ok' => false, 'error' => 'Not authenticated'], 401);
  }
  return (int)$_SESSION['user_id'];
}
