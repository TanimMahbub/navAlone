/**
 * The "How it works" live example for the pure-HTML (declarative) workflow. Two
 * editors sit side by side on top — the menu markup and the activation JS — and
 * a full-width, resizable preview sits underneath.
 *
 * The preview is a real Navalone running inside a self-contained <iframe>
 * (srcdoc, with the shipped global build + CSS inlined). Because the menu lives
 * in the iframe it reacts to the FRAME's own width, so the device presets and
 * the drag handle collapse the SAME instance from desktop bar to mobile drawer —
 * exactly like the hero. Edits are sent over postMessage; the iframe sets its
 * host's innerHTML to the markup and runs the JS via `new Function`, so the
 * declarative parser in the core does all the real work (no behaviour here).
 */
import navaloneGlobal from "navalone/global?raw";
import navaloneCss from "navalone/css?raw";
import { svgIcon } from "./icons";
import { enhanceCodeEditor } from "./code";

/**
 * Seed markup — kept identical to the "Pure HTML setup" reference section. Only
 * the hooks the parser reads are present (`.menu-level`, the `data-target` ↔
 * `id` pairing, `.nv-group`, `data-*`, `[data-nv-logo]`, `[data-nv-actions]`);
 * the bar, headers, back buttons and drawer are generated for you.
 */
export const SEED_HTML = `<menu class="mm" id="mm">
    <!-- Brand: text, or wrap an <img>. An href makes it a link. -->
    <a data-nv-logo href="/">Navalone</a>

    <!-- Right-side actions. data-variant="primary" highlights a button. -->
    <div data-nv-actions>
        <a href="/login">Log in</a>
        <a href="/signup" data-variant="primary">Sign up</a>
    </div>

    <!-- TOP BAR: the .level-1 panel's <ul> becomes the menu bar. -->
    <div class="menu-level level-1" id="main-menu">
        <ul>
            <li><a href="/pricing">Pricing</a></li>
            <!-- data-target points at the id= of the panel it opens. -->
            <li><button data-target="company">Company</button></li>
            <li><button data-target="products">Products</button></li>
            <li><button data-target="resources">Resources</button></li>
        </ul>
    </div>

    <!-- A plain dropdown. id="company" pairs with data-target="company". -->
    <div class="menu-level" id="company" data-submenu="dropdown">
        <ul>
            <li><a href="/about">About us</a></li>
            <li><a href="/careers" data-badge="5">Careers</a></li>
            <li><a href="/press">Press</a></li>
        </ul>
    </div>

    <!-- A large dropdown with a NESTED, multi-level flyout. -->
    <div class="menu-level" id="products" data-submenu="dropdown-lg">
        <ul>
            <li><a href="/analytics" data-description="Dashboards and reports">Analytics</a></li>
            <!-- This row drills deeper: another data-target ↔ id pair. -->
            <li>
                <button data-target="devtools" data-badge="New"
                        data-description="APIs, SDKs and CLI">Developer Tools</button>
            </li>
        </ul>
    </div>

    <!-- The deeper flyout the row above opens. -->
    <div class="menu-level" id="devtools" data-submenu="dropdown">
        <ul>
            <li><a href="/rest-api">REST API</a></li>
            <li><a href="/js-sdk">JavaScript SDK</a></li>
            <li><a href="/cli">Command Line</a></li>
        </ul>
    </div>

    <!-- A MEGA menu. Each .nv-group opens a column; the rows after it fill it. -->
    <div class="menu-level" id="resources" data-submenu="mega">
        <ul>
            <li class="nv-group">Learn</li>
            <li><a href="/docs" data-description="Guides and references">Documentation</a></li>
            <li><a href="/tutorials" data-description="Step-by-step lessons">Tutorials</a></li>

            <li class="nv-group">Community</li>
            <li><a href="/blog" data-badge="New" data-description="News and deep dives">Blog</a></li>
            <li><a href="/forum" data-description="Ask and answer">Forum</a></li>

            <li class="nv-group">Support</li>
            <li><a href="/help" data-description="Troubleshooting">Help Center</a></li>
            <li><a href="/status" data-description="System uptime">Status</a></li>
        </ul>
    </div>
</menu>`;

/** Seed activation — note: no `items`, so the markup above is parsed. */
export const SEED_JS = `// No \`items\` option, so Navalone reads the markup instead.
const menu = new Navalone("#mm", {
    openOn: "hover",
    menuAlign: "center"
});`;

