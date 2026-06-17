/**
 * Phase 4 browser verification. Serves each built app/example over HTTP (ES
 * modules need a real origin + correct MIME; file:// won't execute them) and
 * drives the installed headless Chrome via the DevTools Protocol to confirm the
 * menu renders in a real engine, then captures screenshots.
 *
 *   node scripts/verify-phase4.mjs
 *
 * Why CDP and not `--dump-dom`: with a live HTTP origin, Chrome's
 * `--virtual-time-budget` never considers the network idle and `--dump-dom`
 * hangs. CDP lets us wait a fixed time, read the live DOM, screenshot, and exit
 * deterministically. Follows memory/verify-in-browser-headless-chrome.md.
 *
 * Set CHROME_PATH to override the browser. Screenshots land in
 * scripts/.phase4-shots/.
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = resolve(here, "..");
const shotDir = resolve(here, ".phase4-shots");
mkdirSync(shotDir, { recursive: true });

const CHROME =
    process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
if (!existsSync(CHROME)) {
    console.error(`Chrome not found at ${CHROME}. Set CHROME_PATH.`);
    process.exit(1);
}

const MIME = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".map": "application/json",
    ".ico": "image/x-icon"
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function freePort() {
    return new Promise((res) => {
        const s = net.createServer();
        s.listen(0, "127.0.0.1", () => {
            const { port } = s.address();
            s.close(() => res(port));
        });
    });
}

function serveDir(rootDir, port) {
    const server = createServer((req, res) => {
        try {
            let path = decodeURIComponent(req.url.split("?")[0]);
            if (path === "/") path = "/index.html";
            let file = join(rootDir, path);
            if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
            if (!existsSync(file)) {
                res.writeHead(404);
                res.end("not found");
                return;
            }
            res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
            res.end(readFileSync(file));
        } catch (err) {
            res.writeHead(500);
            res.end(String(err));
        }
    });
    return new Promise((res) => server.listen(port, "127.0.0.1", () => res(server)));
}

/** Minimal CDP client over a single WebSocket. */
function cdp(ws) {
    let nextId = 1;
    const pending = new Map();
    ws.addEventListener("message", (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && pending.has(msg.id)) {
            const { resolve: rs, reject: rj } = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? rj(new Error(msg.error.message)) : rs(msg.result);
        }
    });
    return (method, params = {}) =>
        new Promise((rs, rj) => {
            const id = nextId++;
            pending.set(id, { resolve: rs, reject: rj });
            ws.send(JSON.stringify({ id, method, params }));
        });
}

async function withPage(url, { width, height, settleMs, scrollToId }, work) {
    const dbgPort = await freePort();
    const profileDir = mkdtempSync(join(tmpdir(), "nv-chrome-"));
    const child = spawn(
        CHROME,
        [
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-background-networking",
            "--disable-extensions",
            "--disable-sync",
            "--no-first-run",
            `--user-data-dir=${profileDir}`,
            `--remote-debugging-port=${dbgPort}`,
            `--window-size=${width},${height}`,
            "about:blank"
        ],
        { stdio: "ignore" }
    );

    try {
        // Wait for the DevTools endpoint.
        let version = null;
        for (let i = 0; i < 50 && !version; i++) {
            try {
                version = await (await fetch(`http://127.0.0.1:${dbgPort}/json/version`)).json();
            } catch {
                await sleep(200);
            }
        }
        if (!version) throw new Error("DevTools endpoint never came up");

        const targets = await (await fetch(`http://127.0.0.1:${dbgPort}/json/list`)).json();
        const page = targets.find((t) => t.type === "page");
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r, j) => {
            ws.addEventListener("open", r, { once: true });
            ws.addEventListener("error", j, { once: true });
        });
        const send = cdp(ws);

        await send("Page.enable");
        await send("Runtime.enable");
        await send("Emulation.setDeviceMetricsOverride", {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: false
        });
        await send("Page.navigate", { url });
        await sleep(settleMs);

        if (scrollToId) {
            await send("Runtime.evaluate", {
                expression: `document.getElementById(${JSON.stringify(scrollToId)})?.scrollIntoView({block:"start"})`
            });
            await sleep(500);
        }

        const html = (
            await send("Runtime.evaluate", {
                expression: "document.documentElement.outerHTML",
                returnByValue: true
            })
        ).result.value;

        const shot = await send("Page.captureScreenshot", { format: "png" });
        await work({ html, shotBase64: shot.data });
        ws.close();
    } finally {
        try {
            execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
        } catch {
            child.kill("SIGKILL");
        }
    }
}

const targets = [
    {
        name: "React example",
        dir: "packages/react/example/dist",
        shot: "react-example.png",
        size: [1280, 900],
        assert: (h) => [
            ["renders the desktop bar", h.includes("nv-bar")],
            ["renders the menubar", h.includes("nv-menubar")],
            ["renders an item label", h.includes("Resources") || h.includes("Company")],
            ["renders the example heading", h.includes("@navalone/react example")]
        ]
    },
    {
        name: "Vue example",
        dir: "packages/vue/example/dist",
        shot: "vue-example.png",
        size: [1280, 900],
        assert: (h) => [
            ["renders the desktop bar", h.includes("nv-bar")],
            ["renders the menubar", h.includes("nv-menubar")],
            ["renders the example heading", h.includes("@navalone/vue example")]
        ]
    },
    {
        name: "Landing site (hero)",
        dir: "apps/site/dist",
        shot: "site-hero.png",
        size: [1280, 1000],
        assert: (h) => [
            ["renders the hero menu mount", h.includes('id="hero-menu"')],
            ["hero menu instantiated (nv-bar)", h.includes("nv-bar")],
            ["renders the headline", h.includes("doesn't cost a thing")],
            ["renders the comparison vs mmenu.js", h.includes("mmenu.js")]
        ]
    }
];

let failed = 0;
for (const t of targets) {
    const root = resolve(repo, t.dir);
    console.log(`\n${t.name}`);
    if (!existsSync(root)) {
        console.log(`  FAIL missing build dir ${t.dir} — run the build first.`);
        failed++;
        continue;
    }
    const port = await freePort();
    const server = await serveDir(root, port);
    const [width, height] = t.size;
    try {
        await withPage(
            `http://127.0.0.1:${port}/`,
            { width, height, settleMs: 2500, scrollToId: t.scrollToId },
            ({ html, shotBase64 }) => {
                for (const [label, pass] of t.assert(html)) {
                    console.log(`  ${pass ? "ok  " : "FAIL"} ${label}`);
                    if (!pass) failed++;
                }
                if (t.shot) {
                    const out = resolve(shotDir, t.shot);
                    writeFileSync(out, Buffer.from(shotBase64, "base64"));
                    console.log(`  shot ${out}`);
                }
            }
        );
    } finally {
        server.close();
    }
}

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${failed} failing assertion(s)`);
process.exit(failed === 0 ? 0 : 1);
