/**
 * Reproduce the mobile drill-down "second level is empty" bug exactly the way a
 * user does: narrow viewport (mobile mode), open the drawer example, click a
 * first-level item that has a submenu, then report what is actually in the
 * second-level panel (item count, sizes, computed visibility, --mmHeight).
 */
import { createServer } from "node:http";
import { spawn, execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = resolve(here, "..");
const CHROME =
    process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const MIME = {
    ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
    ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
    ".map": "application/json", ".ico": "image/x-icon"
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise((res) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)); });
});

function serveDir(rootDir, port) {
    const server = createServer((req, res) => {
        try {
            let path = decodeURIComponent(req.url.split("?")[0]);
            if (path === "/") path = "/index.html";
            let file = join(rootDir, path);
            if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
            if (!existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
            res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
            res.end(readFileSync(file));
        } catch (err) { res.writeHead(500); res.end(String(err)); }
    });
    return new Promise((res) => server.listen(port, "127.0.0.1", () => res(server)));
}

function cdp(ws) {
    let nextId = 1; const pending = new Map();
    ws.addEventListener("message", (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && pending.has(msg.id)) {
            const { resolve: rs, reject: rj } = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? rj(new Error(msg.error.message)) : rs(msg.result);
        }
    });
    return (method, params = {}) => new Promise((rs, rj) => {
        const id = nextId++; pending.set(id, { resolve: rs, reject: rj });
        ws.send(JSON.stringify({ id, method, params }));
    });
}

const port = await freePort();
const server = await serveDir(resolve(repo, "apps/docs/dist"), port);
const dbgPort = await freePort();
const profileDir = mkdtempSync(join(tmpdir(), "nv-repro-"));
const child = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
    "--disable-extensions", "--disable-sync",
    `--user-data-dir=${profileDir}`, `--remote-debugging-port=${dbgPort}`,
    "--window-size=420,900", "about:blank"
], { stdio: "ignore" });

const evalJS = (send, expression) =>
    send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
        .then((r) => r.result.value);

