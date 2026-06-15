/**
 * Build the normalised item model that drives both presentations — either from
 * `options.items` or by parsing the declarative `.menu-level` markup (plus
 * `[data-nv-logo]` / `[data-nv-actions]`). No data duplication: one model in,
 * two views out.
 */
import type { Navalone } from "./navalone";
import { escapeId } from "./dom";
import type { NavaloneDisplay, NavaloneItem } from "./types";

export function buildModel(nv: Navalone): NavaloneItem[] {
    return Array.isArray(nv.options.items) ? nv.options.items : parseDeclarative(nv);
}

export function parseDeclarative(nv: Navalone): NavaloneItem[] {
    const logoEl = nv.root.querySelector("[data-nv-logo]");
    if (logoEl && nv.options.logo == null) {
        const img = logoEl.querySelector("img");
        nv.options.logo = img
            ? {
                  img: img.getAttribute("src") ?? undefined,
                  alt: img.alt,
                  href: logoEl.getAttribute("href") || undefined
              }
            : {
                  text: (logoEl.textContent ?? "").trim(),
                  href: logoEl.getAttribute("href") || undefined
              };
    }

    const actionsHost = nv.root.querySelector("[data-nv-actions]");
    if (actionsHost && nv.options.rightButtons == null) {
        nv.options.rightButtons = Array.from(
            actionsHost.querySelectorAll<HTMLElement>("a, button")
        ).map((el) => ({
            label: (el.textContent ?? "").trim(),
            href: el.tagName === "A" ? el.getAttribute("href") ?? undefined : undefined,
            variant: el.dataset.variant || undefined
        }));
    }

    const top =
        nv.root.querySelector<HTMLElement>(".menu-level.level-1") ||
        nv.root.querySelector<HTMLElement>(".menu-level");
    return top ? parseList(nv, top) : [];
}

export function parseList(nv: Navalone, panel: HTMLElement): NavaloneItem[] {
    const ul = panel.querySelector("ul");
    const items: NavaloneItem[] = [];
    if (!ul) {
        return items;
    }
    ul.querySelectorAll<HTMLElement>(":scope > li").forEach((li) => {
        const el = li.querySelector<HTMLElement>(":scope > button, :scope > a");
        if (!el) {
            return;
        }
        const ds = el.dataset;
        const item: NavaloneItem = {
            label:
                ds.label != null
                    ? ds.label
                    : (el.textContent ?? "").replace(/\s*→\s*$/, "").trim(),
            icon: ds.icon,
            image: ds.image,
            imageAlt: ds.imageAlt,
            description: ds.description,
            badge: ds.badge,
            disabled:
                (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true"
        };
        if (el.tagName === "A" && el.getAttribute("href")) {
            item.href = el.getAttribute("href") ?? undefined;
            const a = el as HTMLAnchorElement;
            if (a.target) {
                item.linkTarget = a.target;
            }
        }
        const targetId = ds.target;
        if (targetId) {
            const sub = nv.root.querySelector<HTMLElement>("#" + escapeId(targetId));
            if (sub) {
                item.submenu = {
                    id: targetId,
                    display: (sub.dataset.submenu as NavaloneDisplay) || "dropdown",
                    title: sub.dataset.title,
                    items: parseList(nv, sub)
                };
            }
        }
        items.push(item);
    });
    return items;
}
