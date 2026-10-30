/* Tavla Sultanı: tema parametreleri (yalnızca veri; çizim kodu index.html'de).
   a: Premium Asset v2 klasörü (assets/<tema>/): board-field, board-frame, checker-{light,dark}, btn-roll,
      adv-bar-track, avatar-ring, fx-closed-point, points (üçgen degradesi ve konturu çalışma anında points.svg'den okunur).
   card: tema seçim kartının sinematik önizlemesi (384×1024 portre; logo/başlık/OYNA resme gömülü olduğu için kartta
      yalnızca yazısız orta bant, yani masa sahnesi, gösterilir: object-position 50% 65%). Yüklenemezse kod çizimi önizleme kalır.
   home (isteğe bağlı): giriş ekranı görsel yuvaları {logo, table, bg}: dosya yolu verilince yedek çizimin yerine geçer.
   tk: varlık yüklenene kadar ve küçük çizimlerde (isim etiketi, toplanan pul) kullanılan renkler. adv: üstünlük barı [oyuncu, rakip]. */
window.TAVLA_THEMES={
  neon:{card:'assets/home/theme-cards/neon.webp',c:'#0b0620',a:'assets/neon/',adv:['#21c8ff','#ff2f9a'],tk:{frame:'#150a31',field:'#0d0724',bar:'#1d1042',
    triA:'#12dffc',triSA:'#ff84f3',triB:'#fc24cd',triSB:'#ff84f3',triW:.7,
    l:{g:['#ffffff','#fffaf1','#bab2aa'],s:'#12dffc'},d:{g:['#ff8aa5','#da0938','#570218'],s:'#12dffc'},
    hi:'#fff35a',hiFill:'rgba(255,243,90,.3)',dest:'rgba(34,228,255,.38)',destS:'#22e4ff',
    die:{face:[246,241,255],edge:'#9d86e0',pip:'#1a0b3a',one:'#ff3dcb'}}},
  sunset:{card:'assets/home/theme-cards/sunset.webp',c:'#ffd6b8',a:'assets/sunset/',adv:['#21b8d6','#ff4f7b'],tk:{frame:'#965224',field:'#ffd29a',bar:'#965224',
    triA:'#08acb7',triSA:'#ffdda4',triB:'#ff8d38',triSB:'#ffdda4',triW:.7,
    l:{g:['#ffffff','#fffaf1','#bab2aa'],s:'#08acb7'},d:{g:['#ff8aa5','#da0938','#570218'],s:'#08acb7'},
    hi:'#ffcf3a',hiFill:'rgba(255,207,58,.35)',dest:'rgba(255,207,58,.5)',destS:'#ff9f1c',
    die:{face:[255,250,240],edge:'#e9b98d',pip:'#4a2234',one:'#ff4d6d'}}},
  poker:{card:'assets/home/theme-cards/poker.webp',c:'#07140f',a:'assets/poker/',adv:['#2ee07a','#e9e4d4'],tk:{frame:'#160f0b',field:'#04553c',bar:'#160f0b',
    triA:'#ebdfac',triSA:'#ffdf87',triB:'#d1a451',triSB:'#ffdf87',triW:.7,
    l:{g:['#ffffff','#fffaf1','#bab2aa'],s:'#ebdfac'},d:{g:['#ff8aa5','#da0938','#570218'],s:'#ebdfac'},
    hi:'#ffd86b',hiFill:'rgba(255,216,107,.3)',dest:'rgba(255,216,107,.38)',destS:'#ffd86b',
    die:{face:[250,244,228],edge:'#b9a77a',pip:'#141414',one:'#b3261e'}}},
  arcade:{card:'assets/home/theme-cards/arcade.webp',c:'#0a1f4d',a:'assets/arcade/',adv:['#1e88ff','#ffffff'],tk:{frame:'#05172c',field:'#087bdc',bar:'#05172c',
    triA:'#04cdff',triSA:'#f02e4c',triB:'#ffe217',triSB:'#f02e4c',triW:.7,
    l:{g:['#ffffff','#fffaf1','#bab2aa'],s:'#04cdff'},d:{g:['#ff8aa5','#da0938','#570218'],s:'#04cdff'},
    hi:'#00f0ff',hiFill:'rgba(0,240,255,.3)',dest:'rgba(0,240,255,.42)',destS:'#00f0ff',
    die:{face:[255,255,255],edge:'#000000',pip:'#111111',one:'#ff3b47'}}},
  // Klasik: kızıl maun, bordo, fildişi, pirinç (assets/classic v0.9). Sinematik kart görseli henüz yok: kod önizlemesi gösterilir.
  classic:{c:'#21100d',a:'assets/classic/',adv:['#e8d0a3','#a3242c'],tk:{frame:'#2a0f0c',field:'#6a2a1c',bar:'#4a1a12',
    triA:'#fff0cd',triSA:'#f3cf87',triB:'#8c1d23',triSB:'#bf6c4c',triW:.7,
    l:{g:['#fffaf0','#e5c9a0','#968166'],s:'#d8ad61'},d:{g:['#e74a4d','#8f171b','#340709'],s:'#d8ad61'},
    hi:'#f2cf79',hiFill:'rgba(242,207,121,.3)',dest:'rgba(242,207,121,.4)',destS:'#f2cf79',
    die:{face:[247,238,218],edge:'#a8875a',pip:'#2a120e',one:'#8f171b'}}}
};
window.TAVLA_THEME_NAMES={neon:'Neon Club',sunset:'Sunset Pop',poker:'Poker Lounge',arcade:'Street Arcade',classic:'Klasik'};
