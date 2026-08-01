<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
startSecureSession();
if (!isAuthenticated()) {
    http_response_code(401);
    exit('Bitte die Einsatzseite zuerst öffnen.');
}

$backupError = '';
if (($_SESSION['backup_authorized'] ?? false) !== true && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $submittedCode = (string)($_POST['backup_code'] ?? '');
    if (hash_equals(BACKUP_CODE_HASH, hash('sha256', $submittedCode))) {
        session_regenerate_id(true);
        $_SESSION['einsatz_authenticated'] = true;
        $_SESSION['backup_authorized'] = true;
    } else {
        usleep(500000);
        $backupError = 'Der Backupcode ist nicht korrekt.';
    }
}

if (($_SESSION['backup_authorized'] ?? false) !== true) {
    header('Content-Type: text/html; charset=UTF-8');
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('Cache-Control: no-store');
    ?>
    <!doctype html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Riccardo Backup</title>
      <style>
        *{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:20px;color:#172033;background:#111827;font:16px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:min(100%,420px);padding:26px;border-radius:22px;background:#fff;box-shadow:0 25px 80px rgba(0,0,0,.35)}.kicker{color:#687386;font-size:.72rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}h1{margin:.35rem 0 .6rem;font-size:1.7rem}p{color:#687386}label{display:grid;gap:7px;margin-top:20px;font-weight:800}input{min-height:54px;padding:13px;border:1px solid #dce2ea;border-radius:12px;font:inherit}button,a{display:flex;align-items:center;justify-content:center;width:100%;min-height:54px;margin-top:12px;border:0;border-radius:13px;font:inherit;font-weight:900;text-decoration:none}button{color:#fff;background:#15803d}a{color:#2563eb;background:#eff6ff}.error{padding:10px;color:#991b1b;border-radius:10px;background:#fee2e2;font-weight:800}
      </style>
    </head>
    <body><main class="card"><span class="kicker">Nur für Riccardo</span><h1>Vollständiges Backup</h1><p>Das ZIP enthält alle synchronisierten Koordinaten, Einsatzdaten und Fotos.</p><?php if ($backupError !== ''): ?><p class="error"><?= htmlspecialchars($backupError, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?><form method="post"><label>Backupcode<input type="password" name="backup_code" required autofocus autocomplete="current-password"></label><button type="submit">Backup herunterladen</button></form><a href="./">Zurück zur Übersicht</a></main></body></html>
    <?php
    exit;
}

@set_time_limit(0);
ini_set('zlib.output_compression', '0');
while (ob_get_level() > 0) ob_end_clean();

$stateRaw = is_file(DATA_FILE) ? (string)file_get_contents(DATA_FILE) : "{\n  \"meta\": {},\n  \"tours\": {}\n}";
$state = json_decode($stateRaw, true);
if (!is_array($state)) $state = ['meta' => [], 'tours' => []];
$tourData = is_file(__DIR__ . '/touren.json') ? (string)file_get_contents(__DIR__ . '/touren.json') : '{}';

$csvHandle = fopen('php://temp', 'w+');
fwrite($csvHandle, "\xEF\xBB\xBF");
fputcsv($csvHandle, ['ID','Tour','Abschnitt','Breitengrad','Längengrad','Genauigkeit Meter','Zeit','Fahrer','Notiz','Foto'], ';');
$markerCount = 0;
foreach ((array)($state['tours'] ?? []) as $tourId => $tour) {
    foreach ((array)($tour['markers'] ?? []) as $marker) {
        $markerCount++;
        fputcsv($csvHandle, [$marker['id'] ?? '', $tourId, ((int)($marker['sectionIndex'] ?? 0)) + 1, $marker['lat'] ?? '', $marker['lng'] ?? '', $marker['accuracy'] ?? '', $marker['capturedAt'] ?? '', $marker['driver'] ?? '', $marker['note'] ?? '', $marker['photo'] ?? ''], ';');
    }
}
rewind($csvHandle);
$csv = (string)stream_get_contents($csvHandle);
fclose($csvHandle);

$readme = "BACKUP PLAKATIERUNG BERLIN\n";
$readme .= "Erstellt: " . date(DATE_ATOM) . "\n";
$readme .= "Erfasste Plakatstandorte: " . $markerCount . "\n\n";
$readme .= "standorte.csv - Koordinaten und Zuordnung\n";
$readme .= "einsatzstand.json - Vollständiger technischer Einsatzstand\n";
$readme .= "touren.json - Definition aller Touren und Sollmengen\n";
$readme .= "photos/ - Sämtliche hochgeladenen Plakatfotos\n";

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="berlin-einsatz-backup-' . date('Y-m-d-His') . '.zip"');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

$offset = 0;
$central = [];
$flags = 0x0800;

function zipDosTime(int $timestamp): array
{
    $parts = getdate($timestamp);
    $year = max(1980, (int)$parts['year']);
    $time = ((int)$parts['hours'] << 11) | ((int)$parts['minutes'] << 5) | ((int)$parts['seconds'] >> 1);
    $date = (($year - 1980) << 9) | ((int)$parts['mon'] << 5) | (int)$parts['mday'];
    return [$time, $date];
}

function zipAddHeader(string $name, int $size, int $crc, int $timestamp): void
{
    global $offset, $central, $flags;
    [$dosTime, $dosDate] = zipDosTime($timestamp);
    $nameBytes = $name;
    $localOffset = $offset;
    $header = pack('VvvvvvVVVvv', 0x04034b50, 20, $flags, 0, $dosTime, $dosDate, $crc, $size, $size, strlen($nameBytes), 0) . $nameBytes;
    echo $header;
    $offset += strlen($header);
    $central[] = [$nameBytes, $size, $crc, $dosTime, $dosDate, $localOffset];
}

function zipAddContent(string $name, string $content): void
{
    global $offset;
    $crc = (int)hexdec(hash('crc32b', $content));
    zipAddHeader($name, strlen($content), $crc, time());
    echo $content;
    $offset += strlen($content);
}

function zipAddFile(string $name, string $path): void
{
    global $offset;
    $size = (int)filesize($path);
    $crc = (int)hexdec(hash_file('crc32b', $path));
    zipAddHeader($name, $size, $crc, (int)filemtime($path));
    $handle = fopen($path, 'rb');
    if ($handle === false) return;
    while (!feof($handle)) {
        $chunk = fread($handle, 1048576);
        if ($chunk === false || $chunk === '') break;
        echo $chunk;
        $offset += strlen($chunk);
        flush();
    }
    fclose($handle);
}

zipAddContent('README.txt', $readme);
zipAddContent('standorte.csv', $csv);
zipAddContent('einsatzstand.json', $stateRaw);
zipAddContent('touren.json', $tourData);

$photoDir = __DIR__ . '/data/photos';
if (is_dir($photoDir)) {
    $photos = glob($photoDir . '/*.{jpg,webp}', GLOB_BRACE) ?: [];
    sort($photos, SORT_NATURAL);
    foreach ($photos as $photo) {
        if (is_file($photo)) zipAddFile('photos/' . basename($photo), $photo);
    }
}

$centralOffset = $offset;
foreach ($central as [$name, $size, $crc, $dosTime, $dosDate, $localOffset]) {
    $record = pack('VvvvvvvVVVvvvvvVV', 0x02014b50, 20, 20, $flags, 0, $dosTime, $dosDate, $crc, $size, $size, strlen($name), 0, 0, 0, 0, 0, $localOffset) . $name;
    echo $record;
    $offset += strlen($record);
}
$centralSize = $offset - $centralOffset;
$entryCount = count($central);
echo pack('VvvvvVVv', 0x06054b50, 0, 0, $entryCount, $entryCount, $centralSize, $centralOffset, 0);
