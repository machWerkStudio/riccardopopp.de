<?php
declare(strict_types=1);

const ACCESS_CODE_HASH = '4883e712986aad09ddd0110495e39bbd7f12eab87dccc3864e5656cf5be728ac';
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

function cleanText(mixed $value, int $maxLength = 500): string
{
    $text = trim((string)$value);
    return function_exists('mb_substr') ? mb_substr($text, 0, $maxLength) : substr($text, 0, $maxLength);
}
