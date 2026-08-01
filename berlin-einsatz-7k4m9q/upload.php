<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
startSecureSession();
requireAuthentication();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow, noarchive');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Methode nicht erlaubt.']);
    exit;
}
if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Sicherheitsprüfung fehlgeschlagen.']);
    exit;
}

$id = cleanText($_POST['id'] ?? '', 60);
$tourId = (int)($_POST['tourId'] ?? 0);
$sectionIndex = (int)($_POST['sectionIndex'] ?? -1);
$lat = filter_var($_POST['lat'] ?? null, FILTER_VALIDATE_FLOAT);
$lng = filter_var($_POST['lng'] ?? null, FILTER_VALIDATE_FLOAT);
$accuracy = filter_var($_POST['accuracy'] ?? null, FILTER_VALIDATE_FLOAT);
if (!preg_match('/^[a-zA-Z0-9-]{16,60}$/', $id) || $tourId < 1 || $tourId > 11 || $sectionIndex < 0 || $sectionIndex > 9 || $lat === false || $lng === false || abs((float)$lat) > 90 || abs((float)$lng) > 180 || $accuracy === false) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Standortdaten sind ungültig.']);
    exit;
}
if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK || $_FILES['photo']['size'] > 3500000) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Foto fehlt oder ist zu groß.']);
    exit;
}
$imageInfo = @getimagesize($_FILES['photo']['tmp_name']);
$mime = is_array($imageInfo) ? (string)($imageInfo['mime'] ?? '') : '';
if (!in_array($mime, ['image/jpeg', 'image/webp'], true)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Nur JPEG- oder WebP-Fotos sind erlaubt.']);
    exit;
}

$photoDir = __DIR__ . '/data/photos';
if (!is_dir($photoDir) && !mkdir($photoDir, 0750, true) && !is_dir($photoDir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Fotoordner konnte nicht angelegt werden.']);
    exit;
}
$extension = $mime === 'image/webp' ? 'webp' : 'jpg';
$photoName = $id . '.' . $extension;
$photoPath = $photoDir . '/' . $photoName;
if (!move_uploaded_file($_FILES['photo']['tmp_name'], $photoPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Foto konnte nicht gespeichert werden.']);
    exit;
}

$marker = [
    'id' => $id,
    'sectionIndex' => $sectionIndex,
    'lat' => round((float)$lat, 7),
    'lng' => round((float)$lng, 7),
    'accuracy' => round(max(0, (float)$accuracy), 1),
    'capturedAt' => cleanText($_POST['capturedAt'] ?? '', 40),
    'driver' => cleanText($_POST['driver'] ?? '', 80),
    'note' => cleanText($_POST['note'] ?? '', 300),
    'photo' => $photoName,
];

if (!is_dir(dirname(DATA_FILE))) mkdir(dirname(DATA_FILE), 0750, true);
$handle = fopen(DATA_FILE, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    @unlink($photoPath);
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Einsatzdaten momentan gesperrt.']);
    exit;
}
$raw = stream_get_contents($handle);
$state = $raw ? json_decode($raw, true) : [];
if (!is_array($state)) $state = [];
$state += ['meta' => [], 'tours' => []];
$tourKey = (string)$tourId;
if (!isset($state['tours'][$tourKey]) || !is_array($state['tours'][$tourKey])) $state['tours'][$tourKey] = [];
$markers = isset($state['tours'][$tourKey]['markers']) && is_array($state['tours'][$tourKey]['markers']) ? $state['tours'][$tourKey]['markers'] : [];
$markers = array_values(array_filter($markers, function ($item) use ($id) {
    return !is_array($item) || ($item['id'] ?? '') !== $id;
}));
$markers[] = $marker;
$state['tours'][$tourKey]['markers'] = $markers;
$state['tours'][$tourKey]['updatedAt'] = date(DATE_ATOM);
$state['updatedAt'] = date(DATE_ATOM);
$encoded = json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
rewind($handle); ftruncate($handle, 0); fwrite($handle, $encoded ?: '{}'); fflush($handle); flock($handle, LOCK_UN); fclose($handle);
createStateSnapshot($encoded ?: '{}');
echo json_encode(['ok' => true, 'marker' => $marker], JSON_UNESCAPED_UNICODE);
