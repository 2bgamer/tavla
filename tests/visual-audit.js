// Görsel denetim: 4 tema × 6 durum, 390×844, gerçek yazı tipleri (Google Fonts curl ile indirilir).
// Çalıştırma: python3 -m http.server 8765 & ; PW=playwright OUT=tests/out/visual-audit URL=http://localhost:8765/index.html node tests/visual-audit.js
const pw=require(process.env.PW||'playwright');const OUT=process.env.OUT||'tests/out/visual-audit',URL=process.env.URL||'http://localhost:8765/index.html';require('fs').mkdirSync(OUT,{recursive:true});
const {execFileSync}=require('child_process');const FC={};
// Google Fonts: tarayıcı proxy'siz; istek curl ile (ajan proxy üzerinden) indirilip verilir
const fontRoute=async r=>{const u=r.request().url();try{if(!FC[u])FC[u]=execFileSync('curl',['-sS','-m','20','-A','Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',u]);
  await r.fulfill({status:200,contentType:/googleapis/.test(u)?'text/css':'font/woff2',body:FC[u],headers:{'access-control-allow-origin':'*'}});}catch(e){await r.fulfill({status:200,contentType:'text/css',body:''});}};
(async()=>{const b=await pw.chromium.launch();
const checks=[];
for(const t of ['neon','sunset','poker','arcade']){
  const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,ignoreHTTPSErrors:true});const p=await c.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));await c.route(/fonts\.(googleapis|gstatic)\.com/,fontRoute);
  await p.addInitScript(t=>{localStorage.setItem('tavla_name','"BURAK"');localStorage.setItem('tavla_lang','"tr"');localStorage.setItem('tavla_theme',JSON.stringify(t));localStorage.setItem('tavla_snd','"off"');localStorage.setItem('tavla_av','0');localStorage.setItem('tavla_tlc','20');localStorage.setItem('tavla_target','3');localStorage.setItem('tavla_lvl','"hard"');},t);
  await p.goto(URL);await p.waitForFunction(()=>document.documentElement.classList.contains('asset'),null,{timeout:6000}).catch(()=>{});
  await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(900);
  const home=await p.evaluate(()=>{const r=e=>e.getBoundingClientRect();const lg=$('#home .logo .lg-t'),lh=parseFloat(getComputedStyle(lg).fontSize);
    const hero=r($('#heroB')),mods=r($('#home .modes')),opts=r($('#optCpu')),hb=r($('#hero'));
    const on=g=>[...document.querySelectorAll(`#optCpu [data-grp=${g}] button.on`)].map(b=>b.dataset.v);
    return {fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family).filter((v,i,a)=>a.indexOf(v)===i).join(','),
      logoTek:r(lg).height<lh*1.6,logoIcinde:r($('#home .logo')).right<=r($('#home')).right+.5&&r($('#home .logo')).left>=r($('#home')).left-.5,
      isim:!$('#hello').hidden&&$('#helloN').textContent==='BURAK'&&r($('#hello')).height>0,
      masa:!!document.querySelector('#heroB image,#heroB polygon')&&hb.height>=140&&hero.top>=mods.bottom-2&&hero.bottom<=opts.top+2,
      seviye:on('lvl'),set:on('tgt'),sure:on('tlc'),tasma:document.scrollingElement.scrollWidth<=innerWidth&&$('#home').scrollWidth<=$('#home').clientWidth+1};});
  checks.push([t,home]);
  await p.screenshot({path:`${OUT}/${t}-1-giris.png`});
  await p.tap('#bGo');await p.waitForTimeout(500);
  const clean=()=>p.evaluate(()=>{const d=document.getElementById('dbt');if(d){d.classList.remove('pop');d.textContent='';}G.flash='';G.msg='';const s=$('#slg');s.className='';s.textContent='';render();});
  // 2) başlangıç dizilimi
  await p.evaluate(()=>{G.run++;Object.assign(G,{op:0,turn:1,rolled:false,busy:false,over:false,last:null});G.st=newState();opClear();render();timerSync();});
  await p.waitForTimeout(900);await clean();await p.waitForTimeout(150);
  await p.screenshot({path:`${OUT}/${t}-2-baslangic.png`});
  // 3) normal oyun: 6-3 atıldı, bir pul oynandı, ikinci pul seçili (hedefler ve rakibin son hamlesi işaretli)
  await p.evaluate(()=>{G.run++;const b=Array(24).fill(0);Object.assign(b,{23:1,13:2,12:3,8:2,7:3,5:3,4:1});[[0,-2],[2,-2],[11,-4],[16,-3],[18,-3],[20,-1]].forEach(([i,v])=>b[i]=v);
    G.st={b,bar:[0,0],off:[0,0]};Object.assign(G,{op:0,turn:1,rolled:true,all:[6,3],dice:[6,3],seed:777,rollPos:{x:300,y:210},busy:false,over:false,sel:null,last:[{f:6,t:2,by:-1},{f:4,t:0,by:-1}]});render();timerSync();});
  await p.waitForTimeout(1800);
  await p.evaluate(()=>{doHuman({f:13,t:7,d:6});});await p.waitForTimeout(700);
  await p.evaluate(()=>{G.sel=12;render();});await clean();await p.evaluate(()=>{G.sel=12;render();});await p.waitForTimeout(200);
  await p.screenshot({path:`${OUT}/${t}-3-hamle.png`});
  // 4) altı iç kapı kapalı + rakip pul kırık
  await p.evaluate(()=>{G.run++;const b=Array(24).fill(0);Object.assign(b,{0:2,1:2,2:3,3:2,4:2,5:2,12:2});[[23,-2],[18,-4],[16,-3],[11,-4],[20,-1]].forEach(([i,v])=>b[i]=v);
    G.st={b,bar:[0,1],off:[0,0]};Object.assign(G,{op:0,turn:1,rolled:false,dice:[],all:[],busy:false,over:false,sel:null,last:null});render();timerSync();});
  await p.waitForTimeout(500);await clean();await p.waitForTimeout(300);
  await p.screenshot({path:`${OUT}/${t}-4-kapi-kirik.png`});
  // 5) toplama aşaması, son 5 sn
  await p.evaluate(()=>{G.run++;const b=Array(24).fill(0);Object.assign(b,{0:2,1:2,2:1,3:2,4:1,5:2});[[23,-3],[22,-3],[21,-2],[20,-2],[19,-1],[18,-1]].forEach(([i,v])=>b[i]=v);
    G.st={b,bar:[0,0],off:[5,3]};Object.assign(G,{op:0,turn:1,rolled:true,all:[6,4],dice:[6,4],seed:4242,rollPos:{x:300,y:200},busy:false,over:false,sel:5,last:null});render();timerSync();});
  await p.waitForTimeout(1700);await clean();
  await p.evaluate(()=>{G.sel=5;render();G.deadline=Date.now()+4600;tbPaint();});await p.waitForTimeout(250);
  await p.screenshot({path:`${OUT}/${t}-5-toplama.png`});
  // 6) bitiş: son pulu toplayıp maçı kazan
  await p.evaluate(()=>{G.run++;SC={you:2,cpu:1};const b=Array(24).fill(0);b[0]=1;[[23,-6],[22,-5]].forEach(([i,v])=>b[i]=v);G.st={b,bar:[0,0],off:[14,4]};Object.assign(G,{rolled:true,all:[1,2],dice:[1,2],busy:false,over:false,sel:null,last:null});render();doHuman({f:0,t:'off',d:1});});
  await p.waitForTimeout(1300);
  await p.screenshot({path:`${OUT}/${t}-6-bitis.png`});
  checks.push([t+' hata',errs]);
  await c.close();}
console.log(JSON.stringify(checks,null,1));
await b.close();})();
