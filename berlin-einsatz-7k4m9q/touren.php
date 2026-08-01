<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
startSecureSession();
requireAuthentication();
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Cache-Control: no-store');
readfile(__DIR__ . '/touren.json');
