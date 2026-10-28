// Firebase Realtime Database REST + SSE taklidi (test için): GET/PUT/PATCH/POST, EventSource akışı, orderBy/limitToLast
const http=require('http');
const root={};
const subs=new Set();
const seg=p=>p.replace(/\.json$/,'').split('/').filter(Boolean).map(decodeURIComponent);
function get(path){let c=root;for(const k of path){if(c==null||typeof c!=='object')return null;c=c[k];}return c===undefined?null:c;}
function set(path,v){if(!path.length)return;let c=root;for(let i=0;i<path.length-1;i++){if(!c[path[i]]||typeof c[path[i]]!=='object')c[path[i]]={};c=c[path[i]];}
  if(v===null||v===undefined)delete c[path[path.length-1]];else c[path[path.length-1]]=v;}
function q(v,u){
  if(u.searchParams.get('orderBy')==='"$value"'&&v&&typeof v==='object'){const ea=u.searchParams.get('endAt'),lf=+u.searchParams.get('limitToFirst')||1e9;
    const ks=Object.keys(v).filter(k=>ea==null||v[k]<=+ea).sort((a,b)=>v[a]-v[b]).slice(0,lf);const o={};ks.forEach(k=>o[k]=v[k]);return o;}
  const lt=u.searchParams.get('limitToLast');if(!lt||!v||typeof v!=='object')return v;const ks=Object.keys(v).sort().slice(-(+lt));const o={};ks.forEach(k=>o[k]=v[k]);return o;}
function notify(){for(const s of subs){const v=q(get(s.path),s.u);const j=JSON.stringify(v);if(j!==s.last){s.last=j;s.res.write(`event: put\ndata: ${JSON.stringify({path:'/',data:v})}\n\n`);}}}
let n=0;
http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','*');res.setHeader('Access-Control-Allow-Methods','GET,PUT,PATCH,POST,DELETE,OPTIONS');
  if(req.method==='OPTIONS'){res.end();return;}
  const u=new URL(req.url,'http://x'),path=seg(u.pathname);
  if(req.method==='GET'&&(req.headers.accept||'').includes('text/event-stream')){
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'});
    const s={path,u,res,last:null};subs.add(s);notify();req.on('close',()=>subs.delete(s));return;
  }
  let b='';req.on('data',d=>b+=d);req.on('end',()=>{
    const body=b?JSON.parse(b):null;let out=null;
    if(req.method==='GET')out=q(get(path),u);
    else if(req.method==='PUT'){set(path,body);out=body;}
    else if(req.method==='PATCH'){for(const k of Object.keys(body||{}))set(path.concat(k.split('/').filter(Boolean)),body[k]);out=body;}
    else if(req.method==='POST'){const id='-k'+String(Date.now()).padStart(14,'0')+String(n++).padStart(4,'0');set(path.concat(id),body);out={name:id};}
    else if(req.method==='DELETE'){set(path,null);}
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify(out));notify();
  });
}).listen(+process.argv[2]||8790);
