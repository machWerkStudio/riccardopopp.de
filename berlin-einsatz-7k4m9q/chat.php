<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
startSecureSession();
requireAuthentication();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow, noarchive');

$chatFile = __DIR__ . '/data/chat.json';

function chatReply(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $messages = [];
    if (is_file($chatFile)) {
        $readHandle = @fopen($chatFile, 'rb');
        if ($readHandle !== false && flock($readHandle, LOCK_SH)) {
            $decoded = json_decode((string)stream_get_contents($readHandle), true);
            flock($readHandle, LOCK_UN);
            if (is_array($decoded)) $messages = array_values(array_slice($decoded, -200));
        }
        if ($readHandle !== false) fclose($readHandle);
    }
    chatReply(200, ['ok' => true, 'messages' => $messages, 'serverTime' => date(DATE_ATOM)]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    chatReply(405, ['ok' => false, 'message' => 'Methode nicht erlaubt.']);
}
if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
    chatReply(403, ['ok' => false, 'message' => 'Sicherheitsprüfung fehlgeschlagen.']);
}
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 5000) {
    chatReply(413, ['ok' => false, 'message' => 'Nachricht ist zu groß.']);
}

$input = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($input)) chatReply(422, ['ok' => false, 'message' => 'Ungültige Nachricht.']);
$id = cleanText($input['id'] ?? '', 60);
$driver = cleanText($input['driver'] ?? '', 20);
$text = cleanText($input['text'] ?? '', 500);
if (!preg_match('/^[a-zA-Z0-9-]{16,60}$/', $id) || !in_array($driver, ['Ibo', 'Kai', 'Riccardo'], true) || $text === '') {
    chatReply(422, ['ok' => false, 'message' => 'Fahrer oder Nachricht ist ungültig.']);
}

if (!is_dir(dirname($chatFile)) && !@mkdir(dirname($chatFile), 0750, true) && !is_dir(dirname($chatFile))) {
    chatReply(500, ['ok' => false, 'message' => 'Chatordner konnte nicht angelegt werden.']);
}
$handle = fopen($chatFile, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    chatReply(500, ['ok' => false, 'message' => 'Chat ist momentan gesperrt.']);
}
$raw = stream_get_contents($handle);
$messages = $raw ? json_decode($raw, true) : [];
if (!is_array($messages)) $messages = [];
$existing = null;
foreach ($messages as $message) {
    if (is_array($message) && ($message['id'] ?? '') === $id) { $existing = $message; break; }
}
if ($existing === null) {
    $existing = ['id' => $id, 'driver' => $driver, 'text' => $text, 'at' => date(DATE_ATOM)];
    $messages[] = $existing;
    $messages = array_values(array_slice($messages, -200));
    $encoded = json_encode($messages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, $encoded ?: '[]');
    fflush($handle);
}
flock($handle, LOCK_UN);
fclose($handle);
chatReply(200, ['ok' => true, 'message' => $existing]);
