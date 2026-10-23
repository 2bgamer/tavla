/* Tavla Masası: tema parametreleri (yalnızca veri; çizim kodu index.html'de).
   a: Grafik Paketi v1 varlık klasörü (assets/<tema>/): board-field, board-frame, checker-{light,dark}, btn-roll,
      adv-bar-track, avatar-ring, fx-closed-point. Üçgen renkleri points.svg'deki #pt-a / #pt-b stilinden.
   tk: varlık yüklenene kadar ve küçük çizimlerde (isim etiketi, toplanan pul) kullanılan renkler. adv: üstünlük barı [oyuncu, rakip]. */
window.TAVLA_THEMES={
  neon:{c:'#0b0620',a:'assets/neon/',adv:['#21c8ff','#ff2f9a'],tk:{frame:'#150a31',field:'#0d0724',bar:'#1d1042',
    triA:'#11c9ff',triSA:'#00dafa',triB:'#e343d4',triSB:'#f63bd9',triW:.65,
    l:{g:['#ffffff','#ffecff','#d9b8e6'],s:'#f63bd9'},d:{g:['#ff6a8e','#f31352','#7a0628'],s:'#f63bd9'},
    hi:'#fff35a',hiFill:'rgba(255,243,90,.3)',dest:'rgba(34,228,255,.38)',destS:'#22e4ff',
    die:{face:[246,241,255],edge:'#9d86e0',pip:'#1a0b3a',one:'#ff3dcb'}}},
  sunset:{c:'#ffd6b8',a:'assets/sunset/',adv:['#21b8d6','#ff4f7b'],tk:{frame:'#965224',field:'#ffd29a',bar:'#965224',
    triA:'#ffecbd',triSA:'#19b5af',triB:'#23aeb2',triSB:'#f9a12d',triW:.65,
    l:{g:['#ffffff','#fff9e8','#e8d3b0'],s:'#f9a12d'},d:{g:['#f0566a','#c81e37','#5e0a17'],s:'#f9a12d'},
    hi:'#ffcf3a',hiFill:'rgba(255,207,58,.35)',dest:'rgba(255,207,58,.5)',destS:'#ff9f1c',
    die:{face:[255,250,240],edge:'#e9b98d',pip:'#4a2234',one:'#ff4d6d'}}},
  poker:{c:'#07140f',a:'assets/poker/',adv:['#2ee07a','#e9e4d4'],tk:{frame:'#160f0b',field:'#04553c',bar:'#160f0b',
    triA:'#efcf7a',triSA:'#ebdb9d',triB:'#113627',triSB:'#c99c45',triW:.65,
    l:{g:['#ffffff','#fff7df','#e2d3a8'],s:'#c99c45'},d:{g:['#e54b5e','#bd112a','#560610'],s:'#c99c45'},
    hi:'#ffd86b',hiFill:'rgba(255,216,107,.3)',dest:'rgba(255,216,107,.38)',destS:'#ffd86b',
    die:{face:[250,244,228],edge:'#b9a77a',pip:'#141414',one:'#b3261e'}}},
  arcade:{c:'#0a1f4d',a:'assets/arcade/',adv:['#1e88ff','#ffffff'],tk:{frame:'#05172c',field:'#087bdc',bar:'#05172c',
    triA:'#ffdc23',triSA:'#02ccff',triB:'#fe285b',triSB:'#ffe51c',triW:.65,
    l:{g:['#ffffff','#fffdf3','#e6e2cf'],s:'#ffe51c'},d:{g:['#ff4f6a','#d80e31','#650414'],s:'#ffe51c'},
    hi:'#00f0ff',hiFill:'rgba(0,240,255,.3)',dest:'rgba(0,240,255,.42)',destS:'#00f0ff',
    die:{face:[255,255,255],edge:'#000000',pip:'#111111',one:'#ff3b47'}}}
};
window.TAVLA_THEME_NAMES={neon:'Neon Club',sunset:'Sunset Pop',poker:'Poker Lounge',arcade:'Street Arcade'};
