/**
 * Progressive enhancement for the static `<pre><code>` blocks: syntax
 * highlighting via highlight.js (a small registered subset of languages) plus a
 * copy-to-clipboard button. Runs once over the rendered document.
 */
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import bash from "highlight.js/lib/languages/bash";
import "highlight.js/styles/atom-one-dark.css";
import { svgIcon } from "./icons";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("bash", bash);

const SUBSET = ["typescript", "xml", "bash"];

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

export function enhanceCodeBlocks(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>("pre > code").forEach((code) => {
        const pre = code.parentElement as HTMLPreElement;
        if (pre.dataset.enhanced) {
            return;
        }
        pre.dataset.enhanced = "1";
        highlight(code);
        addCopyButton(pre, code);
    });
}
