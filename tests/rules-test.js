// Firebase RTDB kurallarının (database.rules.json) testleri: Firebase emülatöründe çalışır
//   npx firebase emulators:exec --only database --project demo-tavla "node tests/rules-test.js"
const fs=require('fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {ref,get,set,update,push,remove}=require('firebase/database');
const res=[];let fails=0;
async function t(name,p){try{await p;res.push('PASS  '+name);}catch(e){fails++;res.push('FAIL  '+name+'  — '+(e&&e.message||e));}}
const room=(w,extra)=>Object.assign({ct:Date.now(),seats:{w},nm:{w:'AHMET'},turn:1,started:false,rev:0},extra||{});
(async()=>{
  const env=await initializeTestEnvironment({projectId:'demo-tavla',database:{rules:fs.readFileSync(__dirname+'/../database.rules.json','utf8')}});
  const anon=uid=>env.authenticatedContext(uid,{firebase:{sign_in_provider:'anonymous'}}).database();
  const acct=uid=>env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'}}).database();
  const A=anon('a'),B=anon('b'),C=anon('c'),X=env.unauthenticatedContext().database();
  const seed=async(path,v)=>env.withSecurityRulesDisabled(c=>set(ref(c.database(),path),v));

  /* odalar */
  await t('kimliksiz kullanıcı oda kuramaz',assertFails(set(ref(X,'games/1000'),room('x'))));
  await t('kimliksiz kullanıcı oda okuyamaz',assertFails(get(ref(X,'games/1000'))));
  await t('oyuncu kendi adına oda kurar',assertSucceeds(set(ref(A,'games/1000'),room('a'))));
  await t('başkası adına oda kurulamaz',assertFails(set(ref(C,'games/1001'),room('a'))));
  await t('ct olmadan oda kurulamaz',assertFails(set(ref(C,'games/1002'),{seats:{w:'c'}})));
  await t('rakip bekleyen oda okunabilir (katılmak için)',assertSucceeds(get(ref(C,'games/1000'))));
  await t('yabancı boş koltuğa başkasını oturtamaz',assertFails(update(ref(C,'games/1000'),{'seats/k':'z'})));
  await t('yabancı kurucuyu değiştiremez',assertFails(update(ref(C,'games/1000'),{'seats/w':'c'})));
  await t('rakip boş koltuğa oturur',assertSucceeds(update(ref(B,'games/1000'),{'seats/k':'b','nm/k':'BURAK',rev:1})));
  await t('dolu oda yabancıya kapalı (okuma)',assertFails(get(ref(C,'games/1000'))));
  await t('dolu oda yabancıya kapalı (yazma)',assertFails(update(ref(C,'games/1000'),{turn:-1})));
  await t('dolu oda yabancıya kapalı (silme)',assertFails(remove(ref(C,'games/1000'))));
  await t('oyuncular oyunu oynar',assertSucceeds(update(ref(A,'games/1000'),{turn:-1,'dice/0':3,rev:2})));
  await t('rakip de yazar',assertSucceeds(update(ref(B,'games/1000'),{turn:1,rev:3})));
  await t('rakip kurucuyu atamaz',assertFails(update(ref(B,'games/1000'),{'seats/w':'b'})));
  await t('oluşturma zamanı değiştirilemez',assertFails(update(ref(A,'games/1000'),{ct:1})));
  await t('HTML içeren ad yazılamaz',assertFails(update(ref(B,'games/1000'),{'nm/k':'<img src=x>'})));
  await t('14 karakterden uzun ad yazılamaz',assertFails(update(ref(B,'games/1000'),{'nm/k':'ABCDEFGHIJKLMNO'})));
  await t('oyuncu sohbete yazar',assertSucceeds(push(ref(B,'games/1000/msgs'),{from:'b',n:-1,nm:'BURAK',t:Date.now(),text:'merhaba'})));
  await t('başkası adına mesaj yazılamaz',assertFails(push(ref(B,'games/1000/msgs'),{from:'a',t:Date.now(),text:'x'})));
  await t('200 karakterden uzun mesaj yazılamaz',assertFails(push(ref(B,'games/1000/msgs'),{from:'b',t:Date.now(),text:'x'.repeat(201)})));
  await t('yabancı sohbete yazamaz',assertFails(push(ref(C,'games/1000/msgs'),{from:'c',t:Date.now(),text:'x'})));
  await t('kurucu rakibi atar ve yasaklar',assertSucceeds(update(ref(A,'games/1000'),{'seats/k':null,'nm/k':null,'ban/b':1})));
  await t('atılan oyuncu odayı görebilir (atıldığını anlar)',assertSucceeds(get(ref(B,'games/1000'))));
  await t('atılan oyuncu tekrar oturamaz',assertFails(update(ref(B,'games/1000'),{'seats/k':'b'})));
  await t('başka oyuncu oturabilir',assertSucceeds(update(ref(C,'games/1000'),{'seats/k':'c'})));
  /* eski odalar */
  await seed('games/2000',{seats:{w:'x',k:'y'},started:true});
  await seed('games/2001',room('x',{ct:Date.now()-8*864e5,seats:{w:'x',k:'y'}}));
  await seed('games/2002',room('x',{seats:{w:'x',k:'y'}}));
  await t('oluşturma zamanı herkese açık',assertSucceeds(get(ref(C,'games/2002/ct'))));
  await t('eski sürüm odası (ct yok) silinebilir',assertSucceeds(remove(ref(C,'games/2000'))));
  await t('7 günden eski oda silinebilir',assertSucceeds(remove(ref(C,'games/2001'))));
  await t('yeni oda silinemez',assertFails(remove(ref(C,'games/2002'))));

  /* oda listesi */
  const lb=(u,extra)=>Object.assign({u,n:'AHMET',av:0,lv:1,xp:0,tg:1,tl:0,th:'poker',t:Date.now()},extra||{});
  await t('herkes listeyi okur',assertSucceeds(get(ref(X,'lobby'))));
  await t('kurucu ilan verir',assertSucceeds(set(ref(A,'lobby/3000'),lb('a'))));
  await t('başkası adına ilan verilemez',assertFails(set(ref(C,'lobby/3001'),lb('a'))));
  await t('başkasının ilanı değiştirilemez',assertFails(set(ref(C,'lobby/3000'),lb('c'))));
  await t('başkasının ilanı silinemez',assertFails(remove(ref(C,'lobby/3000'))));
  await t('HTML adlı ilan verilemez',assertFails(set(ref(C,'lobby/3002'),lb('c',{n:'<b>x</b>'}))));
  await t('kod 4 rakam olmalı',assertFails(set(ref(C,'lobby/abc'),lb('c'))));
  await seed('games/3000',room('a',{seats:{w:'a',k:'b'}}));
  await t('odaya oturan rakip ilanı siler',assertSucceeds(remove(ref(B,'lobby/3000'))));
  await seed('lobby/3003',lb('x',{t:Date.now()-11*60000}));
  await t('10 dakikadır tazelenmeyen ilan silinebilir',assertSucceeds(remove(ref(C,'lobby/3003'))));
  await t('kurucu kendi ilanını siler',assertSucceeds(remove(ref(A,'lobby/3000'))));

  /* profil ve adlar */
  const G1=acct('g1'),G2=acct('g2');
  await t('hesap kendi profilini yazar',assertSucceeds(set(ref(G1,'users/g1'),{n:'AHMET',av:1,xp:{xp:5},t:1})));
  await t('hesap kendi profilini okur',assertSucceeds(get(ref(G1,'users/g1'))));
  await t('başkasının profili okunamaz',assertFails(get(ref(G2,'users/g1'))));
  await t('başkasının profili yazılamaz',assertFails(set(ref(G2,'users/g1'),{n:'X'})));
  await t('anonim hesap profil yazamaz',assertFails(set(ref(A,'users/a'),{n:'X'})));
  await t('hesap ad alır',assertSucceeds(set(ref(G1,'names/AHMET'),'g1')));
  await t('alınmış ad başkasına geçmez',assertFails(set(ref(G2,'names/AHMET'),'g2')));
  await t('ad başkası adına alınamaz',assertFails(set(ref(G2,'names/MEHMET'),'g1')));
  await t('anonim hesap ad alamaz',assertFails(set(ref(A,'names/ALI'),'a')));
  await t('ad sahibi kim herkes görür (tekil ad kontrolü)',assertSucceeds(get(ref(X,'names/AHMET'))));
  await t('ad listesinin tamamı okunamaz',assertFails(get(ref(X,'names'))));
  await t('hesap adını bırakır',assertSucceeds(remove(ref(G1,'names/AHMET'))));

  await env.cleanup();
  console.log(res.join('\n'));console.log(`\n${res.length-fails}/${res.length} geçti`);
  process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
