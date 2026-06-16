/**
 * A live, editable example. The left pane is an editable JSON config; the right
 * pane mounts a real Navalone instance built from it. Editing re-instantiates
 * the menu (debounced), so every example is genuinely interactive — driven by
 * the same core the wrappers use, with no behaviour duplicated here.
 */
import { Navalone, type NavaloneOptions } from "navalone";
import { svgIcon } from "./icons";

export interface LiveExampleOptions {
    id: string;
    title: string;
    description: string;
    config: NavaloneOptions;
    /** Extra buttons that drive the live instance (e.g. open the drawer). */
    actions?: { label: string; run: (instance: Navalone) => void }[];
    /** Note shown under the preview. */
    note?: string;
}

export function createLiveExample(opts: LiveExampleOptions): HTMLElement {
    const section = document.createElement("section");
    section.className = "example";
    section.id = opts.id;

    const editorId = `${opts.id}-editor`;
    const statusId = `${opts.id}-status`;

    section.innerHTML = `
        <h3>${opts.title} <a class="anchor" href="#${opts.id}" aria-label="Link to ${opts.title}">#</a></h3>
        <p>${opts.description}</p>
        <div class="example-grid">
            <div class="example-editor">
                <label for="${editorId}">Editable config (JSON)</label>
                <textarea id="${editorId}" spellcheck="false" aria-describedby="${statusId}"></textarea>
                <div class="example-toolbar">
                    <button type="button" data-run class="btn-run">${svgIcon("play", 13)}<span>Run</span></button>
                    <button type="button" data-reset>Reset</button>
                    <span id="${statusId}" class="status" role="status" aria-live="polite"></span>
                </div>
            </div>
            <div class="example-preview">
                <div class="preview-surface" data-mount></div>
                <div class="example-actions" data-actions></div>
                ${opts.note ? `<p class="note">${opts.note}</p>` : ""}
            </div>
        </div>
    `;

    const textarea = section.querySelector<HTMLTextAreaElement>("textarea")!;
    const mount = section.querySelector<HTMLElement>("[data-mount]")!;
    const status = section.querySelector<HTMLElement>(".status")!;
    const actionsHost = section.querySelector<HTMLElement>("[data-actions]")!;
    const runBtn = section.querySelector<HTMLButtonElement>("[data-run]")!;
    const resetBtn = section.querySelector<HTMLButtonElement>("[data-reset]")!;

    const initial = JSON.stringify(opts.config, null, 2);
    textarea.value = initial;

    let instance: Navalone | null = null;

    function setStatus(text: string, ok: boolean): void {
        status.textContent = text;
        status.classList.toggle("status--error", !ok);
        status.classList.toggle("status--ok", ok);
    }

    function build(): void {
        let parsed: NavaloneOptions;
        try {
            parsed = JSON.parse(textarea.value) as NavaloneOptions;
        } catch (err) {
            setStatus(`Invalid JSON: ${(err as Error).message}`, false);
            return;
        }
        instance?.destroy();
        // A fresh host each rebuild keeps revert semantics simple.
        mount.innerHTML = '<div class="preview-menu"></div>';
        const host = mount.firstElementChild as HTMLElement;
        try {
            instance = new Navalone(host, parsed);
            setStatus("Updated ✓", true);
        } catch (err) {
            setStatus(`Build error: ${(err as Error).message}`, false);
        }
    }

    // Render the action buttons once; they always target the current instance.
    for (const action of opts.actions ?? []) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = action.label;
        btn.addEventListener("click", () => {
            if (instance) {
                action.run(instance);
            }
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

    build();
    return section;
}
