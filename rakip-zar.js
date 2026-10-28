/* ---------- RAKİP ZAR: ikinci oyun modu (yalnız online oda) ----------
   Oda kurulurken "Oyun modu: Rakip Zar" seçilirse odaya rz:1 yazılır. Bu odada her atışta zarı rakip seçer:
   sırası gelen oyuncunun rakibine 9 sn'lik seçim penceresi açılır (çift zar seçilemez), Tamam'a basınca seçim odaya pk={k,d} yazılır
   (k: atışın anahtarı set:sıra:atış sayısı, d: iki zar). Sırası gelen oyuncunun zarı bu değerlerle kendiliğinden atılır.
   9 sn içinde seçilmezse zar normal rastgele atılır. Açılış zarı (kim başlar) her zaman rastgeledir.
   Atacak oyuncunun kırık taşı varsa ya da toplamaya başladıysa (bütün taşları evde ya da toplanmış taşı var) seçim olmaz, zarı normal atar.
   Bu modda XP kazanılmaz ve kaybedilmez (index.html xpAward). */
(function(){
  'use strict';
  const PICK_MS=9000,GRACE=900; // GRACE: seçimin ağdan gelmesi için atan tarafın ek beklemesi
  const okPair=p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isInteger(v)&&v>=1&&v<=6)&&p[0]!==p[1]; // çift zar seçilemez
  let pk=null;   // odadaki son seçim
  let win=null;  // açık atış penceresi {key,mine,t0,go,free,taken,miss}
  let sheet=null,sel=[0,0],lastSec=-1;

  const css=document.createElement('style');
  css.textContent=`
#home .og .rzn{grid-column:1/-1;display:block;font-size:12px;line-height:1.35;color:var(--fg);opacity:.75;padding:0 2px 2px}
#home .og .rzn[hidden]{display:none}
.rmt i.rzt{border-color:var(--accent);color:var(--accent)}
#rzSheet{position:fixed;left:0;right:0;bottom:0;z-index:45;display:flex;justify-content:center;pointer-events:none}
#rzSheet .in{pointer-events:auto;width:100%;max-width:440px;box-sizing:border-box;background:var(--surface);color:var(--fg);border:1px solid var(--line);border-bottom:0;
  border-radius:18px 18px 0 0;padding:12px 14px max(12px,env(safe-area-inset-bottom,0px));box-shadow:0 -6px 24px rgba(0,0,0,.35);font:14px/1.35 system-ui,sans-serif}
#rzSheet .rzh{display:flex;align-items:center;gap:8px}
#rzSheet .rzh .rzx{flex:1;min-width:0}
#rzSheet .rzh b{display:block;font-family:var(--display,inherit);font-size:17px}
#rzSheet .rzh small{display:block;color:var(--muted);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#rzSheet .rzc{flex:none;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 20px/1 system-ui,sans-serif;
  background:var(--accent);color:var(--accent-fg)}
#rzSheet .rzc.hot{background:#ff4d3d;color:#fff}
#rzSheet .rzb{height:5px;border-radius:3px;background:var(--line);margin:9px 0 10px;overflow:hidden}
#rzSheet .rzb i{display:block;height:100%;width:100%;background:var(--accent);transform-origin:left center}
#rzSheet .row{display:flex;gap:6px;margin-bottom:7px}
#rzSheet .row button{flex:1;min-width:0;height:46px;padding:0;border-radius:10px;border:1px solid var(--line);background:var(--row,rgba(0,0,0,.18));color:var(--fg);
  display:flex;align-items:center;justify-content:center;font:800 22px/1 system-ui,sans-serif;font-variant-numeric:tabular-nums}
#rzSheet .row button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:var(--accent-fg)}
#rzSheet .ok{display:block;width:100%;height:46px;margin-top:4px;border-radius:12px;border:0;background:var(--accent);color:var(--accent-fg);font:800 16px system-ui,sans-serif}
#rzSheet .ok:disabled{opacity:.45}
#rzSheet .row button:disabled{opacity:.25}
:root[data-theme=arcade] #home .og .rzn{color:#111}
:root[data-theme=arcade] #rzSheet .row button:not([aria-pressed=true]){background:#fff;color:#111;border-color:#000}`;
  document.head.appendChild(css);

  const rolls=()=>(G.hl||[]).reduce((n,r)=>n+(r&&r.w?1:0)+(r&&r.k?1:0),0);
  // zarın atılmayı beklediği an: online Rakip Zar odası, set sürüyor, açılış zarı ve geri sayım bitti, sıradaki henüz atmadı
  function ctx(){
    if(G.mode!=='online'||!G.rz||!G.loaded||!G.started||G.over||G.rolled||G.op||!G.st)return null;
    if(cdOn()||opHeld()||doorsClosed(G.st,G.turn))return null;
    if(G.st.bar[K(G.turn)]>0||G.st.off[K(G.turn)]>0||allHome(G.st,G.turn))return null; // kırık taş ya da toplama: normal zar
    return {key:G.gid+':'+G.turn+':'+rolls(),mine:G.turn===G.me};
  }
  const left=()=>win?Math.max(0,PICK_MS-(Date.now()-win.t0)):0;
  const fmt=d=>d[0]+'-'+d[1];
  const roll=()=>doRoll(98+Math.random()*240,56+Math.random()*288);

  function openSheet(){
    closeSheet();sel=[0,0];
    const el=document.createElement('div');el.id='rzSheet';el.setAttribute('role','dialog');el.setAttribute('aria-label',i18('gmRz'));
    el.innerHTML=`<div class="in"><div class="rzh"><span class="rzx"><b>${escH(i18('rzTag'))}</b><small>${escH(i18('rzPickT',{n:oppName()}))}</small></span><span class="rzc" aria-live="off"></span></div>
      <div class="rzb"><i></i></div>
      ${[0,1].map(i=>`<div class="row" data-i="${i}">${[1,2,3,4,5,6].map(v=>`<button type="button" data-v="${v}" aria-label="${v}" aria-pressed="false">${v}</button>`).join('')}</div>`).join('')}
      <button type="button" class="ok" disabled>${escH(i18('rzOk'))}</button></div>`;
    el.querySelectorAll('.row button').forEach(b=>b.onclick=()=>{
      const i=+b.closest('.row').dataset.i;if(b.disabled)return;sel[i]=+b.dataset.v;
      // çift zar seçilemez: bir sırada seçilen değer öbür sırada kapanır
      el.querySelectorAll('.row').forEach(r=>{const j=+r.dataset.i;r.querySelectorAll('button').forEach(x=>{const v=+x.dataset.v;x.setAttribute('aria-pressed',String(sel[j]===v));x.disabled=sel[1-j]===v;});});
      el.querySelector('.ok').disabled=!okPair(sel);
    });
    el.querySelector('.ok').onclick=send;
    document.body.appendChild(el);sheet=el;paintSheet();
  }
  function closeSheet(){if(sheet){sheet.remove();sheet=null;}}
  function paintSheet(){
    if(!sheet)return;const l=left(),c=sheet.querySelector('.rzc');
    c.textContent=String(Math.ceil(l/1000));c.classList.toggle('hot',l<=2000);
    sheet.querySelector('.rzb i').style.transform=`scaleX(${(l/PICK_MS).toFixed(3)})`;
  }
  function send(){
    const c=ctx();
    if(!c||c.mine||!win||win.key!==c.key||!okPair(sel)||!left()){closeSheet();return;}
    const d=sel.slice();win.taken=true;closeSheet();
    pushFields({pk:{k:c.key,d}});
    flash(i18('rzSent',{d:fmt(d)}),2200);
  }

  function tick(){
    const c=ctx();
    if(!c){if(win){win=null;closeSheet();if(G.mode)render();}return;}
    if(!win||win.key!==c.key){
      win={key:c.key,mine:c.mine,t0:Date.now()};lastSec=-1;
      if(c.mine)render();else openSheet();
    }
    if(c.mine){
      if(!win.go&&!win.free){
        if(pk&&pk.k===c.key){win.go=pk.d.slice();flash(i18('rzGot',{n:oppName(),d:fmt(win.go)}),2600);}
        else if(Date.now()-win.t0>=PICK_MS+GRACE){win.free=true;flash(i18('rzLate',{n:oppName()}),2600);}
      }
      if(win.go||win.free){roll();return;} // doRoll meşgulse (animasyon vb.) bir sonraki tikte yeniden dener
      const s=Math.ceil(left()/1000);if(s!==lastSec){lastSec=s;render();}
    }else if(!win.taken){
      if(!left()){win.taken=true;closeSheet();flash(i18('rzMiss'),2200);}
      else paintSheet();
    }
  }
  setInterval(tick,150);

  window.RZ={
    // her oda anlık görüntüsünde (rev'e bakılmadan): rakibin yazdığı seçim
    room(d){const p=d&&d.pk;pk=p&&typeof p.k==='string'&&okPair(p.d)?{k:p.k,d:p.d.slice()}:null;setTimeout(tick,0);},
    // kendi atışım rakibin seçimini bekliyor mu (Zar At düğmesi kapalı, doRoll atmaz)
    hold(){const c=ctx();return !!(c&&c.mine&&!(win&&win.key===c.key&&(win.go||win.free)));},
    // doRoll: rakibin seçtiği zar (yoksa null → rastgele)
    take(){const c=ctx();if(c&&c.mine&&win&&win.key===c.key&&win.go&&!win.taken){win.taken=true;return win.go.slice();}return null;},
    // doRoll: atışla birlikte odaya yazılacak alanlar (kullanılan seçim silinir)
    rolled(){return G.mode==='online'&&G.rz?{pk:null}:{};},
    label(){return i18('rzWait',{n:oppName(),s:Math.max(1,Math.ceil(left()/1000))});}
  };
})();
