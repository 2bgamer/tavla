// Tavla tema + slogan entegrasyonu uçtan uca testleri (Playwright, Chromium)
const {chromium}=require(process.env.PW||'playwright');
const SP=process.env.SP||__dirname+'/out',OUT=SP+'/shots';require('fs').mkdirSync(OUT,{recursive:true});
const URL='http://localhost:8765/index.html',DB='http://localhost:8790';
const THEMES=['neon','sunset','poker','arcade'];
const res=[];let fails=0;
const ok=(name,cond,info)=>{res.push(`${cond?'PASS':'FAIL'}  ${name}${info?'  — '+info:''}`);if(!cond)fails++;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function mkPage(b,opts={}){
  const ctx=await b.newContext({viewport:opts.vp||{width:390,height:844},deviceScaleFactor:2,reducedMotion:opts.rm||'no-preference'});
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
    const n=AudioContext.prototype.createOscillator;window.__osc=0;AudioContext.prototype.createOscillator=function(){window.__osc++;return n.call(this);};
  },{name:opts.name,ls:opts.ls,db:DB});
  return p;
}
async function hook(p){await p.evaluate(()=>{const m=moment;window.moment=function(k,d,key){const r=m(k,d,key);__log.push(k+':'+r);return r;};const r=Math.random;Math.random=()=>__dice.length?(__dice.shift()-1)/6+.01:r();});}
const slgText=p=>p.evaluate(()=>document.getElementById('slg').textContent);
async function waitSlg(p,txt,ms=4000){try{await p.waitForFunction(t=>document.getElementById('slg').textContent.includes(t),txt,{timeout:ms});return true;}catch(e){return false;}}
const stSnap=p=>p.evaluate(()=>JSON.stringify({st:G.st,dice:G.dice,all:G.all,seed:G.seed,turn:G.turn,sc:SC,gid:G.gid}));
async function setBoard(p,b,o){await p.evaluate(([b,o])=>{G.run++;G.autoTok++;G.endTok++;$('#overlay').hidden=true;Object.assign(G,{op:0,over:false,busy:false,auto:false,turn:1,rolled:true,sel:null,hist:[],endTimer:null});
  G.st={b,bar:o.bar||[0,0],off:o.off||[0,0]};G.all=o.all;G.dice=o.all.slice();G.seed=(Math.random()*1e9)|0;G.un={w:3,k:3};render();},[b,o]);}
const board=(m)=>{const b=Array(24).fill(0);for(const [i,v] of Object.entries(m))b[+i]=v;return b;};

(async()=>{
  const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});

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

  /* 2) bilgisayara karşı: olaylar, AI, geri al, tema değişimi */
  {
    const p=await mkPage(b,{ls:{tavla_theme:'poker',tavla_snd:'all'}});await p.goto(URL);await sleep(400);
    await hook(p);
    // varsayılan: kayıtlı tercih yokken Poker Lounge
    await p.click('#bGo');await sleep(300);
    ok('maç başladı (yerel)',await p.evaluate(()=>G.mode==='local'));
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
    ok('kapı alma: KAPI GİBİ!',await waitSlg(p,'KAPI GİBİ!'),await slgText(p));
    // tema değişimi maç ortasında: durum değişmez (oyuncu hamle beklerken)
    await sleep(500);await setBoard(p,board({7:3,12:2,20:10,1:-2,22:-13}),{all:[2,5]});
    const before=await stSnap(p);
    for(const t of THEMES){
      await p.click('#bSnd');await p.click('#bTheme2');await p.waitForSelector('#thDrawer:not([hidden])');
      await p.click(`#thDrawer .thc[data-t=${t}]`);await sleep(350);
      const fill=await p.evaluate(()=>[...document.querySelectorAll('#bg polygon')].map(e=>e.getAttribute('fill')));
      const exp=await p.evaluate(()=>[TK.triA,TK.triB]);
      ok(`[${t}] maç ortasında tema: üçgenler tokenla çizildi`,fill.includes(exp[0])&&fill.includes(exp[1]));
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
    ok('galibiyet: İŞTE BU!',await waitSlg(p,'İŞTE BU!',5000),await slgText(p));
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
    await p.evaluate(()=>{audio();});await p.waitForFunction(()=>AC&&AC.state==='running',null,{timeout:3000}).catch(()=>{});
    const osc=async snd=>p.evaluate(async s=>{setSnd(s);await new Promise(r=>setTimeout(r,400));const a=__osc;sfx('win');return __osc-a;},snd);
    const all=await osc('all'),game=await osc('game'),off=await osc('off');
    ok('ses "Tümü": slogan efekti çalar',all>0,'osc='+all);
    ok('ses "Pul ve zar": slogan efekti çalmaz',game===0,'osc='+game);
    ok('ses "Kapalı": efekt çalmaz',off===0,'osc='+off);
    await p.evaluate(()=>{setSnd('game');moment('win',0,'k1');});
    ok('ses kapalıyken de slogan yazısı görünür',await waitSlg(p,'İŞTE BU!'));
    await p.evaluate(()=>setSlogan(false));await sleep(1600);
    const r=await p.evaluate(()=>{const x=moment('win',0,'k2');return x;});await sleep(200);
    ok('slogan kapalı: yazı görünmez',!r&&!(await slgText(p)).trim());
    await p.reload();await sleep(300);
    ok('slogan tercihi kalıcı',await p.evaluate(()=>SLOGAN===false&&$('#slIn').checked===false));
    await p.context().close();
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
    await A.setViewportSize({width:375,height:380});await A.focus('#chatIn');await sleep(300);
    const vis=await A.evaluate(()=>{const r=$('#chatIn').getBoundingClientRect();return r.bottom<=innerHeight&&r.top>=0&&document.scrollingElement.scrollWidth<=innerWidth;});
    ok('kısa ekran (klavye açık benzetimi): giriş görünür, yatay taşma yok',vis);
    await A.screenshot({path:`${SP}/keyboard-sim.png`});
    ok('online testlerde sayfa hatası yok',!A.errs.length&&!B.errs.length,A.errs.concat(B.errs).join('|'));
    await A.context().close();await B.context().close();
  }
  /* 6) küçük iPhone (SE) */
  {
    const p=await mkPage(b,{vp:{width:375,height:667},ls:{tavla_theme:'arcade',tavla_snd:'off'}});await p.goto(URL);await sleep(300);
    ok('iPhone SE: ana ekranda yatay taşma yok',await p.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth&&$('#home').scrollWidth<=$('#home').clientWidth+1));
    await p.click('#bGo');await sleep(400);
    ok('iPhone SE: üst çubuk sığıyor',await p.evaluate(()=>{const r=$('#bNew').getBoundingClientRect();return r.right<=innerWidth;}));
    ok('iPhone SE: skor yazısı kesilmeden sığıyor',await p.evaluate(()=>{const e=$('#scT');return e.scrollWidth<=e.clientWidth+1;}));
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
