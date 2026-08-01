<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
startSecureSession();
header('X-Robots-Tag: noindex, nofollow, noarchive, nosnippet');
header('Cache-Control: no-store');

if (!isAuthenticated()) {
    session_regenerate_id(true);
    $_SESSION['einsatz_authenticated'] = true;
    $_SESSION['csrf'] = bin2hex(random_bytes(24));
}
$authenticated = true;
$csrf = (string)$_SESSION['csrf'];
?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
  <meta name="theme-color" content="#111827">
  <title>Plakatierung Berlin – Einsatz</title>
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="stylesheet" href="styles.css?v=4">
  <link rel="stylesheet" href="vendor/leaflet/leaflet.css?v=1">
  <link rel="stylesheet" href="overrides.css?v=12">
</head>
<body class="<?= $authenticated ? 'app-mode' : 'login-mode' ?>">
<?php if (!$authenticated): ?>
  <main class="login-shell">
    <section class="login-card">
      <span class="kicker">Interner Bereich</span>
      <h1>Plakatierung Berlin</h1>
      <p>Bitte gib den gemeinsamen Einsatzcode ein.</p>
      <form method="post" autocomplete="off">
        <label for="access_code">Zugangscode</label>
        <input id="access_code" name="access_code" type="password" required autofocus inputmode="text" autocomplete="current-password">
        <?php if ($error !== ''): ?><p class="form-error" role="alert"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
        <button class="primary-button" type="submit">Einsatz öffnen</button>
      </form>
    </section>
  </main>
