(() => {
  'use strict';

  const app = document.querySelector('#app');
  if (!app) return;

  const csrf = app.dataset.csrf;
  const localKey = 'berlin-einsatz-backup-v1';
  const driverKey = 'berlin-einsatz-driver-v1';
  const backupKey = 'berlin-einsatz-last-backup-v1';
  const problemTypes = ['Keine freie Fläche', 'Pfosten / Halterung beschädigt', 'Abschnitt nicht zugänglich', 'Ordnungsamt / Polizei', 'Sonstige Besonderheit'];
  const dom = {
    overview: document.querySelector('#overviewView'), tour: document.querySelector('#tourView'), groups: document.querySelector('#tourGroups'),
    totalDone: document.querySelector('#totalDone'), percent: document.querySelector('#progressPercent'), ring: document.querySelector('#progressRing'),
    driver: document.querySelector('#driverName'),
    saveState: document.querySelector('#saveState'), offline: document.querySelector('#offlineNotice'), pending: document.querySelector('#pendingNotice'), content: document.querySelector('#tourContent'),
    bottom: document.querySelector('#bottomAction'), finishButton: document.querySelector('#finishTourButton'), back: document.querySelector('#backButton'),
    tourProgressText: document.querySelector('#tourProgressText'), tourProgressBar: document.querySelector('#tourProgressBar'), sync: document.querySelector('#syncButton'),
    problemDialog: document.querySelector('#problemDialog'), problemStreet: document.querySelector('#problemStreet'), problemOptions: document.querySelector('#problemOptions'),
    problemNote: document.querySelector('#problemNote'), saveProblem: document.querySelector('#saveProblemButton'),
    finishDialog: document.querySelector('#finishDialog'), finishCheck: document.querySelector('#finishCheck'), finishNote: document.querySelector('#finishNote'), confirmFinish: document.querySelector('#confirmFinishButton'),
    captureDialog: document.querySelector('#captureDialog'), captureStreet: document.querySelector('#captureStreet'), gpsStatus: document.querySelector('#gpsStatus'),
    retryLocation: document.querySelector('#retryLocationButton'), locationHelp: document.querySelector('#locationPermissionHelp'), locationSteps: document.querySelector('#locationPermissionSteps'), capturePhoto: document.querySelector('#capturePhoto'), capturePreview: document.querySelector('#capturePreview'),
    captureNote: document.querySelector('#captureNote'), captureError: document.querySelector('#captureError'), saveCapture: document.querySelector('#saveCaptureButton'),
    testLocation: document.querySelector('#testLocationButton'), testLocationStatus: document.querySelector('#testLocationStatus'), testLocationHelp: document.querySelector('#testLocationHelp'), testLocationSteps: document.querySelector('#testLocationSteps'),
    testPhoto: document.querySelector('#testPhotoInput'), testPhotoStatus: document.querySelector('#testCameraStatus'), testPhotoPreview: document.querySelector('#testPhotoPreview'),
    testSave: document.querySelector('#testSaveButton'), testSaveStatus: document.querySelector('#testSaveStatus')
  };

  let definitions = [];
  let state = { meta: {}, tours: {} };
  let activeTourId = null;
  let activeProblem = null;
  let selectedProblem = '';
  let tourTimer = null;
  let finishNeedsNote = false;
  let captureTarget = null;
  let capturePosition = null;
  let captureBlob = null;
  let capturePreviewUrl = '';
  let testPreviewUrl = '';
  let testPosition = null;
  let testPhotoBlob = null;
  let pendingCount = 0;
  let tourMarkerMap = null;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const now = () => new Date().toISOString();
  const sum = values => values.reduce((total, value) => total + value, 0);
  const mapUrl = (start, end) => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${start}, Berlin`)}&destination=${encodeURIComponent(`${end}, Berlin`)}&travelmode=driving`;
  const streetUrl = street => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${street}, Berlin`)}`;

  function emptyTour(def) {
    return { sections: def.streets.map(() => ({ count: 0, done: false, problems: [] })), status: 'open', finishNote: '', finishedAt: '' };
  }

  function normalizeState(input) {
    const result = input && typeof input === 'object' ? input : {};
    result.meta = result.meta && typeof result.meta === 'object' ? result.meta : {};
    result.tours = result.tours && typeof result.tours === 'object' ? result.tours : {};
    definitions.forEach(def => {
      const saved = result.tours[String(def.id)] || emptyTour(def);
      saved.sections = def.streets.map((street, index) => {
        const section = saved.sections?.[index] || {};
        return { count: Math.max(0, Number(section.count) || 0), done: Boolean(section.done), problems: Array.isArray(section.problems) ? section.problems : [] };
      });
      saved.status = ['open', 'active', 'done'].includes(saved.status) ? saved.status : 'open';
      saved.markers = Array.isArray(saved.markers) ? saved.markers : [];
      saved.finishNote = String(saved.finishNote || '');
      saved.finishedAt = String(saved.finishedAt || '');
      result.tours[String(def.id)] = saved;
    });
    return result;
  }

  function storeLocal() {
    try { localStorage.setItem(localKey, JSON.stringify(state)); } catch (_) {}
  }

  function localBackup() {
    try { return JSON.parse(localStorage.getItem(localKey) || 'null'); } catch (_) { return null; }
  }

  function openCaptureDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('berlin-einsatz-captures', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('pending', {keyPath:'id'});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function pendingOperation(mode, value) {
    const db = await openCaptureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending', mode === 'getAll' ? 'readonly' : 'readwrite');
      const store = tx.objectStore('pending');
      const request = mode === 'put' ? store.put(value) : mode === 'delete' ? store.delete(value) : store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function updatePendingNotice() {
    try { pendingCount = (await pendingOperation('getAll')).length; } catch (_) { pendingCount = 0; }
    dom.pending.classList.toggle('hidden', pendingCount === 0);
    dom.pending.textContent = pendingCount ? `${pendingCount} Foto${pendingCount === 1 ? '' : 's'} wartet${pendingCount === 1 ? '' : 'en'} auf Synchronisierung.` : '';
    if (dom.driver.value === 'Riccardo' && dom.overview.classList.contains('active')) renderOverview();
  }

  async function mergePendingMarkers() {
    let records = [];
    try { records = await pendingOperation('getAll'); } catch (_) { return; }
    records.forEach(record => {
      const tour = state.tours[String(record.meta?.tourId)];
      if (tour && !tour.markers.some(marker => marker.id === record.id)) tour.markers.push({...record.meta,pending:true});
    });
  }

  function uuid() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  }

  async function apiRequest(options = {}) {
    const response = await fetch('api.php', { cache: 'no-store', credentials: 'same-origin', ...options });
    if (response.status === 401) { window.location.reload(); throw new Error('Sitzung abgelaufen'); }
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || 'Serverfehler');
    return data;
  }

  function setSaveLabel(text, error = false) {
    dom.saveState.textContent = text;
    dom.saveState.style.color = error ? '#b91c1c' : '';
  }

  async function saveSection(section, data, tourId = null) {
    storeLocal();
    setSaveLabel('Speichert …');
    if (!navigator.onLine) { setSaveLabel('Lokal gesichert'); updateOnlineState(); return; }
    try {
      const payload = { section, data };
      if (tourId !== null) payload.tourId = tourId;
      await apiRequest({ method: 'POST', headers: {'Content-Type':'application/json','X-CSRF-Token':csrf}, body: JSON.stringify(payload) });
      setSaveLabel('Gespeichert');
    } catch (error) {
      setSaveLabel('Lokal gesichert', true);
    }
  }

  function queueTourSave(id) {
    clearTimeout(tourTimer);
    storeLocal();
    tourTimer = setTimeout(() => saveSection('tour', state.tours[String(id)], id), 250);
  }

  function totalCompleted() {
    return sum(definitions.flatMap(def => state.tours[String(def.id)].sections.map(section => section.count)));
  }

  function tourCompleted(def) {
    return sum(state.tours[String(def.id)].sections.map(section => section.count));
  }

  function storageControlMarkup() {
    if (dom.driver.value !== 'Riccardo') return '';
    const latest = {Ibo:null,Kai:null,Riccardo:null};
    let confirmedCount = 0;
    definitions.forEach(def => {
      (state.tours[String(def.id)]?.markers || []).forEach(marker => {
        if (marker.pending || !(marker.driver in latest)) return;
        confirmedCount += 1;
        const candidate = {...marker,tourId:def.id};
        if (!latest[marker.driver] || String(candidate.capturedAt || '') > String(latest[marker.driver].capturedAt || '')) latest[marker.driver] = candidate;
      });
    });
    const rows = ['Ibo','Kai','Riccardo'].map(driver => {
      const marker = latest[driver];
      const detail = marker ? `${new Date(marker.capturedAt).toLocaleString('de-DE')} · Tour ${marker.tourId}` : 'Noch kein bestätigter Plakatnachweis';
      return `<div class="storage-driver"><i class="${driver.toLowerCase()}"></i><div><strong>${driver}</strong><span>${esc(detail)}</span></div><b>${marker ? '✓' : '–'}</b></div>`;
    }).join('');
    return `<section class="storage-control"><div class="section-heading"><div><span class="kicker">Nur für Riccardo</span><h2>Speicherkontrolle</h2></div><span class="storage-total">${confirmedCount}</span></div><p class="storage-summary">${pendingCount ? `⚠ Auf diesem Handy warten ${pendingCount} Foto${pendingCount === 1 ? '' : 's'} auf Übertragung.` : '✓ Auf diesem Handy sind keine Übertragungen offen.'}</p><div class="storage-drivers">${rows}</div><p class="snapshot-note">Automatische Sicherung aktiv: Nach jeder Serveränderung wird ein Wiederherstellungsstand erstellt. Die letzten 60 Stände bleiben erhalten.</p></section>`;
  }

  function renderOverview() {
    const completed = totalCompleted();
    const percentage = Math.min(100, Math.round((completed / 500) * 100));
    dom.totalDone.textContent = completed;
    dom.percent.textContent = `${percentage}%`;
    dom.ring.style.setProperty('--p', percentage);
    const driverSelected = Boolean(dom.driver.value);
    const lastBackup = localStorage.getItem(backupKey);
    const backupMarkup = dom.driver.value === 'Riccardo' ? `<section class="backup-card"><div><span class="kicker">Datensicherung</span><h2>Vollständiges Einsatz-Backup</h2><p>${lastBackup ? `Letzter Download auf diesem Gerät: ${new Date(lastBackup).toLocaleString('de-DE')}` : 'Noch kein Backup auf diesem Gerät heruntergeladen.'}</p></div><a class="backup-button" id="backupDownload" href="backup.php" download>ZIP-Backup herunterladen ↓</a></section>` : '';
    const controlMarkup = storageControlMarkup();
    dom.groups.innerHTML = `${driverSelected ? '' : '<p class="priority-note">Bitte zuerst Ibo, Kai oder Riccardo als Fahrer auswählen.</p>'}${controlMarkup}${backupMarkup}${[1, 2].map(priority => {
      const tours = definitions.filter(def => def.priority === priority).sort((a, b) => {
        const rank = {active:0, open:1, done:2};
        return rank[state.tours[String(a.id)].status] - rank[state.tours[String(b.id)].status] || a.id - b.id;
      });
      const target = sum(tours.map(tour => tour.target));
      return `<section><div class="group-heading"><h2>Priorität ${priority}</h2><span class="priority-chip priority-${priority}">${target} Plakate</span></div>${tours.map(def => {
        const tourState = state.tours[String(def.id)];
        const count = tourCompleted(def);
        const statusText = tourState.status === 'done' ? 'Fertig' : tourState.status === 'active' ? 'Läuft' : 'Offen';
        return `<button class="tour-card ${tourState.status === 'done' ? 'done' : ''} ${tourState.status === 'active' ? 'active-tour' : ''}" data-tour-id="${def.id}" type="button" ${driverSelected ? '' : 'disabled aria-disabled="true"'}><div><span class="status-chip priority-${def.priority}">${driverSelected ? statusText : 'Fahrer wählen'}</span><h3>Tour ${def.id}: ${esc(def.name)}</h3><p>${count} von ${def.target} Plakaten</p></div><span class="number">${def.id}</span></button>`;
      }).join('')}</section>`;
    }).join('')}`;
    dom.groups.querySelectorAll('[data-tour-id]').forEach(button => button.addEventListener('click', () => openTour(Number(button.dataset.tourId))));
    const backupDownload = document.querySelector('#backupDownload');
    if (backupDownload) backupDownload.addEventListener('click', () => { localStorage.setItem(backupKey, now()); setTimeout(renderOverview, 300); });
  }

  function renderTour() {
    const def = definitions.find(item => item.id === activeTourId);
    if (!def) return;
    const tourState = state.tours[String(def.id)];
    const completed = tourCompleted(def);
    const percentage = Math.min(100, Math.round((completed / def.target) * 100));
    const driverCounts = {Kai:0,Ibo:0,Riccardo:0};
    tourState.markers.forEach(marker => { if (marker.driver in driverCounts) driverCounts[marker.driver] += 1; });
    dom.tourProgressText.textContent = `${completed} von ${def.target}`;
    dom.tourProgressBar.style.width = `${percentage}%`;
    if (tourMarkerMap) { tourMarkerMap.remove(); tourMarkerMap = null; }
    dom.content.innerHTML = `
      <section class="tour-hero"><span class="priority-chip priority-${def.priority}">Priorität ${def.priority}</span><h1 id="tourTitle">Tour ${def.id}: ${esc(def.name)}</h1><div class="tour-meta"><div><span>Start</span><strong>${esc(def.start)}</strong></div><div><span>Ende</span><strong>${esc(def.end)}</strong></div><div><span>Soll</span><strong>${def.target}</strong></div></div><a class="navigate-button" href="${mapUrl(def.start,def.end)}" target="_blank" rel="noopener">Navigation starten ↗</a></section>
      <section class="route-card"><span class="kicker">Arbeitshinweis</span><p class="hint">${esc(def.hint)}</p></section>
      <div>${def.streets.map((street,index) => streetCard(def, street, index, tourState.sections[index])).join('')}</div>
      <section class="live-map-card"><div class="section-heading"><div><span class="kicker">Standortkarte</span><h2>Markierte Plakate</h2></div><strong>${tourState.markers.length}</strong></div><div class="driver-legend"><span><i class="kai"></i>Kai ${driverCounts.Kai}</span><span><i class="ibo"></i>Ibo ${driverCounts.Ibo}</span><span><i class="riccardo"></i>Riccardo ${driverCounts.Riccardo}</span></div>${tourState.markers.length ? '<div id="tourMarkerMap" class="tour-marker-map" aria-label="Karte mit allen markierten Plakaten dieser Tour"></div>' : '<p class="empty-map">Noch keine Plakate mit GPS-Standort erfasst.</p>'}</section>
      <section class="map-card"><details><summary>Geplanten Kartenausschnitt anzeigen</summary><img src="${esc(def.map)}" alt="Kartenausschnitt für Tour ${def.id}" loading="lazy"></details></section>
      ${tourState.markers.length ? `<section class="route-card"><span class="kicker">Erfasste Standorte</span><h2>${tourState.markers.length} Plakatnachweise</h2><div class="marker-list">${tourState.markers.slice().reverse().map(marker => markerCard(marker, def)).join('')}</div></section>` : ''}
      ${tourState.status === 'done' ? `<div class="finished-banner">✓ Tour abgeschlossen${tourState.finishedAt ? ` · ${new Date(tourState.finishedAt).toLocaleString('de-DE')}` : ''}</div>` : ''}`;
    bindTourControls(def);
    if (tourState.markers.length) requestAnimationFrame(() => initTourMarkerMap(def, tourState.markers));
  }

  function initTourMarkerMap(def, markers) {
    const container = document.querySelector('#tourMarkerMap');
    if (!container || typeof L === 'undefined' || container._leaflet_id) return;
    const colors = {Kai:'#2563eb',Ibo:'#16a34a',Riccardo:'#dc2626'};
    const order = {Kai:0,Ibo:1,Riccardo:2};
    const valid = markers.filter(marker => Number.isFinite(Number(marker.lat)) && Number.isFinite(Number(marker.lng))).slice().sort((a,b) => (order[a.driver] ?? 9) - (order[b.driver] ?? 9));
    if (!valid.length) return;
    tourMarkerMap = L.map(container,{scrollWheelZoom:false,zoomControl:true});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap-Mitwirkende'}).addTo(tourMarkerMap);
    const bounds = [];
    valid.forEach(marker => {
      const lat = Number(marker.lat), lng = Number(marker.lng), street = def.streets[Number(marker.sectionIndex)]?.name || `Abschnitt ${Number(marker.sectionIndex)+1}`;
      const photo = marker.photo ? `<img class="map-popup-photo" src="photo.php?file=${encodeURIComponent(marker.photo)}" alt="Plakatfoto">` : '';
      const popup = `${photo}<strong>${esc(marker.driver || 'Fahrer unbekannt')}</strong><span>${esc(street)}</span><small>${marker.capturedAt ? new Date(marker.capturedAt).toLocaleString('de-DE') : ''} · ±${Math.round(Number(marker.accuracy)||0)} m</small>${marker.note ? `<p>${esc(marker.note)}</p>` : ''}`;
      L.circleMarker([lat,lng],{radius:9,color:'#fff',weight:3,fillColor:colors[marker.driver]||'#64748b',fillOpacity:1}).addTo(tourMarkerMap).bindPopup(popup,{maxWidth:240});
      bounds.push([lat,lng]);
    });
    if (bounds.length === 1) tourMarkerMap.setView(bounds[0],17);
    else tourMarkerMap.fitBounds(bounds,{padding:[28,28],maxZoom:17});
    setTimeout(() => tourMarkerMap?.invalidateSize(),100);
  }

  function streetCard(def, street, index, section) {
    const markerCount = state.tours[String(def.id)].markers.filter(marker => Number(marker.sectionIndex) === index).length;
    return `<section class="street-card ${section.done ? 'done' : ''}" data-section="${index}"><div class="street-head"><div><span class="kicker">Abschnitt ${index+1}</span><h3>${esc(street.name)}</h3><p>Soll: ${street.target}${markerCount ? ` · ${markerCount} mit Foto` : ''}</p></div><a class="map-link" href="${streetUrl(street.name)}" target="_blank" rel="noopener" aria-label="${esc(street.name)} in Karte öffnen">Karte ↗</a></div><button class="capture-button" type="button" data-capture>◎ Plakat + Foto erfassen</button><div class="count-control"><button type="button" data-count="-1" aria-label="Ein Plakat abziehen">−</button><output>${section.count}</output><button type="button" data-count="1" aria-label="Ein Plakat hinzufügen">+</button></div><div class="street-actions"><button class="secondary-button" type="button" data-problem>Problem melden</button><button class="done-button" type="button" data-done>${section.done ? '✓ Fertig' : 'Abschnitt fertig'}</button></div>${section.problems.length ? `<span class="problem-badge">${section.problems.length} Meldung${section.problems.length === 1 ? '' : 'en'}</span>` : ''}</section>`;
  }

  function markerCard(marker, def) {
    const street = def.streets[Number(marker.sectionIndex)]?.name || `Abschnitt ${Number(marker.sectionIndex) + 1}`;
    const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${marker.lat},${marker.lng}`)}`;
    const photo = marker.photo ? `<a href="photo.php?file=${encodeURIComponent(marker.photo)}" target="_blank" rel="noopener"><img src="photo.php?file=${encodeURIComponent(marker.photo)}" alt="Plakatfoto" loading="lazy"></a>` : '<div class="pending-photo">Wartet auf Upload</div>';
    return `<article class="marker-card">${photo}<div><strong>${esc(street)}</strong><span>${Number(marker.lat).toFixed(6)}, ${Number(marker.lng).toFixed(6)}</span><small>±${Math.round(Number(marker.accuracy) || 0)} m · ${esc(marker.driver || 'Fahrer unbekannt')}</small><a href="${map}" target="_blank" rel="noopener">Standort öffnen ↗</a></div></article>`;
  }

  function bindTourControls(def) {
    dom.content.querySelectorAll('.street-card').forEach(card => {
      const index = Number(card.dataset.section);
      card.querySelectorAll('[data-count]').forEach(button => button.addEventListener('click', () => {
        const section = state.tours[String(def.id)].sections[index];
        section.count = Math.max(0, section.count + Number(button.dataset.count));
        if (state.tours[String(def.id)].status === 'open') state.tours[String(def.id)].status = 'active';
        queueTourSave(def.id); renderTour();
      }));
      card.querySelector('[data-done]').addEventListener('click', () => {
        const section = state.tours[String(def.id)].sections[index];
        section.done = !section.done;
        if (state.tours[String(def.id)].status === 'open') state.tours[String(def.id)].status = 'active';
        queueTourSave(def.id); renderTour();
      });
      card.querySelector('[data-problem]').addEventListener('click', () => openProblem(def, index));
      card.querySelector('[data-capture]').addEventListener('click', () => openCapture(def, index));
    });
  }

  function openTour(id) {
    activeTourId = id;
    const tourState = state.tours[String(id)];
    if (tourState.status === 'open') { tourState.status = 'active'; queueTourSave(id); }
    dom.overview.classList.remove('active'); dom.tour.classList.add('active'); dom.bottom.classList.remove('hidden');
    renderTour(); window.scrollTo(0,0); history.replaceState(null,'',`#tour-${id}`);
  }

  function closeTour() {
    if (tourMarkerMap) { tourMarkerMap.remove(); tourMarkerMap = null; }
    activeTourId = null; dom.tour.classList.remove('active'); dom.overview.classList.add('active'); dom.bottom.classList.add('hidden');
    renderOverview(); window.scrollTo(0,0); history.replaceState(null,'',window.location.pathname);
  }

  function openProblem(def, index) {
    activeProblem = { tourId: def.id, index };
    selectedProblem = '';
    dom.problemStreet.textContent = def.streets[index].name;
    dom.problemNote.value = '';
    dom.problemOptions.innerHTML = problemTypes.map(type => `<button type="button" class="problem-option" data-type="${esc(type)}">${esc(type)}</button>`).join('');
    dom.problemOptions.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      selectedProblem = button.dataset.type; dom.problemOptions.querySelectorAll('button').forEach(item => item.classList.toggle('selected', item === button));
    }));
    dom.problemDialog.showModal();
  }

  function locationPermissionSteps() {
    const android = /Android/i.test(navigator.userAgent);
    return android
      ? ['Links neben der Adresse auf das Seiteninfo-Symbol tippen.', '„Berechtigungen“ öffnen.', 'Bei „Standort“ die Einstellung „Zulassen“ wählen.', 'Falls dort nichts angezeigt wird: Chrome-Menü → Einstellungen → Website-Einstellungen → Standort öffnen.']
      : ['Links in der Safari-Adressleiste auf das Seitenmenü tippen.', '„Mehr“ und anschließend die Website-Einstellungen öffnen.', 'Bei „Standort“ die Einstellung „Erlauben“ oder „Fragen“ wählen.', 'Falls nötig: iPhone-Einstellungen → Apps → Safari → Standort öffnen.'];
  }

  function showLocationPermissionHelp() {
    dom.locationSteps.innerHTML = locationPermissionSteps().map(step => `<li>${esc(step)}</li>`).join('');
    dom.locationHelp.classList.remove('hidden');
    dom.retryLocation.textContent = 'Nach Freigabe erneut prüfen';
  }

  async function prepareLocationPermission() {
    dom.locationHelp.classList.add('hidden');
    dom.retryLocation.textContent = 'Standortfreigabe anfragen';
    if (!navigator.geolocation) {
      dom.gpsStatus.className = 'gps-status error'; dom.gpsStatus.textContent = 'Standortermittlung wird von diesem Browser nicht unterstützt.'; return;
    }
    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({name:'geolocation'});
        if (permission.state === 'denied') {
          dom.gpsStatus.className = 'gps-status error'; dom.gpsStatus.textContent = 'Standortfreigabe ist für diese Seite blockiert.'; showLocationPermissionHelp(); return;
        }
        permission.onchange = () => { if (permission.state === 'granted') locatePhone(); else if (permission.state === 'denied') showLocationPermissionHelp(); };
      }
    } catch (_) {}
    locatePhone();
  }

  function locatePhone() {
    capturePosition = null;
    dom.locationHelp.classList.add('hidden');
    dom.retryLocation.textContent = 'Standort erneut bestimmen';
    dom.gpsStatus.className = 'gps-status loading';
    dom.gpsStatus.textContent = 'Standort wird ermittelt …';
    if (!navigator.geolocation) {
      dom.gpsStatus.className = 'gps-status error'; dom.gpsStatus.textContent = 'Standortermittlung wird nicht unterstützt.'; return;
    }
    navigator.geolocation.getCurrentPosition(position => {
      capturePosition = {lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy};
      dom.locationHelp.classList.add('hidden');
      dom.gpsStatus.className = `gps-status ${position.coords.accuracy > 35 ? 'warning' : 'success'}`;
      dom.gpsStatus.textContent = `Standort gefunden · Genauigkeit ±${Math.round(position.coords.accuracy)} Meter${position.coords.accuracy > 35 ? ' – erneute Messung empfohlen' : ''}`;
    }, error => {
      dom.gpsStatus.className = 'gps-status error';
      dom.gpsStatus.textContent = error.code === 1 ? 'Standortfreigabe wurde nicht erlaubt oder ist blockiert.' : 'Standort konnte nicht bestimmt werden.';
      if (error.code === 1) showLocationPermissionHelp();
    }, {enableHighAccuracy:true,timeout:15000,maximumAge:5000});
  }

  function testPhoneLocation() {
    testPosition = null;
    updateTestSaveButton();
    dom.testLocationHelp.classList.add('hidden');
    dom.testLocationStatus.className = 'gps-status loading';
    dom.testLocationStatus.textContent = 'Standort wird ermittelt …';
    dom.testLocation.textContent = 'Standort erneut testen';
    if (!navigator.geolocation) {
      dom.testLocationStatus.className = 'gps-status error';
      dom.testLocationStatus.textContent = 'Standortermittlung wird von diesem Browser nicht unterstützt.';
      return;
    }
    navigator.geolocation.getCurrentPosition(position => {
      const accuracy = Math.round(position.coords.accuracy);
      testPosition = {lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy};
      dom.testLocationStatus.className = `gps-status ${accuracy > 35 ? 'warning' : 'success'}`;
      dom.testLocationStatus.textContent = `✓ Standort funktioniert · Genauigkeit ±${accuracy} Meter${accuracy > 35 ? ' – draußen bitte noch einmal testen' : ''}`;
      updateTestSaveButton();
    }, error => {
      dom.testLocationStatus.className = 'gps-status error';
      dom.testLocationStatus.textContent = error.code === 1 ? 'Standortfreigabe wurde nicht erlaubt oder ist blockiert.' : 'Standort konnte nicht bestimmt werden. Bitte draußen erneut testen.';
      if (error.code === 1) {
        dom.testLocationSteps.innerHTML = locationPermissionSteps().map(step => `<li>${esc(step)}</li>`).join('');
        dom.testLocationHelp.classList.remove('hidden');
        dom.testLocation.textContent = 'Nach Freigabe erneut testen';
      }
    }, {enableHighAccuracy:true,timeout:15000,maximumAge:0});
  }

  function updateTestSaveButton() {
    const ready = Boolean(dom.driver.value && testPosition && testPhotoBlob && navigator.onLine);
    dom.testSave.disabled = !ready;
    if (!dom.driver.value) dom.testSave.title = 'Bitte zuerst oben einen Fahrer auswählen.';
    else if (!testPosition) dom.testSave.title = 'Bitte zuerst den Standort testen.';
    else if (!testPhotoBlob) dom.testSave.title = 'Bitte zuerst die Kamera testen.';
    else if (!navigator.onLine) dom.testSave.title = 'Für den Speichertest wird eine Internetverbindung benötigt.';
    else dom.testSave.title = '';
  }

  async function saveTestEvidence() {
    updateTestSaveButton();
    if (dom.testSave.disabled) return;
    dom.testSave.disabled = true;
    dom.testSave.textContent = 'Test wird gespeichert …';
    dom.testSaveStatus.className = 'test-save-status loading';
    dom.testSaveStatus.textContent = 'Foto und Standort werden an den Testbereich des Servers übertragen.';
    try {
      const form = new FormData();
      form.append('driver',dom.driver.value);
      form.append('lat',String(testPosition.lat));
      form.append('lng',String(testPosition.lng));
      form.append('accuracy',String(testPosition.accuracy));
      form.append('capturedAt',now());
      form.append('photo',testPhotoBlob,'test.jpg');
      const response = await fetch('test-upload.php',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':csrf},body:form});
      const responseText = await response.text();
      let data = {};
      try { data = JSON.parse(responseText); } catch (_) {}
      if (!response.ok || !data.ok) {
        const detail = data.message || (response.status === 404 ? 'test-upload.php wurde auf dem Server nicht gefunden.' : `Keine gültige Serverantwort (HTTP ${response.status}).`);
        throw new Error(detail);
      }
      dom.testSaveStatus.className = 'test-save-status success';
      dom.testSaveStatus.textContent = `✓ Speichern funktioniert · ${data.driver} · ${new Date(data.savedAt).toLocaleString('de-DE')} · Testdaten getrennt von den Touren gespeichert`;
    } catch (error) {
      dom.testSaveStatus.className = 'test-save-status error';
      dom.testSaveStatus.textContent = `Speichertest fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`;
    } finally {
      dom.testSave.textContent = 'Testnachweis erneut speichern';
      updateTestSaveButton();
    }
  }

  function openCapture(def, index) {
    captureTarget = {tourId:def.id,index}; captureBlob = null;
    if (capturePreviewUrl) URL.revokeObjectURL(capturePreviewUrl);
    capturePreviewUrl = ''; dom.capturePreview.classList.add('hidden'); dom.capturePhoto.value = ''; dom.captureNote.value = '';
    dom.captureError.classList.add('hidden'); dom.captureStreet.textContent = def.streets[index].name;
    dom.captureDialog.showModal(); prepareLocationPermission();
  }

  async function compressPhoto(file) {
    const image = new Image();
    const source = URL.createObjectURL(file);
    try {
      await new Promise((resolve,reject) => { image.onload=resolve; image.onerror=reject; image.src=source; });
      const max = 1280, scale = Math.min(1, max / Math.max(image.naturalWidth,image.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width = Math.round(image.naturalWidth*scale); canvas.height = Math.round(image.naturalHeight*scale);
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      return await new Promise((resolve,reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Komprimierung fehlgeschlagen')), 'image/jpeg', .78));
    } finally { URL.revokeObjectURL(source); }
  }

  async function uploadCapture(record) {
    const form = new FormData();
    Object.entries(record.meta).forEach(([key,value]) => form.append(key,String(value ?? '')));
    form.append('photo',record.photo,`${record.id}.jpg`);
    const response = await fetch('upload.php',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':csrf},body:form});
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || 'Upload fehlgeschlagen');
    return data.marker;
  }

  async function syncCaptures() {
    if (!navigator.onLine) { await updatePendingNotice(); return; }
    let records = [];
    try { records = await pendingOperation('getAll'); } catch (_) { return; }
    for (const record of records) {
      try {
        const serverMarker = await uploadCapture(record);
        await pendingOperation('delete',record.id);
        const markers = state.tours[String(record.meta.tourId)]?.markers || [];
        const local = markers.find(marker => marker.id === record.id);
        if (local) Object.assign(local,serverMarker,{pending:false}); else markers.push(serverMarker);
      } catch (_) { break; }
    }
    storeLocal(); await updatePendingNotice();
    if (activeTourId) renderTour(); else renderOverview();
  }

  function openFinish() {
    const def = definitions.find(item => item.id === activeTourId);
    const tourState = state.tours[String(activeTourId)];
    const unfinished = def.streets.filter((_, index) => !tourState.sections[index].done);
    const count = tourCompleted(def), difference = def.target - count;
    dom.finishCheck.innerHTML = `<div class="check-list"><div class="check-item ${unfinished.length ? 'warn' : ''}">${unfinished.length ? `⚠ ${unfinished.length} Abschnitt(e) noch nicht als fertig markiert` : '✓ Alle Abschnitte markiert'}</div><div class="check-item ${difference !== 0 ? 'warn' : ''}">${difference === 0 ? '✓ Sollmenge erreicht' : `⚠ ${Math.abs(difference)} Plakate ${difference > 0 ? 'unter' : 'über'} Soll`}</div><div class="check-item">${count} von ${def.target} Plakaten dokumentiert</div></div>`;
    finishNeedsNote = unfinished.length > 0 || difference !== 0;
    dom.finishNote.value = tourState.finishNote || '';
    dom.finishNote.style.borderColor = '';
    dom.finishDialog.showModal();
  }

  async function syncAll() {
    dom.sync.disabled = true; dom.sync.textContent = '…';
    try {
      if (!navigator.onLine) throw new Error('offline');
      await syncCaptures();
      for (const def of definitions) await saveSection('tour', state.tours[String(def.id)], def.id);
      const server = await apiRequest(); state = normalizeState(server.state); storeLocal(); fillMeta();
      activeTourId ? renderTour() : renderOverview(); setSaveLabel('Synchronisiert');
    } catch (_) { setSaveLabel('Keine Verbindung', true); }
    finally { dom.sync.disabled = false; dom.sync.textContent = '↻'; updateOnlineState(); }
  }

  function fillMeta() {
    dom.driver.value = localStorage.getItem(driverKey) || '';
  }

  function updateOnlineState() {
    dom.offline.classList.toggle('hidden', navigator.onLine);
  }

  async function init() {
    const definitionResponse = await fetch('touren.php', {cache:'no-store'});
    const definitionData = await definitionResponse.json(); definitions = definitionData.tours;
    try { const server = await apiRequest(); state = normalizeState(server.state); }
    catch (_) { state = normalizeState(localBackup()); setSaveLabel('Lokale Sicherung', true); }
    await mergePendingMarkers(); fillMeta(); renderOverview(); updateOnlineState(); await updatePendingNotice();
    if (navigator.onLine) syncCaptures();
    const hashMatch = location.hash.match(/^#tour-(\d+)$/); if (hashMatch) openTour(Number(hashMatch[1]));
  }

  dom.driver.addEventListener('change', () => { localStorage.setItem(driverKey, dom.driver.value); setSaveLabel(dom.driver.value ? `${dom.driver.value} gespeichert` : 'Bitte Fahrer auswählen'); renderOverview(); updateTestSaveButton(); });
  dom.back.addEventListener('click', closeTour); dom.finishButton.addEventListener('click', openFinish); dom.sync.addEventListener('click', syncAll);
  dom.saveProblem.addEventListener('click', event => {
    event.preventDefault(); if (!activeProblem || !selectedProblem) return;
    const section = state.tours[String(activeProblem.tourId)].sections[activeProblem.index];
    section.problems.push({type:selectedProblem,note:dom.problemNote.value.trim(),at:now()});
    queueTourSave(activeProblem.tourId); dom.problemDialog.close(); renderTour();
  });
  dom.retryLocation.addEventListener('click', locatePhone);
  dom.testLocation.addEventListener('click', testPhoneLocation);
  dom.testPhoto.addEventListener('change', async () => {
    const file = dom.testPhoto.files?.[0];
    if (!file) return;
    testPhotoBlob = null;
    updateTestSaveButton();
    dom.testPhotoStatus.className = 'test-camera-status';
    dom.testPhotoStatus.textContent = 'Testfoto wird vorbereitet …';
    try {
      testPhotoBlob = await compressPhoto(file);
      if (testPreviewUrl) URL.revokeObjectURL(testPreviewUrl);
      testPreviewUrl = URL.createObjectURL(testPhotoBlob);
      dom.testPhotoPreview.src = testPreviewUrl;
      dom.testPhotoPreview.classList.remove('hidden');
      dom.testPhotoStatus.className = 'test-camera-status success';
      dom.testPhotoStatus.textContent = `✓ Kamera funktioniert · Testfoto bereit (${Math.max(1, Math.round(testPhotoBlob.size / 1024))} KB)`;
    } catch (_) {
      dom.testPhotoStatus.className = 'test-camera-status error';
      dom.testPhotoStatus.textContent = 'Das Testfoto konnte nicht vorbereitet werden.';
    }
    updateTestSaveButton();
  });
  dom.testSave.addEventListener('click', saveTestEvidence);
  dom.capturePhoto.addEventListener('change', async () => {
    const file = dom.capturePhoto.files?.[0]; if (!file) return;
    dom.captureError.classList.add('hidden'); dom.saveCapture.disabled = true; dom.saveCapture.textContent = 'Foto wird vorbereitet …';
    try {
      captureBlob = await compressPhoto(file);
      if (capturePreviewUrl) URL.revokeObjectURL(capturePreviewUrl);
      capturePreviewUrl = URL.createObjectURL(captureBlob); dom.capturePreview.src = capturePreviewUrl; dom.capturePreview.classList.remove('hidden');
    } catch (_) { captureBlob = null; dom.captureError.textContent = 'Foto konnte nicht verarbeitet werden.'; dom.captureError.classList.remove('hidden'); }
    finally { dom.saveCapture.disabled = false; dom.saveCapture.textContent = 'Plakat speichern'; }
  });
  dom.saveCapture.addEventListener('click', async event => {
    event.preventDefault(); dom.captureError.classList.add('hidden');
    if (!capturePosition || !captureBlob || !captureTarget) {
      dom.captureError.textContent = !capturePosition ? 'Bitte auf einen gültigen Standort warten.' : 'Bitte zuerst ein Foto aufnehmen.';
      dom.captureError.classList.remove('hidden'); return;
    }
    const driver = dom.driver.value;
    if (!driver) { dom.captureError.textContent = 'Bitte zuerst in der Übersicht den Fahrer auswählen.'; dom.captureError.classList.remove('hidden'); return; }
    const id = uuid();
    const meta = {id,tourId:captureTarget.tourId,sectionIndex:captureTarget.index,lat:capturePosition.lat,lng:capturePosition.lng,accuracy:capturePosition.accuracy,capturedAt:now(),driver,note:dom.captureNote.value.trim()};
    const record = {id,meta,photo:captureBlob};
    try { await pendingOperation('put',record); }
    catch (_) { dom.captureError.textContent = 'Der lokale Fotospeicher ist nicht verfügbar.'; dom.captureError.classList.remove('hidden'); return; }
    const tourState = state.tours[String(captureTarget.tourId)];
    tourState.markers.push({...meta,pending:true});
    tourState.sections[captureTarget.index].count += 1;
    if (tourState.status === 'open') tourState.status = 'active';
    queueTourSave(captureTarget.tourId); storeLocal(); dom.captureDialog.close(); renderTour(); await updatePendingNotice(); syncCaptures();
  });
  dom.confirmFinish.addEventListener('click', event => {
    event.preventDefault();
    if (finishNeedsNote && !dom.finishNote.value.trim()) { dom.finishNote.style.borderColor = '#dc2626'; dom.finishNote.placeholder = 'Bitte Abweichung kurz begründen'; dom.finishNote.focus(); return; }
    const tourState = state.tours[String(activeTourId)];
    tourState.status = 'done'; tourState.finishNote = dom.finishNote.value.trim(); tourState.finishedAt = now();
    queueTourSave(activeTourId); dom.finishDialog.close(); renderTour();
  });
  window.addEventListener('online', () => { syncAll(); updateTestSaveButton(); }); window.addEventListener('offline', () => { updateOnlineState(); updatePendingNotice(); updateTestSaveButton(); });
  window.addEventListener('popstate', () => { if (activeTourId) closeTour(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(() => {});
  init().catch(() => { dom.groups.innerHTML = '<div class="notice">Die Einsatzdaten konnten nicht geladen werden. Bitte Seite neu öffnen.</div>'; });
})();
