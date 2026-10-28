// Web oyununu (depo kökü) Capacitor'ın paketleyeceği www/ klasörüne kopyalar.
// Testler, belgeler ve geliştirme dosyaları pakete girmez; oyun internetsiz de açılır (bilgisayara karşı).
import {cpSync,rmSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const app=dirname(fileURLToPath(import.meta.url)),root=join(app,'..'),www=join(app,'www');
const FILES=['index.html','account.js','mod.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','gizlilik.html','sartlar.html'];
const DIRS=['assets','audio','theme'];
rmSync(www,{recursive:true,force:true});mkdirSync(www,{recursive:true});
for(const f of FILES)if(existsSync(join(root,f)))cpSync(join(root,f),join(www,f));
for(const d of DIRS)cpSync(join(root,d),join(www,d),{recursive:true});
console.log('www hazır:',FILES.length+DIRS.length,'öğe');
