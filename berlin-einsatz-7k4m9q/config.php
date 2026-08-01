<?php
declare(strict_types=1);

const ACCESS_CODE_HASH = '4883e712986aad09ddd0110495e39bbd7f12eab87dccc3864e5656cf5be728ac';
const BACKUP_CODE_HASH = '1a8c44cbfd4512e76a66dfdd1badc24fe55599cdf2890dca76dc86d9de86084e';
const DATA_FILE = __DIR__ . '/data/state.json';

function startSecureSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function isAuthenticated(): bool
{
    return ($_SESSION['einsatz_authenticated'] ?? false) === true;
}

function requireAuthentication(): void
{
    if (!isAuthenticated()) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'message' => 'Bitte erneut anmelden.']);
        exit;
    }
}

function cleanText($value, int $maxLength = 500): string
{
    $text = trim((string)$value);
    return function_exists('mb_substr') ? mb_substr($text, 0, $maxLength) : substr($text, 0, $maxLength);
}

function createStateSnapshot(string $stateJson): void
{
    $snapshotDir = __DIR__ . '/data/snapshots';
    if (!is_dir($snapshotDir) && !@mkdir($snapshotDir, 0750, true) && !is_dir($snapshotDir)) {
        return;
    }
    $name = 'state-' . date('Ymd-His') . '-' . substr(hash('sha256', $stateJson), 0, 8) . '.json';
    @file_put_contents($snapshotDir . '/' . $name, $stateJson, LOCK_EX);
    $snapshots = glob($snapshotDir . '/state-*.json') ?: [];
    rsort($snapshots, SORT_STRING);
    foreach (array_slice($snapshots, 60) as $oldSnapshot) {
        if (is_file($oldSnapshot)) @unlink($oldSnapshot);
    }
}
