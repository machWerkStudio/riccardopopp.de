const CACHE='berlin-einsatz-v10';
const ASSETS=['./styles.css?v=4','./vendor/leaflet/leaflet.css?v=1','./vendor/leaflet/leaflet.js?v=1','./overrides.css?v=10','./app.js?v=10','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||(url.pathname.endsWith('.php')&&!url.pathname.endsWith('/touren.php'))) return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));
});
