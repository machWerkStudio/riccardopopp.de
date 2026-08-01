<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

$honeypot = trim((string)($_POST['website'] ?? ''));
if ($honeypot !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

$name = trim((string)($_POST['name'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Bitte alle Felder ausfüllen.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Bitte eine gültige E-Mail-Adresse eingeben.']);
    exit;
}

$name = preg_replace('/[\r\n]+/', ' ', $name);
$email = preg_replace('/[\r\n]+/', '', $email);
$message = str_replace(["\r\n", "\r"], "\n", $message);

$to = 'info@riccardopopp.de';
$subject = 'Neue Anfrage über riccardopopp.de';
$body = "Name: {$name}\n";
$body .= "E-Mail: {$email}\n";
$body .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unbekannt') . "\n";
$body .= "Zeit: " . date('Y-m-d H:i:s') . "\n\n";
$body .= "Nachricht:\n{$message}\n";

$headers = [
    'From: riccardopopp.de <info@riccardopopp.de>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = mail($to, $subject, $body, implode("\r\n", $headers), '-f info@riccardopopp.de');

if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Mail konnte nicht gesendet werden.']);
    exit;
}

echo json_encode(['ok' => true]);
