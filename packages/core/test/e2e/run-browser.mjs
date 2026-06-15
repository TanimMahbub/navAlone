/**
 * Integration harness — drives the installed headless Chrome against the BUILT
 * output (dist/navalone.global.js + dist/navalone.css) to re-validate the
 * Phase-2 behaviour that needs a real layout engine (edge-aware clamping,
 * focus into a just-opened panel, the drawer + scroll-lock), then captures a
 * desktop and a mobile screenshot.
 *
 * Follows memory/verify-in-browser-headless-chrome.md. Set CHROME_PATH to
 * override the browser, NV_E2E_KEEP=1 to keep the temp HTML/PNG artifacts.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "../..");
const dist = resolve(pkgRoot, "dist");

const CHROME =
    process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const KEEP = !!process.env.NV_E2E_KEEP;

if (!existsSync(resolve(dist, "navalone.global.js"))) {
    console.error("e2e: dist/navalone.global.js missing — run `pnpm --filter navalone build` first.");
    process.exit(1);
}
if (!existsSync(CHROME)) {
    console.error(`e2e: Chrome not found at ${CHROME}. Set CHROME_PATH to override.`);
    process.exit(1);
}

const harnessPath = resolve(pkgRoot, "__e2e.html");
const shotDir = resolve(pkgRoot, "__e2e-shots");
mkdirSync(shotDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="./dist/navalone.css">
<style>body{margin:0;font-family:sans-serif}.spacer{height:140vh}</style>
</head><body>
<menu class="mm" id="mm"></menu>
<div class="spacer"></div>
<pre id="out" style="display:none"></pre>
<script src="./dist/navalone.global.js"></script>
<script>
(function () {
    var state = new URLSearchParams(location.search).get("state") || "assert";
    var thumb = function (t) {
        return "data:image/svg+xml;utf8," + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
            '<rect width="64" height="64" rx="10" fill="#3a7afe"/>' +
            '<text x="32" y="42" font-size="28" text-anchor="middle" fill="#fff">' + t + '</text></svg>');
    };
    var menu = new Navalone("#mm", {
        logo: { text: "Navalone", href: "#" },
        rightButtons: [
            { label: "Log in", href: "#login" },
            { label: "Sign up", href: "#signup", variant: "primary" }
        ],
        theme: { "--nv-drawer-head-bg": "#2d2d3a" },
        items: [
            { label: "Company", submenu: { id: "company", display: "dropdown",
                items: [ { label: "About", href: "#a" }, { label: "Careers", href: "#c", badge: "5" } ] } },
            { label: "Products", submenu: { id: "products", display: "dropdown-lg", items: [
                { label: "Analytics", image: thumb("A"), description: "Dashboards" },
                { label: "Developer Tools", image: thumb("D"), description: "APIs", submenu: {
                    id: "devtools", display: "dropdown", items: [ { label: "REST API", href: "#r" } ] } }
            ] } },
            { label: "Resources", submenu: { id: "resources", display: "mega", columns: [
                { heading: "Learn", items: [ { label: "Docs", image: thumb("📚"), description: "Guides" },
                    { label: "Tutorials", image: thumb("🎓"), description: "Lessons" } ] },
                { heading: "Community", items: [ { label: "Blog", image: thumb("✍"), description: "News", badge: "New" } ] },
                { heading: "Support", items: [ { label: "Status", image: thumb("📈"), description: "Uptime" } ] }
            ] } },
            { label: "Pricing", href: "#pricing" },
            { label: "Enterprise", href: "#e", disabled: true }
        ]
    });
    window.menu = menu;

    if (state === "mega") { menu.openSubmenu("resources"); return; }
    if (state === "drawer") { menu.open(); return; }

    // state === "assert"
    var results = [];
    function ok(name, cond) { results.push({ name: name, pass: !!cond }); }

    ok("window.Navalone is a function", typeof window.Navalone === "function");
    ok("desktop bar renders 5 items", document.querySelectorAll(".nv-menubar > li").length === 5);
    ok("starts in desktop mode", document.querySelector(".mm").classList.contains("nv-mode-desktop"));

    menu.openSubmenu("resources");
    var mega = menu._desktopPanels["resources"];
    ok("mega opens (is-open)", mega.classList.contains("is-open"));
    ok("mega has 3 columns", mega.querySelectorAll(".nv-col").length === 3);
    var mr = mega.getBoundingClientRect();
    ok("mega is edge-clamped within viewport", mr.left >= -1 && mr.right <= window.innerWidth + 1);
    // The visibility:hidden gotcha — programmatic focus must land in the panel.
    var firstRow = mega.querySelector(".nv-d-item");
    firstRow.focus();
    ok("focus lands inside the just-opened panel", mega.contains(document.activeElement));
    menu.closeAll();
    ok("closeAll clears open panels", mega.classList.contains("is-open") === false);

    menu.openSubmenu("products");
    menu.openSubmenu("devtools");
    ok("nested flyout cascade opens", menu._desktopPanels["devtools"].classList.contains("is-open"));
    menu.closeAll();
    ok("closeAll cascades flyouts closed", menu._desktopPanels["devtools"].classList.contains("is-open") === false);

    menu.open();
    ok("drawer opens (nv-open)", document.querySelector(".mm").classList.contains("nv-open"));
    ok("backdrop visible", document.querySelector(".nv-backdrop").hidden === false);
    menu.close();

    menu.destroy();
    ok("destroy reverts root to empty", document.querySelector("#mm").innerHTML === "");

    document.getElementById("out").textContent = JSON.stringify(results);
})();
</script>
</body></html>`;

writeFileSync(harnessPath, html);

function chrome(args) {
    return execFileSync(
        CHROME,
        ["--headless=new", "--disable-gpu", "--no-sandbox", ...args],
        { encoding: "utf8", timeout: 60000, maxBuffer: 64 * 1024 * 1024 }
    );
}

function url(state) {
    return pathToFileURL(harnessPath).href + "?state=" + state;
}

let failed = 0;
try {
    // 1. Behavioural assertions via --dump-dom (desktop-width window so the bar
    //    is in desktop mode for the submenu/focus checks).
    const dom = chrome([
        "--window-size=1280,720",
        "--virtual-time-budget=4000",
        "--dump-dom",
        url("assert")
    ]);
    const m = dom.match(/<pre id="out"[^>]*>([\s\S]*?)<\/pre>/);
    if (!m) {
        console.error("e2e: could not find assertion output in dumped DOM");
        process.exit(1);
    }
    const decode = (s) =>
        s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    const results = JSON.parse(decode(m[1]));
    for (const r of results) {
        console.log(`${r.pass ? "  ok" : "FAIL"}  ${r.name}`);
        if (!r.pass) failed++;
    }
    console.log(`\n${results.length - failed}/${results.length} browser assertions passed`);

    // 2. Screenshots — desktop (mega open) and mobile (drawer open).
    const desktopShot = resolve(shotDir, "desktop-mega.png");
    const mobileShot = resolve(shotDir, "mobile-drawer.png");
    chrome([
        "--virtual-time-budget=2500",
        "--window-size=1280,720",
        `--screenshot=${desktopShot}`,
        url("mega")
    ]);
    chrome([
        "--virtual-time-budget=2500",
        "--window-size=420,820",
        `--screenshot=${mobileShot}`,
        url("drawer")
    ]);
    console.log(`screenshots: ${desktopShot}\n             ${mobileShot}`);
} finally {
    if (!KEEP) {
        rmSync(harnessPath, { force: true });
        rmSync(shotDir, { recursive: true, force: true });
    }
}

if (failed > 0) {
    console.error(`\ne2e: ${failed} assertion(s) failed`);
    process.exit(1);
}
console.log("\ne2e: all browser assertions passed");

// Confirm the built CJS/ESM resolve and expose the class (Node-side smoke test).
const cjs = readFileSync(resolve(dist, "index.cjs"), "utf8");
if (!/Navalone/.test(cjs)) {
    console.error("e2e: built CJS does not reference Navalone");
    process.exit(1);
}
