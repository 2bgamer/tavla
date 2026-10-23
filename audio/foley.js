/* Tavla Masası: kayıtlı foley sesleri (zar ve pul).
   assets/sfx/manifest.json içinde listelenen dosyalar yüklenir: {"dice":[...],"checker":[...],"hit":[...]}.
   Bir türün listesi boşsa ya da dosyalar yüklenemezse oyun o tür için sentez sesine döner. */
window.TavlaFoley=(function(){
  const S={dice:[],checker:[],hit:[]},last={},lastI={};let loading=null;
  function load(ac){
    if(loading||!ac)return loading;
    const get=f=>fetch('assets/sfx/'+f).then(r=>{if(!r.ok)throw new Error(f);return r.arrayBuffer();})
      .then(b=>new Promise((ok,no)=>ac.decodeAudioData(b,ok,no)));
    loading=fetch('assets/sfx/manifest.json').then(r=>r.ok?r.json():{}).catch(()=>({}))
      .then(m=>Promise.all(Object.keys(S).map(k=>Promise.all((Array.isArray(m[k])?m[k]:[]).map(f=>get(f).then(buf=>{S[k].push(buf);}).catch(()=>{}))))));
    return loading;
  }
  const has=k=>!!(S[k]&&S[k].length);
  // t: AudioContext zamanı; vel: 0..1; gap: aynı türden iki ses arasındaki en kısa süre (sn), üst üste binmeyi önler.
  // Her çalışta başka bir örnek, ±%6 ton ve ±%15 seviye farkı.
  function play(ac,dest,k,t,vel,gap){
    const L=S[k];if(!L||!L.length)return false;
    if(last[k]!=null&&Math.abs(t-last[k])<(gap||0))return true;
    last[k]=t;
    let i=Math.floor(Math.random()*L.length);if(L.length>1&&i===lastI[k])i=(i+1)%L.length;lastI[k]=i;
    const s=ac.createBufferSource();s.buffer=L[i];s.playbackRate.value=.94+Math.random()*.12;
    const g=ac.createGain();g.gain.value=Math.max(.05,Math.min(1.2,(vel==null?1:vel)*(.85+Math.random()*.3)));
    s.connect(g);g.connect(dest);s.start(Math.max(ac.currentTime,t));
    return true;
  }
  return {load,has,play};
})();
