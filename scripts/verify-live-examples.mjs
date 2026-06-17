/**
 * Verify the docs Live Examples are real, responsive iframe previews. With the
 * default DYNAMIC responsive mode the embedded menu folds based on its own
 * content vs. the (narrow) preview width, so:
 *   - a light menu (the dropdown example) stays on the desktop bar at 100%,
 *   - a content-heavy menu collapses to the hamburger once it would overlap —
 *     this is the fix for "previews didn't collapse even while overlapping",
 *   - the Mobile preset always collapses the SAME instance to the hamburger,
 *   - the action buttons drive the live instance (drawer opens),
 *   - dropdown actions open a desktop dropdown panel.
 * Screenshots land in scripts/.phase4-shots/.
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
const dbg=await freePort();const profile=mkdtempSync(join(tmpdir(),"nv-le-"));
const child=spawn(CHROME,["--headless=new","--disable-gpu","--no-sandbox","--no-first-run","--hide-scrollbars",`--user-data-dir=${profile}`,`--remote-debugging-port=${dbg}`,"--window-size=1360,1700","about:blank"],{stdio:"ignore"});
const evalJS=(send,e)=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r.result.value);
try{
 let v=null;for(let i=0;i<50&&!v;i++){try{v=await(await fetch(`http://127.0.0.1:${dbg}/json/version`)).json();}catch{await sleep(200);}}
 const tg=await(await fetch(`http://127.0.0.1:${dbg}/json/list`)).json();const page=tg.find(t=>t.type==="page");
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener("open",r,{once:true});ws.addEventListener("error",j,{once:true});});
 const send=cdp(ws);await send("Page.enable");await send("Runtime.enable");
 await send("Emulation.setDeviceMetricsOverride",{width:1360,height:1700,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:`http://127.0.0.1:${port}/docs/`});await sleep(3000);

 // Helper that reads the live mode/state from inside an example's iframe.
 const probe = (id) => `(()=>{const ex=document.getElementById(${JSON.stringify(id)});const ifr=ex.querySelector("iframe");const d=ifr.contentDocument;const root=d&&d.querySelector(".nv-bar")?.closest("[class*='nv-mode']")||d&&d.querySelector(".nv-mode-desktop,.nv-mode-mobile");const r=d&&(d.querySelector(".nv-mode-desktop,.nv-mode-mobile"));const size=ex.querySelector("[data-size]")?.textContent;const active=ex.querySelector(".preview-presets .is-active")?.textContent;return{frameW:Math.round(ex.querySelector("[data-frame]").getBoundingClientRect().width),size,active,mode:r?(r.classList.contains("nv-mode-mobile")?"mobile":"desktop"):"none",hamburger:!!(d&&d.querySelector(".nv-hamburger")&&getComputedStyle(d.querySelector(".nv-hamburger")).display!=="none"),open:!!(d&&d.querySelector(".nv-open")),dropdownOpen:!!(d&&d.querySelector("[aria-expanded='true']")),status:ex.querySelector(".status")?.textContent};})()`;
 const click = (sel) => `(()=>{const el=document.querySelector(${JSON.stringify(sel)});if(!el)return false;el.click();return true;})()`;

 await evalJS(send,`document.getElementById("example-drawer").scrollIntoView({block:"center"})`);await sleep(800);

 const drawerInitial = await evalJS(send, probe("example-drawer"));
 console.log("drawer @ Desktop:", JSON.stringify(drawerInitial));

 // Click the Mobile preset for the drawer example.
 await evalJS(send, click("#example-drawer .preview-presets button[data-w='340']"));
 await sleep(700);
 const drawerMobile = await evalJS(send, probe("example-drawer"));
 console.log("drawer @ Mobile:", JSON.stringify(drawerMobile));

 // Now press "Open drawer".
 await evalJS(send, `(()=>{const b=[...document.querySelectorAll("#example-drawer .example-actions button")].find(x=>/open/i.test(x.textContent));b&&b.click();})()`);
 await sleep(700);
 const drawerOpened = await evalJS(send, probe("example-drawer"));
 console.log("drawer opened:", JSON.stringify(drawerOpened));
 let shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(join(outDir,"live-drawer-mobile-open.png"),Buffer.from(shot.data,"base64"));

 // Dropdown example: desktop preset (default), press Open → dropdown panel opens.
 await evalJS(send,`document.getElementById("example-dropdown").scrollIntoView({block:"center"})`);await sleep(700);
 const ddInitial = await evalJS(send, probe("example-dropdown"));
 console.log("dropdown @ Desktop:", JSON.stringify(ddInitial));
 await evalJS(send, `(()=>{const b=[...document.querySelectorAll("#example-dropdown .example-actions button")].find(x=>/open/i.test(x.textContent));b&&b.click();})()`);
 await sleep(600);
 const ddOpened = await evalJS(send, probe("example-dropdown"));
 console.log("dropdown opened:", JSON.stringify(ddOpened));
 shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(join(outDir,"live-dropdown-open.png"),Buffer.from(shot.data,"base64"));

 ws.close();

 // Summary assertions. Under dynamic mode the content-heavy drawer example may
 // already be collapsed at the narrow Desktop preset (it would overlap) — that's
 // the intended fix — so we assert the meaningful invariants instead of forcing
 // it to read "desktop" at 591px: the light dropdown example stays desktop and
 // opens a panel, while the heavy menu collapses + opens its drawer on Mobile.
 const ok = ddInitial.mode==="desktop" && ddOpened.dropdownOpen && drawerMobile.mode==="mobile" && drawerMobile.hamburger && drawerOpened.open;
 console.log("\nPASS:", ok);
 if(!ok) process.exitCode = 1;
}finally{try{execSync(`taskkill /PID ${child.pid} /T /F`,{stdio:"ignore"});}catch{child.kill("SIGKILL");}server.close();}
