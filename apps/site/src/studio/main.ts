/**
 * Navalone Studio — compose exactly the nav you want, preview the composed
 * bundle live, and download it. The option panel is rendered from the core's
 * chunk manifest (so new core features surface here automatically); every
 * change recomposes the bundle, refreshes the iframe preview (which runs the
 * EXACT bytes the ZIP ships) and regenerates the code blocks.
 */
import { zipSync, strToU8 } from "fflate";
import { compose, formatKb, manifest, resolveSelection, type ManifestFeature } from "./chunks";
import {
    defaultState,
    generateAppJs,
    generateIndexHtml,
    generatePreviewHtml,
    selectedFeatureIds,
    type StudioState
} from "./generate";
import { enhanceCodeBlocks, highlightInto } from "../docs/code";

const state: StudioState = {
    ...defaultState,
    flavors: new Set(defaultState.flavors)
};

const $ = <T extends HTMLElement>(sel: string): T => {
    const el = document.querySelector<T>(sel);
    if (!el) {
        throw new Error("Studio: missing element " + sel);
    }
    return el;
};

/* ----------------------- Option panel (from manifest) --------------------- */

const flavorHost = $("[data-flavor-list]");
const drawerHost = $("[data-drawer-list]");
const responsiveHost = $("[data-responsive-list]");

function featureCard(f: ManifestFeature, type: "checkbox" | "radio", name: string): string {
    const kb = formatKb(f.bytes.js + f.bytes.css);
    return `
    <label class="opt-card" data-card="${f.id}">
        <input type="${type}" name="${name}" value="${f.id}" />
        <span class="opt-card-body">
            <span class="opt-card-title">${f.label}<span class="opt-kb">${kb}</span></span>
            <span class="opt-card-desc">${f.description}</span>
            <span class="opt-card-req" data-req hidden></span>
        </span>
    </label>`;
}

function group(id: ManifestFeature["group"]): ManifestFeature[] {
    return manifest.features.filter((f) => f.group === id);
}

flavorHost.innerHTML = group("submenu")
    .map((f) => featureCard(f, "checkbox", "flavor"))
    .join("");
drawerHost.innerHTML = group("drawer")
    .map((f) => featureCard(f, "radio", "drawer"))
    .join("");
responsiveHost.innerHTML = group("responsive")
    .map((f) => featureCard(f, "radio", "responsive"))
    .join("");

/* ------------------------------ Read/write UI ----------------------------- */

// `state.flavors` holds the user's DIRECT picks and is maintained by the
// change handler (a dep auto-checked for another flavor is rendered
// checked+locked but never becomes a direct pick, so unchecking its dependent
// releases it again).
function readState(): void {
    const drawer = document.querySelector<HTMLInputElement>('input[name="drawer"]:checked');
    state.drawer = drawer && drawer.value === "drawer-accordion" ? "accordion" : "drilldown";
    const resp = document.querySelector<HTMLInputElement>('input[name="responsive"]:checked');
    state.responsive =
        resp && resp.value === "responsive-static" ? "static" : "dynamic";
    state.breakpoint =
        parseInt($<HTMLInputElement>("[data-breakpoint]").value, 10) || 960;
    const val = (name: string) =>
        document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value;
    state.drawerSide = (val("drawer-side") as StudioState["drawerSide"]) || "left";
    state.openOn = (val("open-on") as StudioState["openOn"]) || "hover";
    state.position = (val("position") as StudioState["position"]) || "fixed";
    state.menuAlign = (val("menu-align") as StudioState["menuAlign"]) || "center";
    state.logo = $<HTMLInputElement>("[data-opt-logo]").checked;
    state.rightButtons = $<HTMLInputElement>("[data-opt-buttons]").checked;
}

/** Reflect dependency locking: deps of checked flavors are checked+locked. */
function reflectDeps(): void {
    const direct = state.flavors;
    const effective = new Set(
        resolveSelection(selectedFeatureIds(state))
            .filter((f) => f.group === "submenu")
            .map((f) => f.id)
    );
    document.querySelectorAll<HTMLInputElement>('input[name="flavor"]').forEach((input) => {
        const id = input.value;
        const required = effective.has(id) && !direct.has(id);
        input.checked = direct.has(id) || required;
        input.disabled = required;
        const card = input.closest<HTMLElement>(".opt-card");
        const req = card?.querySelector<HTMLElement>("[data-req]");
        card?.classList.toggle("is-locked", required);
        if (req) {
            req.hidden = !required;
            if (required) {
                const needers = manifest.features
                    .filter(
                        (f) =>
                            direct.has(f.id) &&
                            (f.deps.includes(id) || (f.id === "flyout" && id === "dropdown"))
                    )
                    .map((f) => f.label);
                req.textContent = "included with " + (needers.join(", ") || "your selection");
            }
        }
    });
    // The static breakpoint input only matters in static mode.
    const bpRow = $("[data-breakpoint-row]");
    bpRow.hidden = state.responsive !== "static";
}

/* ------------------------------- Rendering -------------------------------- */

const frame = $<HTMLIFrameElement>("[data-preview]");
const sizeOut = $("[data-size-readout]");
const savingsOut = $("[data-size-savings]");
const featuresOut = $("[data-included]");

const codeEls = {
    html: $("[data-code-html]"),
    app: $("[data-code-app]"),
    css: $("[data-code-css]"),
    js: $("[data-code-js]")
};

let current = { js: "", css: "", appJs: "", indexHtml: "" };

