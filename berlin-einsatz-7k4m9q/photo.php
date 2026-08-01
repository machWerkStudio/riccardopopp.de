<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
startSecureSession();
if (!isAuthenticated()) { http_response_code(401); exit; }
$name = basename((string)($_GET['file'] ?? ''));
if (!preg_match('/^[a-zA-Z0-9-]{16,60}\.(jpg|webp)$/', $name)) { http_response_code(404); exit; }
$path = __DIR__ . '/data/photos/' . $name;
if (!is_file($path)) { http_response_code(404); exit; }
header('Content-Type: ' . (substr($name, -5) === '.webp' ? 'image/webp' : 'image/jpeg'));
header('Content-Length: ' . filesize($path));
header('Cache-Control: private, max-age=86400');
header('X-Content-Type-Options: nosniff');
readfile($path);
