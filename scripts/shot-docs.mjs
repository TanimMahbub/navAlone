/** Screenshot + probe the merged /docs route on the built site. */
import { createServer } from "node:http";
import { spawn, execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
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

const port=await freePort();const server=await serveDir(resolve(repo,"apps/site/dist"),port);
const dbg=await freePort();const profile=mkdtempSync(join(tmpdir(),"nv-d-"));
const child=spawn(CHROME,["--headless=new","--disable-gpu","--no-sandbox","--no-first-run","--hide-scrollbars",`--user-data-dir=${profile}`,`--remote-debugging-port=${dbg}`,"--window-size=1280,1600","about:blank"],{stdio:"ignore"});
const evalJS=(send,e)=>send("Runtime.evaluate",{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r.result.value);
try{
 let v=null;for(let i=0;i<50&&!v;i++){try{v=await(await fetch(`http://127.0.0.1:${dbg}/json/version`)).json();}catch{await sleep(200);}}
 const tg=await(await fetch(`http://127.0.0.1:${dbg}/json/list`)).json();const page=tg.find(t=>t.type==="page");
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener("open",r,{once:true});ws.addEventListener("error",j,{once:true});});
 const send=cdp(ws);await send("Page.enable");await send("Runtime.enable");
 await send("Emulation.setDeviceMetricsOverride",{width:1280,height:1600,deviceScaleFactor:1,mobile:false});
 await send("Page.navigate",{url:`http://127.0.0.1:${port}/docs/`});await sleep(2500);
 const info=await evalJS(send,`(()=>{const app=document.getElementById("app");const pre=document.querySelector(".code-block pre");return{hasApp:!!app&&app.children.length>0,bars:document.querySelectorAll(".nv-bar").length,examples:document.querySelectorAll(".example").length,codeBg:pre?getComputedStyle(pre).backgroundColor:null,highlighted:document.querySelectorAll("pre code.hljs").length,copyBtns:document.querySelectorAll(".copy-btn").length,title:document.title};})()`);
 console.log(JSON.stringify(info,null,2));
 await evalJS(send,`document.getElementById("example-mega")?.scrollIntoView()`);await sleep(600);
 let shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(resolve(here,".phase4-shots","docs-merged.png"),Buffer.from(shot.data,"base64"));
 await evalJS(send,`document.getElementById("getting-started")?.scrollIntoView()`);await sleep(600);
 shot=await send("Page.captureScreenshot",{format:"png"});writeFileSync(resolve(here,".phase4-shots","docs-top.png"),Buffer.from(shot.data,"base64"));
 ws.close();
}finally{try{execSync(`taskkill /PID ${child.pid} /T /F`,{stdio:"ignore"});}catch{child.kill("SIGKILL");}server.close();}
