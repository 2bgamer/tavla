/* ---------- HESAP: Google ya da e-posta bağlantısıyla giriş (Firebase Authentication) ----------
   Giriş zorunlu değil: misafir oyuncunun adı, avatarı ve puanı (tavla_name/tavla_av/tavla_xp) yalnız bu cihazda durur.
   Giriş yapılınca profil RTDB'de users/<uid> altına yazılır: {n: ad, av: avatar, xp: puan kaydı, t: son değişiklik zamanı}.
   - Hesapta profil yoksa cihazdaki profil hesaba aktarılır.
   - Hesapta profil varsa hesaptaki geçerli olur (yeni girişte her zaman, sonraki açılışlarda daha yeniyse).
   - Çıkış yapınca bu cihazdaki profil silinir (hesapta saklı kalır), oyun misafir olarak baştan başlar.
   Misafir ad seçemez: GUEST ve 4 rakam (GUEST4821) adıyla oynar; ad seçmek için giriş yapar.
   Giriş yapanın adı tekildir: names/<AD> = uid ile ona ayrılır, başkası alamaz. BURAK = Burak = burak aynı ad sayılır; GUEST ile başlayan adlar misafirlere ayrılmıştır.
   Firebase SDK (assets/fb) yalnız gerektiğinde yüklenir: giriş yapılmışsa, giriş düğmesine basılınca ya da e-posta bağlantısıyla açılınca.
   Online oda/davet akışı hesaptan bağımsızdır (oyuncu kimliği tavla_tok). */