/** Device presets: label + frame width ("100%" or a pixel number). */
const PRESETS: { label: string; w: string }[] = [
    { label: "Desktop", w: "100%" },
    { label: "Tablet", w: "430" },
    { label: "Mobile", w: "340" }
];

/** Bootstrap that runs inside the preview iframe (serialised into srcdoc). */
const IFRAME_BOOTSTRAP = `(function () {
    var host = document.getElementById("nv-host");
    var Base = window.Navalone;
    var instance = null;

    function reply(msg) {
        msg.source = "navalone-html-preview";
        // srcdoc origin is unreliable across browsers; the parent validates the
        // message source + tag, and the payload is non-sensitive.
        window.parent.postMessage(msg, "*");
    }

    // A thin wrapper that records whatever instance the user's JS builds, so we
    // can tear it down before the next rebuild (their code owns the \`new\`). A low
    // default breakpoint keeps the full-width "Desktop" preset reading as desktop
    // while the narrow presets collapse to the drawer; explicit options win.
    function Tracked(target, options) {
        instance = new Base(target, Object.assign({ breakpoint: 460 }, options || {}));
        return instance;
    }
    Tracked.prototype = Base.prototype;

    window.addEventListener("message", function (e) {
        var d = e.data;
        if (!d || d.source || d.type !== "render") return;
        try { if (instance) instance.destroy(); } catch (err) {}
        instance = null;
        host.innerHTML = d.html;
        var root = host.querySelector(".mm") || host.firstElementChild;
        try {
            new Function("Navalone", "root", d.js)(Tracked, root);
            reply({ type: "status", ok: true, message: "Updated \\u2713" });
        } catch (err) {
            reply({ type: "status", ok: false, message: (err && err.message) || String(err) });
        }
    });

    reply({ type: "ready" });
})();`;

