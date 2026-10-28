// Tavla tema + slogan entegrasyonu uçtan uca testleri (Playwright, Chromium)
// BROWSER=chromium|webkit, DEVICE="iPhone 13" gibi bir Playwright cihaz profili (isteğe bağlı)
const pw=require(process.env.PW||'playwright');
const BR=process.env.BROWSER||'chromium',DEVN=process.env.DEVICE||'',DEV=DEVN?pw.devices[DEVN]:null;
if(DEVN&&!DEV)throw new Error('bilinmeyen cihaz: '+DEVN);
const TAG=BR+(DEVN?'-'+DEVN.replace(/\W+/g,'_'):'');
const SP=process.env.SP||__dirname+'/out',OUT=SP+'/shots-'+TAG;require('fs').mkdirSync(OUT,{recursive:true});
const URL='http://localhost:8765/index.html',DB='http://localhost:8790';
const THEMES=['neon','sunset','poker','arcade'];
const FBM=require('fs').readFileSync(__dirname+'/firebase-mock.js','utf8');
const res=[];let fails=0;
const skip=(name,why)=>res.push(`SKIP  ${name}  — ${why}`);
const ok=(name,cond,info)=>{res.push(`${cond?'PASS':'FAIL'}  ${name}${info?'  — '+info:''}`);if(!cond)fails++;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function mkPage(b,opts={}){
  const base=DEV?Object.assign({},DEV):{viewport:{width:390,height:844},deviceScaleFactor:2};
  if(opts.vp)base.viewport=opts.vp;
  const ctx=await b.newContext(Object.assign(base,{reducedMotion:opts.rm||'no-preference'},opts.noSW?{serviceWorkers:'block'}:{}));
  const p=await ctx.newPage();p.errs=[];
  p.on('pageerror',e=>p.errs.push(e.message));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await ctx.addInitScript(o=>{
    if(!sessionStorage.getItem('init')){sessionStorage.setItem('init','1');
      localStorage.setItem('tavla_name',JSON.stringify(o.name||'BURAK'));localStorage.setItem('tavla_lang','"tr"');
      for(const [k,v] of Object.entries(o.ls||{}))localStorage.setItem(k,JSON.stringify(v));}
    window.__DBURL=o.db;
    if(!o.guest)window.__keepName=true; // misafir adları GUEST… olur; eski testler verilen adla (BURAK, AHMET) açılır
    if(o.acct){window.__mockUid=o.acct;if(!sessionStorage.getItem('acct')){sessionStorage.setItem('acct','1');localStorage.setItem('tavla_uid',JSON.stringify(o.acct));
      localStorage.setItem('__fbmock_user',JSON.stringify({uid:o.acct,email:'test@mail.com',displayName:'Test',providerData:[{providerId:'google.com'}]}));}(0,eval)(o.fbm);}
    // olay kaydı + zar kuyruğu (r6 global fonksiyon bildirimi)
    window.__log=[];window.__dice=[];
    const AC0=window.AudioContext||window.webkitAudioContext;if(AC0){const n=AC0.prototype.createOscillator,g=AC0.prototype.createGain;window.__osc=0;window.__gains=[];
      AC0.prototype.createOscillator=function(){window.__osc++;return n.call(this);};AC0.prototype.createGain=function(){const x=g.call(this);window.__gains.push(x);if(window.__gains.length>400)window.__gains.shift();return x;};}
  },{name:opts.name,ls:opts.ls,db:DB,guest:opts.guest,acct:opts.acct,fbm:opts.acct?FBM:''});
  return p;
}
async function hook(p){await p.evaluate(()=>{const m=moment;window.moment=function(k,d,key){const r=m(k,d,key);__log.push(k+':'+r);return r;};const r=Math.random;Math.random=()=>__dice.length?(__dice.shift()-1)/6+.01:r();});}
const press=async(p,sel)=>{if(DEV&&DEV.hasTouch)await p.tap(sel);else await p.click(sel);};
const slgText=p=>p.evaluate(()=>document.getElementById('slg').textContent);
async function waitSlg(p,txt,ms=4000){try{await p.waitForFunction(t=>document.getElementById('slg').textContent.includes(t),txt,{timeout:ms});return true;}catch(e){return false;}}
const stSnap=p=>p.evaluate(()=>JSON.stringify({st:G.st,dice:G.dice,all:G.all,seed:G.seed,turn:G.turn,sc:SC,gid:G.gid}));
async function setBoard(p,b,o){await p.evaluate(([b,o])=>{G.run++;G.autoTok++;G.endTok++;$('#overlay').hidden=true;Object.assign(G,{op:0,over:false,busy:false,auto:false,turn:1,rolled:true,sel:null,hist:[],endTimer:null});
  G.st={b,bar:o.bar||[0,0],off:o.off||[0,0]};G.all=o.all;G.dice=o.all.slice();G.seed=(Math.random()*1e9)|0;G.un={w:3,k:3};render();},[b,o]);}
// ZAR AT düğmesi/ipucu ile bardaki pullar: çakışma ölçümü
const barCheck=p=>p.evaluate(()=>{
  const bar=[...document.querySelectorAll('#bg use[href="#ckL"],#bg use[href="#ckD"],#bg circle.ck')].filter(u=>{const r=u.getBoundingClientRect(),b=$('#bg rect[data-k="bar"]').getBoundingClientRect();return r.width&&Math.abs((r.left+r.right)/2-(b.left+b.right)/2)<3;}).map(u=>u.getBoundingClientRect());
  const btn=[...document.querySelectorAll('#bg .rbig,#bg text.zs')].map(e=>e.getBoundingClientRect());
  const hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
  return {bar:bar.length,btn:!!document.querySelector('#bg .rbig'),cakisma:bar.some(c=>btn.some(x=>hit(c,x))),boardW:Math.round($('#board').getBoundingClientRect().width)};});
// "ZARINI AT!" yazısı en büyük anında (animasyonun tepe ölçeği) bardaki pullara ve ZAR AT düğmesine değiyor mu
const banCheck=p=>p.evaluate(async()=>{
  // CI'daki geniş yedek yazı tipini taklit et (en kötü durum): yazı yine de okunur kalmalı
  if(!document.getElementById('banWide')){const st=document.createElement('style');st.id='banWide';st.textContent='#dbt{font-family:"DejaVu Sans",Verdana,sans-serif!important;letter-spacing:.06em}';document.head.appendChild(st);}
  showBanner(0,i18('throwBan'),true);await new Promise(r=>setTimeout(r,80));
  const t=$('#dbt'),side=t.classList.contains('side');t.style.animation='none';t.style.opacity='1';t.style.transform=side?'scale(1.1) rotate(-5deg)':'scale(1.28) rotate(-5deg)';
  const R=t.getBoundingClientRect(),bar=$('#bg rect[data-k="bar"]').getBoundingClientRect(),bw=$('#board').getBoundingClientRect();
  const ck=[...document.querySelectorAll('#bg use[href="#ckL"],#bg use[href="#ckD"]')].map(u=>u.getBoundingClientRect()).filter(r=>r.width&&Math.abs((r.left+r.right)/2-(bar.left+bar.right)/2)<3);
  const btn=[...document.querySelectorAll('#bg .rbig')].map(e=>e.getBoundingClientRect());
  const hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
  const fs=parseFloat(getComputedStyle(t).fontSize),scale=bw.width/410;
  const out={side,pul:ck.length,pulaDeger:ck.some(c=>hit(R,c)),dugmeyeDeger:btn.some(b=>hit(R,b)),bariKesiyor:side&&R.right>bar.left+1,tahtaIcinde:R.left>=bw.left-1&&R.right<=bw.right+1,
    ekranPx:Math.round(fs*scale),satir:t.querySelectorAll('tspan').length||1};
  t.style.animation='';t.style.opacity='';t.style.transform='';t.classList.remove('pop');return out;});
const board=(m)=>{const b=Array(24).fill(0);for(const [i,v] of Object.entries(m))b[+i]=v;return b;};

(async()=>{
  const b=await pw[BR].launch(BR==='chromium'?{args:['--autoplay-policy=no-user-gesture-required']}:{});
  res.push(`#  tarayıcı: ${BR}${DEVN?' · cihaz: '+DEVN:''}`);

  /* 1) ana ekran: dört tema, kalıcılık */
  for(const t of THEMES){
    const p=await mkPage(b,{ls:{tavla_theme:t,tavla_snd:'off'}});await p.goto(URL);await sleep(500);
    const dt=await p.evaluate(()=>document.documentElement.dataset.theme);
    ok(`[${t}] tercih yüklendi`,dt===t);
    const stop=await p.evaluate(()=>document.querySelector('#gB stop').getAttribute('stop-color'));
    ok(`[${t}] pul gradyanı tokenla güncellendi`,stop===(await p.evaluate(()=>TK.d.g[0])));
    await p.screenshot({path:`${OUT}/${t}-1-home.png`});
    ok(`[${t}] ana ekranda hata yok`,!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }

  /* 1b) giriş ekranı: dört tema × (tema değişimi, oyun başlatma, kayıtlı oyuna devam, mobil) */
  for(const t of THEMES){
    const p=await mkPage(b,{ls:{tavla_theme:'poker',tavla_snd:'off'}});await p.goto(URL);await sleep(500);
    const bg0=await p.evaluate(()=>getComputedStyle(document.body).backgroundImage+getComputedStyle($('#bGo')).backgroundImage);
    await press(p,`#thHome .thc[data-t=${t}]`);await sleep(250);
    const st=await p.evaluate(()=>({th:document.documentElement.dataset.theme,ls:lsGet('tavla_theme'),bg:getComputedStyle(document.body).backgroundImage+getComputedStyle($('#bGo')).backgroundImage,hero:!!document.querySelector('#heroB polygon')}));
    ok(`[${t}] giriş: tema anında uygulandı ve kaydedildi`,st.th===t&&st.ls===t&&(t==='poker'||st.bg!==bg0)&&st.hero,JSON.stringify({th:st.th,ls:st.ls}));
    ok(`[${t}] giriş: devam düğmesi kayıt yokken pasif`,await p.evaluate(()=>$('#bCont').disabled));
    // seçimler motora bağlı: Kolay, 5 set, 30 sn
    await press(p,'#optCpu [data-grp=lvl] [data-v=easy]');await press(p,'#optCpu [data-grp=tgt] [data-v="5"]');await press(p,'#optCpu [data-grp=tlc] [data-v="30"]');
    await press(p,'#bGo');await sleep(400);
    ok(`[${t}] giriş: OYUNU BAŞLAT seçimlerle yerel oyunu açtı`,await p.evaluate(()=>G.mode==='local'&&!$('#play').hidden&&LVL==='easy'&&TARGET===5&&TLC===30&&lsGet('tavla_lvl')==='easy'));
    // kayıtlı oyuna devam
    await p.evaluate(()=>{G.run++;Object.assign(G,{op:0,turn:1,rolled:true,all:[5,2],dice:[5,2],busy:false,over:false});G.st=newState();G.st.b[12]=4;G.st.b[7]=4;render();saveCur();});
    const snap=await p.evaluate(()=>JSON.stringify(G.st));
    await press(p,'#bBack');await sleep(300);
    ok(`[${t}] giriş: kayıt varken OYUNA DEVAM ET etkin`,await p.evaluate(()=>!$('#home').hidden&&!$('#bCont').disabled));
    await press(p,'#bCont');await sleep(400);
    ok(`[${t}] giriş: OYUNA DEVAM ET aynı oyunu açtı`,await p.evaluate(s=>G.mode==='local'&&JSON.stringify(G.st)===s,snap));
    await p.evaluate(()=>showHome());await sleep(200);
    // mobil: üç genişlikte yatay taşma yok, dikey kaydırılabilir, dokunma hedefleri
    // CI'daki geniş yedek yazı tipleri de denenir (Linux'ta Google Fonts yerine)
    await p.evaluate(()=>{const st=document.createElement('style');st.textContent='*{font-family:"DejaVu Sans",Verdana,sans-serif!important}';document.head.appendChild(st);});
    for(const w of [375,390,430]){await p.setViewportSize({width:w,height:w===375?667:w===390?844:932});await sleep(150);
      const m=await p.evaluate(()=>{const h=$('#home'),r=e=>e.getBoundingClientRect();return {ov:document.scrollingElement.scrollWidth<=innerWidth&&h.scrollWidth<=h.clientWidth+1,
        go:r($('#bGo')).height,seg:Math.min(...[...document.querySelectorAll('#optCpu .seg button')].map(b=>r(b).height)),ic:r($('#bSet')).height,mc:r($('#mCpu')).height,scroll:h.scrollHeight>h.clientHeight};});
      ok(`[${t}] giriş ${w}px: yatay taşma yok, hedefler parmağa uygun`,m.ov&&m.go>=56&&m.seg>=40&&m.ic>=44&&m.mc>=88,JSON.stringify(m));
      if(w===375)ok(`[${t}] giriş 375×667: içerik dikey kaydırılabilir`,m.scroll);}
    ok(`[${t}] giriş: sayfa hatası yok`,!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }
  {const p=await mkPage(b,{ls:{tavla_target:4,tavla_snd:'off'}});await p.goto(URL);await sleep(400);
    ok('giriş: eski 4 set tercihi 5 olarak açılır (1/3/5)',await p.evaluate(()=>TARGET===5&&$('#optCpu [data-grp=tgt] .on').dataset.v==='5'));
    await press(p,'#mOnline');await sleep(150);
    ok('giriş: Arkadaşınla seçilince oda seçenekleri görünür',await p.evaluate(()=>!$('#optOn').hidden&&$('#optCpu').hidden&&$('#mOnline').classList.contains('on')));
    ok('giriş: açık oda yokken devam pasif (çok oyunculu)',await p.evaluate(()=>$('#bCont').disabled));
    ok('giriş: görsel yuvaları (logo/masa) tema dosyasından değiştirilebilir',await p.evaluate(()=>{const t=THEMES[THEME];t.home={logo:'assets/neon/btn-roll.svg',table:'assets/neon/board-field.svg'};heroPaint();
      const r=!$('#lgImg').hidden&&!$('#heroImg').hidden&&getComputedStyle($('#heroB')).display==='none';delete t.home;heroPaint();return r&&$('#heroImg').hidden&&getComputedStyle($('#heroB')).display!=='none';}));
    await press(p,'#mCpu');await press(p,'#bSet');await sleep(200);
    ok('giriş: ⚙ ayarlar çekmecesi ses/slogan/dil ayarlarını açar',await p.evaluate(()=>!$('#setDrawer').hidden&&$('#setDrawer').contains($('#jkIn'))&&$('#setDrawer').contains($('#bLang'))));
    await p.keyboard.press('Escape');await sleep(100);
    ok('giriş: çekmece Esc ile kapanır',await p.evaluate(()=>$('#setDrawer').hidden));
    await press(p,'#bBell');await sleep(150);
    ok('giriş: zil bildirim penceresini açar',await p.evaluate(()=>!$('#overlay').hidden));
    await p.context().close();}

  /* 2) bilgisayara karşı: olaylar, AI, geri al, tema değişimi */
  {
    const p=await mkPage(b,{ls:{tavla_theme:'poker',tavla_snd:'all'}});await p.goto(URL);await sleep(400);
    await hook(p);
    // Grafik Paketi v1 varlıkları yüklendi; referans PNG'ler çalışma anında istenmez
    const reqs=[];p.on('request',r=>reqs.push(r.url()));
    await p.waitForFunction(()=>document.documentElement.classList.contains('asset'),null,{timeout:5000}).catch(()=>{});
    ok('tema varlıkları yüklendi (pul, efekt, ZAR AT sembolleri)',await p.evaluate(()=>['ckL','ckD','fxC','rbB'].every(id=>document.getElementById(id))));
    // varsayılan: kayıtlı tercih yokken Poker Lounge
    await p.click('#bGo');await sleep(300);
    ok('maç başladı (yerel)',await p.evaluate(()=>G.mode==='local'));
    {const r=await p.evaluate(async()=>{const f0=$('#bgField image'),r0=$('#bgFrame image');for(let i=0;i<20;i++){render();await new Promise(r=>requestAnimationFrame(r));}
        const same=$('#bgField image')===f0&&$('#bgFrame image')===r0;
        // sıra: zemin → üçgenler → çerçeve → pullar
        const kids=[...$('#bg').children].map(e=>e.id),pts=$('#bgPts polygon'),ck=$('#bgTop use[href="#ckL"],#bgTop use[href="#ckD"]');
        return {same,f0:!!f0,r0:!!r0,kids:kids.join(),pts:!!pts,ck:!!ck};});
      ok('tahta: zemin ve çerçeve 20 yeniden çizimde aynı öğe (yanıp sönmez)',r.same&&r.f0&&r.r0,JSON.stringify(r));
      ok('tahta: katman sırası zemin → üçgenler → çerçeve → pullar',r.kids==='bgField,bgPts,bgFrame,bgTop'&&r.pts&&r.ck,JSON.stringify(r));}
    ok('tahta zemini ve çerçevesi katmanlarda',await p.evaluate(()=>{const im=[...document.querySelectorAll('#bg image')].map(i=>i.getAttribute('href'));const f=im.findIndex(h=>/board-field\.svg$/.test(h)),r=im.findIndex(h=>/board-frame\.svg$/.test(h));return f===0&&r>f;}));
    // başlangıç dizilimi: 15+15 pul, 2/5/3/5, referans ekran görüntüsüyle aynı noktalar
    {await p.evaluate(()=>{G.run++;Object.assign(G,{op:0,turn:1,rolled:false,busy:false,over:false});G.st=newState();opClear();render();});
      const r=await p.evaluate(()=>{const cnt={};document.querySelectorAll('#bg use[href="#ckL"],#bg use[href="#ckD"]').forEach(u=>{const k=u.getAttribute('href')+'@'+Math.round(+u.getAttribute('x')+14.286);cnt[k]=(cnt[k]||0)+1;});
        const L=[...document.querySelectorAll('#bg use[href="#ckL"]')].length,D=[...document.querySelectorAll('#bg use[href="#ckD"]')].length;
        const at=(h,p)=>cnt[h+'@'+(PX(p)+14)]||0;
        return {L,D,me:[at('#ckL',23),at('#ckL',12),at('#ckL',7),at('#ckL',5)],op:[at('#ckD',0),at('#ckD',11),at('#ckD',16),at('#ckD',18)]};});
      ok('başlangıç: 15 beyaz + 15 kırmızı pul çizildi',r.L===15&&r.D===15,JSON.stringify(r));
      ok('başlangıç: beyaz 2/5/3/5 (24, 13, 8, 6. noktalar)',r.me.join()==='2,5,3,5',r.me.join());
      ok('başlangıç: kırmızı 2/5/3/5 karşılıklı',r.op.join()==='2,5,3,5',r.op.join());}
    // sol toplama kanalı: dokunarak/tıklayarak pul toplama
    {await setBoard(p,board({0:2,1:2,3:3,5:3,22:-15}),{all:[6,4],off:[5,0]});
      await press(p,'#bg rect[data-k="pt"][data-i="5"]');await sleep(150);
      ok('toplama: kanal hedef olarak işaretlendi',await p.evaluate(()=>!!document.querySelector('#bg rect.dest[x="6"]')));
      await press(p,'#bg rect[data-k="off"]');await sleep(500);
      ok('toplama: pul kanala gitti (dokunmatik/tıklama)',await p.evaluate(()=>G.st.off[0]===6&&G.st.b[5]===2),await p.evaluate(()=>JSON.stringify(G.st.off)));
      // çubuk, pulun kanala uçuş animasyonu bitince çizilir (yavaş makinede 500 ms'yi aşabilir)
      await p.waitForFunction(()=>document.querySelectorAll('#bg rect[x="8"][y]').length>=6,null,{timeout:3000}).catch(()=>{});
      ok('toplama: kanalda 6 beyaz çubuk',await p.evaluate(()=>document.querySelectorAll('#bg rect[x="8"][y]').length>=6));}
    // tur süresi halkası: yeşil, son 5 sn kırmızı + sayı; diğer avatar pasif
    {await p.evaluate(()=>{G.run++;Object.assign(G,{op:0,turn:1,rolled:false,busy:false,over:false});G.st=newState();render();timerSync();});await sleep(250);
      const r0=await p.evaluate(()=>({on:$('#avwMe').classList.contains('ton'),red:$('#avwMe').classList.contains('tred'),n:+$('#avwMe .tsec').textContent,op:$('#avwOp').classList.contains('ton')}));
      ok('süre halkası: tur başında yeşil ve tam süre',r0.on&&!r0.red&&r0.n>=19&&r0.n<=20&&!r0.op,JSON.stringify(r0));
      await p.evaluate(()=>{G.deadline=Date.now()+4300;});await sleep(250);
      const r1=await p.evaluate(()=>({red:$('#avwMe').classList.contains('tred'),n:$('#avwMe .tsec').textContent,stroke:getComputedStyle($('#avwMe .tfg')).stroke,op:$('#avwOp').classList.contains('ton')}));
      ok('süre halkası: son 5 sn kırmızı ve sayı gösteriyor',r1.red&&(r1.n==='4'||r1.n==='5')&&/239, 68, 68/.test(r1.stroke)&&!r1.op,JSON.stringify(r1));
      await p.evaluate(()=>{G.deadline=Date.now()+3000;document.dispatchEvent(new Event('visibilitychange'));});await sleep(1100);
      const n2=+await p.evaluate(()=>$('#avwMe .tsec').textContent);
      ok('süre halkası: arka planda da gerçek süreye göre azalır',n2===2,'kalan='+n2);
      await p.evaluate(()=>{G.run++;G.turn=-1;G.rolled=false;render();timerSync();});await sleep(200);
      ok('süre halkası: bilgisayarın sırasında iki halka da pasif',await p.evaluate(()=>!$('#avwMe').classList.contains('ton')&&!$('#avwOp').classList.contains('ton')));
      await p.evaluate(()=>{G.run++;G.turn=1;render();timerSync();});await sleep(200);
      ok('süre halkası: yeni turda sıfırlanır',await p.evaluate(()=>+$('#avwMe .tsec').textContent>=19&&!$('#avwMe').classList.contains('tred')));
      ok('ikinci süre göstergesi yok (tahta altı çubuk ve ⏱ kaldırıldı)',await p.evaluate(()=>getComputedStyle($('#tb')).display==='none'&&!$('#scS').textContent.includes('⏱')));}
    // sohbet daraltma: tahtaya yer açar, kalıcı
    {const h0=await p.evaluate(()=>$('#board').getBoundingClientRect().height);
      await press(p,'#bFold');await sleep(200);
      const r=await p.evaluate(()=>({min:$('#play').classList.contains('chatmin'),hid:getComputedStyle($('#histList')).display==='none',exp:$('#bFold').getAttribute('aria-expanded'),h:$('#board').getBoundingClientRect().height}));
      ok('sohbet daraltıldı (aria-expanded=false)',r.min&&r.hid&&r.exp==='false');
      ok('daraltılınca tahta küçülmedi',r.h>=h0-1,`${h0.toFixed(0)} → ${r.h.toFixed(0)}`);
      await press(p,'#bFold');await sleep(150);}
    ok('referans PNG çalışma anında istenmedi',!reqs.some(u=>/references\/|\.png$/.test(u)&&!/icon|apple-touch/.test(u)));

    // çift zar
    await p.evaluate(()=>{Object.assign(G,{op:0,turn:1,rolled:false,busy:false,over:false});G.st=newState();opClear();render();__dice.push(4,4);doRoll(218,200);});
    ok('çift zar: HOPP! ÇİFTE GELDİ!',await waitSlg(p,'HOPP! ÇİFTE GELDİ!'),await slgText(p));
    await sleep(2800);
    // kırma: 10 → 7 rakip tek pul
    await setBoard(p,board({10:2,20:13,7:-1,22:-14}),{all:[3,5]});
    const legalHit=await p.evaluate(()=>legalMoves(G.st,1,G.dice).some(m=>m.f===10&&m.t===7));
    ok('kırma hamlesi kurallara uygun',legalHit);
    await p.evaluate(()=>doHuman({f:10,t:7,d:3}));
    ok('kırma: YAKALADIM SENİ!',await waitSlg(p,'YAKALADIM SENİ!'),await slgText(p));
    ok('kırılan pul bara gitti',await p.evaluate(()=>G.st.bar[1]===1));
    // geri al ve aynı hamleyi yeniden yap: slogan tekrar etmez
    const nBefore=await p.evaluate(()=>__log.length);
    await p.evaluate(()=>{undo();});
    ok('geri al çalıştı',await p.evaluate(()=>G.st.bar[1]===0&&G.dice.length===2));
    await sleep(3000);
    await p.evaluate(()=>doHuman({f:10,t:7,d:3}));
    const lg=await p.evaluate(n=>__log.slice(n),nBefore);
    ok('geri al + tekrar: kırma sloganı tekrarlanmadı',lg.includes('hit:false'),lg.join(','));
    await sleep(2800);
    // kapı alma: 5 → 2 (2'de tek pulum var), temas sürüyor
    await setBoard(p,board({2:1,5:2,20:12,1:-2,22:-13}),{all:[3,6]});
    await p.evaluate(()=>doHuman({f:5,t:2,d:3}));
    ok('kapı alma: DUVAR ÖRÜLDÜ!',await waitSlg(p,'DUVAR ÖRÜLDÜ!'),await slgText(p));
    // tema değişimi maç ortasında: durum değişmez (oyuncu hamle beklerken)
    await sleep(500);await setBoard(p,board({7:3,12:2,20:10,1:-2,22:-13}),{all:[2,5]});
    const before=await stSnap(p);
    for(const t of THEMES){
      await p.click('#bSnd');await p.click('#bTheme2');await p.waitForSelector('#thDrawer:not([hidden])');
      await p.click(`#thDrawer .thc[data-t=${t}]`);await sleep(350);
      await p.waitForFunction(t=>document.documentElement.classList.contains('asset')&&THEME===t&&ASSET[t]&&ASSET[t].ok,t,{timeout:5000}).catch(()=>{});await sleep(150);
      const r=await p.evaluate(()=>{const f=[...document.querySelectorAll('#bg polygon')].map(e=>e.getAttribute('fill'));
        return {a:f.filter(x=>x==='url(#ptA)').length,b:f.filter(x=>x==='url(#ptB)').length,stopA:(document.querySelector('#ptA stop')||{getAttribute:()=>''}).getAttribute('stop-color'),stopB:(document.querySelector('#ptB stop')||{getAttribute:()=>''}).getAttribute('stop-color'),exp:[TK.triA,TK.triB]};});
      ok(`[${t}] maç ortasında tema: 24 nokta points.svg degradesiyle çizildi`,r.a===12&&r.b===12&&r.stopA===r.exp[0]&&r.stopB===r.exp[1],JSON.stringify(r));
      ok(`[${t}] zar paleti güncellendi`,await p.evaluate(()=>PAL.one===TK.die.one));
    }
    ok('tema değişince tahta zemini ve çerçevesi yeni temanın dosyası',await p.evaluate(()=>{const a=THEMES[THEME].a;return $('#bgField image').getAttribute('href')===a+'board-field.svg'&&$('#bgFrame image').getAttribute('href')===a+'board-frame.svg';}));
    ok('tema değişimi maç durumunu ve zar tohumunu değiştirmedi',before===await stSnap(p));
    ok('çekmece kapandı',await p.evaluate(()=>$('#thDrawer').hidden));
    // kalıcılık
    await p.reload();await sleep(500);
    ok('yenileme sonrası tema korundu (arcade)',await p.evaluate(()=>document.documentElement.dataset.theme==='arcade'&&lsGet('tavla_theme')==='arcade'));
    await hook(p);
    // normal tur + AI turu (bilgisayarın olayları slogan üretmez)
    await p.evaluate(()=>{startLocal();});await sleep(300);
    await p.evaluate(()=>{G.run++;Object.assign(G,{op:0,turn:1,rolled:false,busy:false,over:false});G.st=newState();opClear();render();__dice.push(6,5,3,1);doRoll(218,200);});
    await sleep(2500);
    const n0=await p.evaluate(()=>__log.length);
    // oyuncu: ilk uygun hamlelerle oynar
    for(let i=0;i<4;i++){await p.evaluate(()=>{if(G.turn!==1||!G.dice.length||G.busy)return;const ms=legalMoves(G.st,1,G.dice);if(ms.length)doHuman(ms[0]);});await sleep(300);}
    await p.waitForFunction(()=>G.turn===-1,null,{timeout:8000}).catch(()=>{});
    ok('AI turuna geçildi',await p.evaluate(()=>G.turn===-1));
    await p.waitForFunction(()=>G.turn===1,null,{timeout:15000}).catch(()=>{});
    ok('AI hamlesini oynadı, sıra oyuncuya döndü',await p.evaluate(()=>G.turn===1&&G.st.b.reduce((a,v)=>a+(v<0?-v:0),0)+G.st.bar[1]+G.st.off[1]===15));
    const lgAI=await p.evaluate(n=>__log.slice(n),n0);
    ok('AI turunda slogan yok (yalnızca 6-5 hamlesi)',lgAI.every(x=>!x.startsWith('double')),lgAI.join(','));
    await p.screenshot({path:`${SP}/ai-turn.png`});
    // mars
    await setBoard(p,board({0:1,12:-15}),{all:[1,2],off:[14,0]});
    await p.evaluate(()=>doHuman({f:0,t:'off',d:1}));
    ok('mars: MAAARS!',await waitSlg(p,'MAAARS!',5000),await slgText(p));
    ok('mars gerçek skorlama: 2 puan',await p.evaluate(()=>G.result&&G.result.mars&&G.result.pts===2));
    await sleep(1800);
    // galibiyet (mars değil)
    await p.evaluate(()=>{$('#overlay').hidden=true;SC={you:0,cpu:0};startLocal();});await sleep(300);
    await setBoard(p,board({0:1,12:-12}),{all:[1,2],off:[14,3]});
    await p.evaluate(()=>doHuman({f:0,t:'off',d:1}));
    ok('galibiyet: TEBRİKLER!',await waitSlg(p,'TEBRİKLER!',5000),await slgText(p));
    // sonuç türleri: 2 sayılık çekilme mars sayılmaz, teklif ayrı, yenilgide slogan yok
    for(const [why,pts,txt] of [['resign',2,'PES ETTİ!'],['offer',1,'SAYI CEBİMDE!']]){
      await sleep(1800);
      await p.evaluate(()=>{$('#overlay').hidden=true;SC={you:0,cpu:0};startLocal();});await sleep(300);
      await setBoard(p,board({0:1,12:-15}),{all:[1,2],off:[5,0]});
      const n=await p.evaluate(()=>__log.length);
      await p.evaluate(([w,pt])=>gameOver(1,pt,w),[why,pts]);
      ok(`bitiş "${why}" (${pts} sayı): ${txt}`,await waitSlg(p,txt,5000),await slgText(p));
      const lg=await p.evaluate(n=>__log.slice(n),n);
      ok(`bitiş "${why}": mars sloganı yok`,!lg.some(x=>x.startsWith('mars')),lg.join(','));
    }
    await sleep(1800);
    await p.evaluate(()=>{$('#overlay').hidden=true;SC={you:0,cpu:0};startLocal();});await sleep(300);
    await setBoard(p,board({0:1,12:-15}),{all:[1,2],off:[5,0]});
    {const n=await p.evaluate(()=>__log.length);await p.evaluate(()=>gameOver(-1));await sleep(2200);
      const lg=await p.evaluate(n=>__log.slice(n),n);ok('yenilgide slogan yok',!lg.length&&!(await slgText(p)).trim(),lg.join(','));}
    // üstünlük: zar atınca değişmez, tamamlanan taş hamlesinden sonra değişir
    await sleep(1800);
    await p.evaluate(()=>{$('#overlay').hidden=true;SC={you:0,cpu:0};startLocal();});await sleep(300);
    await setBoard(p,board({0:2,5:5,7:3,12:5,23:-2,18:-5,16:-3,11:-5}),{all:[1,2]});
    await p.evaluate(()=>{G.rolled=false;G.dice=[];G.all=[];render();});await sleep(900);
    const w0=await p.evaluate(()=>WP.to);
    await p.evaluate(()=>{__dice.push(6,5);doRoll(218,200);});await sleep(1200);
    ok('üstünlük: zar atıldığında değişmedi',await p.evaluate(w=>WP.to===w,w0));
    await p.evaluate(()=>{const ms=legalMoves(G.st,1,G.dice);doHuman(ms.find(m=>m.f===12)||ms[0]);});await sleep(900);
    const w1=await p.evaluate(()=>WP.to);
    ok('üstünlük: taş hamlesinden sonra güncellendi',w1!==w0,`${w0.toFixed(3)} → ${w1.toFixed(3)}`);
    ok('üstünlük barı yüzdeyle eşleşiyor',await p.evaluate(()=>{const pm=G.me===1?WP.p:1-WP.p;return Math.abs(parseFloat($('#abMe').style.width)-pm*100)<.6&&$('#pcMe').textContent.includes(String(Math.round(pm*100)));}));
    // gerçekçi olasılık: toplamada kesin değer, yarışta sıra avantajı, kontakt varken %1–99 aralığı
    {const r=await p.evaluate(()=>{const mk=(w,k,off=[0,0])=>{const b=Array(24).fill(0);for(const [q,c] of w)b[IDX(1,q)]+=c;for(const [q,c] of k)b[IDX(-1,q)]-=c;return {b,bar:[0,0],off};};
      return {a:winOnRoll(mk([[0,1]],[[0,1]],[14,14]),1),b:winOnRoll(mk([[5,1]],[[0,1]],[14,14]),1),c:winOnRoll(mk([[1,2]],[[0,1]],[13,14]),1),
        d:winOnRoll(mk([[10,4],[8,3],[5,4],[3,4]],[[10,4],[8,3],[5,4],[3,4]]),1),e:winOnRoll(newState(),1)};});
      ok('olasılık: 1’e 1 toplamada sırası gelen %100',Math.abs(r.a-1)<1e-9,JSON.stringify(r));
      ok('olasılık: 6 hanede tek pul, rakip 1 hanede: %75',Math.abs(r.b-.75)<1e-9);
      ok('olasılık: 2 hanede iki pul, rakip 1 hanede: 26/36 (1 gelmezse ya da çift gelirse)',Math.abs(r.c-26/36)<1e-6,r.c.toFixed(4));
      ok('olasılık: eşit yarışta sırası gelen %55–65',r.d>.55&&r.d<.65,r.d.toFixed(3));
      ok('olasılık: açılışta %40–60',r.e>.4&&r.e<.6,r.e.toFixed(3));}
    // ÇIKIŞ YOK!: rakip kırıkken altı iç kapı kapanır
    await sleep(1800);
    await setBoard(p,board({0:2,1:2,2:2,3:2,4:2,5:1,8:2,20:2,12:-14}),{all:[3,1],bar:[0,1]});
    await p.evaluate(()=>doHuman({f:8,t:5,d:3}));
    ok('tam kapı + rakip kırık: ÇIKIŞ YOK!',await waitSlg(p,'ÇIKIŞ YOK!'),await slgText(p));
    ok('tam kapı: yalnız kapanan 6 iç kapıda fx-closed-point',await p.evaluate(()=>{const z=[...document.querySelectorAll('#bg .bz')];return z.length===6&&z.every(g=>+g.dataset.p<6&&g.querySelector('use[href="#fxC"]'));}));
    // MARS GELİYOR!: rakip hiç toplamamış ve evine girmemişken ilk pul
    await sleep(2800);
    await setBoard(p,board({0:5,1:5,2:5,12:-15}),{all:[1,2]});
    await p.evaluate(()=>doHuman({f:0,t:'off',d:1}));
    ok('mars riski: MARS GELİYOR!',await waitSlg(p,'MARS GELİYOR!'),await slgText(p));
    // OYUN DÖNDÜ!: tur başına göre ≥15 puan
    await sleep(2800);
    await setBoard(p,board({7:2,12:3,20:10,1:-2,22:-13}),{all:[2,1]});
    await p.evaluate(()=>{G.dice=[2];G.advStart=myAdv()-.3;doHuman(legalMoves(G.st,1,G.dice)[0]);});
    ok('büyük üstünlük değişimi: OYUN DÖNDÜ!',await waitSlg(p,'OYUN DÖNDÜ!'),await slgText(p));
    ok('üst bölümde iki avatar ve skor',await p.evaluate(()=>!!($('#avMe svg')&&$('#avOp svg'))&&/\d+ – \d+/.test($('#ascT').textContent)));
    // yeni maç
    await p.evaluate(()=>{$('#overlay').hidden=true;SC={you:0,cpu:0};startLocal();});await sleep(300);
    ok('yeni maç başladı',await p.evaluate(()=>G.mode==='local'&&!G.over));
    ok('yerel testlerde sayfa hatası yok',!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }

  /* 3) oyun ekranı görüntüleri: dört tema */
  for(const t of THEMES){
    const p=await mkPage(b,{ls:{tavla_theme:t,tavla_snd:'off'}});await p.goto(URL);await sleep(300);await hook(p);
    await p.click('#bGo');await sleep(200);
    await p.evaluate(()=>{Object.assign(G,{op:0,turn:1,rolled:false,busy:false,over:false});G.st=newState();
      G.st.b[7]=4;G.st.b[5]=4;G.st.b[3]=1;G.st.b[12]=4;G.st.b[23]=2;G.st.b[18]=-4;G.st.b[16]=-2;G.st.b[11]=-5;G.st.b[0]=-2;G.st.b[20]=-2;G.st.bar=[0,0];
      opClear();render();__dice.push(5,3);doRoll(250,200);});
    await sleep(2200);
    await p.evaluate(()=>{G.sel=7;G.flash='';G.msg='';render();});await sleep(150);
    await p.screenshot({path:`${OUT}/${t}-2-game.png`});
    // slogan görünümü
    await p.evaluate(()=>moment('hit',0,'shot'+Math.random()));await sleep(320);
    await p.screenshot({path:`${OUT}/${t}-4-slogan.png`});
    ok(`[${t}] oyun ekranında hata yok`,!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }

  /* 4) ses ayarları, reduced motion, dil, slogan kapalı */
  {
    const p=await mkPage(b,{ls:{tavla_snd:'all'}});await p.goto(URL);await sleep(300);
    await p.mouse.click(5,5);// kullanıcı etkileşimi: iOS ses kilidi
    await p.evaluate(()=>{audio();});await p.waitForFunction(()=>AC&&AC.state==='running',null,{timeout:3000}).catch(()=>{});
    ok('ana ekranda bağımsız ayarlar var (slogan, animasyon, efekt, seviye)',await p.evaluate(()=>!!($('#slIn')&&$('#saIn')&&$('#fxIn')&&$('#fxV'))));
    if(!(await p.evaluate(()=>!!AC&&AC.state==='running')))skip('efekt sesi ölçümleri',`${BR} başsız modunda ses bağlamı başlamadı`);
    else{
      const fx=async setup=>p.evaluate(async f=>{(new Function(f))();await new Promise(r=>setTimeout(r,450));const a=__osc;sfx('win');return __osc-a;},setup);
      const all=await fx("setSnd('all');setFx(true);setFxVol(.8)"),game=await fx("setSnd('game');setFx(true)"),fxOff=await fx("setSnd('all');setFx(false)"),
        mute=await fx("setSnd('off');setFx(true)"),vol0=await fx("setSnd('all');setFx(true);setFxVol(0)");
      ok('efekt açık + ses Tümü: efekt çalar',all>0,'osc='+all);
      ok('efekt açık + ses Pul ve zar: efekt çalar (bağımsız ayar)',game>0,'osc='+game);
      ok('efekt kapalı: çalmaz',fxOff===0,'osc='+fxOff);
      ok('ses Kapalı: efekt de çalmaz',mute===0,'osc='+mute);
      ok('efekt seviyesi %0: çalmaz',vol0===0,'osc='+vol0);
      const vol=await p.evaluate(async()=>{setSnd('all');setFx(true);setFxVol(.35);await new Promise(r=>setTimeout(r,450));const n=__gains.length;sfx('hit');return __gains.slice(n).some(g=>Math.abs(g.gain.value-.35)<1e-6);});
      ok('efekt seviyesi ses yoluna uygulanıyor (%35)',vol);
    }
    await p.evaluate(()=>{setSnd('off');moment('win',0,'k1');});
    ok('ses kapalıyken de slogan yazısı görünür',await waitSlg(p,'TEBRİKLER!'));
    await sleep(1700);
    await p.evaluate(()=>{setSlgAnim(false);moment('win',0,'k3');});await sleep(80);
    ok('slogan animasyonu kapalı: sade görünüm',await p.evaluate(()=>$('#slg').classList.contains('still')&&getComputedStyle($('#slg')).animationName==='slgfade'));
    await sleep(1700);
    await p.evaluate(()=>setSlogan(false));await sleep(1600);
    const r=await p.evaluate(()=>{const x=moment('win',0,'k2');return x;});await sleep(200);
    ok('slogan kapalı: yazı görünmez',!r&&!(await slgText(p)).trim());
    await p.reload();await sleep(300);
    ok('slogan tercihi kalıcı',await p.evaluate(()=>SLOGAN===false&&$('#slIn').checked===false));
    ok('animasyon ve efekt seviyesi kalıcı',await p.evaluate(()=>SLGANIM===false&&$('#saIn').checked===false&&Math.abs(FXVOL-.35)<1e-9&&$('#fxV').value==='35'));
    await p.evaluate(()=>{startLocal();});await sleep(300);await p.click('#bSnd');await sleep(150);
    ok('oyun içi ayar menüsünde aynı ayarlar',await p.evaluate(()=>!!($('#slIn2')&&$('#saIn2')&&$('#fxIn2')&&$('#fxV2'))));
    await p.evaluate(()=>{const r=$('#fxV2');r.value='60';r.dispatchEvent(new Event('input'));r.dispatchEvent(new Event('change'));});
    ok('menüden seviye değişimi ana ekrana yansıdı',await p.evaluate(()=>FXVOL===.6&&$('#fxV').value==='60'&&lsGet('tavla_fxv')===.6));
    ok('ayar menüsü ekranda kalıyor',await p.evaluate(()=>{const r=$('#sndPop').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1;}));
    await p.context().close();
    {const pf=await mkPage(b,{ls:{tavla_snd:'all'},noSW:true});
      const wav=(()=>{const n=2205,buf=Buffer.alloc(44+n*2);buf.write('RIFF',0);buf.writeUInt32LE(36+n*2,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(22050,24);buf.writeUInt32LE(44100,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(n*2,40);return buf;})();
      await pf.context().route(/assets\/sfx\/manifest\.json/,r=>r.fulfill({contentType:'application/json',body:JSON.stringify({checker:['t1.wav','t2.wav'],dice:['t1.wav'],hit:[]})}));
      await pf.context().route(/assets\/sfx\/t\d\.wav/,r=>r.fulfill({contentType:'audio/wav',body:wav}));
      await pf.goto(URL);await sleep(300);await pf.mouse.click(5,5);
      const fr=await pf.evaluate(async()=>{audio();await new Promise(r=>setTimeout(r,500));if(!AC||AC.state!=='running')return null;await TavlaFoley.load(AC);
        const B0=AudioBufferSourceNode.prototype.start;let n=0;AudioBufferSourceNode.prototype.start=function(...a){n++;return B0.apply(this,a);};
        moveSound(false);moveSound(false);await new Promise(r=>setTimeout(r,120));moveSound(false);
        return {has:TavlaFoley.has('checker'),hit:TavlaFoley.has('hit'),n};});
      if(!fr)skip('kayıtlı ses yükleyicisi',`${BR} başsız modunda ses bağlamı başlamadı`);
      else{ok('kayıtlı pul sesi yüklendi ve çalındı (eksik tür sentezde kalır)',fr.has&&!fr.hit&&fr.n>=1,JSON.stringify(fr));
        ok('aynı anda iki pul sesi bindirilmedi',fr.n===2,'çalınan='+fr.n);}
      await pf.context().close();}
    const p5=await mkPage(b,{ls:{tavla_snd:'game'}});await p5.goto(URL);await sleep(300);
    ok('eski "Pul ve zar" tercihi: efekt sesleri kapalı başlar',await p5.evaluate(()=>FXON===false));
    await p5.context().close();
    const p2=await mkPage(b,{ls:{tavla_joke:false}});await p2.goto(URL);await sleep(300);
    ok('eski "esprili yazılar: kapalı" tercihi sloganlara devredildi',await p2.evaluate(()=>SLOGAN===false));
    await p2.context().close();
    const p3=await mkPage(b,{rm:'reduce'});await p3.goto(URL);await sleep(300);
    await p3.evaluate(()=>moment('win',0,'rm'));await sleep(100);
    ok('reduced motion: sade solma animasyonu',await p3.evaluate(()=>getComputedStyle($('#slg')).animationName==='slgfade'));
    await p3.context().close();
    const p4=await mkPage(b,{ls:{tavla_lang:'en'}});await p4.goto(URL);await sleep(300);
    ok('İngilizce: tema başlığı',await p4.evaluate(()=>[...document.querySelectorAll('.sh')].some(e=>e.textContent==='Table theme')));
    await p4.evaluate(()=>moment('hit',0,'en'));
    ok('İngilizce: slogan',await waitSlg(p4,'GOTCHA!'));
    await p4.evaluate(()=>{LANGSEL='tr';LANG='tr';applyLang();});
    ok('dil değişince tema kartları yeniden yazıldı',await p4.evaluate(()=>$('#thHome .thc small').textContent==='Neon ışıklar, gece kulübü'));
    await p4.context().close();
  }

  /* 5) arkadaşla: gönderen/alan, sohbet, yeniden bağlanma, tema değişimi */
  {
    const A=await mkPage(b,{name:'AHMET',ls:{tavla_snd:'off',tavla_theme:'neon'}}),B=await mkPage(b,{name:'BURAK',ls:{tavla_snd:'off',tavla_theme:'sunset'}});
    await A.goto(URL);await B.goto(URL);await sleep(500);await hook(A);await hook(B);
    await A.evaluate(()=>createRoom());await A.waitForFunction(()=>G.code,null,{timeout:5000});
    const code=await A.evaluate(()=>G.code);
    await B.evaluate(c=>joinRoom(c),code);
    await A.waitForFunction(()=>G.seats.w&&G.seats.k,null,{timeout:8000});
    ok('online: iki oyuncu odada',true,'oda '+code);
    await A.waitForFunction(()=>G.av&&G.av.k>=0,null,{timeout:8000}).catch(()=>{});
    await B.waitForFunction(()=>G.av&&G.av.w>=0,null,{timeout:8000}).catch(()=>{}); // B'nin oda verisini alması WebKit'te gecikebilir
    ok('online: avatarlar karşıya iletildi',(await A.evaluate(()=>G.av.k))===(await B.evaluate(()=>AV))&&(await B.evaluate(()=>(G.av||{}).w))===(await A.evaluate(()=>AV)));
    ok('online: rakip avatarı üst bölümde',await A.evaluate(()=>$('#avOp').dataset.v===AVATARS[G.av.k]));
    await A.evaluate(()=>startOnline());
    await B.waitForFunction(()=>G.started,null,{timeout:8000});
    await A.evaluate(()=>{__dice.push(6);opThrowOnline();});
    await B.waitForFunction(()=>G.op&&G.turn===G.me,null,{timeout:8000});
    await B.evaluate(()=>{__dice.push(2);opThrowOnline();});
    await A.waitForFunction(()=>!G.op&&G.turn===1&&!G.opHold,null,{timeout:12000});
    await sleep(800);
    ok('online: açılış zarı sonrası A başlıyor',await B.evaluate(()=>!G.op&&G.turn===1));
    {const r=await A.evaluate(()=>{const st=JSON.parse(JSON.stringify(G.st));window.__st0=st;G.st.bar=[1,2];render();return 1;}).then(()=>barCheck(A));
      await A.evaluate(()=>{G.st=window.__st0;render();});
      ok('online: ZAR AT bardaki kırık pulları kapatmaz',r.btn&&r.bar===3&&!r.cakisma,JSON.stringify(r));}
    await A.evaluate(()=>{__dice.push(4,4);doRoll(218,200);});
    ok('online gönderen: çift zar sloganı',await waitSlg(A,'HOPP! ÇİFTE GELDİ!'));
    await sleep(600);
    ok('online alan: rakibin çift zarında slogan yok',!(await slgText(B)).includes('ÇİFTE'));
    for(let i=0;i<4;i++){await A.evaluate(()=>{if(!G.dice.length||G.busy)return;const ms=legalMoves(G.st,1,G.dice);if(ms.length)doHuman(ms[0]);});await sleep(500);}
    await B.waitForFunction(()=>G.turn===-1,null,{timeout:8000}).catch(()=>{});
    const sa=await A.evaluate(()=>JSON.stringify(G.st)),sb=await B.evaluate(()=>JSON.stringify(G.st));
    ok('online: hamleler karşıya aynen ulaştı',sa===sb);
    ok('sohbette mikrofon düğmesi',await A.isVisible('#bMic'));
    // sohbet
    await A.fill('#chatIn','Selam, iyi oyunlar!');await A.click('#chatForm button[type=submit]');
    await B.waitForFunction(()=>$('#chatList').textContent.includes('Selam, iyi oyunlar!'),null,{timeout:6000}).catch(()=>{});
    ok('sohbet: mesaj karşıya ulaştı',await B.evaluate(()=>$('#chatList').textContent.includes('Selam, iyi oyunlar!')));
    await B.fill('#chatIn','Sana da 👋');await B.press('#chatIn','Enter');
    await A.waitForFunction(()=>$('#chatList').textContent.includes('Sana da'),null,{timeout:6000}).catch(()=>{});
    ok('sohbet: cevap geri ulaştı',await A.evaluate(()=>$('#chatList').textContent.includes('Sana da')));
    // tema değişimi online maç ortasında
    ok('online: rakip odada kurucunun temasıyla oynuyor (aynı ünvan)',await B.evaluate(()=>THEME==='neon'),await B.evaluate(()=>THEME));
    const before=await stSnap(A);
    await A.evaluate(()=>applyTheme('poker',true));await sleep(300);
    ok('online: tema değişimi durumu değiştirmedi',before===await stSnap(A));
    ok('online: aynı ünvanda kurucunun teması iki tarafta (neon→poker)',await B.waitForFunction(()=>THEME==='poker',null,{timeout:6000}).then(()=>true,()=>false),await B.evaluate(()=>THEME));
    ok('online: rakibin kendi tema tercihi saklı kaldı',await B.evaluate(()=>myTheme()==='sunset'));
    // yeniden bağlanma
    await B.reload();await B.waitForFunction(()=>G.mode==='online'&&G.loaded,null,{timeout:8000}).catch(()=>{});
    await sleep(800);
    ok('yeniden bağlanma: B odaya döndü ve durum aynı',(await B.evaluate(()=>JSON.stringify(G.st)))===(await A.evaluate(()=>JSON.stringify(G.st))));
    ok('yeniden bağlanma: sohbet geçmişi geldi',await B.evaluate(()=>$('#chatList').textContent.includes('Selam')));
    // sohbet açık ekran görüntüleri
    for(const t of THEMES){await A.evaluate(t=>applyTheme(t,false),t);await sleep(250);await A.screenshot({path:`${OUT}/${t}-3-chat.png`});}
    // iPhone klavye: 16px altı yazı tipi yakınlaştırma yapar
    ok('sohbet girişi 16px (iOS yakınlaştırmaz)',await A.evaluate(()=>parseFloat(getComputedStyle($('#chatIn')).fontSize)>=16));
    // CI'daki geniş yedek yazı tiplerini taklit et: başlık yine de taşmamalı
    await A.evaluate(()=>{const st=document.createElement('style');st.id='wideFont';st.textContent='#chatHead,#chatHead *{font-family:"DejaVu Sans",Verdana,sans-serif!important;letter-spacing:.06em!important}';document.head.appendChild(st);});
    await A.setViewportSize({width:375,height:380});await A.focus('#chatIn');await sleep(300);
    const vis=await A.evaluate(()=>{const r=$('#chatIn').getBoundingClientRect();return {ok:r.bottom<=innerHeight&&r.top>=0&&document.scrollingElement.scrollWidth<=innerWidth,t:Math.round(r.top),b:Math.round(r.bottom),ih:innerHeight,sw:document.scrollingElement.scrollWidth,sy:scrollY,chat:Math.round($('#chat').getBoundingClientRect().top),over:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+.5&&getComputedStyle(e).position!=='fixed';}).slice(0,6).map(e=>(e.id||e.className.baseVal||e.className||e.tagName)+':'+Math.round(e.getBoundingClientRect().right))};});
    ok('kısa ekran (klavye açık benzetimi): giriş görünür, yatay taşma yok',vis.ok,JSON.stringify(vis));
    await A.screenshot({path:`${SP}/keyboard-sim.png`});
    // yeniden bağlanma sonrası süre halkası: sırası gelen tarafta etkin
    ok('yeniden bağlanma: süre halkası sırası gelen oyuncuda',await B.evaluate(()=>{const mine=G.turn===G.me;return $('#avw'+(mine?'Me':'Op')).classList.contains('ton')&&!$('#avw'+(mine?'Op':'Me')).classList.contains('ton');}));
    // ikinci oyuncu (kırmızı) kendi ekranından kanala toplar
    {await A.evaluate(()=>{const b=Array(24).fill(0);Object.assign(b,{0:15});[[23,-2],[22,-3],[18,-3]].forEach(([i,v])=>b[i]=v);G.st={b,bar:[0,0],off:[0,7]};G.turn=-1;G.rolled=true;G.dice=[6,5];G.all=[6,5];
        pushFields({b:G.st.b,bar:G.st.bar,off:G.st.off,turn:-1,rolled:true,dice:[6,5],all:[6,5],last:null});render();});
      await B.waitForFunction(()=>G.st.off[1]===7&&G.turn===G.me&&G.rolled,null,{timeout:6000}).catch(()=>{});
      await B.setViewportSize(DEV?DEV.viewport:{width:390,height:844});await sleep(300);
      await press(B,'#bg rect[data-k="pt"][data-i="5"]');await sleep(150);await press(B,'#bg rect[data-k="off"]');
      await A.waitForFunction(()=>G.st.off[1]===8,null,{timeout:6000}).catch(()=>{});
      ok('online: ikinci oyuncu dokunarak kanala topladı, karşıya ulaştı',await A.evaluate(()=>G.st.off[1]===8),await A.evaluate(()=>JSON.stringify(G.st.off)));}
    // rakip 2 sayıyla çekilir: kazanan tarafta "PES ETTİ!", mars değil; çekilen tarafta slogan yok
    await A.setViewportSize(DEV?DEV.viewport:{width:390,height:844});
    {const na=await A.evaluate(()=>__log.length),nb=await B.evaluate(()=>__log.length);
      await B.evaluate(()=>{$('#overlay').hidden=true;G.turn=G.me;G.rolled=false;gameOver(-G.me,2,'resign');});
      ok('online: rakip çekildi, kazanan tarafta PES ETTİ!',await waitSlg(A,'PES ETTİ!',6000),await slgText(A));
      const la=await A.evaluate(n=>__log.slice(n),na),lb=await B.evaluate(n=>__log.slice(n),nb);
      ok('online: çekilmede mars sloganı yok, çekilen tarafta slogan yok',!la.some(x=>x.startsWith('mars'))&&!lb.length,la.concat(['|']).concat(lb).join(','));}
    ok('online testlerde sayfa hatası yok',!A.errs.length&&!B.errs.length,A.errs.concat(B.errs).join('|'));
    await A.context().close();await B.context().close();
  }
  /* 5i) odalar listesi: kurulan oda listelenir (puan, set, tema), listeden katılma, kurucu rakibi atar, ünvana göre oda teması */
  {
    const A=await mkPage(b,{name:'AHMET',ls:{tavla_snd:'off',tavla_theme:'neon',tavla_target:5,tavla_tl:30,tavla_xp:{v:1,xp:5000,g:0,w:0}}});
    const B=await mkPage(b,{name:'BURAK',ls:{tavla_snd:'off',tavla_theme:'sunset',tavla_hm:'on'}});
    const C=await mkPage(b,{name:'CEMİL',ls:{tavla_snd:'off',tavla_theme:'arcade',tavla_hm:'on',tavla_xp:{v:1,xp:20000,g:0,w:0}}});
    await A.goto(URL);await B.goto(URL);await C.goto(URL);await sleep(600);
    await press(B,'#mOnline');await press(C,'#mOnline');await sleep(300);
    ok('odalar: Arkadaşınla seçiliyken odalar bölümü görünüyor',await B.evaluate(()=>!$('#optOn').hidden&&!!$('#rmList')&&$('#rmList').offsetHeight>0));
    await A.evaluate(()=>createRoom());await A.waitForFunction(()=>G.code&&G.loaded,null,{timeout:6000});
    const code=await A.evaluate(()=>G.code),row=`#rmList .rmj[data-c="${code}"]`;
    const listed=await B.waitForSelector(row,{timeout:8000}).then(()=>true,()=>false);
    ok('odalar: kurulan oda listede',listed,code);
    const txt=await B.evaluate(r=>{const e=document.querySelector(r);return e?e.closest('.rm').textContent:'';},row);
    const lvA=await A.evaluate(()=>myLv()),ttlA=await A.evaluate(()=>lvTitle(myLv()));
    ok('odalar: kurucunun adı, level/ünvanı ve puanı',txt.includes('AHMET')&&txt.includes('Level '+lvA)&&txt.includes(ttlA)&&/5[.,]?000 puan/.test(txt),txt);
    ok('odalar: set sayısı, hamle süresi ve tema',txt.includes('5 set')&&txt.includes('30 sn')&&txt.includes('Neon Club'),txt);
    // ekran görüntüleri: odalar listesi, dört tema (390×844)
    for(const t of THEMES){await B.evaluate(t=>applyTheme(t,true),t);await sleep(350);
      await B.evaluate(()=>{const e=$('#rmList');e.closest('.og').scrollIntoView({block:'center'});});await sleep(200);
      await B.screenshot({path:`${OUT}/odalar-${t}.png`});}
    await B.evaluate(()=>applyTheme('sunset',true));
    await B.click(row);
    await B.waitForFunction(c=>G.mode==='online'&&G.code===c&&G.loaded,code,{timeout:8000}).catch(()=>{});
    ok('odalar: listeden katıldı, ikinci koltukta',await B.evaluate(c=>G.mode==='online'&&G.code===c&&G.me===-1,code));
    await A.waitForFunction(()=>G.seats.k,null,{timeout:8000}).catch(()=>{});
    await sleep(500);
    ok('odalar: rakip oturunca oda listeden kalktı',await C.evaluate(c=>!document.querySelector(`#rmList .rmj[data-c="${c}"]`),code)&&(await (await fetch(`${DB}/lobby/${code}.json`)).json())===null);
    ok('oda teması: kurucu üst ünvanda, iki tarafta kurucunun teması',await B.evaluate(()=>THEME==='neon')&&await A.evaluate(()=>THEME==='neon'),await B.evaluate(()=>THEME));
    ok('odalar: ilk seti yalnız kurucu başlatır',await B.evaluate(()=>{const c=centerBtn();startOnline();return c&&!c.en&&!G.started;}));
    ok('odadan at: kurucuda düğme görünüyor',await A.evaluate(()=>!$('#bKick').hidden&&$('#bKick').textContent.includes('BURAK')));
    ok('odadan at: rakipte düğme yok',await B.evaluate(()=>$('#bKick').hidden));
    // ekran görüntüleri: kurucunun ekranı (rakip katıldı, odadan at), dört tema; kurucu belirleyici olduğu için tema iki tarafta değişir
    for(const t of THEMES){await A.evaluate(t=>applyTheme(t,true),t);await B.waitForFunction(t=>THEME===t,t,{timeout:5000}).catch(()=>{});await sleep(350);
      await A.screenshot({path:`${OUT}/odadan-at-${t}.png`});}
    ok('oda teması: kurucunun seçimi rakibe de geçti',await B.evaluate(()=>THEME==='arcade'));
    await A.evaluate(()=>applyTheme('neon',true));
    await press(A,'#bKick');await sleep(200);await press(A,'#ovOk');
    await B.waitForFunction(()=>!G.mode,null,{timeout:8000}).catch(()=>{});
    ok('odadan at: rakip ana ekrana döndü, bilgilendirildi',await B.evaluate(()=>!G.mode&&$('#lobbyMsg').textContent.includes('çıkardı')),await B.evaluate(()=>$('#lobbyMsg').textContent));
    ok('odadan at: rakip kendi temasına döndü',await B.evaluate(()=>THEME==='sunset'));
    ok('odadan at: kurucuda koltuk boşaldı',await A.evaluate(()=>!G.seats.k&&$('#bKick').hidden));
    ok('odadan at: oda yeniden listede',await C.waitForSelector(row,{timeout:8000}).then(()=>true,()=>false));
    await B.evaluate(c=>joinRoom(c),code);await sleep(800);
    ok('odadan at: atılan oyuncu tekrar giremez',await B.evaluate(()=>!G.mode&&$('#lobbyMsg').textContent===i18('banned')));
    await C.click(row);
    await C.waitForFunction(c=>G.mode==='online'&&G.code===c&&G.loaded,code,{timeout:8000}).catch(()=>{});
    await A.waitForFunction(()=>G.seats.k&&G.th.k,null,{timeout:8000}).catch(()=>{});await sleep(400);
    ok('oda teması: üst ünvanlı rakip girince iki tarafta onun teması',await A.evaluate(()=>THEME==='arcade')&&await C.evaluate(()=>THEME==='arcade'),await A.evaluate(()=>THEME+' '+JSON.stringify(G.th)+' '+JSON.stringify(G.lv)));
    await A.evaluate(()=>applyTheme('poker',true));await sleep(300);
    ok('oda teması: alt ünvanlı kurucunun seçimi odayı değiştirmez, bildirilir',await A.evaluate(()=>THEME==='arcade'&&myTheme()==='poker'&&$('#msg').textContent.includes('Arcade')),await A.evaluate(()=>$('#msg').textContent));
    await A.evaluate(()=>startOnline());
    await C.waitForFunction(()=>G.started,null,{timeout:8000}).catch(()=>{});
    ok('odalar: kurucu başlattı, set başladı; atma düğmesi kalktı',await C.evaluate(()=>G.started)&&await A.evaluate(()=>$('#bKick').hidden));
    await A.evaluate(()=>showHome());await sleep(300);
    ok('oda teması: ana ekranda kendi temasına döndü',await A.evaluate(()=>THEME==='poker'));
    ok('odalar testinde sayfa hatası yok',!A.errs.length&&!B.errs.length&&!C.errs.length,A.errs.concat(B.errs,C.errs).join('|'));
    await A.context().close();await B.context().close();await C.context().close();
  }
  /* 5b) davet bağlantısı: ismi olmayan arkadaş ?oda= ile açar, isim girer, odaya oturur */
  {
    const A=await mkPage(b,{name:'AHMET',ls:{tavla_snd:'off'}}),B=await mkPage(b,{guest:true,ls:{tavla_snd:'off',tavla_name:''}});
    await A.goto(URL);await sleep(400);
    await A.evaluate(()=>createRoom());await A.waitForFunction(()=>G.code,null,{timeout:5000});
    const code=await A.evaluate(()=>G.code),inv=await A.evaluate(()=>inviteURL(G.code));
    ok('davet: bağlantı oda kodunu taşıyor',inv===URL+'?oda='+code,inv);
    ok('davet: oda düğmesi bağlantı paylaşımını anlatıyor',await A.evaluate(()=>$('#bChip').title==='Davet bağlantısını paylaş'));
    await B.goto(inv);await sleep(500);
    ok('davet: misafir onaylamadan odaya girilmedi, ad sorulmuyor',await B.evaluate(()=>!G.mode&&!$('#overlay').hidden&&!$('#nmIn')&&!!document.querySelector('#ovBox [data-ac=g]')));
    await B.click('#ovOk');
    await B.waitForFunction(()=>G.mode==='online'&&G.loaded,null,{timeout:8000}).catch(()=>{});
    ok('davet: arkadaş ikinci koltuğa oturdu',await B.evaluate(c=>G.mode==='online'&&G.code===c&&G.me===-1,code));
    ok('davet: adres çubuğundaki kod temizlendi',await B.evaluate(()=>!location.search.includes('oda=')));
    await A.waitForFunction(()=>G.seats.w&&G.seats.k,null,{timeout:8000}).catch(()=>{});
    ok('davet: kurucu rakibi ve misafir adını (GUEST…) görüyor',await A.evaluate(()=>!!(G.seats.k&&G.nm&&/^GUEST\d{4}$/.test(G.nm.k))),await A.evaluate(()=>JSON.stringify(G.nm)));
    await B.reload();await B.waitForFunction(()=>G.mode==='online'&&G.loaded,null,{timeout:8000}).catch(()=>{});
    ok('davet: yenileyince aynı odaya geri bağlandı',await B.evaluate(c=>G.mode==='online'&&G.code===c&&G.me===-1,code));
    ok('davet testinde sayfa hatası yok',!A.errs.length&&!B.errs.length,A.errs.concat(B.errs).join('|'));
    await A.context().close();await B.context().close();
  }
  /* 5d) giriş tahtası oklarla/kaydırarak tema seçer; oyun ekranında isim etiketi yok */
  {
    const p=await mkPage(b,{ls:{tavla_snd:'off',tavla_theme:'neon'}});await p.goto(URL);await sleep(400);
    await p.click('#heroNext');await sleep(200);
    ok('giriş tahtası: sonraki ok temayı değiştirip kaydetti',await p.evaluate(()=>THEME==='sunset'&&lsGet('tavla_theme')==='sunset'&&$('#heroN b').textContent==='Sunset Pop'));
    await p.click('#heroPrev');await p.click('#heroPrev');await sleep(200);
    ok('giriş tahtası: önceki ok başa sarıyor',await p.evaluate(()=>THEME==='arcade'));
    const r=await p.evaluate(()=>{const x=$('#hero').getBoundingClientRect();return {x:x.left+x.width/2,y:x.top+x.height/2};});
    await p.evaluate(({x,y})=>{const h=$('#hero'),ev=(t,cx)=>h.dispatchEvent(new PointerEvent(t,{bubbles:true,clientX:cx,clientY:y,pointerId:1}));ev('pointerdown',x+80);ev('pointerup',x-80);},r);await sleep(200);
    ok('giriş tahtası: sola kaydırınca sonraki tema',await p.evaluate(()=>THEME==='neon'));
    await p.click('#bGo');await sleep(500);
    ok('oyun ekranı: tahta üstünde/altında isim etiketi yok, sıra yazısı skor kutusunda',await p.evaluate(()=>!$('#tags .ntg')&&$('#ascS').classList.contains('sira')&&$('#ascS').textContent==='SIRA SENDE'),await p.evaluate(()=>$('#ascS').textContent));
    ok('bilgisayarın adı BuBi (üst bölüm ve geçmiş başlığı)',await p.evaluate(()=>$('#anOp').textContent==='BuBi'&&$('#histList .hh').textContent.includes('BuBi')),await p.evaluate(()=>$('#anOp').textContent));
    ok('tema kaydırma testinde sayfa hatası yok',!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }
  /* 5e) ses: iOS'ta askıya alınan ses bağlamı ses anında yeniden açılır, ses düşmez */
  if(BR==='chromium'){
    const p=await mkPage(b,{ls:{tavla_snd:'all'},noSW:true});await p.goto(URL);await sleep(300);
    await p.mouse.click(5,5);await sleep(200);
    const r=await p.evaluate(async()=>{const ac=audio();await ac.suspend();const o0=__osc;moveSound(false);await new Promise(r=>setTimeout(r,350));return {st:ac.state,d:__osc-o0};});
    ok('ses: bağlam askıdayken pul sesi bağlamı açıp çaldı',r.st==='running'&&r.d>0,JSON.stringify(r));
    const k2=await p.evaluate(async()=>{const ac=audio();const b2=await loadOh2(ac);await loadOh(ac);const used=[];const o=ac.createBufferSource.bind(ac);
      ac.createBufferSource=()=>{const n=o();const st=n.start.bind(n);n.start=(...a)=>{used.push(n.buffer===b2?'oh2':'x');return st(...a);};return n;};
      ohSound(1);const one=used.filter(x=>x==='oh2').length;ohSound(2);await new Promise(r=>setTimeout(r,50));const two=used.filter(x=>x==='oh2').length;ac.createBufferSource=o;
      return {yuklendi:!!b2,sure:b2&&+b2.duration.toFixed(2),bir:one,iki:two,eski:used.filter(x=>x==='x').length};});
    ok('kırık sesi: yeni kayıt yalnız 2. ve sonraki kırıkta, eski sesle birlikte çalar',k2.yuklendi&&k2.bir===0&&k2.iki===1&&k2.eski>=2,JSON.stringify(k2));
    ok('ses testinde sayfa hatası yok',!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }
  /* 5g) sinematik tema kartları (Faz 1): yazısız orta bant, yedek, taşma, çekmece */
  {
    const p=await mkPage(b,{ls:{tavla_snd:'off',tavla_theme:'neon'}});await p.goto(URL);await sleep(300);
    await p.evaluate(()=>$('#thHome').scrollIntoView());
    await p.waitForFunction(()=>[...document.querySelectorAll('#thHome .thimg')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:8000}).catch(()=>{});
    const r=await p.evaluate(()=>[...document.querySelectorAll('#thHome .thc')].map(c=>{const i=c.querySelector('.thimg'),cs=i&&getComputedStyle(i),pv=c.querySelector('.thpv').getBoundingClientRect();
      return {t:c.dataset.t,w:i&&i.naturalWidth,h:i&&i.naturalHeight,fit:cs&&cs.objectFit,pos:cs&&cs.objectPosition,lazy:i&&i.loading,kare:Math.abs(pv.width-pv.height)<1.5,ad:c.querySelector('b').textContent};}));
    ok('tema kartı: dört temada sinematik görsel yüklendi (384×1024)',r.length===4&&r.every(x=>x.w===384&&x.h===1024),JSON.stringify(r.map(x=>x.t+':'+x.w+'×'+x.h)));
    ok('tema kartı: yalnızca yazısız orta bant (kare pencere, cover, %65)',r.every(x=>x.fit==='cover'&&x.pos==='50% 65%'&&x.kare),JSON.stringify(r[0]));
    ok('tema kartı: ad ve açıklama HTML\'den (görselde yazı yok)',r.map(x=>x.ad).join()==='Neon Club,Sunset Pop,Poker Lounge,Street Arcade');
    ok('tema kartı: görseller tembel yükleniyor (lazy)',r.every(x=>x.lazy==='lazy'));
    const sel=await p.evaluate(()=>{const c=$('#thHome .thc[aria-pressed=true]'),a=getComputedStyle(c,'::after');return a.content.includes('✓')&&+a.zIndex>=2;});
    ok('tema kartı: seçili işaret görselin üstünde',sel);
    await p.click('#thHome .thc[data-t=poker]');await sleep(200);
    ok('tema kartı: dokununca tema değişip kaydedildi',await p.evaluate(()=>THEME==='poker'&&lsGet('tavla_theme')==='poker'));
    // CI'daki geniş yedek yazı tipini taklit et (en kötü durum)
    await p.evaluate(()=>{const st=document.createElement('style');st.id='wideHome';st.textContent='#home,#home *{font-family:"DejaVu Sans",Verdana,sans-serif!important}';document.head.appendChild(st);});
    for(const w of [320,375,390,430]){await p.setViewportSize({width:w,height:740});await sleep(150);
      ok(`tema kartı: ${w}px'te yatay taşma yok`,await p.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth&&$('#home').scrollWidth<=$('#home').clientWidth+1&&[...document.querySelectorAll('#thHome .thc')].every(c=>c.getBoundingClientRect().right<=innerWidth+.5)));}
    await p.evaluate(()=>$('#wideHome').remove());
    // oyunda çekmece: kısa ekranda da Kapat'a ulaşılır
    await p.setViewportSize({width:390,height:664});await p.click('#bGo');await sleep(400);
    await p.evaluate(()=>themeMenu());await sleep(500);
    const dr=await p.evaluate(()=>{const k=[...document.querySelectorAll('#thDrawer button')].find(b=>/Kapat/.test(b.textContent));k&&k.scrollIntoView({block:'nearest'});const r=k&&k.getBoundingClientRect();return {k:!!k,ok:!!r&&r.bottom<=innerHeight+1&&r.top>=0,imgs:document.querySelectorAll('#thDrawer .thimg').length};});
    ok('tema çekmecesi: dört sinematik kart, kısa ekranda Kapat erişilebilir',dr.k&&dr.ok&&dr.imgs===4,JSON.stringify(dr));
    ok('tema kartı testinde sayfa hatası yok',!p.errs.length,p.errs.join('|'));
    await p.context().close();
    // yedek: görseller yüklenemezse kod çizimi önizleme görünür
    const q=await mkPage(b,{ls:{tavla_snd:'off'}});await q.route(/theme-cards\/.*\.webp/,r=>r.abort());await q.goto(URL);await sleep(300);
    await q.evaluate(()=>$('#thHome').scrollIntoView());await sleep(600);
    ok('tema kartı: görsel yüklenemezse kod çizimi önizleme görünür',await q.evaluate(()=>!document.querySelector('#thHome .thimg')&&[...document.querySelectorAll('#thHome .thpv svg')].every(s=>s.getBoundingClientRect().height>20)));
    await q.context().close();
  }
  /* 5h) kırık pulun tek ve zorunlu girişi sormadan oynanır */
  {
    const p=await mkPage(b,{ls:{tavla_snd:'off'}});await p.goto(URL);await sleep(300);await p.click('#bGo');await sleep(500);
    const set=(b0,bar,dice)=>p.evaluate(([b0,bar,dice])=>{G.run++;G.autoTok++;const b=Array(24).fill(0);for(const [i,v] of Object.entries(b0))b[+i]=v;
      G.st={b,bar,off:[0,0]};Object.assign(G,{op:0,turn:G.me,rolled:true,all:dice.slice(),dice:dice.slice(),busy:false,auto:false,over:false,sel:null,last:null,hist:[]});render();humanProceed();},[b0,bar,dice]);
    const me=await p.evaluate(()=>G.me);const E=d=>me===1?24-d:d-1,O=-me;
    // 2-6: rakibin 6 kapısı kapalı, 2 açık, başka pullar da var (6 için seçenek) → 2'ye otomatik girer, 6'yı oyuncu seçer
    await set({[E(6)]:2*O,[E(1)]:2*O,[me===1?12:11]:3*me,[me===1?7:16]:3*me,[me===1?5:18]:4*me,[me===1?23:0]:2*me},me===1?[1,0]:[0,1],[2,6]);
    await p.waitForFunction(()=>!G.auto&&G.st.bar[K(G.me)]===0,null,{timeout:4000}).catch(()=>{});
    const r=await p.evaluate(e=>({bar:G.st.bar[K(G.me)],giris:G.st.b[e]*G.me,zar:G.dice.slice(),busy:G.busy}),E(2));
    ok('zorunlu giriş: 2-6, 6 kapalı → kırık pul sormadan 2\'ye girdi, 6 oyuncuda',r.bar===0&&r.giris>=1&&r.zar.join()==='6'&&!r.busy,JSON.stringify(r));
    // 2-6: iki giriş de açık → sormalı (otomatik oynamamalı)
    await set({[E(1)]:2*O,[me===1?12:11]:3*me,[me===1?5:18]:4*me},me===1?[1,0]:[0,1],[2,6]);await sleep(1500);
    ok('zorunlu giriş: iki giriş açıkken oyuncuya sorulur',await p.evaluate(()=>G.st.bar[K(G.me)]===1&&G.dice.length===2));
    // çift (3-3), iki kırık, yalnız 3 açık → iki pul da girer
    await set({[E(1)]:2*O,[E(2)]:2*O,[E(4)]:2*O,[E(5)]:2*O,[E(6)]:2*O,[me===1?12:11]:3*me},me===1?[2,0]:[0,2],[3,3,3,3]);
    await p.waitForFunction(()=>!G.auto&&G.st.bar[K(G.me)]===0,null,{timeout:6000}).catch(()=>{});
    ok('zorunlu giriş: 3-3 ile iki kırık pul da otomatik girdi',await p.evaluate(()=>G.st.bar[K(G.me)]===0),await p.evaluate(()=>JSON.stringify({bar:G.st.bar,zar:G.dice})));
    ok('zorunlu giriş testinde sayfa hatası yok',!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }
  /* 5c) kısa Safari ekranı: tahta tam genişlik, alt panelde 3 satır (eskiler ▲ ▼ ile), panel tahtayla hizalı */
  {
    const p=await mkPage(b,{vp:{width:390,height:664},ls:{tavla_snd:'off'}});await p.goto(URL);await sleep(400);
    await p.click('#bGo');await sleep(500);
    const bw=await p.evaluate(()=>{const r=$('#board').getBoundingClientRect();return {l:r.left,r:innerWidth-r.right,h:r.height,w:r.width};});
    ok('kısa ekran: tahta yanlarda en fazla 6px boşluk bırakıyor',bw.l<=6&&bw.r<=6,JSON.stringify(bw));
    ok('kısa ekran: tahta yüksekliğe göre küçülmedi',Math.abs(bw.h-bw.w*406/410)<2,JSON.stringify(bw));
    ok('kısa ekran (390×664): üst bölüm, tahta ve alt panel kaydırmadan tek ekrana sığıyor',await p.evaluate(()=>{const pl=$('#play');return pl.scrollHeight<=pl.clientHeight+1;}),await p.evaluate(()=>$('#play').scrollHeight+'/'+$('#play').clientHeight));
    // CI'daki geniş yedek yazı tiplerini taklit et: rakip adı yine de kesilmemeli
    await p.evaluate(()=>{const st=document.createElement('style');st.textContent='#adv,#adv *{font-family:"DejaVu Sans",Verdana,sans-serif!important}';document.head.appendChild(st);$('#anOp').dataset.fk='';$('#anMe').dataset.fk='';});
    await p.evaluate(()=>{G.turn=-G.me;render();});
    ok('sıra rakipteyken yazı skor kutusunda ve üst bölüm taşmıyor',await p.evaluate(()=>{const a=$('#adv');return $('#ascS').textContent==='SIRA RAKİPTE'&&$('#anOp').scrollWidth<=$('#anOp').clientWidth+1&&a.scrollWidth<=a.clientWidth+1&&document.scrollingElement.scrollWidth<=innerWidth;}),await p.evaluate(()=>$('#ascS').textContent));
    await p.evaluate(()=>{G.turn=G.me;render();});
    ok('kısa ekran: alt panele kaydırarak ulaşılıyor',await p.evaluate(()=>{const pl=$('#play');pl.scrollTop=9999;const r=$('#chat').getBoundingClientRect();return r.bottom<=innerHeight+1;}));
    await p.evaluate(()=>{G.hl=[1,2,3,4,5].map(i=>({w:[i,1],k:[i,2]}));histPaint(true);
      CH.msgs=[1,2,3,4,5].map(i=>({from:i%2?TOKEN:'x',nm:'ALI',text:'m'+i,t:i}));chatPaint();});
    // listede tamamen görünen satırlar
    const vis=sel=>p.evaluate(sel=>{const l=sel.startsWith('#chat')?$('#chatList'):$('#histList'),L=l.getBoundingClientRect();
      return [...l.querySelectorAll(sel.split(' ').pop())].filter(e=>{const r=e.getBoundingClientRect();return r.height&&r.top>=L.top-1&&r.bottom<=L.bottom+1;}).map(e=>e.querySelector('.n')?e.querySelector('.n').textContent:e.textContent).join();},sel);
    ok('geçmiş: 3 satır görünür, en son zar altta',await vis('#histList .hr')==='3,4,5',await vis('#histList .hr'));
    ok('geçmiş: eski zarlar ▲ ile görülür, ▼ ile geri dönülür',await (async()=>{const up0=await p.evaluate(()=>!$('#scUp').disabled&&$('#scDn').disabled);
      await p.click('#scUp');await sleep(150);const a=await vis('#histList .hr');await p.click('#scUp');await sleep(150);const b2=await vis('#histList .hr');
      const top=await p.evaluate(()=>$('#scUp').disabled);await p.click('#scDn');await p.click('#scDn');await sleep(150);const c=await vis('#histList .hr');
      return up0&&a==='2,3,4'&&b2==='1,2,3'&&top&&c==='3,4,5';})());
    await p.evaluate(()=>setTab('c'));await sleep(100);
    ok('sohbet: 3 mesaj görünür, en yenisi altta',await vis('#chatList .cm')==='m3,m4,m5',await vis('#chatList .cm'));
    await p.click('#scUp');await sleep(150);
    ok('sohbet: ▲ ile önceki mesaj görünür',await vis('#chatList .cm')==='m2,m3,m4',await vis('#chatList .cm'));
    await p.evaluate(()=>{CH.msgs=CH.msgs.concat([{from:'x',nm:'ALI',text:'m6',t:6}]);chatPaint();});await sleep(100);
    ok('sohbet: yeni mesaj gelince en alta iner',await vis('#chatList .cm')==='m4,m5,m6',await vis('#chatList .cm'));
    ok('sohbet yazısı büyük (≥15px) ve panel tahtayla sağdan soldan hizalı',await p.evaluate(()=>{const b=$('#board').getBoundingClientRect(),c=$('#chat').getBoundingClientRect();
      return parseFloat(getComputedStyle($('#chatList .cm')).fontSize)>=15&&Math.abs(b.left-c.left)<=1&&Math.abs(b.right-c.right)<=1;}),await p.evaluate(()=>JSON.stringify([$('#board').getBoundingClientRect().left,$('#chat').getBoundingClientRect().left])));
    await p.evaluate(()=>setTab('h'));
    ok('kısa ekran testinde sayfa hatası yok',!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }
  /* 5f) ZAR AT düğmesi bardaki kırık pulları kapatmaz (dört tema, bilgisayara karşı) */
  for(const t of THEMES){
    const p=await mkPage(b,{ls:{tavla_snd:'off',tavla_theme:t}});await p.goto(URL);await sleep(300);
    await p.waitForFunction(()=>document.documentElement.classList.contains('asset'),null,{timeout:6000}).catch(()=>{});
    await p.click('#bGo');await sleep(400);
    const w0=await p.evaluate(()=>Math.round($('#board').getBoundingClientRect().width));
    const set=(bar,ex)=>p.evaluate(([bar,ex])=>{G.run++;const b=Array(24).fill(0);Object.assign(b,{0:2,1:2,2:3,3:2,4:2,5:2,12:2});[[23,-2],[18,-4],[16,-3],[11,-4],[20,-1]].forEach(([i,v])=>b[i]=v);
      G.st={b,bar,off:[0,0]};Object.assign(G,{op:0,turn:1,rolled:false,dice:[],all:[],busy:false,over:false,sel:null,last:null},ex||{});render();},[bar,ex]);
    await set([0,0]);let r=await barCheck(p);
    ok(`[${t}] ZAR AT: bar boşken düğme ortada görünür`,r.btn&&await p.evaluate(()=>!($('#bg .rbig').getAttribute('transform')||'').includes('translate(99')));
    await set([0,1]);r=await barCheck(p);
    ok(`[${t}] ZAR AT: rakip kırıkken düğme görünür ama bardaki pulu kapatmaz`,r.btn&&r.bar===1&&!r.cakisma,JSON.stringify(r));
    await set([2,3]);r=await barCheck(p);
    ok(`[${t}] ZAR AT: iki taraf kırıkken (2 + 3) hiçbir pul kapanmaz`,r.btn&&r.bar===5&&!r.cakisma,JSON.stringify(r));
    await set([2,3],{rolled:true,all:[6,4],dice:[6,4],seed:4242});r=await barCheck(p);
    ok(`[${t}] ZAR AT: zar atılınca düğme kaybolur, 5 kırık pulun hepsi görünür`,!r.btn&&r.bar===5,JSON.stringify(r));
    await set([0,1],{turn:-1});r=await barCheck(p);
    ok(`[${t}] ZAR AT: sıra rakipteyken düğme yok`,!r.btn,JSON.stringify(r));
    ok(`[${t}] ZAR AT: tahta küçülmedi`,r.boardW===w0,w0+' → '+r.boardW);
    ok(`[${t}] ZAR AT: tahtaya dokununca zar atılıyor`,await (async()=>{await set([0,1]);const bx=await p.evaluate(()=>{const r=$('#board').getBoundingClientRect();return {x:r.left+r.width*.78,y:r.top+r.height*.5};});await p.mouse.click(bx.x,bx.y);await sleep(200);return p.evaluate(()=>G.rolled||G.busy);})());
    await set([0,0]);let bn=await banCheck(p);
    ok(`[${t}] ZARINI AT!: bar boşken ortada, ZAR AT düğmesine değmez`,!bn.side&&!bn.dugmeyeDeger&&bn.tahtaIcinde,JSON.stringify(bn));
    await set([0,1]);bn=await banCheck(p);
    ok(`[${t}] ZARINI AT!: rakip kırıkken bardaki pula ve düğmeye değmez, bara taşmaz`,bn.side&&bn.pul===1&&!bn.pulaDeger&&!bn.dugmeyeDeger&&!bn.bariKesiyor&&bn.tahtaIcinde,JSON.stringify(bn));
    await set([2,3]);bn=await banCheck(p);
    ok(`[${t}] ZARINI AT!: iki taraf kırıkken (2 + 3) hiçbir pula ve düğmeye değmez`,bn.side&&bn.pul===5&&!bn.pulaDeger&&!bn.dugmeyeDeger&&!bn.bariKesiyor&&bn.tahtaIcinde,JSON.stringify(bn));
    ok(`[${t}] ZARINI AT!: yazı okunur boyutta (ekranda en az 20 px)`,bn.ekranPx>=20,JSON.stringify(bn));
    ok(`[${t}] ZAR AT testinde sayfa hatası yok`,!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }
  /* 6) küçük iPhone (SE) */
  {
    const p=await mkPage(b,{vp:{width:375,height:667},ls:{tavla_theme:'arcade',tavla_snd:'off'}});await p.goto(URL);await sleep(300);
    ok('iPhone SE: ana ekranda yatay taşma yok',await p.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth&&$('#home').scrollWidth<=$('#home').clientWidth+1));
    await p.click('#bGo');await sleep(400);
    ok('iPhone SE: üst çubuk sığıyor',await p.evaluate(()=>{const r=$('#bNew').getBoundingClientRect();return r.right<=innerWidth;}));
    ok('iPhone SE: üst bölüm (avatar, yüzde, skor) sığıyor',await p.evaluate(()=>{const a=$('#adv');return a.scrollWidth<=a.clientWidth+1&&$('#ascT').getBoundingClientRect().width>0&&$('#avMe svg')&&$('#avOp svg');}));
    ok('iPhone SE: tahta görünür yükseklikte',await p.evaluate(()=>$('#board').getBoundingClientRect().height>=300));
    await p.screenshot({path:`${SP}/se-game.png`});
    await p.setViewportSize({width:430,height:932});await sleep(200);
    ok('geniş ekran (430px): üst çubukta 🎨 görünür ve çekmeceyi açar',await p.isVisible('#bTheme'));
    await p.click('#bTheme');await p.waitForSelector('#thDrawer:not([hidden])');
    ok('çekmece Esc ile kapanır',await (async()=>{await p.keyboard.press('Escape');await sleep(100);return p.evaluate(()=>$('#thDrawer').hidden);})());
    await p.click('#bSnd');await sleep(150);await p.screenshot({path:`${SP}/settings-pop.png`});
    await p.context().close();
  }
  /* 7) set başı geri sayım, istenen anda çekilme, seri atış (bilgisayara karşı) */
  {
    const p=await mkPage(b,{ls:{tavla_snd:'off',tavla_tlc:0}});await p.goto(URL);await sleep(300);
    await p.click('#bGo');await sleep(150);
    ok('geri sayım: set başında 3 görünür, ZAR AT yok',await p.evaluate(()=>cdOn()&&$('#cdl .cdt').textContent==='3'&&!document.querySelector('#bg .rbig')));
    await p.waitForFunction(()=>$('#cdl .cdt')&&$('#cdl .cdt').textContent==='1',null,{timeout:4000}).catch(()=>{});
    ok('geri sayım: 3 → 2 → 1',await p.evaluate(()=>$('#cdl .cdt')&&$('#cdl .cdt').textContent==='1'));
    await p.waitForFunction(()=>(G.openN||[0,0])[0]>0,null,{timeout:4000}).catch(()=>{});
    ok('geri sayım bitince açılış zarı dokunmadan atıldı',await p.evaluate(()=>!cdOn()&&!$('#cdl').innerHTML&&G.openN[0]>0));
    // eşit açılış zarı yeniden atılır, açılışı bilgisayar kazanırsa ilk hamleyi de o oynar: 12 sn yavaş makinede yetmiyordu
    await p.waitForFunction(()=>!G.op&&!G.busy,null,{timeout:25000}).catch(()=>{});
    ok('açılış zarları kendiliğinden bitti, set başladı',await p.evaluate(()=>!G.op));
    // sonraki set: kazanan başlar, geri sayımdan sonra zarı kendiliğinden atılır
    await p.evaluate(()=>{G.run++;G.prevW=1;SC={you:1,cpu:0};startLocal();});await sleep(300);
    ok('sonraki set: geri sayım var, zar henüz atılmadı',await p.evaluate(()=>cdOn()&&!G.rolled&&G.turn===1));
    await p.waitForFunction(()=>G.rolled,null,{timeout:5000}).catch(()=>{});
    ok('sonraki set: geri sayım sonrası zar kendiliğinden atıldı',await p.evaluate(()=>G.rolled&&G.all.length>=2&&G.turn===1));
    // bilgisayarın sırasında çekilme (2 sayı): oyun hemen biter, bilgisayar sonra taş oynamaz, skor bir kez yazılır
    await setBoard(p,board({0:2,5:5,7:3,12:5,23:-2,18:-5,16:-3,11:-5}),{all:[1,2]});
    await p.evaluate(()=>{SC={you:0,cpu:0};G.turn=-1;G.rolled=false;G.dice=[];G.all=[];G.busy=false;aiTurn();});await sleep(1200);
    ok('çekilme: bilgisayarın sırasında da yapılabilir',await p.evaluate(()=>G.turn===-1&&canResign()));
    await p.evaluate(()=>{resignMenu();});
    ok('çekilme menüsü: 1 sayı teklifi ve 2 sayı seçeneği',await p.evaluate(()=>!!($('#ovOk')&&$('#ovR2'))));
    await p.click('#ovR2');
    const b0=await p.evaluate(()=>JSON.stringify(G.st));await sleep(2500);
    ok('çekilme sonrası bilgisayar taş oynamadı',await p.evaluate(b=>G.over?JSON.stringify(G.st)===b:true,b0));
    ok('çekilme skoru bir kez yazıldı (2 sayı)',await p.evaluate(()=>SC.cpu===2&&SC.you===0),await p.evaluate(()=>JSON.stringify(SC)));
    await p.evaluate(()=>gameOver(-1,2,'resign'));
    ok('ikinci bitiş çağrısı skoru tekrar yazmaz',await p.evaluate(()=>SC.cpu===2));
    await p.waitForFunction(()=>!G.over,null,{timeout:6000}).catch(()=>{});
    ok('çekilme sonrası yeni set kendiliğinden başladı',await p.evaluate(()=>!G.over&&G.mode==='local'));
    // pul toplarken 1 sayıyla çekilme: rakibe sorulmaz, mars olmaz, hemen yeni sete geçilir
    await sleep(3500);
    await setBoard(p,board({0:3,1:4,2:3,12:-15}),{all:[1,2],off:[5,0]});
    await p.evaluate(()=>{SC={you:0,cpu:0};G.rolled=false;G.dice=[];G.all=[];render();resignMenu();});
    ok('toplarken: menüde "1 sayı ver" var, 2 sayı seçeneği yok',await p.evaluate(()=>!$('#ovR2')&&$('#ovOk').textContent.includes(i18('give1'))&&$('#ovOk').textContent.includes(i18('give1B'))));
    const t0=Date.now();await p.click('#ovOk');
    ok('toplarken: çekilme sormadan bitti, 1 sayı',await p.evaluate(()=>G.over&&G.result.pts===1&&G.result.why==='offer'&&!G.result.mars&&SC.cpu===1));
    await p.waitForFunction(()=>!G.over,null,{timeout:5000}).catch(()=>{});
    ok('toplarken: yeni sete hemen geçildi (≤ 2,5 sn)',await p.evaluate(()=>!G.over)&&Date.now()-t0<=2500,(Date.now()-t0)+' ms');
    // teklif hakkı bitince 1 sayı teklifi pasif
    await sleep(3500);
    await setBoard(p,board({0:2,5:5,7:3,12:5,23:-2,18:-5,16:-3,11:-5}),{all:[1,2],off:[1,1]});
    await p.evaluate(()=>{G.st.off=[0,1];G.st.b[0]=3;G.offN={w:0,k:3};resignMenu();});
    ok('3 teklif hakkı bitince "1 sayı teklif et" pasif',await p.evaluate(()=>$('#ovOk').disabled&&$('#ovOk').textContent.includes(i18('offer1'))));
    await p.evaluate(()=>{$('#overlay').hidden=true;});
    // seri atış: bilgisayar kırık ve kapılar kapalı → oyuncu bildirimsiz ve beklemeden üst üste oynar
    await setBoard(p,board({0:2,1:2,2:2,3:2,4:2,5:2,8:3,12:-14}),{all:[2,1],bar:[0,1]});
    await hook(p);
    await p.evaluate(()=>{G.ser=null;G.flash='';window.__fl=[];const f0=flash;flash=function(t,ms){__fl.push(t);return f0(t,ms);};});
    const tm=[];
    for(let k=0;k<3;k++){
      await p.evaluate(()=>{if(G.turn!==1||G.busy)return;if(!G.rolled){__dice.push(2,1);doRoll(218,200);}});
      await p.waitForFunction(()=>G.rolled&&!G.busy&&G.dice.length,null,{timeout:4000}).catch(()=>{});
      await p.evaluate(()=>{const m=()=>legalMoves(G.st,1,G.dice);while(G.dice.length&&m().length&&!G.busy){const x=m().find(q=>q.f===8)||m()[0];doHuman(x);}});
      const s0=Date.now();await p.waitForFunction(()=>G.turn===1&&!G.rolled&&!G.busy,null,{timeout:4000}).catch(()=>{});tm.push(Date.now()-s0);
      await p.evaluate(()=>{G.st.b[8]=3;G.st.b[7]=0;G.st.b[6]=0;G.st.b[5]=2;render();});
      tm.push(await p.evaluate(()=>__fl.splice(0).join('|')));
    }
    ok('seri atış: sıra beklemeden yine oyuncuda (her tur < 1,2 sn)',tm.filter((x,i)=>i%2===0).every(x=>x<1200),JSON.stringify(tm));
    ok('seri atış: her turda bildirim çıkmıyor (yalnızca ilk turda bir kez)',tm.filter((x,i)=>i%2===1).slice(1).every(x=>!x)&&await p.evaluate(()=>G.ser&&G.ser.n>=3),JSON.stringify(tm));
    ok('çekilme/seri testlerinde sayfa hatası yok',!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }
  /* 7b) arkadaşla: geri sayım + kendiliğinden açılış, rakibin sırasında teklif, seri atış, rakibin sırasında çekilme */
  {
    const A=await mkPage(b,{name:'AHMET',ls:{tavla_snd:'off',tavla_target:5}}),B=await mkPage(b,{name:'BURAK',ls:{tavla_snd:'off'}});
    await A.goto(URL);await B.goto(URL);await sleep(500);await hook(A);await hook(B);
    await A.evaluate(()=>createRoom());await A.waitForFunction(()=>G.code,null,{timeout:5000});
    await B.evaluate(c=>joinRoom(c),await A.evaluate(()=>G.code));
    await A.waitForFunction(()=>G.seats.w&&G.seats.k,null,{timeout:8000});
    await A.evaluate(()=>startOnline());
    await B.waitForFunction(()=>G.started,null,{timeout:8000});
    ok('online geri sayım: iki tarafta da 3-2-1',await A.evaluate(()=>cdOn())&&await B.evaluate(()=>cdOn()));
    await A.waitForFunction(()=>!G.op&&!G.opHold&&G.started,null,{timeout:20000}).catch(()=>{});
    await B.waitForFunction(()=>!G.op,null,{timeout:8000}).catch(()=>{});
    ok('online: açılış zarları dokunmadan atıldı, set başladı',await A.evaluate(()=>!G.op&&G.openN[0]>0&&G.openN[1]>0)&&await B.evaluate(()=>!G.op),await A.evaluate(()=>JSON.stringify({op:G.op,o:G.open,n:G.openN})));
    // tahta: A (beyaz) 1 pul topladı, B toplamadı → B'nin 1 sayı teklifi A'ya sorulur
    const setSt=(pg,o)=>pg.evaluate(o=>{const b=Array(24).fill(0);for(const [i,v] of Object.entries(o.b))b[+i]=v;G.st={b,bar:o.bar||[0,0],off:o.off||[0,0]};
      Object.assign(G,{turn:o.turn,rolled:!!o.all,dice:(o.all||[]).slice(),all:(o.all||[]).slice(),busy:false,auto:false,endTimer:null,hist:[],sel:null});
      pushFields({b:G.st.b,bar:G.st.bar,off:G.st.off,turn:G.turn,rolled:G.rolled,dice:G.dice,all:G.all,last:null});render();},o);
    await setSt(A,{b:{0:2,5:5,7:3,12:4,23:-2,18:-5,16:-3,11:-5},off:[1,0],turn:1});
    await B.waitForFunction(()=>G.st.off[0]===1,null,{timeout:6000}).catch(()=>{});
    ok('online: rakibin sırasında çekilme yapılabilir',await B.evaluate(()=>G.turn!==G.me&&canResign()));
    await B.evaluate(()=>{resignMenu();});
    ok('online: toplamamışken 1 sayı teklifi (kalan hak 3) ve 2 sayı seçeneği',await B.evaluate(()=>!$('#ovOk').disabled&&$('#ovOk').textContent.includes('3')&&!!$('#ovR2')));
    await B.click('#ovOk');
    await A.waitForFunction(()=>!$('#overlay').hidden&&$('#ovRej'),null,{timeout:6000}).catch(()=>{});
    ok('online: teklif rakibe soruldu',await A.evaluate(()=>!$('#overlay').hidden&&!!$('#ovRej')));
    await A.click('#ovRej');
    await B.waitForFunction(()=>!G.offer,null,{timeout:6000}).catch(()=>{});
    ok('online: reddedilen teklif hakkı düştü (2 kaldı), oyun sürüyor',await B.evaluate(()=>G.offN.k===2&&!G.over&&canResign()));
    // seri atış: B kırık, A'nın kapıları kapalı → A sırasını bitirince sıra B'ye geçmeden yine A'da
    await sleep(600);
    await setSt(A,{b:{0:2,1:2,2:2,3:2,4:2,5:2,8:3,12:-14},bar:[0,1],turn:1,all:[2,1]});
    await B.waitForFunction(()=>G.st.bar[1]===1,null,{timeout:6000}).catch(()=>{});
    await A.evaluate(()=>{doHuman({f:8,t:6,d:2});doHuman({f:8,t:7,d:1});});
    const t0=Date.now();await A.waitForFunction(()=>G.turn===1&&!G.rolled&&!G.busy,null,{timeout:4000}).catch(()=>{});
    ok('online seri atış: sıra beklemeden yine A’da (< 1,2 sn)',Date.now()-t0<1200&&await A.evaluate(()=>G.turn===1&&!G.rolled),(Date.now()-t0)+' ms');
    await B.waitForFunction(()=>G.turn===1&&!G.rolled,null,{timeout:6000}).catch(()=>{});
    ok('online seri atış: B tarafında sıra A’da, bir kez bilgi notu',await B.evaluate(()=>G.turn===1&&G.ser&&G.ser.n===1));
    // B, A'nın sırasında 2 sayıyla çekilir: oyun iki tarafta da biter
    await B.evaluate(()=>{resignMenu();});await B.click('#ovR2');
    await A.waitForFunction(()=>G.over,null,{timeout:6000}).catch(()=>{});
    ok('online: rakibin sırasında çekilme iki tarafta oyunu bitirdi (2 sayı)',await A.evaluate(()=>G.over&&G.result.pts===2&&G.result.why==='resign'&&G.score.w===2));
    // yeni set: kazanan (A) geri sayımdan sonra zarını dokunmadan atar
    await A.waitForFunction(()=>!G.over&&G.started&&G.gid>=2,null,{timeout:8000}).catch(()=>{});
    ok('online yeni set: geri sayım',await A.evaluate(()=>cdOn()));
    await A.waitForFunction(()=>G.rolled,null,{timeout:6000}).catch(()=>{});
    ok('online yeni set: kazanan A’nın zarı kendiliğinden atıldı',await A.evaluate(()=>G.rolled&&G.turn===1));
    ok('online çekilme/seri testlerinde sayfa hatası yok',!A.errs.length&&!B.errs.length,A.errs.concat(B.errs).join('|'));
    await A.context().close();await B.context().close();
  }
  /* 7c) arkadaşla: A zorunlu hamleleri kendiliğinden oynarken B çekilir → yeni sette fazla pul/eksik pul kalmamalı */
  {
    const A=await mkPage(b,{name:'AHMET',ls:{tavla_snd:'off',tavla_target:5}}),B=await mkPage(b,{name:'BURAK',ls:{tavla_snd:'off'}});
    await A.goto(URL);await B.goto(URL);await sleep(500);
    await A.evaluate(()=>createRoom());await A.waitForFunction(()=>G.code,null,{timeout:5000});
    await B.evaluate(c=>joinRoom(c),await A.evaluate(()=>G.code));
    await A.waitForFunction(()=>G.seats.w&&G.seats.k,null,{timeout:8000});
    await A.evaluate(()=>startOnline());
    await B.waitForFunction(()=>G.started,null,{timeout:8000});
    await A.waitForFunction(()=>!G.op&&!G.opHold&&G.started,null,{timeout:20000}).catch(()=>{});
    await B.waitForFunction(()=>!G.op,null,{timeout:8000}).catch(()=>{});
    // iki taraf da topluyor; A'nın 2-2'si zorunlu (dört pul toplanır), B topladığı için 1 sayıyla sormadan çekilebilir
    await A.evaluate(()=>{const b=Array(24).fill(0);b[1]=6;b[22]=-6;G.st={b,bar:[0,0],off:[9,9]};
      Object.assign(G,{turn:1,rolled:true,dice:[2,2,2,2],all:[2,2,2,2],busy:false,auto:false,endTimer:null,hist:[],sel:null,cd:null});
      pushFields({b:G.st.b,bar:G.st.bar,off:G.st.off,turn:1,rolled:true,dice:G.dice,all:G.all,last:null});render();});
    await B.waitForFunction(()=>G.st.off[1]===9&&G.rolled,null,{timeout:6000}).catch(()=>{});
    // eşzamanlı yazım: A'nın sayacı B'ninkinden ileride (A'nın yazımları B'nin çekilmesiyle çakışır)
    await A.evaluate(()=>{G.rev+=20;humanProceed();});
    ok('online: A zorunlu hamleleri kendiliğinden oynuyor',await A.evaluate(()=>G.auto));
    await B.evaluate(()=>offerOne());
    await A.waitForFunction(()=>G.over,null,{timeout:4000}).catch(()=>{});
    ok('online: A otomatik oynarken B çekildi, A tarafında set bitti',await A.evaluate(()=>G.over&&G.result&&G.result.winner===1&&G.result.pts===1));
    await A.waitForFunction(()=>G.gid>=2&&!G.over&&G.started,null,{timeout:8000}).catch(()=>{});
    await B.waitForFunction(()=>G.gid>=2&&!G.over&&G.started,null,{timeout:8000}).catch(()=>{});
    await sleep(1500); // eski setin kalan otomatik hamlelerine yetecek süre
    const fresh=pg=>pg.evaluate(()=>{const n=newState(),s=G.st,cnt=x=>s.b.reduce((t,v)=>t+(v*x>0?v*x:0),0)+s.bar[K(x)]+s.off[K(x)];
      return JSON.stringify({gid:G.gid,w:cnt(1),k:cnt(-1),off:s.off,same:stKey(s)===stKey(n)||G.rolled});});
    const fa=await fresh(A),fb=await fresh(B);
    const okSt=f=>{const o=JSON.parse(f);return o.gid>=2&&o.w===15&&o.k===15&&o.off[0]===0&&o.off[1]===0&&o.same;};
    ok('online çekilme sonrası yeni set: iki tarafta da 15’er pul, toplanmış pul yok',okSt(fa)&&okSt(fb),fa+' '+fb);
    ok('online çekilme sonrası yeni set: iki tarafın tahtası aynı',await A.evaluate(()=>stKey(G.st))===await B.evaluate(()=>stKey(G.st)));
    ok('online çekilme sonrası testinde sayfa hatası yok',!A.errs.length&&!B.errs.length,A.errs.concat(B.errs).join('|'));
    await A.context().close();await B.context().close();
  }
  /* 8) TEST MODU (test-admin.js): gizli admin girişi + elle zar seçimi; atışta bildirim yok, rakibin ekranında sağ altta sabit 🧪 simgesi */
  {
    const noNote=p=>p.evaluate(()=>!document.getElementById('taTag')&&!/TEST MODU/i.test(G.flash||''));
    const icoOn=p=>p.evaluate(()=>{const t=document.getElementById('taIco');if(!t||t.hidden)return false;const r=t.getBoundingClientRect();return r.width>0&&r.right<=innerWidth&&r.bottom<=innerHeight&&r.left>innerWidth/2;});
    const pick=async(p,side,a,b2)=>{const sd=side==='me'?'.sd:nth-of-type(1)':'.sd:nth-of-type(2)';
      await press(p,`#taSheet ${sd} .row[data-i="0"] button[data-v="${a}"]`);await press(p,`#taSheet ${sd} .row[data-i="1"] button[data-v="${b2}"]`);};
    for(const t of THEMES){
      await fetch(DB+'/names.json',{method:'DELETE'});
      const uid='adm'+t+Date.now();await fetch(DB+'/names/BURAK.json',{method:'PUT',body:JSON.stringify(uid)});
      if(t==='neon'){
        // başka hesap: eski şifreyi yazsa da test modu açılmaz, BURAK adını da alamaz; misafirde de kapalı
        const o=await mkPage(b,{name:'AHMET',acct:'baska'+Date.now(),ls:{tavla_snd:'off'}});await o.goto(URL);await sleep(1500);
        await o.evaluate(()=>askName(false));await o.fill('#nmIn','burak31');await press(o,'#ovOk');await sleep(1500);
        ok('test modu: başka hesap BURAK31 yazınca açılmaz, BURAK adını alamaz',await o.evaluate(()=>!TESTADM.on&&NAME!=='BURAK'),await o.evaluate(()=>NAME+' '+TESTADM.on));
        await o.context().close();
        const gp=await mkPage(b,{guest:true,ls:{tavla_snd:'off'}});await gp.goto(URL);await sleep(1500);
        ok('test modu: misafirde kapalı',await gp.evaluate(()=>!TESTADM.on));
        await gp.context().close();
      }
      const p=await mkPage(b,{name:'BURAK',acct:uid,ls:{tavla_theme:t,tavla_snd:'off'}});await p.goto(URL);
      await p.waitForFunction(()=>TESTADM.on,null,{timeout:6000}).catch(()=>{});
      ok(`[${t}] test modu: BURAK adının sahibi hesapla şifresiz açık, açılış bildirimi yok`,await p.evaluate(()=>TESTADM.on&&NAME==='BURAK'&&!G.flash));
      await press(p,'#mCpu');await press(p,'#bGo');
      await p.waitForFunction(()=>G.mode==='local'&&!G.op&&!cdOn(),null,{timeout:15000}).catch(()=>{});
      await p.evaluate(()=>{G.run++;G.autoTok++;G.endTok++;$('#overlay').hidden=true;Object.assign(G,{op:0,opHold:0,over:false,busy:false,auto:false,turn:1,rolled:false,dice:[],all:[],sel:null,hist:[],endTimer:null});opClear();render();});
      ok(`[${t}] test modu: sağ altta 🧪 simgesi görünür`,await p.isVisible('#taBtn')&&await p.evaluate(()=>{const r=$('#taBtn').getBoundingClientRect();return r.left>innerWidth/2&&r.bottom>innerHeight-80&&$('#taBtn').textContent.includes('🧪');}));
      await p.screenshot({path:`${OUT}/${t}-8-test-simgesi.png`});
      await press(p,'#taBtn');await pick(p,'me',6,5);await pick(p,'op',3,3);
      await p.screenshot({path:`${OUT}/${t}-8-test-zar-secimi.png`});
      await press(p,'#taSheet .ok');
      ok(`[${t}] test modu: bekleyen zarlar düğmede`,(await p.textContent('#taBtn')).includes('6-5 / 3-3'),await p.textContent('#taBtn'));
      await p.evaluate(()=>doRoll(218,200));await sleep(1400);
      ok(`[${t}] test modu: benim zarım seçilen 6-5`,await p.evaluate(()=>G.all.join()==='6,5'),await p.evaluate(()=>JSON.stringify({a:G.all,r:G.rolled,b:G.busy,cd:cdOn(),oh:opHeld()})));
      ok(`[${t}] test modu: elle seçilen atışta bildirim/etiket yok`,await noNote(p));
      await p.evaluate(()=>{G.dice=[];endTurn();});
      await p.waitForFunction(()=>G.turn===-1&&G.rolled,null,{timeout:6000}).catch(()=>{});
      ok(`[${t}] test modu: bilgisayarın zarı seçilen 3-3`,await p.evaluate(()=>G.all.join()==='3,3,3,3'));
      if(t==='neon'){
        await p.waitForFunction(()=>G.turn===1,null,{timeout:12000}).catch(()=>{});
        await p.evaluate(()=>{if(!G.rolled)doRoll(218,200);});await sleep(300);
        ok('test modu: seçim bir kez kullanılır, düğmede bekleyen zar kalmadı',await p.evaluate(()=>G.rolled&&$('#taBtn').textContent.trim()==='🧪'),await p.textContent('#taBtn'));
        // set bitip yeni set başlayınca ve oyun alanı kaydırılınca düğme ekranda kalır (iOS'ta kaydırılan kutu içinde kayboluyordu)
        await p.evaluate(()=>gameOver(1));await sleep(2500);await p.evaluate(()=>{const o=$('#ovOk');if(o)o.click();});
        await p.waitForFunction(()=>!G.over,null,{timeout:8000}).catch(()=>{});
        await p.evaluate(()=>{const pl=$('#play');pl.scrollTop=pl.scrollHeight;});await sleep(200);
        ok('test modu: yeni sette ve kaydırınca düğme görünür, üstünde başka öğe yok',await p.evaluate(()=>{const b=$('#taBtn'),r=b.getBoundingClientRect();
          return b.parentNode===document.body&&!b.hidden&&r.bottom<=innerHeight&&b.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));}));
        await p.evaluate(()=>showHome());await sleep(200);
        ok('test modu: ana ekranda düğme gizli',!(await p.isVisible('#taBtn')));
        await p.evaluate(()=>{const o=$('#bCont');if(o&&!o.disabled)o.click();});await sleep(800);
        // sayfa yenilenince (ör. güncelleme sonrası) kaldığı oyun açılır: düğme zar atmayı beklemeden görünür
        await p.evaluate(()=>{G.over=false;G.busy=false;G.turn=1;G.rolled=false;G.dice=[];G.all=[];saveCur();});
        await p.reload();await p.waitForFunction(()=>G.mode==='local',null,{timeout:8000}).catch(()=>{});await sleep(400);
        ok('test modu: sayfa yenilenince düğme hemen görünür',await p.evaluate(()=>TESTADM.on)&&await p.isVisible('#taBtn'));
        // BURAK adı artık bu hesabın değilse test modu kapanır
        await fetch(DB+'/names/BURAK.json',{method:'PUT',body:JSON.stringify('baskasi')});
        await p.reload();await sleep(2500);
        ok('test modu: ad sahibi değişince kapanır, düğme gizlenir',await p.evaluate(()=>!TESTADM.on)&&!(await p.isVisible('#taBtn')));
      }
      ok(`[${t}] test modu yerel: sayfa hatası yok`,!p.errs.length,p.errs.join('|'));
      await p.context().close();
    }
    // online: admin (A) rakibinin (B) zarını seçer; B'nin ekranında sağ altta sabit 🧪 simgesi, oda alanı temizlenir
    await fetch(DB+'/names.json',{method:'DELETE'});await fetch(DB+'/names/BURAK.json',{method:'PUT',body:JSON.stringify('admOnline')});
    const A=await mkPage(b,{name:'BURAK',acct:'admOnline',ls:{tavla_snd:'off',tavla_theme:'poker'}}),B=await mkPage(b,{name:'AHMET',ls:{tavla_snd:'off',tavla_theme:'neon'}});
    await A.goto(URL);await B.goto(URL);await sleep(500);await hook(A);await hook(B);
    await A.evaluate(()=>createRoom());await A.waitForFunction(()=>G.code,null,{timeout:5000});
    await B.evaluate(c=>joinRoom(c),await A.evaluate(()=>G.code));
    await A.waitForFunction(()=>G.seats.w&&G.seats.k,null,{timeout:8000});
    await A.evaluate(()=>startOnline());
    await B.waitForFunction(()=>G.started,null,{timeout:8000});
    await A.evaluate(()=>{__dice.push(6);opThrowOnline();});
    await B.waitForFunction(()=>G.op&&G.turn===G.me,null,{timeout:8000});
    await B.evaluate(()=>{__dice.push(2);opThrowOnline();});
    await A.waitForFunction(()=>!G.op&&G.turn===1&&!G.opHold,null,{timeout:12000});
    await sleep(800);
    ok('test modu online: rakipte zar düğmesi yok',!(await B.isVisible('#taBtn')));
    await B.waitForFunction(()=>{const t=document.getElementById('taIco');return t&&!t.hidden;},null,{timeout:8000}).catch(()=>{});
    ok('test modu online: rakibin ekranında sağ altta 🧪 simgesi (seçim yapılmadan önce de)',await icoOn(B));
    ok('test modu online: admin ekranında rakip simgesi yok, kendi düğmesi var',!(await icoOn(A))&&await A.isVisible('#taBtn'));
    await press(A,'#taBtn');await pick(A,'op',2,1);await press(A,'#taSheet .ok');
    await B.waitForFunction(()=>true,null,{timeout:100});await sleep(800);
    await A.evaluate(()=>doRoll(218,200));await sleep(600);
    await A.evaluate(()=>{G.dice=[];endTurnOnline();});
    await B.waitForFunction(()=>G.turn===-1&&!G.rolled,null,{timeout:8000}).catch(()=>{});
    await sleep(400);
    await B.evaluate(()=>doRoll(218,200));
    await A.waitForFunction(()=>G.turn===-1&&G.rolled,null,{timeout:8000}).catch(()=>{});
    await sleep(1400);
    ok('test modu online: rakibin zarı adminin seçtiği 2-1',await B.evaluate(()=>G.all.join()==='2,1')&&await A.evaluate(()=>G.all.join()==='2,1'));
    ok('test modu online: atışta iki ekranda da bildirim yok, rakipte simge duruyor',await noNote(A)&&await noNote(B)&&await icoOn(B));
    for(const t of THEMES){await B.evaluate(k=>applyTheme(k,false),t);await sleep(300);await B.screenshot({path:`${OUT}/${t}-8-test-simgesi-rakip.png`});}
    ok('test modu online: seçim kullanıldı, odadaki alan temizlendi',!(await A.textContent('#taBtn')).includes('2-1'),await A.textContent('#taBtn'));
    ok('test modu online: sayfa hatası yok',!A.errs.length&&!B.errs.length,A.errs.concat(B.errs).join('|'));
    await A.context().close();await B.context().close();
  }
  /* 9) puan (XP) ve level: maç sonunda kazanç/kayıp, mars ve hedef aşımı ekleri, test modu, online rakip leveli */
  {
    const p=await mkPage(b,{ls:{tavla_snd:'off',tavla_lvl:'hard',tavla_target:1,tavla_xp:{v:1,xp:560,g:0,w:0}}});await p.goto(URL);await sleep(400);
    ok('xp: ana ekranda level ve çubuk',await p.evaluate(()=>!$('#xpRow').hidden&&$('#lvHomeAv').textContent==='Level 5'&&$('#xpTxt').textContent==='100/140 XP'),await p.evaluate(()=>$('#lvHomeAv').textContent+' '+$('#xpTxt').textContent));
    await p.click('#bGo');await sleep(800);
    ok('xp: oyunda kendi level rozetim',await p.evaluate(()=>$('#lvMe').textContent==='Level 5'&&$('#lvOp').textContent===''));
    await p.evaluate(()=>{G.st.off[0]=15;gameOver(1);});await sleep(1500);
    const r=await p.evaluate(()=>({xp:XP.xp,g:XP.g,w:XP.w,html:$('#overlay').innerHTML,lv:$('#lvMe').textContent}));
    ok('xp: 1 setlik maç Usta + mars + hedef aşımı = 30+5+10',r.xp===605&&r.g===1&&r.w===1,JSON.stringify({xp:r.xp,g:r.g,w:r.w}));
    ok('xp: sonuç ekranında kazanç ve level atlama',r.html.includes('+45 XP')&&r.html.includes('Level atladın! Artık Level 6'));
    ok('xp: rozet yeni leveli gösteriyor',r.lv==='Level 6',r.lv);
    await p.evaluate(()=>showResult(false));await sleep(200);
    ok('xp: aynı maç iki kez sayılmadı',await p.evaluate(()=>XP.xp===605&&JSON.parse(localStorage.getItem('tavla_xp')).xp===605));
    // kaybedince %70 düşer; level düşebilir
    await p.evaluate(()=>{$('#overlay').hidden=true;XP.xp=600;startLocal();});await sleep(600);
    await p.evaluate(()=>{G.st.off[1]=15;G.st.off[0]=3;gameOver(-1);});await sleep(1500);
    const q=await p.evaluate(()=>({xp:XP.xp,html:$('#overlay').innerHTML}));
    ok('xp: Usta\'ya 1 setlik maçı kaybetmek −10 (14×0.7), level düştü',q.xp===590&&q.html.includes('−10 XP')&&q.html.includes('Level düştü: Level 5'),q.xp);
    ok('xp: kural tablosu',await p.evaluate(()=>[xpGain({won:1,n:3,over:0,mars:0,local:1,lvl:'mid'}),xpGain({won:1,n:5,over:0,mars:0,local:1,lvl:'mid'}),xpGain({won:0,n:5,local:1,lvl:'mid'}),xpGain({won:0,n:3,local:1,lvl:'mid'}),xpGain({won:0,n:1,local:1,lvl:'easy'}),xpGain({won:1,n:5,over:1,mars:2,local:1,lvl:'mid'}),xpGain({won:1,n:3,local:0,d:10,over:0,mars:0}),xpGain({won:0,n:3,local:0,d:-10})].join()==='35,45,-31,-24,-18,65,42,-29'),await p.evaluate(()=>[xpGain({won:1,n:3,over:0,mars:0,local:1,lvl:'mid'}),xpGain({won:1,n:5,over:0,mars:0,local:1,lvl:'mid'}),xpGain({won:0,n:5,local:1,lvl:'mid'}),xpGain({won:0,n:3,local:1,lvl:'mid'}),xpGain({won:0,n:1,local:1,lvl:'easy'}),xpGain({won:1,n:5,over:1,mars:2,local:1,lvl:'mid'}),xpGain({won:1,n:3,local:0,d:10,over:0,mars:0}),xpGain({won:0,n:3,local:0,d:-10})].join()));
    await p.evaluate(()=>{$('#overlay').hidden=true;XP.xp=5;startLocal();});await sleep(600);
    await p.evaluate(()=>{G.st.off[1]=15;G.st.off[0]=3;gameOver(-1);});await sleep(1500);
    ok('xp: puan 0\'ın altına inmez',await p.evaluate(()=>XP.xp===0),await p.evaluate(()=>XP.xp));
    // test modu: elle zar seçilen maç puana sayılmaz
    await p.evaluate(()=>{$('#overlay').hidden=true;XP.xp=600;startLocal();});await sleep(600);
    await p.evaluate(()=>{TESTADM.rolled([6,5]);G.st.off[0]=15;gameOver(1);});await sleep(1500);
    ok('xp: test modunda oynanan maç sayılmadı',await p.evaluate(()=>XP.xp===600&&$('#overlay').innerHTML.includes('Test modu: bu maç puana sayılmadı')));
    ok('ünvan: her 10 levelde değişir, 100 ve sonrası en üst',await p.evaluate(()=>lvTitle(1)==='Çaylak'&&lvTitle(9)==='Çaylak'&&lvTitle(10)==='Acemi'&&lvTitle(99)==='Büyük Usta'&&lvTitle(100)==='Tavla Sultanı'&&lvTitle(250)==='Tavla Sultanı'));
    ok('ünvan: 10. levelde yeni ünvan mesajı',await p.evaluate(()=>xpHtml({p:30,l0:9,l:10}).includes('Yeni ünvan: Acemi')&&!xpHtml({p:30,l0:5,l:6}).includes('Yeni ünvan')));
    ok('xp: level eğrisi (1 yılda 100: 108.760)',await p.evaluate(()=>lvOf(0).l===1&&lvOf(99).l===1&&lvOf(100).l===2&&lvOf(6960).l===30&&lvOf(6959).l===29&&lvNeed(30)===675&&lvNeed(95)===2575&&lvOf(108759).l===99&&lvOf(108760).l===100&&lvOf(1e9).l>100));
    for(const t of THEMES){await p.evaluate(t=>applyTheme(t,false),t);await sleep(250);await p.screenshot({path:`${OUT}/${t}-9-xp-sonuc.png`});}
    ok('xp: sayfa hatası yok',!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }
  {
    const A=await mkPage(b,{name:'AHMET',ls:{tavla_snd:'off',tavla_target:1,tavla_xp:{v:1,xp:600,g:0,w:0}}}),B=await mkPage(b,{name:'BURAK',ls:{tavla_snd:'off',tavla_xp:{v:1,xp:100,g:0,w:0}}});
    await A.goto(URL);await B.goto(URL);await sleep(500);
    await A.evaluate(()=>createRoom());await A.waitForFunction(()=>G.code,null,{timeout:5000});
    await B.evaluate(c=>joinRoom(c),await A.evaluate(()=>G.code));
    await A.waitForFunction(()=>G.lv&&G.lv.k>0,null,{timeout:8000}).catch(()=>{});
    await B.waitForFunction(()=>G.lv&&G.lv.w>0,null,{timeout:8000}).catch(()=>{});
    await sleep(300);
    ok('xp online: rakibin leveli iki ekranda',await A.evaluate(()=>$('#lvOp').textContent==='Level 2')&&await B.evaluate(()=>$('#lvOp').textContent==='Level 6'),await A.evaluate(()=>$('#lvOp').textContent)+' / '+await B.evaluate(()=>$('#lvOp').textContent));
    await A.evaluate(()=>startOnline());await B.waitForFunction(()=>G.started,null,{timeout:8000}).catch(()=>{});
    await A.evaluate(()=>{G.st.off[0]=15;gameOver(1);});
    await B.waitForFunction(()=>G.over,null,{timeout:8000}).catch(()=>{});await sleep(1500);
    ok('xp online: düşük levelliyi yenen az alır, yüksek levelliye kaybeden az verir',await A.evaluate(()=>XP.xp===633)&&await B.evaluate(()=>XP.xp===87),await A.evaluate(()=>XP.xp)+' / '+await B.evaluate(()=>XP.xp));
    ok('xp online: sayfa hatası yok',!A.errs.length&&!B.errs.length,A.errs.concat(B.errs).join('|'));
    await A.context().close();await B.context().close();
  }
  /* 10) hesap (account.js): Google / e-posta bağlantısıyla giriş, profil hesaba yazılır, başka cihazda geri gelir, çıkış */
  {
    const uid='t'+Date.now();
    const cloud=async()=>(await fetch(DB+'/users/'+uid+'.json')).json(),owner=async n=>(await fetch(DB+'/names/'+encodeURIComponent(n)+'.json')).json();
    await fetch(DB+'/names.json',{method:'DELETE'});
    const acPage=async(o,u)=>{const p=await mkPage(b,Object.assign({guest:true},o));await p.context().addInitScript(([m,u])=>{window.__mockUid=u;(0,eval)(m);},[FBM,u||uid]);return p;};
    let p=await acPage({ls:{tavla_name:'',tavla_snd:'off'}});
    await p.goto(URL);await sleep(700);
    ok('hesap: ilk açılışta Google ve e-posta düğmeleri, misafire ad sorulmaz',await p.evaluate(()=>!!document.querySelector('#ovBox [data-ac=g]')&&!!document.querySelector('#ovBox [data-ac=m]')&&!$('#nmIn')&&/GUEST\d{4}/.test($('#ovBox').textContent)));
    for(const t of THEMES){await p.evaluate(t=>applyTheme(t,false),t);await sleep(250);await p.screenshot({path:`${OUT}/${t}-10-giris.png`});}
    await press(p,'#ovBox [data-ac=g]');await sleep(500);
    ok('hesap: Google sonrası kendi adı sorulur, Google adıyla dolar',await p.evaluate(()=>$('#nmIn')&&$('#nmIn').value==='BURAK'&&!document.querySelector('#ovBox .acOv')));
    await press(p,'#ovOk');await sleep(1200);
    let c=await cloud();
    ok('hesap: yeni hesapta profil buluta yazılır',c&&c.n==='BURAK'&&c.xp&&c.xp.xp===0,JSON.stringify(c));
    ok('hesap: ad hesaba ayrılır',await owner('BURAK')===uid);
    await p.evaluate(()=>{XP.xp=250;lsSet('tavla_xp',XP);});await sleep(1200);c=await cloud();
    ok('hesap: puan değişince buluta yazılır',c&&c.xp&&c.xp.xp===250,JSON.stringify(c&&c.xp));
    await press(p,'#bSet');await sleep(500);
    ok('hesap: ayarlarda e-posta ve çıkış',await p.evaluate(()=>$('#acSet').textContent.includes('burak@gmail.com')&&!!$('#acSet [data-ac=o]')&&$('#acHome').hidden));
    ok('hesap: sayfa hatası yok (1)',!p.errs.length,p.errs.join('|'));
    await p.context().close();
    // başka telefon: misafir AHMET (50 XP) giriş yapınca hesaptaki profil gelir
    p=await acPage({name:'AHMET',ls:{tavla_snd:'off',tavla_xp:{v:1,xp:50,g:0,w:0}}});
    await p.goto(URL);await sleep(700);
    ok('hesap: misafire ana ekranda giriş çağrısı',await p.evaluate(()=>!$('#acHome').hidden));
    await press(p,'#acHome');await sleep(500);
    for(const t of THEMES){await p.evaluate(t=>applyTheme(t,false),t);await sleep(250);await p.screenshot({path:`${OUT}/${t}-10-ayarlar-misafir.png`});}
    await press(p,'#acSet [data-ac=g]');await sleep(1200);
    ok('hesap: girişte hesaptaki profil cihaza gelir (misafir adı GUEST…)',await p.evaluate(()=>NAME==='BURAK'&&XP.xp===250&&$('#helloN').textContent==='BURAK'&&$('#ovBox').textContent.includes('Hesabın bağlandı')));
    // misafir: ad seçemez, GUEST… adıyla oynar; eskiden seçilmiş ad GUEST… olur
    {const q=await acPage({ls:{tavla_name:'',tavla_snd:'off'}});await q.goto(URL);await sleep(600);
      await press(q,'#ovOk');await sleep(400);
      ok('misafir: GUEST ve 4 rakamla oynar',await q.evaluate(()=>/^GUEST\d{4}$/.test(NAME)&&$('#overlay').hidden&&$('#helloN').textContent===NAME));
      await press(q,'#bName');await sleep(300);
      ok('misafir: profil penceresinde ad kutusu yok, giriş düğmeleri var',await q.evaluate(()=>!$('#nmIn')&&!!document.querySelector('#ovBox [data-ac=g]')));
      for(const t of THEMES){await q.evaluate(t=>applyTheme(t,false),t);await sleep(250);await q.screenshot({path:`${OUT}/${t}-10-misafir-profil.png`});}
      ok('misafir: sayfa hatası yok',!q.errs.length,q.errs.join('|'));await q.context().close();}
    {const q=await acPage({name:'AHMET',ls:{tavla_snd:'off'}});await q.goto(URL);await sleep(600);
      ok('misafir: eskiden seçilmiş ad GUEST… olur',await q.evaluate(()=>/^GUEST\d{4}$/.test(NAME)));await q.context().close();}
    // tekil ad: başka bir hesap aynı adı (küçük harfle de) alamaz; GUEST… adı alınamaz
    {const q=await acPage({ls:{tavla_name:'',tavla_snd:'off'}},uid+'b');await q.goto(URL);await sleep(600);
      await press(q,'#ovBox [data-ac=g]');await sleep(600);
      await q.fill('#nmIn','burak');await press(q,'#ovOk');await sleep(500);
      ok('ad: başka hesabın adı verilmez',await q.evaluate(()=>!$('#overlay').hidden&&!!$('#nmE')&&$('#nmE').textContent.includes('başka bir oyuncuya')));
      for(const t of THEMES){await q.evaluate(t=>applyTheme(t,false),t);await sleep(250);await q.screenshot({path:`${OUT}/${t}-10-ad-alinmis.png`});}
      await q.fill('#nmIn','guest12');await press(q,'#ovOk');await sleep(300);
      ok('ad: GUEST ile başlayan ad alınamaz',await q.evaluate(()=>!$('#overlay').hidden&&$('#nmE').textContent.includes('GUEST')));
      await q.fill('#nmIn','MEHMET');await press(q,'#ovOk');await sleep(1200);
      ok('ad: boştaki ad kaydedilir ve ayrılır',await q.evaluate(()=>NAME==='MEHMET'&&$('#overlay').hidden)&&await owner('MEHMET')===uid+'b');
      ok('ad: sayfa hatası yok',!q.errs.length,q.errs.join('|'));await q.context().close();}
    // girişli oyuncu adını değiştirince yeni ad ona geçer, eskisi boşa çıkar
    await p.evaluate(()=>askName(false));await p.fill('#nmIn','SULTAN');await press(p,'#ovOk');await sleep(1200);
    ok('ad: ad değişince yenisi ayrılır, eskisi bırakılır',await owner('SULTAN')===uid&&await owner('BURAK')===null&&(await cloud()).n==='SULTAN');
    await p.evaluate(()=>askName(false));await p.fill('#nmIn','BURAK');await press(p,'#ovOk');await sleep(1200);
    await p.reload();await sleep(900);
    ok('hesap: yeniden açılışta oturum sürer',await p.evaluate(()=>!!(ACCT.user&&ACCT.user.uid)&&NAME==='BURAK'&&$('#acHome').hidden));
    await press(p,'#bSet');await sleep(400);
    for(const t of THEMES){await p.evaluate(t=>applyTheme(t,false),t);await sleep(250);await p.screenshot({path:`${OUT}/${t}-10-ayarlar-hesap.png`});}
    await press(p,'#acSet [data-ac=o]');await sleep(300);
    ok('hesap: çıkış onayı sorulur',await p.evaluate(()=>!$('#overlay').hidden&&$('#setDrawer').hidden));
    await Promise.all([p.waitForNavigation().catch(()=>{}),press(p,'#ovOk')]);await sleep(900);
    ok('hesap: çıkışta cihaz misafir olarak baştan başlar',await p.evaluate(()=>!NAME&&XP.xp===0&&!$('#nmIn')&&!!document.querySelector('#ovBox [data-ac=g]')&&localStorage.getItem('tavla_uid')===null));
    c=await cloud();ok('hesap: çıkışta hesaptaki puan kalır',c&&c.xp&&c.xp.xp===250);
    ok('hesap: sayfa hatası yok (2)',!p.errs.length,p.errs.join('|'));
    await p.context().close();
    // Google penceresi dokunuşla aynı anda açılır (SDK önceden yüklü); pencere engellenirse yönlendirme, dönüşte sonuç yoksa uyarı
    p=await acPage({ls:{tavla_name:'',tavla_snd:'off'}},uid+'r');
    await p.goto(URL);await sleep(2000);
    ok('google: pencere dokunuşla aynı anda açılır',await p.evaluate(()=>{const b=document.querySelector('#ovBox [data-ac=g]');window.__mockPopupBlocked=true;b.click();return window.__popupCalled===true;}));
    await sleep(300);
    ok('google: pencere engellenirse Google sayfasına yönlendirir',await p.evaluate(()=>window.__redirected===true&&!!localStorage.getItem('tavla_redir')));
    await p.reload();await sleep(1000);
    ok('google: dönüşte giriş yoksa uyarı gösterilir',await p.evaluate(()=>!$('#overlay').hidden&&$('#ovBox').textContent.includes('tamamlanamadı')&&!localStorage.getItem('tavla_redir')));
    ok('google: sayfa hatası yok',!p.errs.length,p.errs.join('|'));
    await p.context().close();
    // e-posta bağlantısı: gönder, sonra bağlantıyla açılınca giriş tamamlanır ve adres çubuğu temizlenir
    p=await acPage({ls:{tavla_snd:'off'}});
    await p.goto(URL);await sleep(600);await press(p,'#bSet');await sleep(300);await press(p,'#acSet [data-ac=m]');await sleep(300);
    await p.fill('#acMail','burak@gmail.com');await press(p,'#acSend');await sleep(400);
    ok('hesap: e-posta bağlantısı gönderilir',await p.evaluate(()=>window.__sent==='burak@gmail.com'&&$('#ovBox').textContent.includes('Bağlantı gönderildi')));
    await p.goto(URL+'?apiKey=x&oobCode=abc&mode=signIn&lang=tr');await sleep(1000);
    ok('hesap: bağlantıyla açılınca giriş tamamlanır',await p.evaluate(()=>!!(ACCT.user&&ACCT.user.email==='burak@gmail.com')&&!location.search));
    ok('hesap: sayfa hatası yok (3)',!p.errs.length,p.errs.join('|'));
    await p.context().close();
  }
  await b.close();
  console.log(res.join('\n'));console.log(`\n${res.length-fails}/${res.length} geçti`);
  process.exit(fails?1:0);
})().catch(e=>{console.error(e);console.log(res.join('\n'));process.exit(2);});