(function(){
  'use strict';
  const CFG={apiKey:'AIzaSyBZeM1Rbted6Totu61GCN-sp6JqREq2oGc',authDomain:'e-tavla.firebaseapp.com',
    databaseURL:'https://e-tavla-default-rtdb.europe-west1.firebasedatabase.app',projectId:'e-tavla',appId:'1:1071454930528:web:4e17047f9e3411a3b0e505'};
  const PK=['tavla_name','tavla_av','tavla_xp'];
  const ls=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}};
  const lsw=(k,v)=>{try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const linkIn=()=>/[?&]oobCode=/.test(location.search)&&/[?&]mode=signIn/.test(location.search);
  let auth=null,loading=null,user=null,applying=false,pushT=null,fresh=false,ready=false;

  let i18ok=false;
  function addI18n(){
    if(i18ok||typeof I18N==='undefined')return;i18ok=true;
    Object.assign(I18N.tr,{acG:'Google ile devam et',acM:'E-posta ile devam et',acOr:'veya misafir olarak',acT:'Hesap',
      acGuest:'Misafir · puanın yalnız bu cihazda',acIn:'{e}',acVia:'{p} ile giriş yapıldı',acOut:'Çıkış yap',acHome:'Giriş yap, adını seç, puanın kaybolmasın',
      acMT:'E-posta ile giriş',acMP:'Adresine bir giriş bağlantısı gönderelim. Şifre gerekmez.',acMPh:'ornek@mail.com',acSend:'Bağlantı gönder',
      acSent:'Bağlantı gönderildi',acSentP:'{e} adresine gelen maildeki bağlantıya bu telefonda dokun. Gelmezse spam klasörüne bak.',
      acMC:'E-postanı doğrula',acMCP:'Girişi tamamlamak için bağlantıyı istediğin e-posta adresini yaz.',acGo:'Giriş yap',
      acOk:'Hesabın bağlandı',acOkP:'Puanın ve profilin artık hesabında saklanıyor; başka telefondan girince de devam eder.',
      acOutQ:'Çıkış yapılsın mı?',acOutP:'Puanın hesabında saklı kalır. Bu cihaz misafir olarak baştan başlar.',
      acErr:'Giriş yapılamadı',acErrNet:'İnternet bağlantını kontrol edip tekrar dene.',acErrMail:'Geçerli bir e-posta adresi yaz.',
      acErrLink:'Bu bağlantının süresi dolmuş ya da kullanılmış. Yeni bağlantı iste.',acErrX:'Bir sorun oldu, biraz sonra tekrar dene.',acSync:'Hesap eşitleniyor…',cancel2:'Vazgeç',acTaken:'Bu ad başka bir oyuncuya ait. Başka bir ad seç.',acNoGuest:'GUEST ile başlayan adlar misafirlere ayrılmış.',acNeed:'Masada görünecek bir ad yaz.',acProf:'Profil',acGuestF:'Misafir olarak {n} adıyla oynarsın. Kendi adını seçmek için giriş yap.',acGuestP:'Şu an misafir olarak {n} adıyla oynuyorsun. Kendi adını seçmek için giriş yap.',acPlayG:'Misafir olarak oyna'});
    Object.assign(I18N.en,{acG:'Continue with Google',acM:'Continue with email',acOr:'or as a guest',acT:'Account',
      acGuest:'Guest · your points live on this device only',acIn:'{e}',acVia:'Signed in with {p}',acOut:'Sign out',acHome:'Sign in to pick a name and keep your points',
      acMT:'Sign in with email',acMP:'We\'ll send you a sign-in link. No password needed.',acMPh:'you@mail.com',acSend:'Send link',
      acSent:'Link sent',acSentP:'Tap the link in the email sent to {e} on this phone. Check spam if it doesn\'t arrive.',
      acMC:'Confirm your email',acMCP:'Type the email address you requested the link for.',acGo:'Sign in',
      acOk:'Account connected',acOkP:'Your points and profile are now saved to your account and follow you to other phones.',
      acOutQ:'Sign out?',acOutP:'Your points stay in your account. This device starts over as a guest.',
      acErr:'Couldn\'t sign in',acErrNet:'Check your connection and try again.',acErrMail:'Enter a valid email address.',
      acErrLink:'This link has expired or was already used. Request a new one.',acErrX:'Something went wrong, try again later.',acSync:'Syncing account…',cancel2:'Cancel',acTaken:'This name belongs to another player. Pick another one.',acNoGuest:'Names starting with GUEST are reserved for guests.',acNeed:'Type the name shown at the table.',acProf:'Profile',acGuestF:'As a guest you play as {n}. Sign in to pick your own name.',acGuestP:'You\'re playing as guest {n}. Sign in to pick your own name.',acPlayG:'Play as guest'});
  }
  const t=(k,p)=>{addI18n();return i18(k,p);};

  /* ---------- SDK ---------- */
  function script(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('load '+src));document.head.appendChild(s);});}
  function load(){
    if(auth)return Promise.resolve(auth);
    if(!loading)loading=(window.firebase&&window.firebase.auth?Promise.resolve():script('assets/fb/firebase-app-compat.js').then(()=>script('assets/fb/firebase-auth-compat.js'))).then(()=>{
      const fb=window.firebase;if(!fb.apps||!fb.apps.length)fb.initializeApp(CFG);
      auth=fb.auth();auth.onAuthStateChanged(onUser);
      if(auth.getRedirectResult)auth.getRedirectResult().then(r=>{if(r&&r.user)fresh=true;}).catch(err);
      return auth;
    }).catch(e=>{loading=null;throw e;});
    return loading;
  }

  /* ---------- profil eşitleme (RTDB REST, kimlik jetonuyla) ---------- */
  const dbBase=()=>String(window.__DBURL||CFG.databaseURL).replace(/\/+$/,'');
  async function cloud(method,body){
    const tok=await user.getIdToken();
    const r=await fetch(dbBase()+'/users/'+encodeURIComponent(user.uid)+'.json?auth='+encodeURIComponent(tok),
      {method,headers:body!==undefined?{'Content-Type':'application/json'}:undefined,body:body!==undefined?JSON.stringify(body):undefined});
    if(!r.ok)throw new Error('http '+r.status);
    return r.json();
  }
  /* ---------- ad ayırma: names/<AD> = uid ---------- */
  const nk=v=>String(v||'').toLocaleUpperCase('tr').replace(/İ/g,'I').replace(/[.#$\[\]\/]/g,'_').replace(/\s+/g,' ').trim();
  async function names(k,method,body){
    const tok=method==='GET'||!user?'':'?auth='+encodeURIComponent(await user.getIdToken());
    const r=await fetch(dbBase()+'/names/'+encodeURIComponent(k)+'.json'+tok,{method,headers:body!==undefined?{'Content-Type':'application/json'}:undefined,body:body!==undefined?JSON.stringify(body):undefined});
    if(!r.ok)throw new Error('http '+r.status);
    return r.json();
  }
  // true: ad kullanılabilir (girişliyse artık bu hesabın); false: başkasına ait. Bağlantı yoksa engellemez.
  async function claim(v,old){
    const k=nk(v);if(!k)return true;
    let o;try{o=await names(k,'GET');}catch(e){return true;}
    if(o&&(!user||o!==user.uid))return false;
    if(!user||o===user.uid)return true;
    try{await names(k,'PUT',user.uid);}catch(e){
      try{const o2=await names(k,'GET');if(o2&&o2!==user.uid)return false;}catch(e2){}
      return true;
    }
    const ok=old&&nk(old);
    if(ok&&ok!==k)names(ok,'GET').then(x=>{if(x===user.uid)return names(ok,'DELETE');}).catch(()=>{});
    return true;
  }
  const isGuest=v=>/^GUEST/.test(nk(v));
  const guestName=()=>'GUEST'+(1000+Math.floor(Math.random()*9000));
  // girişli mi (SDK daha yüklenmediyse son bilinen durum)
  const signed=()=>!!(user||(!ready&&ls('tavla_uid',null)));
  function nmErr(k){const i=$('#nmIn');if(!i)return;let e=$('#nmE');if(!e){e=document.createElement('p');e.id='nmE';e.className='acE';i.after(e);}e.textContent=t(k);try{i.focus();}catch(x){}}
  // ad penceresindeki kaydet düğmesi (girişli oyuncu): ad boş, GUEST… ya da başkasınınsa kaydetme
  function guardName(){
    const ok=$('#ovOk'),i=$('#nmIn');if(!ok||!i)return;
    const save=ok.onclick;
    ok.onclick=async()=>{
      const raw=UP((i.value||'').trim().replace(/\s+/g,' ')).slice(0,14),v=window.TESTADM?TESTADM.name(raw):raw;
      if(!v&&isGuest(NAME)){nmErr('acNeed');return;}
      if(v&&isGuest(v)){nmErr('acNoGuest');return;}
      if(v&&v===raw&&nk(v)!==nk(NAME)){
        ok.disabled=true;const free=await claim(v,NAME);ok.disabled=false;
        if(!free){nmErr('acTaken');return;}
      }
      save();
    };
  }
  // misafirin profil penceresi: ad yok (GUEST…), giriş düğmeleri ve avatar
  function askGuest(first){
    const g=isGuest(NAME)?NAME:guestName();
    showOverlay(`<h2>${esc(first?i18('welcome'):t('acProf'))}</h2><div class="acOv">${btns()}<div class="acOr"><span>${esc(t('acOr'))}</span></div></div><p>${esc(t(first?'acGuestF':'acGuestP',{n:g}))}</p><div class="avg" role="radiogroup" aria-label="${esc(i18('avPick'))}">${AVATARS.map((v,i)=>`<button type="button" class="avb" role="radio" aria-checked="${i===AV}" aria-label="${esc(i18('avN',{n:i+1}))}" data-a="${i}">${v}</button>`).join('')}</div><button class="primary" id="ovOk">${esc(first?t('acPlayG'):i18('save'))}</button>`,()=>{
      NAME=g;lsSet('tavla_name',NAME);
      const ab=document.querySelector('.avb[aria-checked=true]');if(ab){AV=+ab.dataset.a;lsSet('tavla_av',AV);if(ROOM)pushFields({av:{[myKey()]:AV}});}
      refreshHome();if(G.mode)render();
    });
    bind($('#ovBox'));
    document.querySelectorAll('.avb').forEach(b=>b.onclick=()=>document.querySelectorAll('.avb').forEach(x=>x.setAttribute('aria-checked',String(x===b))));
  }
  // yeni hesap ya da misafirken giriş: kendi adını sor (Google adıyla doldurulur)
  function askOwn(){
    askName(isGuest(NAME)||!NAME);
    const i=$('#nmIn');if(!i)return;
    if(isGuest(i.value))i.value='';
    const dn=String((user&&user.displayName)||'').trim().split(/\s+/)[0]||'';
    if(!i.value&&dn&&!isGuest(dn))i.value=UP(dn).slice(0,14);
  }
  const local=()=>({n:NAME||'',av:AV,xp:XP,t:ls('tavla_pt',0)||0});
  function push(){
    clearTimeout(pushT);
    pushT=setTimeout(()=>{if(!user||!NAME||isGuest(NAME))return;const p=local();if(!p.t){p.t=Date.now();lsw('tavla_pt',p.t);}cloud('PUT',p).catch(()=>{});},600);
  }
  function apply(c){
    applying=true;
    try{
      if(typeof c.n==='string'&&c.n){NAME=c.n;lsSet('tavla_name',NAME);}
      if(Number.isInteger(c.av)&&c.av>=0&&c.av<AVATARS.length){AV=c.av;lsSet('tavla_av',AV);}
      if(c.xp&&typeof c.xp==='object'&&c.xp.xp>=0){
        XP=Object.assign({v:1,xp:0,g:0,w:0},c.xp);if(!Array.isArray(XP.ks))XP.ks=[];if(!XP.cm||typeof XP.cm!=='object')XP.cm={mars:0,tm:false};
        lsSet('tavla_xp',XP);
      }
      lsw('tavla_pt',c.t||Date.now());
    }finally{applying=false;}
    if(ROOM&&typeof pushFields==='function'&&G.mode==='online')pushFields({av:{[myKey()]:AV},lv:{[myKey()]:myLv()}});
    refreshHome();if(G.mode)render();
  }
  async function sync(){
    if(!user)return;
    let c=null;
    try{c=await cloud('GET');}catch(e){return;}
    const was=fresh;fresh=false;
    if(c&&c.n&&!isGuest(c.n)){
      if(was||(+c.t||0)>=(ls('tavla_pt',0)||0))apply(c);else push();
      claim(NAME).catch(()=>{});
      // ad sorusu açıksa hesaptaki profil geldiği için kapat
      if($('#nmIn')&&!$('#overlay').hidden&&NAME)$('#overlay').hidden=true;
      if(was)done();
    }else{
      // yeni hesap: misafir adı (GUEST…) hesaba taşınmaz, kendi adı sorulur; puan ve avatar ad kaydedilince hesaba yazılır
      if(NAME&&!isGuest(NAME)){
        if(await claim(NAME)){push();if(was)done();}
        else{askOwn();nmErr('acTaken');}
      }
      else askOwn();
    }
  }
  function done(){showOverlay(`<h2>${esc(t('acOk'))}</h2><p>${esc(t('acOkP'))}</p><button class="primary" id="ovOk">${esc(i18('close'))}</button>`);}

  function onUser(u){
    user=u||null;ready=true;
    if(user){lsw('tavla_uid',user.uid);lsw('tavla_acc',{e:user.email||'',p:prov(user)});sync();}
    else{lsw('tavla_uid',null);lsw('tavla_acc',null);if(NAME&&!isGuest(NAME)&&!window.__keepName){NAME=guestName();lsSet('tavla_name',NAME);refreshHome();}}
    paint();
  }
  const prov=u=>{const p=((u.providerData||[])[0]||{}).providerId||'';return p==='google.com'?'Google':'E-posta';};

  /* ---------- giriş yolları ---------- */
  function err(e){
    const c=(e&&e.code)||'';
    if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request'||c==='auth/user-cancelled')return;
    const m=c==='auth/network-request-failed'||/^load /.test((e&&e.message)||'')?'acErrNet':c==='auth/invalid-email'?'acErrMail':
      (c==='auth/invalid-action-code'||c==='auth/expired-action-code')?'acErrLink':'acErrX';
    showOverlay(`<h2>${esc(t('acErr'))}</h2><p>${esc(t(m))}</p><button class="primary" id="ovOk">${esc(i18('close'))}</button>`);
  }
  async function google(){
    try{
      const a=await load(),pr=new firebase.auth.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
      fresh=true;
      try{await a.signInWithPopup(pr);}
      catch(e){
        if(e&&(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment')){await a.signInWithRedirect(pr);return;}
        throw e;
      }
    }catch(e){fresh=false;err(e);}
  }
  const mailOk=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  function mail(){
    showOverlay(`<h2>${esc(t('acMT'))}</h2><p>${esc(t('acMP'))}</p><input id="acMail" class="acIn" type="email" inputmode="email" autocomplete="email" placeholder="${esc(t('acMPh'))}" value="${esc(ls('tavla_mail',''))}"><p class="acE" id="acE" hidden></p><button class="primary" id="acSend">${esc(t('acSend'))}</button><button id="acNo">${esc(t('cancel2'))}</button>`);
    const i=$('#acMail'),go=async()=>{
      const v=(i.value||'').trim();if(!mailOk(v)){$('#acE').hidden=false;$('#acE').textContent=t('acErrMail');return;}
      $('#acSend').disabled=true;
      try{
        const a=await load();
        await a.sendSignInLinkToEmail(v,{url:location.origin+location.pathname,handleCodeInApp:true});
        lsw('tavla_mail',v);
        showOverlay(`<h2>${esc(t('acSent'))}</h2><p>${esc(t('acSentP',{e:v}))}</p><button class="primary" id="ovOk">${esc(i18('close'))}</button>`);
      }catch(e){err(e);}
    };
    $('#acSend').onclick=go;$('#acNo').onclick=()=>{$('#overlay').hidden=true;if(!NAME)askName(true);};
    i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});
    setTimeout(()=>{try{i.focus();}catch(e){}},50);
  }
  // e-postadaki bağlantıyla açıldı: girişi tamamla
  async function finishLink(){
    let a;try{a=await load();}catch(e){err(e);return;}
    const href=location.href;
    try{history.replaceState(null,'',location.pathname+location.hash);}catch(e){}
    if(!a.isSignInWithEmailLink(href))return;
    const fin=async v=>{try{fresh=true;await a.signInWithEmailLink(v,href);lsw('tavla_mail',null);}catch(e){fresh=false;err(e);}};
    const m=ls('tavla_mail','');
    if(m){fin(m);return;}
    showOverlay(`<h2>${esc(t('acMC'))}</h2><p>${esc(t('acMCP'))}</p><input id="acMail" class="acIn" type="email" inputmode="email" autocomplete="email" placeholder="${esc(t('acMPh'))}"><p class="acE" id="acE" hidden></p><button class="primary" id="acGo">${esc(t('acGo'))}</button>`);
    $('#acGo').onclick=()=>{const v=($('#acMail').value||'').trim();if(!mailOk(v)){$('#acE').hidden=false;$('#acE').textContent=t('acErrMail');return;}$('#overlay').hidden=true;fin(v);};
  }
  function signOut(){
    showOverlay(`<h2>${esc(t('acOutQ'))}</h2><p>${esc(t('acOutP'))}</p><button class="primary" id="ovOk">${esc(t('acOut'))}</button><button id="acNo">${esc(t('cancel2'))}</button>`,async()=>{
      clearTimeout(pushT);
      try{const a=await load();await a.signOut();}catch(e){}
      ['tavla_uid','tavla_acc','tavla_pt','tavla_name','tavla_av','tavla_xp'].forEach(k=>lsw(k,null));
      location.reload();
    });
    $('#acNo').onclick=()=>{$('#overlay').hidden=true;};
  }

  /* ---------- görünüm ---------- */
  const GSVG='<svg class="acG" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  const MSVG='<svg class="acM" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  const btns=()=>`<button type="button" class="acBtn acBG" data-ac="g">${GSVG}<span>${esc(t('acG'))}</span></button><button type="button" class="acBtn" data-ac="m">${MSVG}<span>${esc(t('acM'))}</span></button>`;
  function bind(root){(root||document).querySelectorAll('[data-ac]').forEach(b=>b.onclick=()=>{try{audio();}catch(e){}if(!$('#setDrawer').hidden)try{sheetClose('#setDrawer');}catch(e){}({g:google,m:mail,o:signOut})[b.dataset.ac]();});}
  // ilk açılıştaki "Hoş geldin" penceresine eklenen giriş düğmeleri (askName çağırır)
  function paint(){
    const acc=ls('tavla_acc',null),inn=!!(user||(acc&&!ready));
    const s=$('#acSet');
    if(s){
      s.querySelector('.ol').textContent=t('acT');
      s.querySelector('.acB').innerHTML=inn?
        `<div class="acU"><span class="acDot" aria-hidden="true">✓</span><span><b>${esc((user&&user.email)||(acc&&acc.e)||'')}</b><small>${esc(t('acVia',{p:(user?prov(user):acc&&acc.p)||''}))}</small></span></div><button type="button" class="acOut" data-ac="o">${esc(t('acOut'))}</button>`:
        `<small class="acS">${esc(t('acGuest'))}</small>${btns()}`;
      bind(s);
    }
    const h=$('#acHome');
    if(h){h.hidden=inn||!NAME;h.querySelector('span').textContent=t('acHome');}
  }
  function init(){
    addI18n();
    const css=document.createElement('style');
    css.textContent=`
.acBtn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:46px;font-size:15px;font-weight:700;border-radius:12px;margin-top:0!important}
.acBtn svg{width:20px;height:20px;flex:none}
.acBtn.acBG{background:#fff!important;color:#1f1f1f!important;border:1px solid #dadce0!important;box-shadow:none!important;text-shadow:none!important;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif!important;letter-spacing:0!important;text-transform:none!important}
.acOv{display:flex;flex-direction:column;gap:10px;margin:10px 0 2px}
.acOr{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px;margin-top:4px}.acOr:before,.acOr:after{content:'';flex:1;height:1px;background:var(--line)}
#acSet .acB{display:flex;flex-direction:column;gap:8px}
#acSet .acS{font-size:13px;color:var(--muted)}
.acU{display:flex;align-items:center;gap:10px;min-width:0}.acU>span:last-child{display:flex;flex-direction:column;min-width:0}
.acU b{font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.acU small{font-size:12px;color:var(--muted)}
.acDot{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:var(--accent-fg);font-weight:800;font-size:15px}
.acOut{width:100%}
#acHome{display:flex;align-items:center;justify-content:center;gap:8px;margin:-2px auto 8px;padding:6px 14px;min-height:34px;border-radius:999px;font-size:13px;background:transparent;border:1px dashed var(--line);color:var(--fg)}
#acHome[hidden]{display:none}#acHome svg{width:16px;height:16px;flex:none}
.acIn{letter-spacing:0!important;font-size:16px!important}
.acE{color:#e5484d;font-size:13px}`;
    document.head.appendChild(css);
    const sh=$('#setDrawer .sheet h2');
    if(sh&&!$('#acSet')){const d=document.createElement('div');d.className='opts';d.id='acSet';d.innerHTML='<div class="og"><span class="ol"></span><div class="acB"></div></div>';sh.after(d);}
    const xr=$('#xpRow');
    if(xr&&!$('#acHome')){const b=document.createElement('button');b.type='button';b.id='acHome';b.hidden=true;
      b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4.75 4.75 0 0 1-.5 9.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span></span>';
      b.onclick=()=>{try{audio();}catch(e){}$('#bSet').click();};xr.after(b);}
    // misafir ad seçemez: eskiden seçilmiş adlar GUEST… olur (giriş yapınca kendi adını seçer)
    if(NAME&&!signed()&&!isGuest(NAME)&&!window.__keepName){NAME=guestName();lsSet('tavla_name',NAME);refreshHome();}
    paint();
    if(linkIn())finishLink();
    else if(ls('tavla_uid',null))load().catch(()=>{});
  }
  window.ACCT={bind,paint,init,guardName,askGuest,signed,nk,
    // index.html lsSet kancası: profil değişince hesaba yaz
    dirty(k){if(applying||!PK.includes(k))return;lsw('tavla_pt',Date.now());if(user)push();},
    get user(){return user;}};
})();
