/**
 * Feature: `mobileMenu: "drilldown"` (the default) — the app-style sliding
 * drill-down inside the drawer: tapping a row slides to a new panel, a back
 * button returns, the host height animates via `--mmHeight`. CSS chunk:
 * styles/drawer-drilldown.css.
 */
import type { Navalone } from "../kernel/navalone";
import type { NavaloneFeature, NavaloneKernelApi } from "../kernel/registry";
import type { NavaloneColumn, NavaloneItem } from "../types";

export const drawerDrilldown: NavaloneFeature = {
    id: "drawer-drilldown",
    label: "Drill-down drawer",
    group: "drawer",
    description: "Mobile drawer with sliding drill-down levels and a back button.",
    install(api) {
        return {
            drawers: {
                drilldown: {
                    render: (nv) => renderConfig(api, nv, nv._model),
                    reset: (nv) => {
                        nv._panels.forEach((panel) => {
                            panel.style.transform = "";
                        });
                        nv._triggers.forEach((trigger) =>
                            trigger.setAttribute("aria-expanded", "false")
                        );
                        nv._triggers.clear();
                        nv._stack = [nv._rootPanel.id];
                        api.setActive(nv, nv._rootPanel);
                    },
                    navigateTo: (nv, panelId, trigger) =>
                        navigateTo(api, nv, panelId, trigger),
                    back: (nv) => back(api, nv)
                }
            },
            // Mobile rows: drill-down navigation, plus the back button.
            onClick: (nv, e, target) => {
                const item = target.closest<HTMLElement>(".menu-item");
                if (item && nv._panelHost.contains(item)) {
                    if (
                        (item as HTMLButtonElement).disabled ||
                        item.classList.contains("is-disabled")
                    ) {
                        e.preventDefault();
                        return true;
                    }
                    if (item.dataset.target) {
                        e.preventDefault();
                        navigateTo(api, nv, item.dataset.target, item);
                        return true;
                    }
                    // Leaf link/button rows act normally.
                    return false;
                }
                const backBtn = target.closest<HTMLElement>(".back-button");
                if (backBtn && nv._panelHost.contains(backBtn)) {
                    e.preventDefault();
                    back(api, nv);
                    return true;
                }
                return false;
            }
        };
    }
};

/* ------------------------------- Rendering -------------------------------- */

function renderConfig(
    api: NavaloneKernelApi,
    nv: Navalone,
    items: NavaloneItem[]
): HTMLElement[] {
    const panels: HTMLElement[] = [];
    const root = document.createElement("div");
    root.className = "menu-level level-1";
    root.id = nv.options.rootId || api.uid("nv-main");
    root.appendChild(buildList(api, nv, items));
    panels.push(root);
    buildSubPanels(api, nv, items, 2, panels);
    return panels;
}

function buildList(api: NavaloneKernelApi, nv: Navalone, items: NavaloneItem[]): HTMLElement {
    const ul = document.createElement("ul");
    items.forEach((item) => ul.appendChild(buildRow(api, nv, item)));
    return ul;
}

function buildRow(api: NavaloneKernelApi, nv: Navalone, item: NavaloneItem): HTMLElement {
    const li = document.createElement("li");
    const submenu = item.submenu || null;
    if (submenu && !submenu.id) {
        submenu.id = api.uid("nv-panel");
    }
    const targetId = submenu ? submenu.id : item.target || null;
    const isLink = !targetId && !!item.href;

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

    if (targetId) {
        el.dataset.target = targetId;
        el.setAttribute("aria-haspopup", "true");
        el.setAttribute("aria-expanded", "false");
        if (submenu && submenu.display) {
            el.dataset.submenu = submenu.display;
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
        hasChild: !!targetId,
        thumbnails: nv.options.showThumbnails,
        description: true,
        arrow: "right"
    });
    el.dataset.nvReady = "1";
    li.appendChild(el);
    return li;
}

