<?php
// api/db.php
declare(strict_types=1);

require_once __DIR__ . '/response.php';

$DB_HOST = 'localhost';
$DB_NAME = 'cjamison6';
$DB_USER = 'cjamison6';
$DB_PASS = 'ChickenSandwich123!';

try {
  $pdo = new PDO(
    "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
    $DB_USER,
    $DB_PASS,
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]
  );
} catch (Throwable $e) {
  json_response(['ok' => false, 'error' => 'DB connection failed'], 500);
}
