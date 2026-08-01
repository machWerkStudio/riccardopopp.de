<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
startSecureSession();
requireAuthentication();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow, noarchive');
ini_set('display_errors', '0');

function testResponse(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$testStage = 'Start';
set_exception_handler(static function (Throwable $error) use (&$testStage): void {
    error_log('Testupload: ' . $error->getMessage());
    $detail = str_replace(__DIR__, '[App]', $error->getMessage());
    $detail = function_exists('mb_substr') ? mb_substr($detail, 0, 180) : substr($detail, 0, 180);
    testResponse(500, ['ok' => false, 'message' => 'Serverfehler – Schritt: ' . $testStage . ' · ' . get_class($error) . ': ' . $detail]);
});

$testStage = 'Anfragemethode prüfen';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    testResponse(405, ['ok' => false, 'message' => 'Methode nicht erlaubt.']);
}
$testStage = 'Sicherheitswert prüfen';
if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
    testResponse(403, ['ok' => false, 'message' => 'Sicherheitsprüfung fehlgeschlagen.']);
}

$testStage = 'Fahrer lesen';
$driver = cleanText($_POST['driver'] ?? '', 20);
$testStage = 'Standortwerte lesen';
$lat = filter_var($_POST['lat'] ?? null, FILTER_VALIDATE_FLOAT);
$lng = filter_var($_POST['lng'] ?? null, FILTER_VALIDATE_FLOAT);
$accuracy = filter_var($_POST['accuracy'] ?? null, FILTER_VALIDATE_FLOAT);
$testStage = 'Fahrer prüfen';
if (!in_array($driver, ['Ibo', 'Kai', 'Riccardo'], true)) {
    testResponse(422, ['ok' => false, 'message' => 'Bitte einen gültigen Fahrer auswählen.']);
}
$testStage = 'Standortwerte prüfen';
if ($lat === false || $lng === false || abs((float)$lat) > 90 || abs((float)$lng) > 180 || $accuracy === false || (float)$accuracy < 0) {
    testResponse(422, ['ok' => false, 'message' => 'Die Test-Standortdaten sind ungültig.']);
}
$testStage = 'Fotoupload prüfen';
if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK || $_FILES['photo']['size'] > 3500000) {
    testResponse(422, ['ok' => false, 'message' => 'Testfoto fehlt oder ist zu groß.']);
}

$testStage = 'Testfoto prüfen';
$imageInfo = @getimagesize($_FILES['photo']['tmp_name']);
$mime = is_array($imageInfo) ? (string)($imageInfo['mime'] ?? '') : '';
if (!in_array($mime, ['image/jpeg', 'image/webp'], true)) {
    testResponse(422, ['ok' => false, 'message' => 'Nur JPEG- oder WebP-Testfotos sind erlaubt.']);
}

$testDir = __DIR__ . '/data/tests';
$testStage = 'Testordner anlegen';
if (!is_dir($testDir) && !mkdir($testDir, 0750, true) && !is_dir($testDir)) {
    testResponse(500, ['ok' => false, 'message' => 'Der Testordner konnte nicht angelegt werden.']);
}

$driverKey = strtolower($driver);
$extension = $mime === 'image/webp' ? 'webp' : 'jpg';
$photoName = $driverKey . '.' . $extension;
$photoPath = $testDir . '/' . $photoName;
$testStage = 'Testfoto speichern';
if (!move_uploaded_file($_FILES['photo']['tmp_name'], $photoPath)) {
    testResponse(500, ['ok' => false, 'message' => 'Das Testfoto konnte nicht gespeichert werden.']);
}

$resultsPath = $testDir . '/results.json';
$testStage = 'Ergebnisdatei öffnen';
$handle = fopen($resultsPath, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    testResponse(500, ['ok' => false, 'message' => 'Das Testergebnis konnte nicht gesperrt werden.']);
}
$raw = stream_get_contents($handle);
$results = $raw ? json_decode($raw, true) : [];
if (!is_array($results)) $results = [];
$savedAt = date(DATE_ATOM);
$results[$driver] = [
    'driver' => $driver,
    'lat' => round((float)$lat, 7),
    'lng' => round((float)$lng, 7),
    'accuracy' => round((float)$accuracy, 1),
    'capturedAt' => cleanText($_POST['capturedAt'] ?? '', 40),
    'savedAt' => $savedAt,
    'photo' => $photoName,
    'bytes' => (int)filesize($photoPath),
];
$testStage = 'Ergebnisdatei schreiben';
$encoded = json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
rewind($handle);
ftruncate($handle, 0);
fwrite($handle, $encoded ?: '{}');
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

testResponse(200, ['ok' => true, 'driver' => $driver, 'savedAt' => $savedAt]);
