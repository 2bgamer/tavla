const V='tavla-202610281800';
const CORE=['./','index.html','test-admin.js','account.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','theme/themes.css','theme/themes.js','assets/avatars.js','audio/foley.js','assets/sfx/manifest.json','assets/sfx/kirik-coklu.mp3','assets/home/theme-cards/neon.webp','assets/home/theme-cards/sunset.webp','assets/home/theme-cards/poker.webp','assets/home/theme-cards/arcade.webp','assets/neon/board-field.svg','assets/neon/board-frame.svg','assets/neon/checker-light.svg','assets/neon/checker-dark.svg','assets/neon/btn-roll.svg','assets/neon/adv-bar-track.svg','assets/neon/avatar-ring.svg','assets/neon/fx-closed-point.svg','assets/sunset/board-field.svg','assets/sunset/board-frame.svg','assets/sunset/checker-light.svg','assets/sunset/checker-dark.svg','assets/sunset/btn-roll.svg','assets/sunset/adv-bar-track.svg','assets/sunset/avatar-ring.svg','assets/sunset/fx-closed-point.svg','assets/poker/board-field.svg','assets/poker/board-frame.svg','assets/poker/checker-light.svg','assets/poker/checker-dark.svg','assets/poker/btn-roll.svg','assets/poker/adv-bar-track.svg','assets/poker/avatar-ring.svg','assets/poker/fx-closed-point.svg','assets/arcade/board-field.svg','assets/arcade/board-frame.svg','assets/arcade/checker-light.svg','assets/arcade/checker-dark.svg','assets/arcade/btn-roll.svg','assets/arcade/adv-bar-track.svg','assets/arcade/avatar-ring.svg','assets/arcade/fx-closed-point.svg','assets/neon/points.svg','assets/sunset/points.svg','assets/poker/points.svg','assets/arcade/points.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(u.hostname.endsWith('firebasedatabase.app'))return;
  if(u.origin===location.origin){
    // önce ağ (güncelleme gelsin), olmazsa önbellek. GitHub Pages 10 dk önbellek süresi verir:
    // tarayıcı önbelleği atlanıp sunucuya sorulur (değişmediyse kısa 304 yanıtı gelir)
    const net=r.mode==='navigate'?fetch(r.url,{cache:'no-cache',credentials:'same-origin'}):fetch(r,{cache:'no-cache'});
    e.respondWith(net.then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
  }else if(u.hostname.includes('fonts.g')){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res;})));
  }
});
