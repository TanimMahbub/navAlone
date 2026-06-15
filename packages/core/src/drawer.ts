/**
 * Off-canvas drawer + the Phase-1 sliding drill-down hosted inside `.nv-panels`:
 * building the drawer chrome and drill-down panels, the open/close lifecycle,
 * drill navigation (navigateTo / back) and the animated-height bookkeeping
 * (`--mmHeight`, the no-transition load-animation fix).
 */
import type { Navalone } from "./navalone";
import type { NavaloneColumn, NavaloneItem } from "./types";
import { durationMs, uid } from "./dom";
import { buildActions, buildLogo, fillRow } from "./render";
import { focusPanel, labelOf } from "./a11y";

/* ------------------------------- Building -------------------------------- */

export function buildDrawer(nv: Navalone): HTMLElement {
    const drawer = document.createElement("aside");
    drawer.id = uid("nv-drawer");
    drawer.className = "nv-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", nv.options.drawerLabel || "Menu");
    drawer.tabIndex = -1;

    const head = document.createElement("div");
    head.className = "nv-drawer-head";
    const logo = buildLogo(nv, "nv-logo--drawer");
    if (logo) {
        head.appendChild(logo);
    }
    nv._drawerClose = document.createElement("button");
    nv._drawerClose.type = "button";
    nv._drawerClose.className = "nv-drawer-close";
    nv._drawerClose.setAttribute("aria-label", "Close menu");
    nv._drawerClose.innerHTML = "<span aria-hidden='true'>&times;</span>";
    head.appendChild(nv._drawerClose);
    drawer.appendChild(head);

    // The drill-down container: this is where the Phase-1 sliding panels live
    // and where the animated height (--mmHeight) is applied.
    nv._panelHost = document.createElement("div");
    nv._panelHost.className = "nv-panels";
    nv._panelHost.id = uid("nv-panelhost");
    renderConfig(nv, nv._model).forEach((panel) => {
        nv._panelHost.appendChild(panel);
    });
    drawer.appendChild(nv._panelHost);

    const actions = buildActions(nv, "nv-actions nv-actions--drawer");
    if (actions) {
        drawer.appendChild(actions);
    }
    return drawer;
}

/* ------------------ Mobile drill-down rendering (Phase 1) ----------------- */

export function renderConfig(nv: Navalone, items: NavaloneItem[]): HTMLElement[] {
    const panels: HTMLElement[] = [];
    const root = document.createElement("div");
    root.className = "menu-level level-1";
    root.id = nv.options.rootId || uid("nv-main");
    root.appendChild(buildList(nv, items));
    panels.push(root);
    buildSubPanels(nv, items, 2, panels);
    return panels;
}

function buildList(nv: Navalone, items: NavaloneItem[]): HTMLElement {
    const ul = document.createElement("ul");
    items.forEach((item) => ul.appendChild(buildRow(nv, item)));
    return ul;
}

function buildRow(nv: Navalone, item: NavaloneItem): HTMLElement {
    const li = document.createElement("li");
    const submenu = item.submenu || null;
    if (submenu && !submenu.id) {
        submenu.id = uid("nv-panel");
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

    fillRow(nv, el, item, {
        hasChild: !!targetId,
        thumbnails: nv.options.showThumbnails,
        description: true,
        arrow: "→"
    });
    el.dataset.nvReady = "1";
    li.appendChild(el);
    return li;
}

function buildSubPanels(
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
        panel.appendChild(buildHeader());

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
                ul.appendChild(buildRow(nv, child));
                childItems.push(child);
            });
        });

        panel.appendChild(ul);
        panels.push(panel);
        buildSubPanels(nv, childItems, level + 1, panels);
    });
}

function buildHeader(): HTMLElement {
    const header = document.createElement("div");
    header.className = "menu-header";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "back-button";
    back.textContent = "← Back";
    back.setAttribute("aria-label", "Back");

    const title = document.createElement("span");
    title.className = "menu-title";

    header.appendChild(back);
    header.appendChild(title);
    return header;
}

export function setupPanels(nv: Navalone): void {
    nv._panels = Array.from(nv._panelHost.querySelectorAll<HTMLElement>(".menu-level"));
    if (!nv._panels.length) {
        throw new Error("Navalone: no .menu-level panels found");
    }
    nv._panels.forEach((panel) => {
        if (!panel.id) {
            panel.id = uid("nv-panel");
        }
        panel.setAttribute("role", "menu");
        if (panel.dataset.title) {
            panel.setAttribute("aria-label", panel.dataset.title);
        }
        panel.querySelectorAll("ul").forEach((ul) => ul.setAttribute("role", "none"));
        panel.querySelectorAll("li").forEach((li) => {
            if (!li.getAttribute("role")) {
                li.setAttribute("role", "none");
            }
        });
    });
    nv._rootPanel = nv._panels[0];
    nv._stack = [nv._rootPanel.id];
}

// Preserve the load-animation behaviour EXACTLY: set the initial height with
// transitions suppressed (so the container does not animate from 0), measured
// after web fonts settle, then re-enable on a double requestAnimationFrame.
export function initHeight(nv: Navalone): void {
    nv._panelHost.classList.add("no-transition");
    nv._rootPanel.classList.add("active-menu");
    nv._panels.forEach((panel) => setHiddenState(panel, panel !== nv._rootPanel));

    const settle = () => {
        updateHeight(nv, nv._rootPanel);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!nv._destroyed) {
                    nv._panelHost.classList.remove("no-transition");
                }
            });
        });
    };

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(settle);
    } else {
        settle();
    }
}

