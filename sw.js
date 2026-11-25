/* TripCraft service worker V170. NOTE: review before production deployment. */
const CACHE='tripcraft-mobile-v170';
const CORE=['./','./index.html','./index-en.html','./tripcraft-config.js','./tripcraft-v160.css','./tripcraft-v170.css','./tripcraft-v160.js','./tripcraft-v170.js','./tripcraft-data.js','./assets/tripcraft-logo.png','./icons/tripcraft-header-logo.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tripcraft-mobile-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  // Pages, config and all app code: always try the network first so updates show immediately.
  const networkFirst=req.mode==='navigate'||/\.html$|tripcraft-[\w-]+\.(?:js|css)$|sw\.js$/.test(url.pathname);
  if(networkFirst){event.respondWith(fetch(req).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));}return r;}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));return;}
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));}return r;})));
});