function buildSrcdoc(): string {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>${navaloneCss}</style>
<style>
    html, body { margin: 0; min-height: 100%; background: #f6f7fb;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        /* A wide mega/dropdown-lg panel can exceed a narrow preset frame; clip
           the cross-axis overflow rather than spawn a horizontal scrollbar. */
        overflow-x: hidden; }
    #nv-host .mm { margin: 0; }
    .nv-faux { padding: 26px 22px; }
    .nv-faux > div { height: 14px; border-radius: 7px; background: #e6e8f2; margin: 0 0 12px; }
    .nv-faux > div:first-child { height: 22px; width: 60%; background: #dfe2ef; }
</style>
</head>
<body>
<div id="nv-host"></div>
<div class="nv-faux" aria-hidden="true"><div></div><div></div><div style="width:40%"></div></div>
<script>${navaloneGlobal}</script>
<script>${IFRAME_BOOTSTRAP}</script>
</body>
</html>`;
}

export function createHtmlExample(): HTMLElement {
    const id = "how-it-works";
    const section = document.createElement("section");
    section.className = "example html-example";
    section.id = id;

    section.innerHTML = `
        <h3>How it works <a class="anchor" href="#${id}" aria-label="Link to How it works">#</a></h3>
        <p>Edit the markup or the activation on the left and the live preview rebuilds.
        Drag the handle (or pick a device preset) to watch the <em>same</em> menu collapse from
        the desktop bar into the mobile drawer — one structure, every screen.</p>
        <div class="html-example-editors">
            <div class="example-editor">
                <label for="${id}-html">Editable HTML <em>— the nav markup</em></label>
                <textarea id="${id}-html" spellcheck="false" aria-describedby="${id}-status"></textarea>
            </div>
            <div class="example-editor">
                <label for="${id}-js">Editable JS <em>— the activation</em></label>
                <textarea id="${id}-js" spellcheck="false" aria-describedby="${id}-status"></textarea>
            </div>
        </div>
        <div class="example-toolbar">
            <button type="button" data-run class="btn-run">${svgIcon("play", 13)}<span>Run</span></button>
            <button type="button" data-reset>Reset</button>
            <span id="${id}-status" class="status" role="status" aria-live="polite"></span>
        </div>
        <div class="example-preview html-example-preview">
            <div class="preview-bar" role="group" aria-label="Resize the live preview">
                <div class="preview-presets">
                    ${PRESETS.map(
                        (p, i) =>
                            `<button type="button" data-w="${p.w}"${i === 0 ? ' class="is-active"' : ""}>${p.label}</button>`
                    ).join("")}
                </div>
                <span class="preview-size" aria-live="polite"><span data-size>—</span> px</span>
            </div>
            <div class="preview-shell">
                <div class="preview-frame" data-frame>
                    <iframe data-preview title="Live pure-HTML Navalone — resize to watch it collapse from desktop bar to mobile drawer"></iframe>
                    <button type="button" class="preview-handle" data-handle
                        aria-label="Drag to resize the preview" title="Drag to resize">
                        <span aria-hidden="true"></span>
                    </button>
                </div>
            </div>
            <p class="note">The preview runs the real core in an iframe, so it parses the markup
            exactly as your own page would. Pick the Mobile preset to get the hamburger, then
            open it and drill through the levels.</p>
        </div>
    `;

    const htmlArea = section.querySelector<HTMLTextAreaElement>(`#${id}-html`)!;
    const jsArea = section.querySelector<HTMLTextAreaElement>(`#${id}-js`)!;
    const status = section.querySelector<HTMLElement>(".status")!;
    const runBtn = section.querySelector<HTMLButtonElement>("[data-run]")!;
    const resetBtn = section.querySelector<HTMLButtonElement>("[data-reset]")!;
    const frame = section.querySelector<HTMLElement>("[data-frame]")!;
    const handle = section.querySelector<HTMLElement>("[data-handle]")!;
    const iframe = section.querySelector<HTMLIFrameElement>("[data-preview]")!;
    const sizeOut = section.querySelector<HTMLElement>("[data-size]")!;
    const presetBtns = Array.from(
        section.querySelectorAll<HTMLButtonElement>(".preview-presets button")
    );

    htmlArea.value = SEED_HTML;
    jsArea.value = SEED_JS;
    const renderHtml = enhanceCodeEditor(htmlArea, "xml");
    const renderJs = enhanceCodeEditor(jsArea, "typescript");

    function setStatus(text: string, ok: boolean): void {
        status.textContent = text;
        status.classList.toggle("status--error", !ok);
        status.classList.toggle("status--ok", ok);
    }

    /* ----------------------------- iframe link ----------------------------- */

    let ready = false;

    function build(): void {
        if (ready) {
            iframe.contentWindow?.postMessage(
                { type: "render", html: htmlArea.value, js: jsArea.value },
                "*"
            );
        }
    }

    window.addEventListener("message", (e: MessageEvent) => {
        if (e.source !== iframe.contentWindow) return;
        const data = e.data;
        if (!data || data.source !== "navalone-html-preview") return;
        if (data.type === "ready") {
            ready = true;
            build();
        } else if (data.type === "status") {
            setStatus(data.message, data.ok);
        }
    });

    iframe.srcdoc = buildSrcdoc();

    /* --------------------------- preview sizing ---------------------------- */

    function reportSize(): void {
        sizeOut.textContent = String(Math.round(frame.getBoundingClientRect().width));
    }

    function setWidth(w: number | string, markPreset?: HTMLButtonElement | null): void {
        if (typeof w === "number") {
            const max = frame.parentElement?.clientWidth ?? 720;
            frame.style.width = Math.min(Math.max(w, 240), max) + "px";
        } else {
            frame.style.width = w; // "100%"
        }
        presetBtns.forEach((b) => b.classList.toggle("is-active", b === markPreset));
        requestAnimationFrame(reportSize);
    }

    frame.addEventListener("transitionend", (e) => {
        if (e.propertyName === "width") reportSize();
    });

    for (const btn of presetBtns) {
        btn.addEventListener("click", () => {
            const raw = btn.dataset.w!;
            setWidth(raw === "100%" ? "100%" : Number(raw), btn);
        });
    }

    // Drag the right edge to resize, so the menu can be inspected at any width
    // (and you can find the exact desktop⇄mobile transition point).
    let dragging = false;
    const onMove = (e: PointerEvent): void => {
        if (!dragging) return;
        const left = frame.getBoundingClientRect().left;
        setWidth(e.clientX - left, null);
    };
    const stop = (): void => {
        dragging = false;
        frame.classList.remove("is-dragging");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", stop);
    };
    handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        dragging = true;
        frame.classList.add("is-dragging");
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", stop);
    });
    window.addEventListener("resize", reportSize);

    /* ------------------------------ editing -------------------------------- */

    let timer: number | undefined;
    const onEdit = (): void => {
        window.clearTimeout(timer);
        timer = window.setTimeout(build, 400);
    };
    htmlArea.addEventListener("input", onEdit);
    jsArea.addEventListener("input", onEdit);
    runBtn.addEventListener("click", build);
    resetBtn.addEventListener("click", () => {
        htmlArea.value = SEED_HTML;
        jsArea.value = SEED_JS;
        renderHtml();
        renderJs();
        build();
    });

    requestAnimationFrame(reportSize);
    return section;
}
