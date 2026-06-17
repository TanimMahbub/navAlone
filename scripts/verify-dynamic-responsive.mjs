/**
 * Verify the dynamic (content-aware) responsive mode in real Chrome: a
 * content-heavy bar should step full → condensed → collapsed as its container
 * narrows, with no breakpoint configured. Drives the BUILT dist over file://
 * via the DevTools Protocol (resize a wrapper, wait a frame, read root classes).
 */
import { spawn, execSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import net from "node:net";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = resolve(here, "..");
const dist = resolve(repo, "packages/core/dist");
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)); }); });
function cdp(ws) { let id = 1; const p = new Map(); ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && p.has(m.id)) { const { resolve: rs, reject: rj } = p.get(m.id); p.delete(m.id); m.error ? rj(new Error(m.error.message)) : rs(m.result); } }); return (method, params = {}) => new Promise((rs, rj) => { const i = id++; p.set(i, { resolve: rs, reject: rj }); ws.send(JSON.stringify({ id: i, method, params })); }); }

if (!existsSync(join(dist, "navalone.global.js"))) {
    console.error("build core first: pnpm --filter navalone build");
    process.exit(1);
}

const cssUrl = pathToFileURL(join(dist, "navalone.css")).href;
const jsUrl = pathToFileURL(join(dist, "navalone.global.js")).href;
const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${cssUrl}">
<style>body{margin:0}#wrap{width:1200px}</style></head><body>
<div id="wrap"><menu class="mm" id="mm"></menu></div>
<script src="${jsUrl}"></script>
<script>
window.menu = new Navalone("#mm", {
    position: "static",
    logo: { text: "Acme" },
    rightButtons: [ { label: "Sign up", variant: "primary" } ],
    items: ["Products","Pricing","Company"].map(l => ({ label: l, href: "#" }))
});
window.setW = (w) => new Promise((res) => {
    document.getElementById("wrap").style.width = w + "px";
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        const c = document.querySelector(".mm").classList;
        res(c.contains("nv-mode-mobile") ? "mobile" : (c.contains("nv-condensed") ? "condensed" : "full"));
    })));
});
</script></body></html>`;

const tmp = mkdtempSync(join(tmpdir(), "nv-dyn-"));
const file = join(tmp, "dyn.html");
writeFileSync(file, html);
const dbg = await freePort();
const profile = mkdtempSync(join(tmpdir(), "nv-dyn-prof-"));
const child = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", `--user-data-dir=${profile}`, `--remote-debugging-port=${dbg}`, "--window-size=1400,900", "about:blank"], { stdio: "ignore" });
const evalJS = (send, e) => send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true }).then((r) => r.result.value);

try {
    let v = null; for (let i = 0; i < 50 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${dbg}/json/version`)).json(); } catch { await sleep(200); } }
    const tg = await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json();
    const page = tg.find((t) => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.addEventListener("open", r, { once: true }); ws.addEventListener("error", j, { once: true }); });
    const send = cdp(ws);
    await send("Page.enable"); await send("Runtime.enable");
    await send("Page.navigate", { url: pathToFileURL(file).href });
    await sleep(1200);

    const widths = [600, 560, 520, 480, 440, 400, 360, 320, 280];
    const seq = [];
    for (const w of widths) {
        const state = await evalJS(send, `window.setW(${w})`);
        seq.push([w, state]);
    }
    for (const [w, s] of seq) console.log(`  ${String(w).padStart(4)}px -> ${s}`);

    const states = seq.map((s) => s[1]);
    const iFull = states.indexOf("full");
    const iCond = states.indexOf("condensed");
    const iMob = states.indexOf("mobile");
    const ordered = iFull === 0 && iCond > iFull && iMob > iCond;
    const allThree = iFull >= 0 && iCond >= 0 && iMob >= 0;
    const pass = ordered && allThree;
    console.log(pass
        ? "PASS — dynamic bar steps full -> condensed -> collapsed as it narrows"
        : "FAIL — expected full, then condensed, then mobile in order");
    ws.close();
    process.exitCode = pass ? 0 : 1;
} finally {
    try { execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" }); } catch { child.kill("SIGKILL"); }
    rmSync(tmp, { recursive: true, force: true });
}
