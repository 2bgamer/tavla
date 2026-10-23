// Tavla tema + slogan entegrasyonu uçtan uca testleri (Playwright, Chromium)
// BROWSER=chromium|webkit, DEVICE="iPhone 13" gibi bir Playwright cihaz profili (isteğe bağlı)
const pw=require(process.env.PW||'playwright');
const BR=process.env.BROWSER||'chromium',DEVN=process.env.DEVICE||'',DEV=DEVN?pw.devices[DEVN]:null;
if(DEVN&&!DEV)throw new Error('bilinmeyen cihaz: '+DEVN);
const TAG=BR+(DEVN?'-'+DEVN.replace(/\W+/g,'_'):'');
const SP=process.env.SP||__dirname+'/out',OUT=SP+'/shots-'+TAG;require('fs').mkdirSync(OUT,{recursive:true});
const URL='http://localhost:8765/index.html',DB='http://localhost:8790';
const THEMES=['neon','sunset','poker','arcade'];
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
    // olay kaydı + zar kuyruğu (r6 global fonksiyon bildirimi)
    window.__log=[];window.__dice=[];
    const AC0=window.AudioContext||window.webkitAudioContext;if(AC0){const n=AC0.prototype.createOscillator,g=AC0.prototype.createGain;window.__osc=0;window.__gains=[];
      AC0.prototype.createOscillator=function(){window.__osc++;return n.call(this);};AC0.prototype.createGain=function(){const x=g.call(this);window.__gains.push(x);if(window.__gains.length>400)window.__gains.shift();return x;};}
  },{name:opts.name,ls:opts.ls,db:DB});
  return p;
}
async function hook(p){await p.evaluate(()=>{const m=moment;window.moment=function(k,d,key){const r=m(k,d,key);__log.push(k+':'+r);return r;};const r=Math.random;Math.random=()=>__dice.length?(__dice.shift()-1)/6+.01:r();});}
const press=async(p,sel)=>{if(DEV&&DEV.hasTouch)await p.tap(sel);else await p.click(sel);};
const slgText=p=>p.evaluate(()=>document.getElementById('slg').textContent);
async function waitSlg(p,txt,ms=4000){try{await p.waitForFunction(t=>document.getElementById('slg').textContent.includes(t),txt,{timeout:ms});return true;}catch(e){return false;}}
const stSnap=p=>p.evaluate(()=>JSON.stringify({st:G.st,dice:G.dice,all:G.all,seed:G.seed,turn:G.turn,sc:SC,gid:G.gid}));
async function setBoard(p,b,o){await p.evaluate(([b,o])=>{G.run++;G.autoTok++;G.endTok++;$('#overlay').hidden=true;Object.assign(G,{op:0,over:false,busy:false,auto:false,turn:1,rolled:true,sel:null,hist:[],endTimer:null});
  G.st={b,bar:o.bar||[0,0],off:o.off||[0,0]};G.all=o.all;G.dice=o.all.slice();G.seed=(Math.random()*1e9)|0;G.un={w:3,k:3};render();},[b,o]);}
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
    ok('tema değişimi maç durumunu ve zar tohumunu değiştirmedi',before===await stSnap(p));
    ok('çekmece kapandı',await p.evaluate(()=>$('#thDrawer').hidden));
    // kalıcılık
    await p.reload();await sleep(500);
    ok('yenileme sonrası tema korundu (arcade)',await p.evaluate(()=>document.documentElement.dataset.theme==='arcade'&&lsGet('tavla_theme')==='arcade'));
    await hook(p);
    // normal tur + AI turu (bilgisayarın olayları slogan üretmez)
    await p.evaluate(()=>{startLocal();});await sleep(300);
    await p.evaluate(()=>{Object.assign(G,{op:0,turn:1,rolled:false,busy:false,over:false});G.st=newState();opClear();render();__dice.push(6,5,3,1);doRoll(218,200);});
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
    const before=await stSnap(A);
    await A.evaluate(()=>applyTheme('poker',true));await sleep(300);
    ok('online: tema değişimi durumu değiştirmedi',before===await stSnap(A));
    ok('online: rakip tarafın teması etkilenmedi',await B.evaluate(()=>THEME==='sunset'));
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
  await b.close();
  console.log(res.join('\n'));console.log(`\n${res.length-fails}/${res.length} geçti`);
  process.exit(fails?1:0);
})().catch(e=>{console.error(e);console.log(res.join('\n'));process.exit(2);});
