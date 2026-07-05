/**
 * Shared chrome/row builders used by both the desktop bar and the mobile
 * drawer: the logo, the right-button CTA region, and the inner row structure
 * (thumbnail/icon · text · badge · arrow).
 */
import type { Navalone } from "./navalone";
import type { NavaloneItem, NavaloneLogoConfig } from "../types";

export interface FillRowOptions {
    hasChild?: boolean;
    thumbnails?: boolean | null;
    description?: boolean;
    /** Chevron direction for items with a child panel. */
    arrow?: "down" | "right" | "left" | null;
}

/* Rounded, "curvy" chevrons (Feather-style) shared by the bar, flyouts, the
   mobile drill-down rows and the back button — no more glyph arrows. */
const CHEVRON: Record<string, string> = {
    down: '<polyline points="6 9 12 15 18 9"/>',
    right: '<polyline points="9 6 15 12 9 18"/>',
    left: '<polyline points="15 6 9 12 15 18"/>'
};

export function chevronSvg(dir: "down" | "right" | "left"): string {
    return (
        '<svg class="nv-chevron" viewBox="0 0 24 24" width="1em" height="1em" ' +
        'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" ' +
        'stroke-linejoin="round" aria-hidden="true">' +
        (CHEVRON[dir] || "") +
        "</svg>"
    );
}

export function fillRow(
    nv: Navalone,
    el: HTMLElement,
    item: NavaloneItem,
    opts: FillRowOptions
): void {
    const showThumb = opts.thumbnails != null ? opts.thumbnails : nv.options.showThumbnails;
    if (showThumb && item.image) {
        const img = document.createElement("img");
        img.className = "nv-thumb";
        img.src = item.image;
        img.alt = item.imageAlt || "";
        img.loading = "lazy";
        el.appendChild(img);
    } else if (item.icon) {
        const icon = document.createElement("span");
        icon.className = "nv-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = item.icon;
        el.appendChild(icon);
    }

    const text = document.createElement("span");
    text.className = "nv-text";
    const label = document.createElement("span");
    label.className = "nv-label";
    label.textContent = item.label || "";
    text.appendChild(label);
    if (item.description && opts.description !== false) {
        const desc = document.createElement("span");
        desc.className = "nv-desc";
        desc.textContent = item.description;
        text.appendChild(desc);
    }
    el.appendChild(text);

    if (item.badge) {
        const badge = document.createElement("span");
        badge.className = "nv-badge";
        badge.textContent = item.badge;
        el.appendChild(badge);
    }

    if (opts.hasChild && opts.arrow) {
        const arrow = document.createElement("span");
        arrow.className = "nv-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.innerHTML = chevronSvg(opts.arrow);
        el.appendChild(arrow);
    }
}

export function buildLogo(nv: Navalone, extraClass?: string): HTMLElement | null {
    const l = nv.options.logo;
    if (!l) {
        return null;
    }
    const data: NavaloneLogoConfig = typeof l === "string" ? { text: l } : l;
    const el = document.createElement(data.href ? "a" : "span");
    el.className = "nv-logo" + (extraClass ? " " + extraClass : "");
    if (data.href) {
        (el as HTMLAnchorElement).href = data.href;
    }
    if (data.img) {
        const img = document.createElement("img");
        img.src = data.img;
        img.alt = data.alt || data.text || "Logo";
        el.appendChild(img);
    } else {
        el.textContent = data.text || "";
    }
    return el;
}

export function buildActions(nv: Navalone, className: string): HTMLElement | null {
    if (!nv.options.showRightButtons) {
        return null;
    }
    const btns = nv.options.rightButtons;
    if (!Array.isArray(btns) || !btns.length) {
        return null;
    }
    const wrap = document.createElement("div");
    wrap.className = className;
    btns.forEach((b) => {
        const el = document.createElement(b.href ? "a" : "button");
        el.className = "nv-action" + (b.variant ? " nv-action--" + b.variant : "");
        if (b.href) {
            const a = el as HTMLAnchorElement;
            a.href = b.href;
            if (b.linkTarget) {
                a.target = b.linkTarget;
            }
        } else {
            (el as HTMLButtonElement).type = "button";
        }
        if (b.icon) {
            const icon = document.createElement("span");
            icon.className = "nv-icon";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = b.icon;
            el.appendChild(icon);
        }
        const label = document.createElement("span");
        label.textContent = b.label || "";
        el.appendChild(label);
        wrap.appendChild(el);
    });
    return wrap;
}
