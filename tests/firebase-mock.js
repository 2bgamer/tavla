// Firebase Authentication (compat) taklidi: account.js testleri ve online oyunun anonim kimliği için. Kullanıcı localStorage'da tutulur (yeniden yüklemede oturum sürer).
(()=>{const K='__fbmock_user';// jeton: imzasız JWT (Firebase emülatörü kabul eder; RTDB taklidi bakmaz)
const b64=x=>btoa(JSON.stringify(x)).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
const jwt=o=>{const n=Math.floor(Date.now()/1000);return b64({alg:'none',typ:'JWT'})+'.'+b64({iss:'https://securetoken.google.com/demo-tavla',aud:'demo-tavla',sub:o.uid,user_id:o.uid,iat:n,exp:n+3600,auth_time:n,firebase:{sign_in_provider:o.isAnonymous?'anonymous':'google.com'}})+'.';};
const mk=o=>o&&Object.assign({},o,{getIdToken:async()=>jwt(o),async delete(){if(window.__mockRecent)throw {code:'auth/requires-recent-login'};window.__deleted=o.uid;set(null);}});
let u=mk(JSON.parse(localStorage.getItem(K)||'null'));let cbs=[];
const set=x=>{u=mk(x);localStorage.setItem(K,JSON.stringify(x));A.currentUser=u;cbs.forEach(c=>c(u));};
const A={currentUser:u,onAuthStateChanged(c){cbs.push(c);setTimeout(()=>c(u),30);},
 async signInWithPopup(pr){window.__popupCalled=true;window.__popupProv=pr&&pr.providerId;if(window.__mockPopupBlocked)throw {code:'auth/popup-blocked'};const ap=pr&&pr.providerId==='apple.com';set({uid:window.__mockUid||'u1',email:ap?'x1@privaterelay.appleid.com':'burak@gmail.com',displayName:ap?null:'Burak Bilgin',providerData:[{providerId:ap?'apple.com':'google.com'}]});return {user:u};},
 async signInWithRedirect(){window.__redirected=true;},async getRedirectResult(){return null;},async sendSignInLinkToEmail(e){window.__sent=e;},
 isSignInWithEmailLink:h=>/oobCode=/.test(h),async signInWithEmailLink(e){set({uid:'m1',email:e,providerData:[{providerId:'password'}]});},
 async signInAnonymously(){window.__anonCalled=(window.__anonCalled||0)+1;set({uid:'anon'+Math.random().toString(36).slice(2,10),isAnonymous:true,providerData:[]});return {user:u};},
 async signInWithCredential(c){window.__credSignIn=c;const ap=c&&c.providerId==='apple.com';set({uid:window.__mockUid||'u1',email:'burak@gmail.com',displayName:'Burak Bilgin',providerData:[{providerId:ap?'apple.com':'google.com'}]});return {user:u};},
 async signOut(){set(null);}};
const auth=()=>A;auth.GoogleAuthProvider=class{constructor(){this.providerId='google.com';}setCustomParameters(){}};auth.GoogleAuthProvider.credential=(idToken)=>({providerId:'google.com',idToken});auth.OAuthProvider=class{constructor(id){this.providerId=id;}addScope(){}credential(o){return Object.assign({providerId:this.providerId},o);}};
window.firebase={apps:[],initializeApp(){this.apps.push(1);},auth};})();
