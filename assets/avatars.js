/* Tavla Masası: geçici çizgi avatarlar (6 oyuncu + bilgisayar). Yalnızca veri: SVG metinleri.
   ChatGPT'nin hazırlayacağı avatarlar gelince bu dosya, aynı sırayla görsel yollarıyla değiştirilir. */
(function(){
  const EYES='<path d="M23.5 23.5q3-2 6 0M34.5 23.5q3-2 6 0" stroke="#3a2418" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="27" cy="28" r="1.8" fill="#2a1a12"/><circle cx="37" cy="28" r="1.8" fill="#2a1a12"/>';
  const SHADES='<path d="M19 26.5h26" stroke="#111" stroke-width="1.6"/><rect x="20.5" y="25" width="10" height="6.5" rx="2.6" fill="#111"/><rect x="33.5" y="25" width="10" height="6.5" rx="2.6" fill="#111"/><path d="M22.5 26.6h3.5M35.5 26.6h3.5" stroke="#fff" stroke-opacity=".55" stroke-width="1" stroke-linecap="round"/>';
  const SMILE='<path d="M27 36q5 4 10 0" stroke="#6b2d1c" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
  const face=o=>`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="64" height="64" fill="${o.bg}"/>`+
    `<path d="M9 64c2-12 11-18 23-18s21 6 23 18z" fill="${o.shirt}"/><rect x="27" y="37" width="10" height="10" rx="3" fill="${o.skinD}"/>`+
    (o.back||'')+`<ellipse cx="18.8" cy="30" rx="3" ry="4" fill="${o.skinD}"/><ellipse cx="45.2" cy="30" rx="3" ry="4" fill="${o.skinD}"/>`+
    `<ellipse cx="32" cy="28" rx="13" ry="15" fill="${o.skin}"/><ellipse cx="24" cy="33" rx="2.6" ry="1.6" fill="#ff8a80" opacity=".35"/><ellipse cx="40" cy="33" rx="2.6" ry="1.6" fill="#ff8a80" opacity=".35"/>`+
    (o.hair||'')+(o.eyes===undefined?EYES:o.eyes)+(o.mouth===undefined?SMILE:o.mouth)+(o.extra||'')+`</svg>`;
  window.TAVLA_AVATARS=[
    // 1: kısa koyu saç, güneş gözlüğü
    face({bg:'#1fb5c7',shirt:'#0f3b57',skin:'#f3c9a6',skinD:'#dfab86',
      hair:'<path d="M19 27c-1.5-11 5.5-16 13-16s14.5 5 13 16c-2-6-6.5-9-13-9s-11 3-13 9z" fill="#1f1410"/>',eyes:SHADES}),
    // 2: dalgalı saç, hasır şapka, güneş gözlüğü
    face({bg:'#ff6f9f',shirt:'#ffffff',skin:'#f6d2b4',skinD:'#e2b394',
      back:'<path d="M16 28c-4 11 0 20 6 22h20c6-2 10-11 6-22z" fill="#6b3a1c"/>',
      hair:'<path d="M19 26c2-6 7-8 13-8s11 2 13 8c-3-3-7-4-13-4s-10 1-13 4z" fill="#6b3a1c"/><ellipse cx="32" cy="17.5" rx="23" ry="5" fill="#e9c98f"/><path d="M20.5 17.5c0-8.5 5-12 11.5-12s11.5 3.5 11.5 12z" fill="#e9c98f"/><path d="M20.8 14.5h22.4v3.2H20.8z" fill="#c0392b"/>',
      eyes:SHADES,mouth:'<path d="M27.5 36q4.5 3.5 9 0" stroke="#c0392b" stroke-width="2" fill="none" stroke-linecap="round"/>'}),
    // 3: at kuyruğu, küpe
    face({bg:'#8b5cf6',shirt:'#fbbf24',skin:'#f6d2b4',skinD:'#e2b394',
      back:'<path d="M44 19c9 2 11 13 6 22-1-7-3-11-7-13z" fill="#c0612b"/>',
      hair:'<path d="M19 27c0-10.5 6-15.5 13-15.5s13 5 13 15.5c-3-6-8-8.5-13-8.5-3 4-9 6.5-13 8.5z" fill="#c0612b"/>',
      extra:'<circle cx="18.8" cy="35" r="1.6" fill="#ffd400"/><circle cx="45.2" cy="35" r="1.6" fill="#ffd400"/>'}),
    // 4: kıvırcık saç, sakal
    face({bg:'#ff9a3d',shirt:'#14532d',skin:'#a8693f',skinD:'#8c5532',
      hair:'<g fill="#1b120c"><circle cx="21" cy="19" r="5"/><circle cx="27" cy="14.5" r="5.5"/><circle cx="34" cy="13.5" r="5.5"/><circle cx="40.5" cy="16.5" r="5"/><circle cx="44" cy="22" r="4"/><circle cx="19.5" cy="24" r="3.5"/></g>',
      mouth:'<path d="M19.5 30c0 10 5.5 14.5 12.5 14.5S44.5 40 44.5 30c-2 5-5 6.5-7.5 6.5H27c-2.5 0-5.5-1.5-7.5-6.5z" fill="#1b120c"/><path d="M27.5 37q4.5 3 9 0" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>'}),
    // 5: ters şapka, çil
    face({bg:'#ffd400',shirt:'#ef4444',skin:'#f3c9a6',skinD:'#dfab86',
      hair:'<path d="M19 24c0-8.5 6-13 13-13s13 4.5 13 13c-4-2-8-3-13-3s-9 1-13 3z" fill="#2563eb"/><path d="M42 18.5c5.5-.5 10 .5 11 3l-10 1.5z" fill="#1d4ed8"/><circle cx="32" cy="11.6" r="1.4" fill="#1d4ed8"/>',
      extra:'<g fill="#c27c4a" opacity=".7"><circle cx="24" cy="31" r=".7"/><circle cx="26" cy="32.4" r=".7"/><circle cx="22.6" cy="32.6" r=".7"/><circle cx="40" cy="31" r=".7"/><circle cx="38" cy="32.4" r=".7"/><circle cx="41.4" cy="32.6" r=".7"/></g>'}),
    // 6: kır saç, bıyık, yuvarlak gözlük
    face({bg:'#22c55e',shirt:'#334155',skin:'#e0a979',skinD:'#c98f62',
      hair:'<path d="M19.5 29c-1.5-7 .5-11.5 4.5-13.5 0 4.5 0 9-.5 13.5zM44.5 29c1.5-7-.5-11.5-4.5-13.5 0 4.5 0 9 .5 13.5z" fill="#d6dbe1"/><path d="M24 15c3-2.5 13-2.5 16 0" stroke="#d6dbe1" stroke-width="2" fill="none" stroke-linecap="round"/>',
      eyes:EYES+'<circle cx="27" cy="28" r="4.6" fill="none" stroke="#3a2418" stroke-width="1.3"/><circle cx="37" cy="28" r="4.6" fill="none" stroke="#3a2418" stroke-width="1.3"/><path d="M31.6 28h.8" stroke="#3a2418" stroke-width="1.3"/>',
      mouth:'<path d="M25.5 34.5q6.5-3.5 13 0q-6.5 2.5-13 0z" fill="#d6dbe1"/><path d="M29 38q3 1.6 6 0" stroke="#6b2d1c" stroke-width="1.5" fill="none" stroke-linecap="round"/>'})
  ];
  window.TAVLA_AVATAR_CPU='<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="64" height="64" fill="#1e293b"/>'+
    '<path d="M9 64c2-12 11-17 23-17s21 5 23 17z" fill="#475569"/><path d="M32 9v6" stroke="#94a3b8" stroke-width="2"/><circle cx="32" cy="8" r="2.6" fill="#22e4ff"/>'+
    '<rect x="15" y="15" width="34" height="29" rx="9" fill="#cbd5e1"/><rect x="13" y="25" width="4" height="9" rx="2" fill="#94a3b8"/><rect x="47" y="25" width="4" height="9" rx="2" fill="#94a3b8"/>'+
    '<rect x="19.5" y="20" width="25" height="12" rx="6" fill="#0f172a"/><rect x="23" y="23.5" width="6" height="5" rx="2.5" fill="#22e4ff"/><rect x="35" y="23.5" width="6" height="5" rx="2.5" fill="#22e4ff"/>'+
    '<path d="M24 38h16" stroke="#334155" stroke-width="2.4" stroke-linecap="round"/><path d="M28 36v4M32 36v4M36 36v4" stroke="#334155" stroke-width="1.2"/></svg>';
})();