function buildSubPanels(
    api: NavaloneKernelApi,
    nv: Navalone,
    items: NavaloneItem[],
    level: number,
    panels: HTMLElement[]
): void {
    items.forEach((item) => {
        const submenu = item.submenu;
        if (!submenu) {
            return;
        }

        const panel = document.createElement("div");
        panel.className = "menu-level level-" + level;
        panel.id = submenu.id as string;
        panel.dataset.title = item.label || submenu.title || "";
        if (submenu.display) {
            panel.dataset.submenu = submenu.display;
        }
        panel.appendChild(buildHeader(api));

        const ul = document.createElement("ul");
        // Mega-menu columns flatten into a single drill-down panel on mobile;
        // each column heading becomes a group label.
        const groups: NavaloneColumn[] = Array.isArray(submenu.columns)
            ? submenu.columns
            : [{ items: submenu.items || [] }];
        if (Array.isArray(submenu.columns)) {
            panel.dataset.columns = String(submenu.columns.length);
        }

        const childItems: NavaloneItem[] = [];
        groups.forEach((column) => {
            if (column.heading) {
                const heading = document.createElement("li");
                heading.className = "nv-group";
                heading.setAttribute("role", "presentation");
                heading.textContent = column.heading;
                ul.appendChild(heading);
            }
            (column.items || []).forEach((child) => {
                ul.appendChild(buildRow(api, nv, child));
                childItems.push(child);
            });
        });

        panel.appendChild(ul);
        panels.push(panel);
        buildSubPanels(api, nv, childItems, level + 1, panels);
    });
}

function buildHeader(api: NavaloneKernelApi): HTMLElement {
    const header = document.createElement("div");
    header.className = "menu-header";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "back-button";
    back.innerHTML = api.chevronSvg("left") + "<span>Back</span>";
    back.setAttribute("aria-label", "Back");

    const title = document.createElement("span");
    title.className = "menu-title";

    // Back on the left, the parent level's name on the right.
    header.appendChild(back);
    header.appendChild(title);
    return header;
}

/* ----------------------------- Drill navigation --------------------------- */

function navigateTo(
    api: NavaloneKernelApi,
    nv: Navalone,
    panelId: string,
    trigger?: HTMLElement | null
): boolean {
    const target = api.panelById(nv, panelId);
    const current = api.activePanel(nv);
    if (!target || !current || target === current) {
        return false;
    }

    target.style.transform = "translateX(0)";
    current.style.transform = "translateX(-100%)";

    const label = trigger ? api.labelOf(trigger) : null;
    applyTitle(nv, target, label, trigger ?? null);

    target.dataset.previous = current.id;
    if (trigger) {
        nv._triggers.set(target.id, trigger);
        trigger.setAttribute("aria-expanded", "true");
    }

    nv._stack.push(target.id);
    api.setActive(nv, target);
    api.focusPanel(target);

    nv._emit("navigate", { from: current.id, to: target.id, trigger: trigger ?? null });
    return true;
}

function back(api: NavaloneKernelApi, nv: Navalone): boolean {
    if (nv._stack.length <= 1) {
        return false;
    }

    const currentId = nv._stack.pop() as string;
    const current = api.panelById(nv, currentId);
    const previous = api.panelById(nv, nv._stack[nv._stack.length - 1]);
    if (!current || !previous) {
        return false;
    }

    current.style.transform = "translateX(100%)";
    previous.style.transform = "translateX(0)";

    const trigger = nv._triggers.get(currentId);
    if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
    }
    nv._triggers.delete(currentId);

    api.setActive(nv, previous);
    api.focusPanel(previous, trigger);

    nv._emit("back", { from: currentId, to: previous.id });
    return true;
}

function applyTitle(
    nv: Navalone,
    panel: HTMLElement,
    label: string | null,
    trigger: HTMLElement | null
): void {
    const titleEl = panel.querySelector(".menu-header .menu-title");
    if (!titleEl) {
        return;
    }
    const opt = nv.options.title;
    let text: string;
    if (typeof opt === "function") {
        text = opt({ label, panelId: panel.id, trigger: trigger || null });
    } else if (opt) {
        text = label != null ? label : panel.dataset.title || "";
    } else {
        text = panel.dataset.title || "";
    }
    titleEl.textContent = text;
}
