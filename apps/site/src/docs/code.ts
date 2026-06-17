/**
 * Progressive enhancement for the static `<pre><code>` blocks: syntax
 * highlighting via highlight.js (a small registered subset of languages) plus a
 * copy-to-clipboard button. Runs once over the rendered document.
 */
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import "../styles/hljs-material.css";
import { svgIcon } from "./icons";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);

const SUBSET = ["typescript", "xml", "bash", "json"];

function highlight(code: HTMLElement): void {
    const raw = code.textContent || "";
    const hint = code.className.match(/language-([\w-]+)/)?.[1];
    const result =
        hint && hljs.getLanguage(hint)
            ? hljs.highlight(raw, { language: hint })
            : hljs.highlightAuto(raw, SUBSET);
    code.innerHTML = result.value;
    code.classList.add("hljs");
}

function addCopyButton(pre: HTMLPreElement, code: HTMLElement): void {
    const wrap = document.createElement("div");
    wrap.className = "code-block";
    pre.parentNode?.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", "Copy code");
    btn.innerHTML = `${svgIcon("copy")}<span>Copy</span>`;
    wrap.appendChild(btn);

    let reset: number | undefined;
    btn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(code.textContent || "");
            btn.classList.add("is-copied");
            btn.innerHTML = `${svgIcon("check")}<span>Copied</span>`;
            window.clearTimeout(reset);
            reset = window.setTimeout(() => {
                btn.classList.remove("is-copied");
                btn.innerHTML = `${svgIcon("copy")}<span>Copy</span>`;
            }, 1800);
        } catch {
            btn.querySelector("span")!.textContent = "Press Ctrl+C";
        }
    });
}

/**
 * Turn an editable `<textarea>` into a syntax-highlighted code editor. A
 * highlighted `<pre>` layer sits directly behind the textarea (which keeps a
 * transparent fill but a visible caret), so the live editors read with the same
 * Material theme colours as the static `<pre><code>` samples. Returns a `render`
 * callback to re-highlight after a programmatic value change (e.g. Reset).
 */
export function enhanceCodeEditor(
    textarea: HTMLTextAreaElement,
    lang: string
): () => void {
    const wrap = document.createElement("div");
    wrap.className = "code-editor";
    textarea.parentNode?.insertBefore(wrap, textarea);

    const pre = document.createElement("pre");
    pre.className = "code-editor-highlight";
    pre.setAttribute("aria-hidden", "true");
    const code = document.createElement("code");
    code.className = `hljs language-${lang}`;
    pre.appendChild(code);

    wrap.appendChild(pre);
    wrap.appendChild(textarea);
    // Horizontal scroll instead of soft-wrap keeps the overlay aligned line-for-line.
    textarea.setAttribute("wrap", "off");

    const render = (): void => {
        const raw = textarea.value;
        const result =
            hljs.getLanguage(lang)
                ? hljs.highlight(raw, { language: lang })
                : hljs.highlightAuto(raw, SUBSET);
        // A trailing newline in the source needs an extra blank line in the
        // overlay, or the last (empty) line clips.
        code.innerHTML = result.value + (raw.endsWith("\n") ? "\n" : "");
    };
    const syncScroll = (): void => {
        pre.scrollTop = textarea.scrollTop;
        pre.scrollLeft = textarea.scrollLeft;
    };

    textarea.addEventListener("input", render);
    textarea.addEventListener("scroll", syncScroll);
    render();

    return render;
}

export function enhanceCodeBlocks(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>("pre > code").forEach((code) => {
        const pre = code.parentElement as HTMLPreElement;
        if (pre.dataset.enhanced) {
            return;
        }
        // Skip the live editors' highlight overlay: it sits behind a transparent
        // textarea, and wrapping/moving it (addCopyButton) would detach it from
        // the textarea and make the caret drift out of sync with the text.
        if (pre.closest(".code-editor")) {
            return;
        }
        pre.dataset.enhanced = "1";
        highlight(code);
        addCopyButton(pre, code);
    });
}
