/**
 * A live, editable example. The left pane is an editable JSON config; the right
 * pane embeds a real Navalone instance inside an <iframe> (see
 * /demo/preview/). Because the menu lives in the iframe, it reacts to the
 * frame's own width — so the device presets (Desktop / Tablet / Mobile) and the
 * drag handle collapse the SAME instance from desktop bar to mobile drawer,
 * exactly like the hero. Edits + button actions are sent over postMessage; the
 * iframe rebuilds the instance from the same core the wrappers use.
 */
import type { NavaloneOptions } from "navalone";
import { svgIcon } from "./icons";

/** A button that drives the live instance via a public Navalone method. */
export interface LiveExampleAction {
    label: string;
    /** Public Navalone method to call, e.g. "open", "openSubmenu". */
    method: string;
    /** Arguments forwarded to the method, e.g. ["company"]. */
    args?: unknown[];
}

export interface LiveExampleOptions {
    id: string;
    title: string;
    description: string;
    config: NavaloneOptions;
    /** Extra buttons that drive the live instance (e.g. open the drawer). */
    actions?: LiveExampleAction[];
    /** Note shown under the preview. */
    note?: string;
}

/** Device presets: label + frame width ("100%" or a pixel number). */
const PRESETS: { label: string; w: string }[] = [
    { label: "Desktop", w: "100%" },
    { label: "Tablet", w: "430" },
    { label: "Mobile", w: "340" }
];

export function createLiveExample(opts: LiveExampleOptions): HTMLElement {
    const section = document.createElement("section");
    section.className = "example";
    section.id = opts.id;

    const editorId = `${opts.id}-editor`;
    const statusId = `${opts.id}-status`;

    section.innerHTML = `
        <h3>${opts.title} <a class="anchor" href="#${opts.id}" aria-label="Link to ${opts.title}">#</a></h3>
        <p>${opts.description}</p>
        <div class="example-toolbar">
            <button type="button" data-run class="btn-run">${svgIcon("play", 13)}<span>Run</span></button>
            <button type="button" data-reset>Reset</button>
            <span id="${statusId}" class="status" role="status" aria-live="polite"></span>
        </div>
        <div class="example-grid">
            <div class="example-editor">
                <label for="${editorId}">Editable config (JSON)</label>
                <textarea id="${editorId}" spellcheck="false" aria-describedby="${statusId}"></textarea>
            </div>
            <div class="example-preview">
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
                        <iframe data-preview src="/demo/preview/"
                            title="Live preview of ${opts.title} — resize to watch it collapse from desktop bar to mobile drawer"
                            loading="lazy"></iframe>
                        <button type="button" class="preview-handle" data-handle
                            aria-label="Drag to resize the preview" title="Drag to resize">
                            <span aria-hidden="true"></span>
                        </button>
                    </div>
                </div>
                <div class="example-actions" data-actions></div>
                ${opts.note ? `<p class="note">${opts.note}</p>` : ""}
            </div>
        </div>
    `;

    const textarea = section.querySelector<HTMLTextAreaElement>("textarea")!;
    const status = section.querySelector<HTMLElement>(".status")!;
    const actionsHost = section.querySelector<HTMLElement>("[data-actions]")!;
    const runBtn = section.querySelector<HTMLButtonElement>("[data-run]")!;
    const resetBtn = section.querySelector<HTMLButtonElement>("[data-reset]")!;
    const frame = section.querySelector<HTMLElement>("[data-frame]")!;
    const handle = section.querySelector<HTMLElement>("[data-handle]")!;
    const iframe = section.querySelector<HTMLIFrameElement>("[data-preview]")!;
    const sizeOut = section.querySelector<HTMLElement>("[data-size]")!;
    const presetBtns = Array.from(
        section.querySelectorAll<HTMLButtonElement>(".preview-presets button")
    );

    const initial = JSON.stringify(opts.config, null, 2);
    textarea.value = initial;

    function setStatus(text: string, ok: boolean): void {
        status.textContent = text;
        status.classList.toggle("status--error", !ok);
        status.classList.toggle("status--ok", ok);
    }

    /* ----------------------------- iframe link ----------------------------- */

    const origin = window.location.origin;
    let ready = false;

    function post(message: object): void {
        iframe.contentWindow?.postMessage(message, origin);
    }

    function build(): void {
        let parsed: NavaloneOptions;
        try {
            parsed = JSON.parse(textarea.value) as NavaloneOptions;
        } catch (err) {
            setStatus(`Invalid JSON: ${(err as Error).message}`, false);
            return;
        }
        if (ready) post({ type: "build", config: parsed });
    }

    // Status (and the "ready" handshake) come back from this example's iframe.
    window.addEventListener("message", (e: MessageEvent) => {
        if (e.origin !== origin || e.source !== iframe.contentWindow) return;
        const data = e.data;
        if (!data || data.source !== "navalone-preview") return;
        if (data.type === "ready") {
            ready = true;
            build();
        } else if (data.type === "status") {
            setStatus(data.message, data.ok);
        }
    });

    /* --------------------------- preview sizing ---------------------------- */

    function reportSize(): void {
        sizeOut.textContent = String(Math.round(frame.getBoundingClientRect().width));
    }

    function setWidth(w: number | string, markPreset?: HTMLButtonElement | null): void {
        if (typeof w === "number") {
            const max = frame.parentElement?.clientWidth ?? 640;
            frame.style.width = Math.min(Math.max(w, 240), max) + "px";
        } else {
            frame.style.width = w; // "100%"
        }
        presetBtns.forEach((b) => b.classList.toggle("is-active", b === markPreset));
        requestAnimationFrame(reportSize);
    }

    // The frame width animates; report the settled size once the transition ends.
    frame.addEventListener("transitionend", (e) => {
        if (e.propertyName === "width") reportSize();
    });

    for (const btn of presetBtns) {
        btn.addEventListener("click", () => {
            const raw = btn.dataset.w!;
            setWidth(raw === "100%" ? "100%" : Number(raw), btn);
        });
    }

    // Drag the right edge to resize the preview, so the menu can be inspected at
    // any width (and you can find the exact desktop⇄mobile transition point).
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

    /* ------------------------------- actions ------------------------------- */

    // Each action drives the live instance inside the iframe via postMessage.
    for (const action of opts.actions ?? []) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = action.label;
        btn.addEventListener("click", () => {
            post({ type: "action", method: action.method, args: action.args ?? [] });
        });
        actionsHost.appendChild(btn);
    }

    let timer: number | undefined;
    textarea.addEventListener("input", () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(build, 400);
    });
    runBtn.addEventListener("click", build);
    resetBtn.addEventListener("click", () => {
        textarea.value = initial;
        build();
    });

    requestAnimationFrame(reportSize);
    return section;
}
