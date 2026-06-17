/** Probe the two new docs "Responsive collapsing" examples at several frame
 *  widths (set directly on the example frame), confirming dynamic + static both
 *  step full -> condensed -> collapsed inside the docs preview. */
import { createServer } from "node:http";
import { spawn, execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = resolve(here, "..");
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".map": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)); }); });
function serveDir(rootDir, port) { const server = createServer((req, res) => { try { let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html"; let file = join(rootDir, p); if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html"); if (!existsSync(file)) { res.writeHead(404); res.end("nf"); return; } res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" }); res.end(readFileSync(file)); } catch (e) { res.writeHead(500); res.end(String(e)); } }); return new Promise((res) => server.listen(port, "127.0.0.1", () => res(server))); }
function cdp(ws) { let id = 1; const p = new Map(); ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && p.has(m.id)) { const { resolve: rs, reject: rj } = p.get(m.id); p.delete(m.id); m.error ? rj(new Error(m.error.message)) : rs(m.result); } }); return (method, params = {}) => new Promise((rs, rj) => { const i = id++; p.set(i, { resolve: rs, reject: rj }); ws.send(JSON.stringify({ id: i, method, params })); }); }

const port = await freePort();
const server = await serveDir(resolve(repo, "apps/site/dist"), port);
const dbg = await freePort();
const profile = mkdtempSync(join(tmpdir(), "nv-dr-"));
const child = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", "--hide-scrollbars", `--user-data-dir=${profile}`, `--remote-debugging-port=${dbg}`, "--window-size=1360,1700", "about:blank"], { stdio: "ignore" });
const evalJS = (send, e) => send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }).then((r) => r.result.value);

// Set an example frame's width, wait for the iframe menu to settle, read state.
const probe = (id, w) => `(async()=>{
  const ex=document.getElementById(${JSON.stringify(id)});
  const frame=ex.querySelector("[data-frame]");
  frame.style.width=${w}+"px";
  await new Promise(r=>setTimeout(r,500));
  const d=ex.querySelector("iframe").contentDocument;
  const root=d&&d.querySelector(".nv-mode-desktop,.nv-mode-mobile");
  const c=root&&root.classList;
  return c?(c.contains("nv-mode-mobile")?"mobile":(c.contains("nv-condensed")?"condensed":"full")):"none";
})()`;

try {
    let v = null; for (let i = 0; i < 50 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${dbg}/json/version`)).json(); } catch { await sleep(200); } }
    const tg = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json();
    const page = tg.find((t) => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.addEventListener("open", r, { once: true }); ws.addEventListener("error", j, { once: true }); });
    const send = cdp(ws);
    await send("Page.enable"); await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1360, height: 1700, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/docs/` });
    await sleep(3000);

    let allPass = true;
    for (const id of ["example-responsive-dynamic", "example-responsive-static"]) {
        await evalJS(send, `document.getElementById(${JSON.stringify(id)}).scrollIntoView({block:"center"})`);
        await sleep(500);
        const seq = [];
        for (const w of [580, 460, 360]) seq.push([w, await evalJS(send, probe(id, w))]);
        const states = seq.map((s) => s[1]).join(" -> ");
        const pass = seq[0][1] === "full" && seq[1][1] === "condensed" && seq[2][1] === "mobile";
        allPass = allPass && pass;
        console.log(`${id}: ${states}  ${pass ? "OK" : "FAIL"}`);
    }
    console.log(allPass ? "PASS" : "FAIL");
    ws.close();
    process.exitCode = allPass ? 0 : 1;
} finally {
    try { execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" }); } catch { child.kill("SIGKILL"); }
    server.close();
}
