/* ---------- SOHBET GÜVENLİĞİ: küfür süzgeci, şikayet ve engelleme (App Store 1.2) ----------
   - Süzgeç: sohbet mesajlarında ve oyuncu adlarında küfür yıldızlanır; girişli oyuncu küfürlü ad seçemez.
   - Şikayet: rakibin mesajına ya da adının yanındaki bayrağa dokununca; reports/<id> = {by, who, room, nm, text, t} yazılır
     (oyuncular okuyamaz, Firebase konsolundan incelenir).
   - Engelleme: engellenen oyuncunun (uid) mesajları gizlenir, odası listede görünmez, odana oturursa set başlamadan çıkarılır.
     Liste bu cihazda (tavla_block = {uid: ad}); Ayarlar'dan kaldırılabilir. */
(function(){
  'use strict';
  // kelimenin başında aranan kökler (yanlış eşleşmesi olmayanlar) ve tam kelime olarak aranan kısa sözcükler.
  // Karşılaştırma küçük harfle ve art arda tekrarlanan harfler teke indirilerek yapılır (siiiktir → siktir, yarrak → yarak).
  const ROOTS=['orospu','orosbu','siktir','sikiş','sikis','sikim','sikik','sikey','siker','sikt','yarak','yarağ','yarag','amına','amina','amcık','amcik',
    'pezevenk','kahpe','ibne','gavat','yavşak','yavsak','dalyarak','şerefsiz','serefsiz','sürtük','surtuk','kaltak','taşak','tasak','daşak','dasak','götveren','gotveren',
    'fuck','shit','bitch','cunt','asshole','bastard','motherf','nigg','fagot','whore','slut','pussy','dick'];
  const WORDS=['amk','amq','aq','mk','oç','oc','piç','pic','sik','göt','yarak','am','sg','ananı','anani','fck','wtf','stfu'];
  const norm=w=>String(w).toLocaleLowerCase('tr').replace(/(.)\1+/g,'$1');
  const isBad=w=>{const n=norm(w);return !!n&&(WORDS.includes(n)||ROOTS.some(r=>n.startsWith(norm(r))));};
  // kelimeler harf/rakam dizileri; araya nokta konmuş olanlar (s.i.k) da birleştirilip denenir
  const WRE=/[\p{L}\p{N}]+(?:[._*-][\p{L}\p{N}]+)*/gu;
  function filter(text){
    return String(text==null?'':text).replace(WRE,w=>(isBad(w)||isBad(w.replace(/[._*-]/g,'')))?'*'.repeat(Math.min(w.length,8)):w);
  }
  const bad=text=>filter(text)!==String(text==null?'':text);

  let i18ok=false;
  function addI18n(){
    if(i18ok||typeof I18N==='undefined')return;i18ok=true;
    Object.assign(I18N.tr,{mdT:'{n} hakkında',mdRep:'Şikayet et',mdBlk:'Engelle',mdUnb:'Engeli kaldır',mdRepQ:'Ne oldu?',mdR1:'Küfür ya da hakaret',mdR2:'Taciz ya da tehdit',mdR3:'Uygunsuz ad',mdR4:'Spam ya da hile',
      mdRepOk:'Şikayetin alındı. 24 saat içinde inceleyip gerekirse oyuncuyu engelleyeceğiz.',mdBlkQ:'{n} engellensin mi?',mdBlkP:'Mesajlarını görmezsin, odası listende çıkmaz, odana giremez.',
      mdBlkOk:'{n} engellendi.',mdList:'Engellenen oyuncular',mdNone:'Engellediğin oyuncu yok.',mdName:'Bu ad uygun değil, başka bir ad seç.',mdMsg:'Mesaj: “{m}”',mdFlag:'Şikayet et ya da engelle'});
    Object.assign(I18N.en,{mdT:'About {n}',mdRep:'Report',mdBlk:'Block',mdUnb:'Unblock',mdRepQ:'What happened?',mdR1:'Swearing or insults',mdR2:'Harassment or threats',mdR3:'Inappropriate name',mdR4:'Spam or cheating',
      mdRepOk:'Thanks, we got your report. We review reports within 24 hours and block the player if needed.',mdBlkQ:'Block {n}?',mdBlkP:'You won\'t see their messages, their room won\'t appear in your list and they can\'t join your room.',
      mdBlkOk:'{n} is blocked.',mdList:'Blocked players',mdNone:'You haven\'t blocked anyone.',mdName:'This name isn\'t allowed, pick another one.',mdMsg:'Message: “{m}”',mdFlag:'Report or block'});
  }
  const t=(k,p)=>{addI18n();return i18(k,p);};

  /* ---------- engelleme ---------- */
  const list=()=>{const v=lsGet('tavla_block',{});return v&&typeof v==='object'?v:{};};
  const blocked=uid=>!!uid&&Object.prototype.hasOwnProperty.call(list(),uid);
  function block(uid,name){
    if(!uid||uid===TOKEN)return;
    const l=list();l[uid]=String(name||'').slice(0,14);lsSet('tavla_block',l);
    after();
  }
  function unblock(uid){const l=list();delete l[uid];lsSet('tavla_block',l);after();}
  // engel değişince: sohbet, oda listesi ve (kurucuysak) odaya oturmuş engelli rakip
  function after(){
    try{if(typeof chatPaint==='function')chatPaint();}catch(e){}
    try{if(typeof lbPaint==='function')lbPaint();}catch(e){}
    paint();
    guard();
  }
  // kurucu: engellenen oyuncu set başlamadan odaya oturduysa çıkarılır
  function guard(){
    try{if(G.mode==='online'&&G.me===1&&G.seats&&G.seats.k&&!G.started&&blocked(G.seats.k))kickOpp();}catch(e){}
  }

  /* ---------- şikayet ---------- */
  async function report(uid,name,text,why){
    const r={by:TOKEN,who:String(uid||''),room:String(G.code||''),nm:String(name||'').slice(0,14),text:String(text||'').slice(0,200),why,t:Date.now()};
    try{if(DB)await DB.collection('reports').add(r);}catch(e){}
  }

  /* ---------- rakip menüsü: şikayet et / engelle ---------- */
  function sheet(uid,name,text){
    if(!uid||uid===TOKEN)return;
    const q=text?`<p class="mdQ">${escH(t('mdMsg',{m:text}))}</p>`:'';
    showOverlay(`<h2>${escH(t('mdT',{n:name||i18('opp')}))}</h2>${q}<button class="primary" id="mdRep">🚩 ${escH(t('mdRep'))}</button>`+
      (blocked(uid)?`<button id="mdUnb">${escH(t('mdUnb'))}</button>`:`<button id="mdBlk">⛔ ${escH(t('mdBlk'))}</button>`)+`<button id="ovNo">${escH(i18('close'))}</button>`);
    $('#ovNo').onclick=()=>{$('#overlay').hidden=true;};
    $('#mdRep').onclick=()=>{
      showOverlay(`<h2>${escH(t('mdRepQ'))}</h2>${['mdR1','mdR2','mdR3','mdR4'].map(k=>`<button class="mdWhy" data-w="${k}">${escH(t(k))}</button>`).join('')}<button id="ovNo">${escH(i18('cancel2'))}</button>`);
      $('#ovNo').onclick=()=>{$('#overlay').hidden=true;};
      document.querySelectorAll('.mdWhy').forEach(b=>b.onclick=()=>{
        report(uid,name,text,b.dataset.w);
        showOverlay(`<h2>🚩 ${escH(t('mdRep'))}</h2><p>${escH(t('mdRepOk'))}</p>`+(blocked(uid)?'':`<button id="mdBlk">⛔ ${escH(t('mdBlk'))}</button>`)+`<button class="primary" id="ovOk">${escH(i18('close'))}</button>`);
        const bb=$('#mdBlk');if(bb)bb.onclick=()=>askBlock(uid,name);
      });
    };
    const bb=$('#mdBlk');if(bb)bb.onclick=()=>askBlock(uid,name);
    const ub=$('#mdUnb');if(ub)ub.onclick=()=>{unblock(uid);$('#overlay').hidden=true;};
  }
  function askBlock(uid,name){
    const n=name||i18('opp');
    showOverlay(`<h2>${escH(t('mdBlkQ',{n}))}</h2><p>${escH(t('mdBlkP'))}</p><button class="primary acDanger" id="ovOk">⛔ ${escH(t('mdBlk'))}</button><button id="ovNo">${escH(i18('cancel2'))}</button>`,()=>{
      block(uid,n);flash(t('mdBlkOk',{n}),3000);
    });
    $('#ovNo').onclick=()=>{$('#overlay').hidden=true;};
  }
  // Ayarlar: engellenen oyuncular listesi (yalnız varsa görünür)
  function paint(){
    const s=$('#mdSet');if(!s)return;
    const l=list(),ks=Object.keys(l);
    s.hidden=!ks.length;if(!ks.length)return;
    s.querySelector('.ol').textContent=t('mdList');
    const b=s.querySelector('.mdB');b.textContent='';
    for(const k of ks){
      const r=document.createElement('div');r.className='mdRow';
      const n=document.createElement('span');n.textContent=UP(l[k])||i18('opp');
      const x=document.createElement('button');x.type='button';x.textContent=t('mdUnb');x.onclick=()=>{unblock(k);paint();};
      r.append(n,x);b.appendChild(r);
    }
  }
  function init(){
    addI18n();
    const css=document.createElement('style');
    css.textContent=`
.cm.them{cursor:pointer}
.mdQ{font-size:14px;color:var(--muted);overflow-wrap:anywhere}
.mdWhy{width:100%}
#mdSet[hidden]{display:none}#mdSet .mdB{display:flex;flex-direction:column;gap:6px}
.mdRow{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:14px}.mdRow button{min-height:32px;padding:0 12px;font-size:13px}`;
    document.head.appendChild(css);
    const ac=$('#acSet');
    if(ac&&!$('#mdSet')){const d=document.createElement('div');d.className='opts';d.id='mdSet';d.hidden=true;d.innerHTML='<div class="og"><span class="ol"></span><div class="mdB"></div></div>';ac.after(d);}
    paint();
    // online'da rakibin adına ya da avatarına dokununca da şikayet et / engelle
    const op=document.querySelector('#play .ap.op');
    if(op){op.style.cursor='pointer';op.addEventListener('click',()=>{
      if(G.mode!=='online'||!G.seats)return;const u=G.seats[G.me===1?'k':'w'];if(u)sheet(u,oppName(),'');});}
  }
  window.MOD={filter,bad,blocked,block,unblock,report,sheet,guard,paint,init};
})();
