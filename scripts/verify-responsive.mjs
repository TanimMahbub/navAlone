/** Verify /demo/responsive collapses to mobile and the drill-down paints. */
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
const MIME = { ".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".map":"application/json",".ico":"image/x-icon" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0,"127.0.0.1",()=>{const{port}=s.address();s.close(()=>res(port));}); });
function serveDir(rootDir, port) {
    const server = createServer((req, res) => {
        try { let p = decodeURIComponent(req.url.split("?")[0]); if (p==="/") p="/index.html";
            let file = join(rootDir, p);
            if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
            if (!existsSync(file)) { res.writeHead(404); res.end("nf"); return; }
            res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
            res.end(readFileSync(file));
        } catch (e) { res.writeHead(500); res.end(String(e)); }
    });
    return new Promise((res) => server.listen(port, "127.0.0.1", () => res(server)));
}
function cdp(ws){let id=1;const p=new Map();ws.addEventListener("message",(ev)=>{const m=JSON.parse(ev.data);if(m.id&&p.has(m.id)){const{resolve:rs,reject:rj}=p.get(m.id);p.delete(m.id);m.error?rj(new Error(m.error.message)):rs(m.result);}});return(method,params={})=>new Promise((rs,rj)=>{const i=id++;p.set(i,{resolve:rs,reject:rj});ws.send(JSON.stringify({id:i,method,params}));});}

const port = await freePort();
const server = await serveDir(resolve(repo, "apps/site/dist"), port);
const dbg = await freePort();
const profile = mkdtempSync(join(tmpdir(), "nv-vr-"));
const child = spawn(CHROME, ["--headless=new","--disable-gpu","--no-sandbox","--no-first-run",`--user-data-dir=${profile}`,`--remote-debugging-port=${dbg}`,"--window-size=390,820","about:blank"], { stdio: "ignore" });
const evalJS = (send, e) => send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }).then((r) => r.result.value);

try {
    let v=null; for(let i=0;i<50&&!v;i++){try{v=await(await fetch(`http://127.0.0.1:${dbg}/json/version`)).json();}catch{await sleep(200);}}
    const tg=await(await fetch(`http://127.0.0.1:${dbg}/json/list`)).json();
    const page=tg.find(t=>t.type==="page");
    const ws=new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r,j)=>{ws.addEventListener("open",r,{once:true});ws.addEventListener("error",j,{once:true});});
    const send=cdp(ws);
    await send("Page.enable"); await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride",{width:390,height:820,deviceScaleFactor:1,mobile:true});
    await send("Page.navigate",{url:`http://127.0.0.1:${port}/demo/responsive/`});
    await sleep(2000);

    const r1 = await evalJS(send, `(() => {
        const root = document.getElementById("demo-menu");
        const mode = Array.from(root.classList).filter(c=>c.startsWith("nv-mode"));
        const burger = root.querySelector(".nv-hamburger");
        if (burger) burger.click();
        return { mode, hasBurger: !!burger };
    })()`);
    await sleep(500);
    const r2 = await evalJS(send, `(() => {
        const root = document.getElementById("demo-menu");
        const trig = root.querySelector(".menu-level.level-1 .menu-item[data-target]");
        if (!trig) return { error:"no trigger" };
        trig.click();
        return { clicked: trig.textContent.trim() };
    })()`);
    await sleep(600);
    const r3 = await evalJS(send, `(() => {
        const root = document.getElementById("demo-menu");
        const host = root.querySelector(".nv-panels");
        const active = host.querySelector(".active-menu");
        const fr = active.querySelector("li button, li a").getBoundingClientRect();
        return { scrollLeft: host.scrollLeft, activeId: active.id, items: active.querySelectorAll("li").length, firstRowLeft: fr.left, firstRowText: active.querySelector("li button, li a").textContent.trim() };
    })()`);
    console.log("collapse:", JSON.stringify(r1));
    console.log("drill:", JSON.stringify(r2));
    console.log("level2:", JSON.stringify(r3));
    const pass = r1.mode.includes("nv-mode-mobile") && r1.hasBurger && r3.scrollLeft===0 && r3.items>0 && r3.firstRowLeft>=0;
    console.log(pass ? "PASS — collapses + drill-down paints on screen" : "FAIL");

    const shot = await send("Page.captureScreenshot",{format:"png"});
    writeFileSync(resolve(here,".phase4-shots","responsive-drilled.png"), Buffer.from(shot.data,"base64"));
    ws.close();
    process.exitCode = pass ? 0 : 1;
} finally {
    try{execSync(`taskkill /PID ${child.pid} /T /F`,{stdio:"ignore"});}catch{child.kill("SIGKILL");}
    server.close();
}
