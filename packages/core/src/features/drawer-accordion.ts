/**
 * Feature: `mobileMenu: "accordion"` — the drawer's inline-expand engine: a
 * SINGLE `.menu-level` panel whose submenus are nested collapsible regions
 * (no sliding, no back button), animated via grid-template-rows. CSS chunk:
 * styles/drawer-accordion.css.
 */
import type { Navalone } from "../kernel/navalone";
import type { NavaloneFeature, NavaloneKernelApi } from "../kernel/registry";
import type { NavaloneColumn, NavaloneItem } from "../types";

export const drawerAccordion: NavaloneFeature = {
    id: "drawer-accordion",
    label: "Accordion drawer",
    group: "drawer",
    description: "Mobile drawer whose submenus expand inline on the same screen.",
    install(api) {
        return {
            drawers: {
                accordion: {
                    hostClass: "nv-acc",
                    render: (nv) => renderAccordion(api, nv, nv._model),
                    reset: (nv) => {
                        // Collapse every expanded region back to the top level.
                        nv._panelHost
                            .querySelectorAll<HTMLElement>(".nv-acc-li.is-open")
                            .forEach((li) => {
                                const trigger = li.querySelector<HTMLElement>(
                                    ":scope > .menu-item"
                                );
                                if (trigger && trigger._nvPanel) {
                                    setAccordion(trigger, trigger._nvPanel, false);
                                }
                            });
                        api.setActive(nv, nv._rootPanel);
                    },
                    // Skip rows inside a collapsed (inert) accordion panel when
                    // roving with ArrowUp/Down.
                    filterFocusable: (_nv, items) =>
                        items.filter(
                            (el) => !el.closest('.nv-acc-panel[aria-hidden="true"]')
                        )
                }
            },
            // Mobile rows: toggle the row's inline submenu.
            onClick: (nv, e, target) => {
                const item = target.closest<HTMLElement>(".menu-item");
                if (!item || !nv._panelHost.contains(item)) {
                    return false;
                }
                if (
                    (item as HTMLButtonElement).disabled ||
                    item.classList.contains("is-disabled")
                ) {
                    e.preventDefault();
                    return true;
                }
                if (item.getAttribute("aria-controls")) {
                    e.preventDefault();
                    toggleAccordion(nv, item);
                }
                // Leaf link rows act normally, but the click is fully handled
                // here either way (mirrors the original accordion branch).
                return true;
            }
        };
    }
};

/* ------------------------------- Rendering -------------------------------- */

function renderAccordion(
    api: NavaloneKernelApi,
    nv: Navalone,
    items: NavaloneItem[]
): HTMLElement[] {
    const root = document.createElement("div");
    root.className = "menu-level level-1";
    root.id = nv.options.rootId || api.uid("nv-main");
    root.appendChild(buildAccList(api, nv, items));
    return [root];
}

function buildAccList(
    api: NavaloneKernelApi,
    nv: Navalone,
    items: NavaloneItem[]
): HTMLElement {
    const ul = document.createElement("ul");
    items.forEach((item) => ul.appendChild(buildAccItem(api, nv, item)));
    return ul;
}

function buildAccItem(api: NavaloneKernelApi, nv: Navalone, item: NavaloneItem): HTMLElement {
    const li = document.createElement("li");
    const submenu = item.submenu || null;
    if (submenu && !submenu.id) {
        submenu.id = api.uid("nv-panel");
    }
    const hasChild = !!submenu;
    const isLink = !hasChild && !!item.href;

    const el = document.createElement(isLink ? "a" : "button");
    el.className = "menu-item";
    el.setAttribute("role", "menuitem");
    if (isLink) {
        const a = el as HTMLAnchorElement;
        a.href = item.href as string;
        if (item.linkTarget) {
            a.target = item.linkTarget;
        }
    } else {
        (el as HTMLButtonElement).type = "button";
    }

    if (hasChild) {
        el.setAttribute("aria-haspopup", "true");
        el.setAttribute("aria-expanded", "false");
        el.setAttribute("aria-controls", submenu!.id as string);
        if (submenu!.display) {
            el.dataset.submenu = submenu!.display;
        }
    }

    if (item.disabled) {
        el.classList.add("is-disabled");
        if (isLink) {
            el.setAttribute("aria-disabled", "true");
        } else {
            (el as HTMLButtonElement).disabled = true;
        }
    }

    api.fillRow(nv, el, item, {
        hasChild,
        thumbnails: nv.options.showThumbnails,
        description: true,
        arrow: hasChild ? "down" : null
    });
    el.dataset.nvReady = "1";
    li.appendChild(el);

    if (hasChild) {
        li.classList.add("nv-acc-li");
        const panel = document.createElement("div");
        panel.className = "nv-acc-panel";
        panel.id = submenu!.id as string;
        panel.setAttribute("role", "menu");
        const label = item.label || submenu!.title;
        if (label) {
            panel.setAttribute("aria-label", label);
        }
        panel.setAttribute("aria-hidden", "true");
        panel.inert = true;

        const inner = document.createElement("ul");
        // Mega-menu columns flatten inline; each heading becomes a group label.
        const groups: NavaloneColumn[] = Array.isArray(submenu!.columns)
            ? submenu!.columns
            : [{ items: submenu!.items || [] }];
        groups.forEach((column) => {
            if (column.heading) {
                const heading = document.createElement("li");
                heading.className = "nv-group";
                heading.setAttribute("role", "presentation");
                heading.textContent = column.heading;
                inner.appendChild(heading);
            }
            (column.items || []).forEach((child) =>
                inner.appendChild(buildAccItem(api, nv, child))
            );
        });
        panel.appendChild(inner);

        el._nvPanel = panel;
        li.appendChild(panel);
    }
    return li;
}

/* ------------------------------- Behaviour -------------------------------- */

/** Expand/collapse an accordion submenu by its trigger row. */
function toggleAccordion(nv: Navalone, trigger: HTMLElement): void {
    const panel = trigger._nvPanel;
    if (!panel) {
        return;
    }
    const open = trigger.getAttribute("aria-expanded") !== "true";
    setAccordion(trigger, panel, open);
    if (open) {
        nv._emit("submenuopen", { id: panel.id, trigger, panel });
    } else {
        nv._emit("submenuclose", { id: panel.id, panel });
    }
}

function setAccordion(trigger: HTMLElement, panel: HTMLElement, open: boolean): void {
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    const li = trigger.closest<HTMLElement>(".nv-acc-li");
    if (li) {
        li.classList.toggle("is-open", open);
    }
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    panel.inert = !open;
}
