/* ---------- TEST MODU: Burak'ın hesabına özel elle zar seçimi ----------
   Yalnız BURAK adının sahibi olan hesapla (names/BURAK = uid, bkz. account.js) giriş yapınca kendiliğinden açılır.
   Misafir ya da başka bir hesap açamaz; şifre yoktur.
   Admin, kendi ve rakibinin (bilgisayar ya da online arkadaş) sıradaki zarını seçebilir.
   Test modu sağ alttaki 🧪 simgesiyle görünür: online odada rakibin ekranında da sürekli durur, gizli değildir.

   MAĞAZAYA GÖNDERMEDEN ÖNCE KALDIRMA:
     1) bu dosyayı sil
     2) index.html'deki <script src="test-admin.js"></script> satırını sil
     3) sw.js CORE listesindeki 'test-admin.js' girdisini sil
   index.html içindeki "window.TESTADM" kancaları dosya yokken hiçbir şey yapmaz (grep TESTADM ile bulunup silinebilir). */
(function(){
  'use strict';
  const ADMIN='BURAK',OWN='tavla_adm_uid'; // OWN: bu cihazda doğrulanmış sahibin uid'si (açılışta beklemeden göstermek için)
  const dbBase=()=>String(window.__DBURL||'https://e-tavla-default-rtdb.europe-west1.firebasedatabase.app').replace(/\/+$/,'');
  const uidNow=()=>(window.ACCT&&ACCT.user&&ACCT.user.uid)||lsGet('tavla_uid',null)||null;
  let on=false,checked;           // checked: test modu kararının verildiği uid
  // giriş yapan hesap BURAK adının sahibi mi: names/BURAK kaydı bu uid mi
  function verify(){
    const uid=uidNow();if(uid===checked)return;checked=uid;
    if(!uid){on=false;return;}
    on=lsGet(OWN,null)===uid;
    fetch(dbBase()+'/names/'+ADMIN+'.json').then(r=>r.ok?r.json():Promise.reject(r.status)).then(o=>{
      if(uidNow()!==uid)return;
      on=o===uid;lsSet(OWN,on?uid:null);paint();
    }).catch(()=>{}); // ağ hatası: bu cihazdaki önceki karar geçerli kalır
  }
  const q={};                    // yerel sıradaki zarlar: q[1] beyaz, q[-1] siyah
  const room={w:null,k:null};    // online: odaya yazılmış bekleyen zarlar (admW/admK)
  let used=null,tmSeed=0,hit=false,roomAdm=null; // roomAdm: odada test modu açık olan koltuk (admOn)        // used: bu atışta odadan alınan koltuk; tmSeed: elle seçilen atışın tohumu
  const sk=s=>s===1?'w':'k',fld=k=>'adm'+k.toUpperCase();
  const okPair=p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isInteger(v)&&v>=1&&v<=6);
  const seatName=s=>s===G.me?myName():oppName();

  const css=document.createElement('style');
  css.textContent=`
#taBtn,#taIco{position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));z-index:40;height:44px;min-width:44px;padding:0 10px;border-radius:22px;box-sizing:border-box;
  display:flex;align-items:center;justify-content:center;gap:4px;border:2px dashed #ffb300;background:#1b1408;color:#ffd54f;font:800 13px/1 system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.4)}
#taBtn[hidden],#taIco[hidden]{display:none}
#taBtn .i,#taIco .i{font-size:20px;line-height:1}
#taIco{pointer-events:none;opacity:.92}
#taSheet{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}
#taSheet .in{width:100%;max-width:420px;background:#1b1408;color:#fff3d6;border:2px dashed #ffb300;border-bottom:0;border-radius:18px 18px 0 0;
  padding:14px 16px max(14px,env(safe-area-inset-bottom,0px));font:14px/1.4 system-ui,sans-serif;box-sizing:border-box}
#taSheet h3{margin:0 0 2px;font-size:16px;color:#ffd54f}
#taSheet p{margin:0 0 10px;font-size:12px;color:#d9c79f}
#taSheet .sd{margin:10px 0}
#taSheet .sd b{display:block;margin-bottom:6px;font-size:13px}
#taSheet .row{display:flex;gap:6px;margin-bottom:6px}
#taSheet .row button{flex:1;height:38px;border-radius:9px;border:1px solid #6b5a33;background:#2b2110;color:#fff3d6;font:700 16px/1 system-ui,sans-serif;padding:0}
#taSheet .row button[aria-pressed=true]{background:#ffb300;border-color:#ffb300;color:#1b1408}
#taSheet .rnd{background:none;border:0;color:#ffd54f;font:600 12px system-ui,sans-serif;padding:2px 0;text-decoration:underline}
#taSheet .act{display:flex;gap:8px;margin-top:12px}
#taSheet .act button{flex:1;height:42px;border-radius:12px;border:1px solid #6b5a33;background:#2b2110;color:#fff3d6;font:700 14px system-ui,sans-serif}
#taSheet .act .ok{background:#ffb300;border-color:#ffb300;color:#1b1408}`;
  document.head.appendChild(css);

  // bekleyen zar: yerelde q, online'da kendi zarın q, rakibinki odada
  function pend(s){if(G.mode==='online'&&s!==G.me)return room[sk(s)];return q[s]||null;}
  function setPend(s,p){
    if(G.mode==='online'&&s!==G.me){
      room[sk(s)]=p;
      if(ROOM)ROOM.update({[fld(sk(s))]:p}).catch(()=>flash('Test zarı kaydedilemedi',3000));
    }else if(p)q[s]=p;else delete q[s];
  }

  function openSheet(){
    if(!on||!G.mode)return;
    const sel={};[G.me,-G.me].forEach(s=>{const p=pend(s);sel[s]=p?p.slice():[0,0];});
    const el=document.createElement('div');el.id='taSheet';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
    const side=s=>`<div class="sd" data-s="${s}"><b>${s===G.me?'Benim':'Rakibin'} sıradaki zarı · ${String(seatName(s)).replace(/[<&>]/g,'')}</b>
      ${[0,1].map(i=>`<div class="row" data-i="${i}">${[1,2,3,4,5,6].map(v=>`<button type="button" data-v="${v}" aria-pressed="${sel[s][i]===v}">${v}</button>`).join('')}</div>`).join('')}
      <button type="button" class="rnd">Rastgele (seçimi kaldır)</button></div>`;
    el.innerHTML=`<div class="in"><h3>🧪 Test modu · zar seçimi</h3><p>Seçilen zar o tarafın bir sonraki atışında gelir. Online odada rakibin ekranında da sağ altta 🧪 simgesi durur.</p>
      ${side(G.me)}${side(-G.me)}
      <div class="act"><button type="button" class="no">Vazgeç</button><button type="button" class="ok">Kaydet</button></div>
</div>`;
    const paintSel=()=>el.querySelectorAll('.sd').forEach(d=>{const s=+d.dataset.s;d.querySelectorAll('.row').forEach(r=>{const i=+r.dataset.i;r.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(sel[s][i]===+b.dataset.v)));});});
    el.querySelectorAll('.row button').forEach(b=>b.onclick=()=>{const s=+b.closest('.sd').dataset.s,i=+b.closest('.row').dataset.i;sel[s][i]=+b.dataset.v;
      if(!sel[s][1-i])sel[s][1-i]=+b.dataset.v;paintSel();});
    el.querySelectorAll('.rnd').forEach(b=>b.onclick=()=>{sel[+b.closest('.sd').dataset.s]=[0,0];paintSel();});
    const close=()=>{el.remove();paint();};
    el.onclick=e=>{if(e.target===el)close();};
    el.querySelector('.no').onclick=close;
    el.querySelector('.ok').onclick=()=>{
      [G.me,-G.me].forEach(s=>{const p=okPair(sel[s])?sel[s]:null,o=pend(s);if(JSON.stringify(p)!==JSON.stringify(o||null))setPend(s,p);});
      close();
    };
    document.body.appendChild(el);
  }

  function paint(){
    // düğme body'de: #play kaydırılabilir bir kutu, iOS Safari içindeki sabit (fixed) öğeyi kaydırınca kırpıp kaybedebiliyor
    verify();
    let b=document.getElementById('taBtn');
    const pl=document.getElementById('play'),show=on&&!!G.mode&&!!pl&&!pl.hidden;
    if(show&&!b){b=document.createElement('button');b.id='taBtn';b.type='button';b.setAttribute('aria-label','Test modu: zar seç');b.onclick=openSheet;document.body.appendChild(b);}
    if(b){b.hidden=!show;
      if(show){const m=pend(G.me),o=pend(-G.me);b.innerHTML='<span class="i">🧪</span>'+(m||o?(m?m.join('-'):'–')+' / '+(o?o.join('-'):'–'):'');}}
    // online: test modu açık olduğunu odaya bildir; rakip bunu sağ altta sabit simge olarak görür
    if(show&&G.mode==='online'&&ROOM&&G.loaded&&roomAdm!==myKey()){roomAdm=myKey();ROOM.update({admOn:roomAdm}).catch(()=>{roomAdm=null;});}
    let ic=document.getElementById('taIco');
    const ico=!show&&G.mode==='online'&&!!pl&&!pl.hidden&&!!roomAdm&&roomAdm!==myKey();
    if(ico&&!ic){ic=document.createElement('div');ic.id='taIco';ic.setAttribute('role','img');ic.setAttribute('aria-label','Test modu açık');ic.title='Test modu açık: rakip zarları elle seçebilir';
      ic.innerHTML='<span class="i">🧪</span>';document.body.appendChild(ic);}
    if(ic)ic.hidden=!ico;
  }

  window.TESTADM={
    // ad kutusu kancası: eski şifreli giriş kaldırıldı, ad olduğu gibi kalır
    name(v){return v;},
    // atıştan önce: bu koltuk için seçilmiş zar varsa onu ver (yoksa null → normal rastgele)
    take(s){
      used=null;
      if(G.mode==='online'){const k=sk(s),p=room[k];if(s===G.me&&okPair(p)){used=k;room[k]=null;return p.slice();}}
      if(on&&okPair(q[s])){const p=q[s];delete q[s];return p.slice();}
      return null;
    },
    // atıştan sonra (G.seed atanmışken): etiketi işaretle; online'da odaya yazılacak alanlar
    rolled(fz){
      tmSeed=fz?G.seed:0;
      if(fz)hit=true;
      const f={tm:fz?G.seed:null};if(used){f[fld(used)]=null;used=null;}
      return f;
    },
    // her oda anlık görüntüsünde (rev'e bakılmadan): bekleyen zarlar, test modu açık koltuk, son atış elle mi seçildi
    room(d){
      const ra=d.admOn==='w'||d.admOn==='k'?d.admOn:null;
      if(ra!==roomAdm){roomAdm=ra;setTimeout(paint,0);} // admOn rev'siz yazılır: onRoom render etmeyebilir
      room.w=okPair(d.admW)?d.admW:null;room.k=okPair(d.admK)?d.admK:null;
      if(d.rolled)tmSeed=d.tm|0;else tmSeed=0;
      if(tmSeed)hit=true;
    },
    paint,
    // puan sistemi: son sorgudan beri elle seçilmiş zar atıldı mı (maç puana sayılmaz)
    takeHit(){const h=hit;hit=false;return h;},
    get on(){return on;}
  };
  // ana ekrana dönüş render() çağırmaz: #play gizlenip açıldıkça düğmeyi güncelle
  const pl=document.getElementById('play');
  if(pl&&window.MutationObserver)new MutationObserver(paint).observe(pl,{attributes:true,attributeFilter:['hidden']});
  // giriş/çıkış (Firebase oturumu sonradan yüklenir) render beklemeden yakalansın
  setInterval(()=>{if(uidNow()!==checked)paint();},1000);
  // sayfa açılırken kaldığı oyun bu dosya yüklenmeden önce çizilir; sıradaki render'ı (ör. zar atışı) beklemeden düğmeyi göster
  paint();
})();