<?php else: ?>
  <header class="topbar">
    <div>
      <span class="kicker">Einsatzmappe</span>
      <strong>Plakatierung Berlin</strong>
    </div>
    <div class="top-actions"><a href="export.php" class="logout-link">Export</a><button class="icon-button" id="syncButton" type="button" aria-label="Daten neu laden" title="Daten neu laden">↻</button></div>
  </header>

  <main id="app" data-csrf="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
    <section id="overviewView" class="view active" aria-labelledby="overviewTitle">
      <div class="summary-card">
        <div>
          <span class="kicker">Gesamtfortschritt</span>
          <h1 id="overviewTitle"><span id="totalDone">0</span> <small>von 500</small></h1>
        </div>
        <div class="progress-ring" id="progressRing"><span id="progressPercent">0%</span></div>
      </div>

      <section class="identity-card" aria-labelledby="identityTitle">
        <div class="section-heading">
          <div><span class="kicker">Fahrer</span><h2 id="identityTitle">Wer fährt?</h2></div>
          <span class="save-state" id="saveState" aria-live="polite">Auf diesem Handy gespeichert</span>
        </div>
        <label>Fahrer auswählen<select id="driverName"><option value="">Bitte auswählen</option><option value="Ibo">Ibo</option><option value="Kai">Kai</option><option value="Riccardo">Riccardo</option></select></label>
      </section>

      <div id="offlineNotice" class="notice hidden" role="status">Offline – Änderungen werden auf diesem Gerät vorgemerkt.</div>
      <div id="pendingNotice" class="notice hidden" role="status"></div>
      <div id="tourGroups"></div>

      <section class="test-card" aria-labelledby="testTitle">
        <span class="kicker">Gerätetest · Ibo · Kai · Riccardo</span>
        <h2 id="testTitle">Vor dem Einsatz testen</h2>
        <p>Hier können Standort, Kamera und das Speichern auf dem Server geprüft werden. Der Test verändert keine Tour und keine Plakatzahl.</p>
        <div class="test-actions">
          <button class="secondary-button full-button location-button" id="testLocationButton" type="button">Standort testen</button>
          <label class="photo-picker test-photo-picker">Kamera testen
            <input id="testPhotoInput" type="file" accept="image/*" capture="environment">
          </label>
        </div>
        <div class="gps-status" id="testLocationStatus" aria-live="polite">Standort noch nicht getestet.</div>
        <div class="permission-help hidden" id="testLocationHelp">
          <strong>Standort ist im Browser blockiert</strong>
          <ol id="testLocationSteps"></ol>
          <p>Nach der Freigabe erneut auf „Standort testen“ tippen.</p>
        </div>
        <p class="test-camera-status" id="testCameraStatus" aria-live="polite">Kamera noch nicht getestet.</p>
        <img id="testPhotoPreview" class="capture-preview hidden" alt="Vorschau des Testfotos">
        <button class="primary-button full-button test-save-button" id="testSaveButton" type="button" disabled>Testnachweis auf Server speichern</button>
        <p class="test-save-status hidden" id="testSaveStatus" role="status" aria-live="polite"></p>
      </section>
    </section>

    <section id="tourView" class="view" aria-labelledby="tourTitle">
      <div class="tour-sticky">
        <button class="back-button" id="backButton" type="button">← Übersicht</button>
        <div class="tour-progress"><span id="tourProgressText">0 von 0</span><div><i id="tourProgressBar"></i></div></div>
      </div>
      <div id="tourContent"></div>
    </section>
  </main>

  <nav class="bottom-action hidden" id="bottomAction" aria-label="Touraktion">
    <button class="primary-button" id="finishTourButton" type="button">Tour abschließen</button>
  </nav>

  <button class="chat-fab" id="chatOpenButton" type="button" aria-label="Fahrerchat öffnen" title="Fahrerchat öffnen">Chat <span class="hidden" id="chatUnreadBadge">0</span></button>

  <dialog id="chatDialog" class="chat-dialog">
    <div class="dialog-card chat-card">
      <div class="section-heading"><div><span class="kicker">Ibo · Kai · Riccardo</span><h2>Fahrerchat</h2></div><button class="icon-button" id="chatCloseButton" type="button" aria-label="Chat schließen">×</button></div>
      <p class="chat-status" id="chatStatus" role="status" aria-live="polite">Nachrichten werden geladen …</p>
      <div class="chat-messages" id="chatMessages" aria-live="polite"></div>
      <div class="chat-quick" aria-label="Schnellmeldungen">
        <button type="button" data-chat-quick="Tour fertig">Tour fertig</button>
        <button type="button" data-chat-quick="Brauche Unterstützung">Brauche Hilfe</button>
        <button type="button" data-chat-quick="Kurze Pause">Pause</button>
        <button type="button" data-chat-quick="Problem vor Ort – bitte melden">Problem</button>
      </div>
      <form class="chat-compose" id="chatForm">
        <label for="chatText">Nachricht<textarea id="chatText" maxlength="500" rows="2" placeholder="Kurze Nachricht an alle Fahrer" required></textarea></label>
        <button class="primary-button" id="chatSendButton" type="submit">Senden</button>
      </form>
    </div>
  </dialog>

  <dialog id="problemDialog">
    <form method="dialog" class="dialog-card">
      <div class="section-heading"><div><span class="kicker">Rückmeldung</span><h2>Problem melden</h2></div><button class="icon-button" value="cancel" aria-label="Schließen">×</button></div>
      <p id="problemStreet"></p>
      <div class="problem-options" id="problemOptions"></div>
      <label>Notiz<textarea id="problemNote" maxlength="500" rows="4" placeholder="Kurze Ergänzung (optional)"></textarea></label>
      <button class="primary-button" id="saveProblemButton" value="default">Meldung speichern</button>
    </form>
  </dialog>

  <dialog id="finishDialog">
    <form method="dialog" class="dialog-card">
      <div class="section-heading"><div><span class="kicker">Kontrolle</span><h2>Tour abschließen</h2></div><button class="icon-button" value="cancel" aria-label="Schließen">×</button></div>
      <div id="finishCheck"></div>
      <label>Abschlussnotiz<textarea id="finishNote" maxlength="1000" rows="4" placeholder="Restmengen oder Besonderheiten"></textarea></label>
      <button class="primary-button" id="confirmFinishButton" value="default">Verbindlich abschließen</button>
    </form>
  </dialog>

  <dialog id="captureDialog">
    <form method="dialog" class="dialog-card capture-card">
      <div class="section-heading"><div><span class="kicker">Plakatnachweis</span><h2>Standort und Foto</h2></div><button class="icon-button" value="cancel" aria-label="Schließen">×</button></div>
      <p id="captureStreet"></p>
      <div class="gps-status" id="gpsStatus">Standort wird ermittelt …</div>
      <div class="permission-help hidden" id="locationPermissionHelp">
        <strong>Standort ist im Browser blockiert</strong>
        <ol id="locationPermissionSteps"></ol>
        <p>Danach zu dieser Seite zurückkehren und unten erneut prüfen.</p>
      </div>
      <button class="secondary-button full-button location-button" id="retryLocationButton" type="button">Standortfreigabe anfragen</button>
      <label class="photo-picker">Foto aufnehmen
        <input id="capturePhoto" type="file" accept="image/*" capture="environment">
      </label>
      <img id="capturePreview" class="capture-preview hidden" alt="Vorschau des aufgenommenen Fotos">
      <label>Notiz<textarea id="captureNote" maxlength="300" rows="3" placeholder="Optional"></textarea></label>
      <p class="capture-error hidden" id="captureError" role="alert"></p>
      <button class="primary-button" id="saveCaptureButton" value="default">Plakat speichern</button>
    </form>
  </dialog>

  <script src="vendor/leaflet/leaflet.js?v=1" defer></script>
  <script src="app.js?v=12" defer></script>
<?php endif; ?>
</body>
</html>
