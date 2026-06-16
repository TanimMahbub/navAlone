/**
 * Theming playground. Mounts a real Navalone instance and mutates its `--nv-*`
 * custom properties live, then mirrors the result as a copy-pasteable `theme`
 * object. Tokens are applied to the instance root only, so the rest of the page
 * is untouched.
 */
import { Navalone } from "navalone";
import { fullConfig } from "./data";

interface TokenControl {
    token: string;
    label: string;
    type: "color" | "range";
    value: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
}

const CONTROLS: TokenControl[] = [
    { token: "--nv-bar-bg", label: "Bar background", type: "color", value: "#ffffff" },
    { token: "--nv-bar-color", label: "Bar text", type: "color", value: "#222222" },
    { token: "--nv-panel-bg", label: "Panel background", type: "color", value: "#ffffff" },
    { token: "--nv-text-color", label: "Panel text", type: "color", value: "#222222" },
    {
        token: "--nv-action-primary-bg",
        label: "Primary button",
        type: "color",
        value: "#3a7afe"
    },
    { token: "--nv-badge-bg", label: "Badge", type: "color", value: "#e0245e" },
    { token: "--nv-focus-color", label: "Focus ring", type: "color", value: "#4a90d9" },
    { token: "--nv-drawer-head-bg", label: "Drawer header", type: "color", value: "#333333" },
    {
        token: "--nv-radius",
        label: "Corner radius",
        type: "range",
        value: "8",
        min: 0,
        max: 24,
        step: 1,
        unit: "px"
    },
    {
        token: "--nv-bar-height",
        label: "Bar height",
        type: "range",
        value: "60",
        min: 44,
        max: 96,
        step: 1,
        unit: "px"
    },
    {
        token: "--nv-width",
        label: "Drawer width",
        type: "range",
        value: "320",
        min: 240,
        max: 480,
        step: 4,
        unit: "px"
    },
    {
        token: "--nv-duration",
        label: "Animation",
        type: "range",
        value: "300",
        min: 0,
        max: 800,
        step: 10,
        unit: "ms"
    }
];

export function createPlayground(): HTMLElement {
    const section = document.createElement("section");
    section.className = "example playground";
    section.id = "theming-playground";

    section.innerHTML = `
        <h3>Theming playground <a class="anchor" href="#theming-playground" aria-label="Link to theming playground">#</a></h3>
        <p>Drag the controls to mutate <code>--nv-*</code> tokens on a live instance. Copy the generated <code>theme</code> object straight into your config.</p>
        <div class="example-grid">
            <form class="playground-controls" aria-label="Theme token controls"></form>
            <div class="example-preview">
                <div class="preview-surface"><div class="preview-menu" data-mount></div></div>
                <div class="example-actions">
                    <button type="button" data-open>Open drawer</button>
                    <button type="button" data-mega>Open mega menu</button>
                    <button type="button" data-reset>Reset theme</button>
                </div>
                <label class="output-label" for="theme-output">Generated <code>theme</code></label>
                <textarea id="theme-output" class="theme-output" readonly rows="6"></textarea>
            </div>
        </div>
    `;

    const form = section.querySelector<HTMLFormElement>(".playground-controls")!;
    const mount = section.querySelector<HTMLElement>("[data-mount]")!;
    const output = section.querySelector<HTMLTextAreaElement>(".theme-output")!;

    const instance = new Navalone(mount, fullConfig);
    const theme: Record<string, string> = {};

    function render(): void {
        output.value = JSON.stringify({ theme }, null, 2);
    }

    function apply(control: TokenControl, raw: string): void {
        const cssValue = control.type === "range" ? raw + (control.unit ?? "") : raw;
        instance.root.style.setProperty(control.token, cssValue);
        theme[control.token] = cssValue;
        render();
    }

    for (const control of CONTROLS) {
        const id = `pg-${control.token.replace(/[^a-z]/gi, "")}`;
        const row = document.createElement("div");
        row.className = "control";
        const suffix = control.type === "range" ? `<output for="${id}"></output>` : "";
        row.innerHTML = `
            <label for="${id}">${control.label} <code>${control.token}</code></label>
            <span class="control-input">
                <input id="${id}" type="${control.type}" value="${control.value}"
                    ${control.min !== undefined ? `min="${control.min}"` : ""}
                    ${control.max !== undefined ? `max="${control.max}"` : ""}
                    ${control.step !== undefined ? `step="${control.step}"` : ""} />
                ${suffix}
            </span>
        `;
        const input = row.querySelector<HTMLInputElement>("input")!;
        const out = row.querySelector<HTMLOutputElement>("output");
        const sync = () => {
            if (out) {
                out.textContent = input.value + (control.unit ?? "");
            }
            apply(control, input.value);
        };
        input.addEventListener("input", sync);
        if (out) {
            out.textContent = control.value + (control.unit ?? "");
        }
        form.appendChild(row);
    }

    section.querySelector("[data-open]")!.addEventListener("click", () => instance.open());
    section.querySelector("[data-mega]")!.addEventListener("click", () =>
        instance.openSubmenu("resources")
    );
    section.querySelector("[data-reset]")!.addEventListener("click", () => {
        for (const control of CONTROLS) {
            instance.root.style.removeProperty(control.token);
            const input = form.querySelector<HTMLInputElement>(
                `#pg-${control.token.replace(/[^a-z]/gi, "")}`
            )!;
            input.value = control.value;
            input.dispatchEvent(new Event("input"));
        }
        for (const key of Object.keys(theme)) {
            delete theme[key];
        }
        render();
    });

    render();
    return section;
}
