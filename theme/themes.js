/* Tavla Masası: tema parametreleri (yalnızca veri; çizim kodu index.html'de).
   tk: SVG çizim tokenları. Pullar onaylı konsepte göre dört temada beyaz ve kırmızı.
   burn: tam kapı + rakip kırık efekti (fire | elec | light). adv: üstünlük barı [oyuncu, rakip]. */
window.TAVLA_THEMES={
  neon:{c:'#0b0620',burn:'elec',adv:['#21c8ff','#ff2f9a'],tk:{frame:'#150a31',frameS:'#ff3dcb',frameW:2.5,glow:'#ff3dcb',field:'#0d0724',tex:'txGrid',bar:'#1d1042',barS:'rgba(34,228,255,.45)',
    triA:'#2f6bff',triB:'#e62dbf',triS:'rgba(255,255,255,.6)',triW:.8,triO:.92,
    l:{g:['#ffffff','#eef6ff','#b9c6e6'],s:'#22e4ff',r:'#9fdcff',h:'#ffffff'},d:{g:['#ff7a8a','#e0102e','#5a0010'],s:'#ff3d5a',r:'#ff9aa8',h:'#ffd0d6'},sheen:.3,ckW:1,
    hi:'#fff35a',hiFill:'rgba(255,243,90,.3)',dest:'rgba(34,228,255,.38)',destS:'#22e4ff',
    die:{face:[246,241,255],edge:'#9d86e0',pip:'#1a0b3a',one:'#ff3dcb'}}},
  sunset:{c:'#ffd6b8',burn:'fire',adv:['#21b8d6','#ff4f7b'],tk:{frame:'#ff7a59',frameS:'#e2524a',frameW:2,glow:'',field:'#fff1dc',tex:'txSun',bar:'#ffb08a',barS:'',
    triA:'#16b5ad',triB:'#ff6f61',triS:'',triW:0,triO:1,
    l:{g:['#ffffff','#fff6ea','#e8cfae'],s:'#c79a6a',r:'#e6c39a',h:'#ffffff'},d:{g:['#ff6b6b','#d81e2c','#6e0a12'],s:'#5a0710',r:'#ff9f9f',h:'#ffd6d6'},sheen:.25,ckW:1,
    hi:'#ffcf3a',hiFill:'rgba(255,207,58,.35)',dest:'rgba(255,207,58,.5)',destS:'#ff9f1c',
    die:{face:[255,250,240],edge:'#e9b98d',pip:'#4a2234',one:'#ff4d6d'}}},
  poker:{c:'#07140f',burn:'light',adv:['#2ee07a','#e9e4d4'],tk:{frame:'#17110c',frameS:'#d4af37',frameW:2,glow:'',field:'#0f5e3c',tex:'txFelt',bar:'#120d09',barS:'rgba(212,175,55,.5)',
    triA:'#3f8f5e',triB:'#173f2b',triS:'rgba(212,175,55,.65)',triW:.8,triO:1,
    l:{g:['#fffaf0','#efe2c4','#bfa772'],s:'#7a6538',r:'#b8964d',h:'#ffffff'},d:{g:['#e2574c','#a8141c','#4a0508'],s:'#3a0306',r:'#ff8a80',h:'#ffc9c4'},sheen:.15,ckW:1,
    hi:'#ffd86b',hiFill:'rgba(255,216,107,.3)',dest:'rgba(255,216,107,.38)',destS:'#ffd86b',
    die:{face:[250,244,228],edge:'#b9a77a',pip:'#141414',one:'#b3261e'}}},
  arcade:{c:'#0a1f4d',burn:'elec',adv:['#1e88ff','#ffffff'],tk:{frame:'#111111',frameS:'#000000',frameW:3,glow:'',field:'#1c6ee8',tex:'txDots',bar:'#0b2f6e',barS:'#000000',
    triA:'#ffd400',triB:'#ff3b47',triS:'#000000',triW:1.8,triO:1,
    l:{g:['#ffffff','#f2f2f2','#c9d6ea'],s:'#000000',r:'#000000',h:'#ffffff'},d:{g:['#ff6a72','#e8132a','#7a0010'],s:'#000000',r:'#ff9aa2',h:'#ffffff'},sheen:0,ckW:2,
    hi:'#00f0ff',hiFill:'rgba(0,240,255,.3)',dest:'rgba(0,240,255,.42)',destS:'#00f0ff',
    die:{face:[255,255,255],edge:'#000000',pip:'#111111',one:'#ff3b47'}}}
};
window.TAVLA_THEME_NAMES={neon:'Neon Club',sunset:'Sunset Pop',poker:'Poker Lounge',arcade:'Street Arcade'};