try {
    let version = null;
    for (let i = 0; i < 50 && !version; i++) {
        try { version = await (await fetch(`http://127.0.0.1:${dbgPort}/json/version`)).json(); }
        catch { await sleep(200); }
    }
    const targets = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`)).json();
    const page = targets.find((t) => t.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.addEventListener("open", r, { once: true }); ws.addEventListener("error", j, { once: true }); });
    const send = cdp(ws);

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 420, height: 900, deviceScaleFactor: 1, mobile: true });
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/` });
    await sleep(2500);

    // Drive the "Mobile drawer" example.
    const report = await evalJS(send, `(() => {
        const sec = document.getElementById("example-drawer");
        if (!sec) return { error: "no example-drawer section" };
        sec.scrollIntoView();
        const root = sec.querySelector(".preview-menu");
        const mode = root ? Array.from(root.classList).filter(c => c.startsWith("nv-mode")) : [];
        // open the drawer
        const openBtn = Array.from(sec.querySelectorAll("[data-actions] button")).find(b => /open/i.test(b.textContent));
        openBtn && openBtn.click();
        return { mode, drawerClasses: root ? root.className : null, hasOpenBtn: !!openBtn };
    })()`);
    console.log("after open:", JSON.stringify(report, null, 2));
    await sleep(600);

    // Click the first first-level item that has a submenu (data-target), then inspect level 2.
    const drill = await evalJS(send, `(() => {
        const sec = document.getElementById("example-drawer");
        const host = sec.querySelector(".nv-panels");
        const before = host ? getComputedStyle(host).getPropertyValue("--mmHeight") : null;
        const trigger = sec.querySelector(".menu-level.level-1 .menu-item[data-target]");
        if (!trigger) return { error: "no level-1 trigger with data-target" };
        const targetId = trigger.dataset.target;
        trigger.click();
        return { targetId, triggerLabel: trigger.textContent.trim(), mmHeightBefore: before };
    })()`);
    console.log("after drill click:", JSON.stringify(drill, null, 2));
    await sleep(700);

    const inspect = await evalJS(send, `(() => {
        const sec = document.getElementById("example-drawer");
        const host = sec.querySelector(".nv-panels");
        const active = host.querySelector(".active-menu");
        const cs = active ? getComputedStyle(active) : null;
        const rows = active ? active.querySelectorAll("li").length : -1;
        const ul = active ? active.querySelector("ul") : null;
        const firstRow = active ? active.querySelector("li button, li a") : null;
        const frcs = firstRow ? getComputedStyle(firstRow) : null;
        const fr = firstRow ? firstRow.getBoundingClientRect() : null;
        return {
            mmHeight: getComputedStyle(host).getPropertyValue("--mmHeight"),
            hostHeight: getComputedStyle(host).height,
            hostRect: { w: host.getBoundingClientRect().width, h: host.getBoundingClientRect().height },
            activeId: active ? active.id : null,
            activeLevelClass: active ? active.className : null,
            activeScrollHeight: active ? active.scrollHeight : null,
            activeRect: active ? { w: active.getBoundingClientRect().width, h: active.getBoundingClientRect().height, top: active.getBoundingClientRect().top } : null,
            activeVisibility: cs ? cs.visibility : null,
            activeOpacity: cs ? cs.opacity : null,
            activeTransform: cs ? cs.transform : null,
            liCount: rows,
            ulChildCount: ul ? ul.children.length : -1,
            ulHTMLpreview: ul ? ul.innerHTML.slice(0, 200) : null,
            firstRowText: firstRow ? firstRow.textContent.trim() : null,
            firstRowVisibility: frcs ? frcs.visibility : null,
            firstRowRect: fr ? { w: fr.width, h: fr.height, top: fr.top } : null
        };
    })()`);
    console.log("\\n=== LEVEL 2 INSPECTION ===");
    console.log(JSON.stringify(inspect, null, 2));

    const paint = await evalJS(send, `(() => {
        const sec = document.getElementById("example-drawer");
        const host = sec.querySelector(".nv-panels");
        const all = Array.from(host.querySelectorAll(".menu-level")).map(p => {
            const cs = getComputedStyle(p);
            const r = p.getBoundingClientRect();
            return { id: p.id, cls: p.className, transform: cs.transform, visibility: cs.visibility, opacity: cs.opacity, zIndex: cs.zIndex, rectTop: r.top, rectLeft: r.left, rectW: r.width, rectH: r.height };
        });
        // What is painted at the point where the first row should be?
        const active = host.querySelector(".active-menu");
        const fr = active.querySelector("li button, li a").getBoundingClientRect();
        const px = fr.left + fr.width/2, py = fr.top + fr.height/2;
        const top = document.elementFromPoint(px, py);
        const stack = [];
        let e = top;
        while (e && stack.length < 8) { stack.push(e.className || e.tagName); e = e.parentElement; }
        const header = active.querySelector(".menu-header");
        const hcs = header ? getComputedStyle(header) : null;
        const hr = header ? header.getBoundingClientRect() : null;
        return {
            point: { px, py },
            elementFromPoint: top ? (top.className || top.tagName) : null,
            stackFromPoint: stack,
            panels: all,
            subHeader: header ? { bg: hcs.backgroundColor, vis: hcs.visibility, rectTop: hr.top, rectH: hr.height, text: header.textContent.trim() } : "NO SUBHEADER"
        };
    })()`);
    console.log("\\n=== PAINT / STACKING ===");
    console.log(JSON.stringify(paint, null, 2));

    const containers = await evalJS(send, `(() => {
        const sec = document.getElementById("example-drawer");
        const drawer = sec.querySelector(".nv-drawer");
        const host = sec.querySelector(".nv-panels");
        const head = sec.querySelector(".nv-drawer-head");
        const info = (el) => { if(!el) return null; const cs=getComputedStyle(el); const r=el.getBoundingClientRect(); return { position: cs.position, transform: cs.transform, left: cs.left, marginLeft: cs.marginLeft, width: cs.width, overflowX: cs.overflowX, scrollLeft: el.scrollLeft, rectLeft: r.left, rectW: r.width }; };
        return { drawer: info(drawer), head: info(head), host: info(host) };
    })()`);
    console.log("\\n=== CONTAINERS ===");
    console.log(JSON.stringify(containers, null, 2));

    const shot = await send("Page.captureScreenshot", { format: "png" });
    const out = resolve(here, ".phase4-shots", "repro-drawer-level2.png");
    writeFileSync(out, Buffer.from(shot.data, "base64"));
    console.log("\\nshot:", out);
    ws.close();
} finally {
    try { execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" }); } catch { child.kill("SIGKILL"); }
    server.close();
}
