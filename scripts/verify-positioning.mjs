/**
 * Verify the new `position` option in the docs Live Examples (apps/site /docs):
 *   - fixed  → bar pinned to the top from the start (barTop ≈ 0 after scrolling).
 *   - sticky → starts below the faux top header, pins to the top once scrolled to.
 *   - smart  → sticky + auto-hide: scrolling DOWN adds nv-hidden, UP removes it.
 * Drives each example's same-origin iframe via CDP. Shots → scripts/.phase4-shots/.
 */
import { createServer } from "node:http";
import { spawn, execSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = resolve(here, "..");
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const MIME = { ".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".map":"application/json",".ico":"image/x-icon",".woff2":"font/woff2" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0,"127.0.0.1",()=>{const{port}=s.address();s.close(()=>res(port));}); });
function serveDir(rootDir, port){const server=createServer((req,res)=>{try{let p=decodeURIComponent(req.url.split("?")[0]);if(p==="/")p="/index.html";let file=join(rootDir,p);if(existsSync(file)&&statSync(file).isDirectory())file=join(file,"index.html");if(!existsSync(file)){res.writeHead(404);res.end("nf");return;}res.writeHead(200,{"content-type":MIME[extname(file)]||"application/octet-stream"});res.end(readFileSync(file));}catch(e){res.writeHead(500);res.end(String(e));}});return new Promise((res)=>server.listen(port,"127.0.0.1",()=>res(server)));}
function cdp(ws){let id=1;const p=new Map();ws.addEventListener("message",(ev)=>{const m=JSON.parse(ev.data);if(m.id&&p.has(m.id)){const{resolve:rs,reject:rj}=p.get(m.id);p.delete(m.id);m.error?rj(new Error(m.error.message)):rs(m.result);}});return(method,params={})=>new Promise((rs,rj)=>{const i=id++;p.set(i,{resolve:rs,reject:rj});ws.send(JSON.stringify({id:i,method,params}));});}

const outDir = resolve(here, ".phase4-shots");
mkdirSync(outDir, { recursive: true });

const port=await freePort();const server=await serveDir(resolve(repo,"apps/site/dist"),port);
const dbg=await freePort();const profile=mkdtempSync(join(tmpdir(),"nv-pos-"));
const child=spawn(CHROME,["--headless=new","--disable-gpu","--no-sandbox","--no-first-run","--hide-scrollbars",`--user-data-dir=${profile}`,`--remote-debugging-port=${dbg}`,"--window-size=1360,1700","about:blank"],{stdio:"ignore"});
const evalJS=(send,e)=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r.result.value);

const probe = (id) => `(()=>{
  const ex=document.getElementById(${JSON.stringify(id)});
  const ifr=ex.querySelector("iframe");
  const d=ifr.contentDocument, w=ifr.contentWindow;
  const root=d.querySelector(".mm.navalone");
  const bar=d.querySelector(".nv-bar");
  const topbar=d.querySelector(".pg-topbar");
  return {
    posClass: root?[...root.classList].find(c=>c.startsWith("nv-pos-")):null,
    hidden: root?root.classList.contains("nv-hidden"):null,
    barTop: bar?Math.round(bar.getBoundingClientRect().top):null,
    scrollY: Math.round(w.scrollY),
    topbarShown: topbar?getComputedStyle(topbar).display!=="none":false,
    bodyDemo:[...d.body.classList].filter(c=>c.startsWith("demo-")||c==="is-positioning")
  };
})()`;
const scrollIframe=(id,y)=>`(()=>{const ex=document.getElementById(${JSON.stringify(id)});const w=ex.querySelector("iframe").contentWindow;w.scrollTo(0,${y});return w.scrollY;})()`;

try{
 let v=null;for(let i=0;i<50&&!v;i++){try{v=await(await fetch(`http://127.0.0.1:${dbg}/json/version`)).json();}catch{await sleep(200);}}
 const tg=await(await fetch(`http://127.0.0.1:${dbg}/json/list`)).json();const page=tg.find(t=>t.type==="page");
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener("open",r,{once:true});ws.addEventListener("error",j,{once:true});});
 const send=cdp(ws);await send("Page.enable");await send("Runtime.enable");
 await send("Emulation.setDeviceMetricsOverride",{width:1360,height:1700,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:`http://127.0.0.1:${port}/docs/`});await sleep(3500);

 // ---- fixed ----
 await evalJS(send,`document.getElementById("example-position-fixed").scrollIntoView({block:"center"})`);await sleep(900);
 const fixed0=await evalJS(send,probe("example-position-fixed"));
 await evalJS(send,scrollIframe("example-position-fixed",400));await sleep(400);
 const fixed1=await evalJS(send,probe("example-position-fixed"));
 console.log("fixed  @0  :",JSON.stringify(fixed0));
 console.log("fixed  @400:",JSON.stringify(fixed1));

 // ---- sticky ----
 await evalJS(send,`document.getElementById("example-position-sticky").scrollIntoView({block:"center"})`);await sleep(900);
 const sticky0=await evalJS(send,probe("example-position-sticky"));
 await evalJS(send,scrollIframe("example-position-sticky",400));await sleep(400);
 const sticky1=await evalJS(send,probe("example-position-sticky"));
 console.log("sticky @0  :",JSON.stringify(sticky0));
 console.log("sticky @400:",JSON.stringify(sticky1));

 // ---- smart ----
 await evalJS(send,`document.getElementById("example-position-smart").scrollIntoView({block:"center"})`);await sleep(900);
 const smart0=await evalJS(send,probe("example-position-smart"));
 await evalJS(send,scrollIframe("example-position-smart",420));await sleep(450);
 const smartDown=await evalJS(send,probe("example-position-smart"));
 await evalJS(send,scrollIframe("example-position-smart",220));await sleep(450);
 const smartUp=await evalJS(send,probe("example-position-smart"));
 console.log("smart  @0   :",JSON.stringify(smart0));
 console.log("smart  down :",JSON.stringify(smartDown));
 console.log("smart  up   :",JSON.stringify(smartUp));

 // ---- theming playground: its inline menu must stay inside its card, not pin
 //      to the docs page top (regression from the default `fixed`). ----
 await evalJS(send,`document.getElementById("theming-playground").scrollIntoView({block:"start"})`);await sleep(700);
 const pg = await evalJS(send,`(()=>{
   const surf=document.querySelector("#theming-playground .preview-surface");
   const bar=surf&&surf.querySelector(".nv-bar");
   if(!bar||!surf)return{ok:false};
   const b=bar.getBoundingClientRect(), s=surf.getBoundingClientRect();
   return { barTop:Math.round(b.top), surfTop:Math.round(s.top), contained: Math.abs(b.top-s.top)<6 };
 })()`);
 console.log("playground:",JSON.stringify(pg));

 const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
 writeFileSync(join(outDir,"positioning-docs.png"),Buffer.from(shot.data,"base64"));

 ws.close();

 const checks = {
   "fixed: class": fixed1.posClass==="nv-pos-fixed",
   "fixed: pinned to top after scroll": fixed1.barTop<=2 && fixed1.barTop>=-2,
   "fixed: no top header": fixed0.topbarShown===false,
   "sticky: class": sticky1.posClass==="nv-pos-sticky",
   "sticky: starts below header (barTop>0)": sticky0.barTop>4,
   "sticky: header shown": sticky0.topbarShown===true,
   "sticky: pins to top after scroll": sticky1.barTop<=2,
   "smart: class": smart0.posClass==="nv-pos-smart",
   "smart: hides on scroll down": smartDown.hidden===true,
   "smart: reveals on scroll up": smartUp.hidden===false,
   "playground: bar contained in its card (not pinned to page top)": pg.contained===true
 };
 let ok=true;
 for(const [k,val] of Object.entries(checks)){console.log((val?"  ✓ ":"  ✗ ")+k);if(!val)ok=false;}
 console.log("\nPASS:",ok);
 if(!ok) process.exitCode=1;
}finally{try{execSync(`taskkill /PID ${child.pid} /T /F`,{stdio:"ignore"});}catch{child.kill("SIGKILL");}server.close();}
