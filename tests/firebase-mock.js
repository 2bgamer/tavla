// Firebase Authentication (compat) taklidi: account.js testleri için. Kullanıcı localStorage'da tutulur (yeniden yüklemede oturum sürer).
(()=>{const K='__fbmock_user';const mk=o=>o&&Object.assign({},o,{getIdToken:async()=>'tok'});
let u=mk(JSON.parse(localStorage.getItem(K)||'null'));let cbs=[];
const set=x=>{u=mk(x);localStorage.setItem(K,JSON.stringify(x));A.currentUser=u;cbs.forEach(c=>c(u));};
const A={currentUser:u,onAuthStateChanged(c){cbs.push(c);setTimeout(()=>c(u),30);},
 async signInWithPopup(){set({uid:window.__mockUid||'u1',email:'burak@gmail.com',displayName:'Burak Bilgin',providerData:[{providerId:'google.com'}]});return {user:u};},
 async signInWithRedirect(){},async getRedirectResult(){return null;},async sendSignInLinkToEmail(e){window.__sent=e;},
 isSignInWithEmailLink:h=>/oobCode=/.test(h),async signInWithEmailLink(e){set({uid:'m1',email:e,providerData:[{providerId:'password'}]});},
 async signOut(){set(null);}};
const auth=()=>A;auth.GoogleAuthProvider=class{setCustomParameters(){}};
window.firebase={apps:[],initializeApp(){this.apps.push(1);},auth};})();
