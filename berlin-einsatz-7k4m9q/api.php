<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
startSecureSession();
requireAuthentication();
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow, noarchive');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $state = is_file(DATA_FILE) ? json_decode((string)file_get_contents(DATA_FILE), true) : null;
    echo json_encode(['ok' => true, 'state' => is_array($state) ? $state : ['meta' => [], 'tours' => []]], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Methode nicht erlaubt.']);
    exit;
}

$csrf = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
if ($csrf === '' || !hash_equals((string)($_SESSION['csrf'] ?? ''), $csrf)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Sicherheitsprüfung fehlgeschlagen.']);
    exit;
}

if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 150000) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'message' => 'Datenmenge zu groß.']);
    exit;
}

$input = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Ungültige Daten.']);
    exit;
}

$section = cleanText($input['section'] ?? '', 20);
$payload = $input['data'] ?? null;
if (!is_array($payload) || !in_array($section, ['meta', 'tour'], true)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Ungültiger Speicherbereich.']);
    exit;
}

if (!is_dir(dirname(DATA_FILE))) {
    mkdir(dirname(DATA_FILE), 0750, true);
}
$handle = fopen(DATA_FILE, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Speichern momentan nicht möglich.']);
    exit;
}

$raw = stream_get_contents($handle);
$state = $raw !== false && $raw !== '' ? json_decode($raw, true) : [];
if (!is_array($state)) $state = [];
$state += ['meta' => [], 'tours' => []];

if ($section === 'meta') {
    $unit = max(1, min(3, (int)($payload['unit'] ?? 1)));
    if (!isset($state['meta']['crews']) || !is_array($state['meta']['crews'])) {
        $state['meta']['crews'] = [];
    }
    $state['meta']['crews'][(string)$unit] = [
        'driver' => cleanText($payload['driver'] ?? '', 80),
        'plate' => cleanText($payload['plate'] ?? '', 30),
        'updatedAt' => date(DATE_ATOM),
    ];
} else {
    $tourId = (int)($input['tourId'] ?? 0);
    if ($tourId < 1 || $tourId > 11) {
        flock($handle, LOCK_UN);
        fclose($handle);
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Unbekannte Tour.']);
        exit;
    }
    $sections = [];
    foreach (array_slice((array)($payload['sections'] ?? []), 0, 10) as $item) {
        if (!is_array($item)) continue;
        $problems = [];
        foreach (array_slice((array)($item['problems'] ?? []), 0, 20) as $problem) {
            if (!is_array($problem)) continue;
            $problems[] = [
                'type' => cleanText($problem['type'] ?? '', 80),
                'note' => cleanText($problem['note'] ?? '', 500),
                'at' => cleanText($problem['at'] ?? '', 40),
            ];
        }
        $sections[] = [
            'count' => max(0, min(999, (int)($item['count'] ?? 0))),
            'done' => (bool)($item['done'] ?? false),
            'problems' => $problems,
        ];
    }
    $existingMarkers = [];
    if (isset($state['tours'][(string)$tourId]['markers']) && is_array($state['tours'][(string)$tourId]['markers'])) {
        $existingMarkers = $state['tours'][(string)$tourId]['markers'];
    }
    $state['tours'][(string)$tourId] = [
        'sections' => $sections,
        'status' => in_array(($payload['status'] ?? ''), ['open', 'active', 'done'], true) ? $payload['status'] : 'open',
        'finishNote' => cleanText($payload['finishNote'] ?? '', 1000),
        'finishedAt' => cleanText($payload['finishedAt'] ?? '', 40),
        'updatedAt' => date(DATE_ATOM),
        'markers' => $existingMarkers,
    ];
}

$state['updatedAt'] = date(DATE_ATOM);
$encoded = json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
rewind($handle);
ftruncate($handle, 0);
fwrite($handle, $encoded === false ? '{}' : $encoded);
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

echo json_encode(['ok' => true, 'state' => $state], JSON_UNESCAPED_UNICODE);