function inlineSafe(code: string): string {
    // A "</script" inside the inlined bundle would end the preview's <script>.
    return code.replace(/<\/script/gi, "<\\/script");
}

function update(): void {
    readState();
    reflectDeps();

    const bundle = compose(selectedFeatureIds(state));
    current = {
        js: bundle.js,
        css: bundle.css,
        appJs: generateAppJs(state),
        indexHtml: generateIndexHtml(state)
    };

    // 1. Live preview — the exact composed bundle + generated config.
    frame.srcdoc = generatePreviewHtml(state, inlineSafe(bundle.js), bundle.css);

    // 2. Size readout: real byte sizes of the composed strings.
    const mine = new Blob([bundle.js]).size + new Blob([bundle.css]).size;
    const full = manifest.full.bytes.js + manifest.full.bytes.css;
    const pct = Math.max(0, Math.round((1 - mine / full) * 100));
    sizeOut.textContent = formatKb(mine);
    savingsOut.textContent =
        "vs " + formatKb(full) + " full plugin — " + pct + "% smaller";
    featuresOut.textContent =
        "kernel + " +
        (bundle.features.length
            ? bundle.features.map((f) => f.label.toLowerCase()).join(", ")
            : "no extras");

    // 3. Code blocks.
    highlightInto(codeEls.html, current.indexHtml, "xml");
    highlightInto(codeEls.app, current.appJs, "typescript");
    highlightInto(codeEls.css, current.css, "css");
    highlightInto(codeEls.js, current.js, "typescript");
}

let pending: number | undefined;
function scheduleUpdate(): void {
    window.clearTimeout(pending);
    pending = window.setTimeout(update, 120);
}

/* -------------------------------- Wiring ---------------------------------- */

$(".studio-options").addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    if (input.name === "flavor" && !input.disabled) {
        if (input.checked) {
            state.flavors.add(input.value);
        } else {
            state.flavors.delete(input.value);
        }
    }
    scheduleUpdate();
});
$<HTMLInputElement>("[data-breakpoint]").addEventListener("input", scheduleUpdate);

// Preview viewport toggle (desktop / phone width). In desktop mode the
// preview document is laid out at ~1000px virtual width and scaled down to
// fit the column, so the desktop bar (not the collapsed drawer) is what you
// see; phone mode renders at a true 380px.
const shell = $("[data-preview-shell]");
const stage = $("[data-preview-stage]");
const VIRTUAL_W = 1000;
const STAGE_H = 460;

function layoutPreview(): void {
    const phone = shell.classList.contains("is-phone");
    const inner = stage.clientWidth;
    if (phone) {
        // True 380px phone width, centred in the stage.
        frame.style.width = "380px";
        frame.style.height = STAGE_H + "px";
        frame.style.left = "50%";
        frame.style.transform = "translateX(-50%)";
        return;
    }
    frame.style.left = "0";
    if (!inner || inner >= 900) {
        frame.style.transform = "";
        frame.style.width = "100%";
        frame.style.height = STAGE_H + "px";
        return;
    }
    const scale = inner / VIRTUAL_W;
    frame.style.width = VIRTUAL_W + "px";
    frame.style.height = Math.round(STAGE_H / scale) + "px";
    frame.style.transform = "scale(" + scale + ")";
}

document.querySelectorAll<HTMLButtonElement>("[data-viewport]").forEach((btn) => {
    btn.addEventListener("click", () => {
        document
            .querySelectorAll("[data-viewport]")
            .forEach((b) => b.classList.toggle("is-active", b === btn));
        shell.classList.toggle("is-phone", btn.dataset.viewport === "phone");
        layoutPreview();
    });
});
// Track every stage size change — including the very first CSS layout pass
// (a plain boot call can race the stylesheet) and window resizes.
if (typeof ResizeObserver === "function") {
    new ResizeObserver(layoutPreview).observe(stage);
} else {
    window.addEventListener("resize", layoutPreview);
}

// Download ZIP — the four files, byte-identical to the code blocks.
const dlBtn = $<HTMLButtonElement>("[data-download]");
dlBtn.addEventListener("click", () => {
    const zipped = zipSync(
        {
            "index.html": strToU8(current.indexHtml),
            "app.js": strToU8(current.appJs),
            "navalone.custom.css": strToU8(current.css),
            "navalone.custom.js": strToU8(current.js)
        },
        { level: 6 }
    );
    const blob = new Blob([zipped], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "navalone-custom.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    dlBtn.classList.add("is-done");
    const label = dlBtn.querySelector("span")!;
    const original = label.textContent;
    label.textContent = "Downloaded ✓";
    window.setTimeout(() => {
        dlBtn.classList.remove("is-done");
        label.textContent = original;
    }, 1800);
});

/* --------------------------------- Boot ----------------------------------- */

// Reflect the default state into the inputs, then render everything once.
defaultState.flavors.forEach((id) => {
    const input = document.querySelector<HTMLInputElement>(
        `input[name="flavor"][value="${id}"]`
    );
    if (input) {
        input.checked = true;
    }
});
(document.querySelector<HTMLInputElement>(
    'input[name="drawer"][value="drawer-drilldown"]'
) as HTMLInputElement).checked = true;
(document.querySelector<HTMLInputElement>(
    'input[name="responsive"][value="responsive-dynamic"]'
) as HTMLInputElement).checked = true;

// Copy buttons for every generated block (reuses the docs enhancer — the
// button copies the block's CURRENT text at click time).
enhanceCodeBlocks($(".studio-code"));

layoutPreview();
update();