/* --------------------------- Drill navigation ---------------------------- */

export function navigateTo(
    nv: Navalone,
    panelId: string,
    trigger?: HTMLElement | null
): boolean {
    const target = panelById(nv, panelId);
    const current = activePanel(nv);
    if (!target || !current || target === current) {
        return false;
    }

    target.style.transform = "translateX(0)";
    current.style.transform = "translateX(-100%)";

    const label = trigger ? labelOf(trigger) : null;
    applyTitle(nv, target, label, trigger ?? null);

    target.dataset.previous = current.id;
    if (trigger) {
        nv._triggers.set(target.id, trigger);
        trigger.setAttribute("aria-expanded", "true");
    }

    nv._stack.push(target.id);
    setActive(nv, target);
    focusPanel(target);

    nv._emit("navigate", { from: current.id, to: target.id, trigger: trigger ?? null });
    return true;
}

export function back(nv: Navalone): boolean {
    if (nv._stack.length <= 1) {
        return false;
    }

    const currentId = nv._stack.pop() as string;
    const current = panelById(nv, currentId);
    const previous = panelById(nv, nv._stack[nv._stack.length - 1]);
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

    setActive(nv, previous);
    focusPanel(previous, trigger);

    nv._emit("back", { from: currentId, to: previous.id });
    return true;
}

/* ----------------------------- Open / close ------------------------------ */

export function openDrawer(nv: Navalone): void {
    if (nv._drawerOpen) {
        return;
    }
    resetToRoot(nv);
    nv._drawerOpen = true;
    nv._lastFocus = document.activeElement as HTMLElement | null;
    nv._backdrop.hidden = false;
    nv.root.classList.add("nv-open");
    nv._drawer.setAttribute("aria-modal", "true");
    if (nv._mode === "mobile") {
        document.body.classList.add("nv-scroll-lock");
    }
    if (nv._hamburger) {
        nv._hamburger.setAttribute("aria-expanded", "true");
        nv._hamburger.setAttribute("aria-label", "Close menu");
    }
    updateHeight(nv, activePanel(nv) || nv._rootPanel);
    requestAnimationFrame(() => {
        if (!nv._destroyed && nv._drawerOpen) {
            focusPanel(nv._rootPanel);
        }
    });
    nv._emit("open", {});
}

export function closeDrawer(nv: Navalone): void {
    if (!nv._drawerOpen) {
        return;
    }
    nv._drawerOpen = false;
    nv.root.classList.remove("nv-open");
    document.body.classList.remove("nv-scroll-lock");
    if (nv._hamburger) {
        nv._hamburger.setAttribute("aria-expanded", "false");
        nv._hamburger.setAttribute("aria-label", "Open menu");
    }
    // Hide the backdrop after the slide-out transition completes.
    const dur = durationMs(nv.options.animationDuration);
    const backdrop = nv._backdrop;
    window.setTimeout(() => {
        if (!nv._destroyed && !nv._drawerOpen) {
            backdrop.hidden = true;
        }
    }, dur);
    if (nv._hamburger && nv._mode === "mobile") {
        nv._hamburger.focus();
    } else if (nv._lastFocus && nv._lastFocus.focus) {
        nv._lastFocus.focus();
    }
    nv._emit("close", {});
}

/* ------------------------------- Helpers --------------------------------- */

export function resetToRoot(nv: Navalone): void {
    nv._panels.forEach((panel) => {
        panel.style.transform = "";
    });
    nv._triggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
    nv._triggers.clear();
    nv._stack = [nv._rootPanel.id];
    setActive(nv, nv._rootPanel);
}

export function setActive(nv: Navalone, panel: HTMLElement): void {
    const previous = nv._panelHost.querySelector(".active-menu");
    if (previous) {
        previous.classList.remove("active-menu");
    }
    panel.classList.add("active-menu");
    nv._panels.forEach((p) => setHiddenState(p, p !== panel));
    requestAnimationFrame(() => updateHeight(nv, panel));
}

export function setHiddenState(panel: HTMLElement, hidden: boolean): void {
    panel.setAttribute("aria-hidden", hidden ? "true" : "false");
    // `inert` keeps off-screen panels out of the tab order and pointer path;
    // harmless where unsupported.
    panel.inert = hidden;
}

export function updateHeight(nv: Navalone, panel: HTMLElement): void {
    // A queued rAF can fire after destroy(); don't re-mutate the DOM.
    if (nv._destroyed) {
        return;
    }
    nv._panelHost.style.setProperty("--mmHeight", panel.scrollHeight + "px");
}

export function applyTitle(
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

export function remeasure(nv: Navalone): void {
    nv._panelHost.classList.add("no-transition");
    updateHeight(nv, activePanel(nv) || nv._rootPanel);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (!nv._destroyed) {
                nv._panelHost.classList.remove("no-transition");
            }
        });
    });
}

export function activePanel(nv: Navalone): HTMLElement | null {
    return nv._panelHost.querySelector<HTMLElement>(".active-menu");
}

export function panelById(nv: Navalone, id: string): HTMLElement | null {
    for (let i = 0; i < nv._panels.length; i++) {
        if (nv._panels[i].id === id) {
            return nv._panels[i];
        }
    }
    return null;
}
