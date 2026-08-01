<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
startSecureSession();
if (!isAuthenticated()) { header('Location: ./'); exit; }
$state = is_file(DATA_FILE) ? json_decode((string)file_get_contents(DATA_FILE), true) : [];
header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="plakat-standorte-' . date('Y-m-d-His') . '.csv"');
echo "\xEF\xBB\xBF";
$out = fopen('php://output', 'w');
fputcsv($out, ['ID','Tour','Abschnitt','Breitengrad','Längengrad','Genauigkeit Meter','Zeit','Fahrer','Notiz','Foto'], ';');
foreach ((array)($state['tours'] ?? []) as $tourId => $tour) {
    foreach ((array)($tour['markers'] ?? []) as $marker) {
        fputcsv($out, [$marker['id'] ?? '', $tourId, ((int)($marker['sectionIndex'] ?? 0)) + 1, $marker['lat'] ?? '', $marker['lng'] ?? '', $marker['accuracy'] ?? '', $marker['capturedAt'] ?? '', $marker['driver'] ?? '', $marker['note'] ?? '', $marker['photo'] ?? ''], ';');
    }
}
fclose($out);
