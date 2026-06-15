/**
 * Desktop bar: building the menubar + submenu panels (dropdown / dropdown-lg /
 * mega / arbitrarily-nested flyout) and the open/close/position/keyboard
 * behaviour. Panels are edge-aware — top-level panels clamp horizontally and
 * flyouts flip/shift to stay on screen.
 */
import type { Navalone } from "./navalone";
import type { NavaloneItem, NavaloneSubmenu } from "./types";
import { escapeId, uid } from "./dom";
import { buildActions, buildLogo, fillRow } from "./render";
import {
    ancestorPanels,
    desktopRows,
    focusFirstDesktop,
    isDescendantPanel,
    menubarItems,
    rove
} from "./a11y";

/* ------------------------------- Building -------------------------------- */

export function buildBar(nv: Navalone): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "nv-bar";

    nv._hamburger = document.createElement("button");
    nv._hamburger.type = "button";
    nv._hamburger.className = "nv-hamburger";
    nv._hamburger.setAttribute("aria-label", "Open menu");
    nv._hamburger.setAttribute("aria-expanded", "false");
    nv._hamburger.innerHTML = "<span class='nv-burger-bars' aria-hidden='true'></span>";
    bar.appendChild(nv._hamburger);

    const logo = buildLogo(nv);
    if (logo) {
        bar.appendChild(logo);
    }

    nv._menubar = document.createElement("ul");
    nv._menubar.className = "nv-menubar";
    nv._menubar.setAttribute("role", "menubar");
    nv._model.forEach((item, i) => {
        nv._menubar.appendChild(buildBarItem(nv, item, i));
    });
    bar.appendChild(nv._menubar);

    const actions = buildActions(nv, "nv-actions");
    if (actions) {
        bar.appendChild(actions);
    }
    return bar;
}

// A top-level menubar entry. If it has a submenu, build and attach the desktop
// panel and wire trigger <-> panel references.
function buildBarItem(nv: Navalone, item: NavaloneItem, index: number): HTMLElement {
    const li = document.createElement("li");
    li.className = "nv-bar-li";
    li.setAttribute("role", "none");

    const submenu = item.submenu || null;
    const isLink = !submenu && !!item.href;
    const trigger = document.createElement(isLink ? "a" : "button");
    trigger.className = "nv-bar-item";
    trigger.setAttribute("role", "menuitem");
    trigger.tabIndex = index === 0 ? 0 : -1;
    if (isLink) {
        const a = trigger as HTMLAnchorElement;
        a.href = item.href as string;
        if (item.linkTarget) {
            a.target = item.linkTarget;
        }
    } else {
        (trigger as HTMLButtonElement).type = "button";
    }
    if (item.disabled) {
        trigger.classList.add("is-disabled");
        trigger.setAttribute("aria-disabled", "true");
        if (!isLink) {
            (trigger as HTMLButtonElement).disabled = true;
        }
    }

    fillRow(nv, trigger, item, { hasChild: !!submenu, thumbnails: false, arrow: "▾" });
    li.appendChild(trigger);

    if (submenu) {
        trigger.setAttribute("aria-haspopup", "true");
        trigger.setAttribute("aria-expanded", "false");
        const panel = buildDesktopPanel(nv, submenu, 1);
        trigger.setAttribute("aria-controls", panel.id);
        trigger._nvPanel = panel;
        panel._nvTrigger = trigger;
        panel._nvParentPanel = null;
        li.appendChild(panel);
    }
    return li;
}

// Desktop submenu panel. `display` picks the layout; mega uses columns.
function buildDesktopPanel(nv: Navalone, submenu: NavaloneSubmenu, level: number): HTMLElement {
    const panel = document.createElement("div");
    panel.id = uid("nv-d");
    if (submenu.id) {
        nv._desktopPanels[submenu.id] = panel;
    }
    panel.setAttribute("role", "menu");
    panel.dataset.level = String(level);
    if (submenu.title) {
        panel.setAttribute("aria-label", submenu.title);
    }

    const display = submenu.display || "dropdown";
    if (display === "mega" && Array.isArray(submenu.columns)) {
        panel.className = "nv-panel nv-mega";
        submenu.columns.forEach((column) => {
            const col = document.createElement("div");
            col.className = "nv-col";
            if (column.heading) {
                const head = document.createElement("div");
                head.className = "nv-col-head";
                head.textContent = column.heading;
                col.appendChild(head);
            }
            const ul = document.createElement("ul");
            ul.setAttribute("role", "none");
            (column.items || []).forEach((child) => {
                ul.appendChild(buildDesktopRow(nv, child, "mega", level, panel));
            });
            col.appendChild(ul);
            panel.appendChild(col);
        });
    } else {
        panel.className =
            "nv-panel " + (display === "dropdown-lg" ? "nv-dropdown-lg" : "nv-dropdown");
        const ul = document.createElement("ul");
        ul.setAttribute("role", "none");
        (submenu.items || []).forEach((child) => {
            ul.appendChild(buildDesktopRow(nv, child, display, level, panel));
        });
        panel.appendChild(ul);
    }
    return panel;
}

function buildDesktopRow(
    nv: Navalone,
    item: NavaloneItem,
    variant: string,
    level: number,
    parentPanel: HTMLElement
): HTMLElement {
    const li = document.createElement("li");
    li.className = "nv-d-li";
    li.setAttribute("role", "none");

    const submenu = item.submenu || null;
    const isLink = !submenu && !!item.href;
    const row = document.createElement(isLink ? "a" : "button");
    row.className = "nv-d-item";
    row.setAttribute("role", "menuitem");
    row.tabIndex = -1;
    if (isLink) {
        const a = row as HTMLAnchorElement;
        a.href = item.href as string;
        if (item.linkTarget) {
            a.target = item.linkTarget;
        }
    } else {
        (row as HTMLButtonElement).type = "button";
    }
    if (item.disabled) {
        row.classList.add("is-disabled");
        row.setAttribute("aria-disabled", "true");
        if (!isLink) {
            (row as HTMLButtonElement).disabled = true;
        }
    }

    // dropdown-lg and mega surface image/description; plain dropdown is text.
    const rich = variant === "dropdown-lg" || variant === "mega";
    fillRow(nv, row, item, {
        hasChild: !!submenu,
        thumbnails: rich,
        description: rich,
        arrow: submenu ? "›" : null
    });
    li.appendChild(row);

    if (submenu) {
        row.setAttribute("aria-haspopup", "true");
        row.setAttribute("aria-expanded", "false");
        const panel = buildDesktopPanel(nv, submenu, level + 1);
        panel.classList.add("nv-flyout");
        row.setAttribute("aria-controls", panel.id);
        row._nvPanel = panel;
        panel._nvTrigger = row;
        panel._nvParentPanel = parentPanel || null;
        li.appendChild(panel);
    }
    return li;
}

/* ------------------------------- Behaviour ------------------------------- */

export function openDesktop(nv: Navalone, trigger: HTMLElement, panel: HTMLElement): void {
    if (nv._openPanels.indexOf(panel) >= 0) {
        return;
    }
    panel.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    nv._openPanels.push(panel);
    positionPanel(panel, trigger);
    nv._emit("submenuopen", { id: panel.id, trigger, panel });
}

export function closeDesktop(nv: Navalone, panel: HTMLElement): void {
    if (nv._openPanels.indexOf(panel) < 0) {
        return;
    }
    // Close descendants first so aria/state unwinds cleanly.
    nv._openPanels.slice().forEach((p) => {
        if (p !== panel && isDescendantPanel(p, panel)) {
            closeDesktop(nv, p);
        }
    });
    panel.classList.remove("is-open", "nv-flip-x", "nv-flip-y");
    panel.style.left = panel.style.right = panel.style.top = "";
    if (panel._nvTrigger) {
        panel._nvTrigger.setAttribute("aria-expanded", "false");
    }
    nv._openPanels = nv._openPanels.filter((p) => p !== panel);
    nv._emit("submenuclose", { id: panel.id, panel });
}

export function closeDesktopAll(nv: Navalone): void {
    nv._openPanels
        .slice()
        .filter((p) => p._nvParentPanel === null || p._nvParentPanel === undefined)
        .forEach((p) => closeDesktop(nv, p));
    // Belt and braces: anything left (orphaned flyouts) gets closed too.
    nv._openPanels.slice().forEach((p) => closeDesktop(nv, p));
}

export function toggleDesktop(nv: Navalone, trigger: HTMLElement, panel: HTMLElement): void {
    if (nv._openPanels.indexOf(panel) >= 0) {
        closeDesktop(nv, panel);
        return;
    }
    // Close any open panels that are not ancestors of this trigger.
    const keep = ancestorPanels(trigger);
    nv._openPanels.slice().forEach((p) => {
        if (keep.indexOf(p) < 0) {
            closeDesktop(nv, p);
        }
    });
    openDesktop(nv, trigger, panel);
}

// Edge-aware positioning. Top-level panels clamp horizontally within the
// viewport; flyouts open to the side and flip when they would overflow.
export function positionPanel(panel: HTMLElement, trigger: HTMLElement): void {
    const margin = 8;
    panel.style.left = panel.style.right = panel.style.top = "";
    panel.classList.remove("nv-flip-x", "nv-flip-y");

    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    if (panel.classList.contains("nv-flyout")) {
        // Default opens to the right of the parent row.
        let rect = panel.getBoundingClientRect();
        if (rect.right > vw - margin) {
            panel.classList.add("nv-flip-x");
        }
        rect = panel.getBoundingClientRect();
        if (rect.bottom > vh - margin) {
            const shift = vh - margin - rect.bottom;
            panel.style.top = shift + "px";
        }
    } else {
        // Top-level: clamp horizontally relative to the trigger's li.
        const li = trigger.closest(".nv-bar-li") as HTMLElement;
        const liRect = li.getBoundingClientRect();
        const width = panel.offsetWidth;
        let left = 0;
        if (liRect.left + width > vw - margin) {
            left = vw - margin - width - liRect.left;
        }
        if (liRect.left + left < margin) {
            left = margin - liRect.left;
        }
        panel.style.left = left + "px";
    }
}

export function openSubmenuById(nv: Navalone, id: string): void {
    const panel = desktopPanelById(nv, id);
    if (panel && panel._nvTrigger) {
        openDesktop(nv, panel._nvTrigger, panel);
    }
}

export function closeSubmenuById(nv: Navalone, id: string): void {
    const panel = desktopPanelById(nv, id);
    if (panel) {
        closeDesktop(nv, panel);
    }
}

// Accepts the logical submenu id ("products") or a built panel id.
export function desktopPanelById(nv: Navalone, id: string): HTMLElement | null {
    if (nv._desktopPanels[id]) {
        return nv._desktopPanels[id];
    }
    const el = nv.root.querySelector<HTMLElement>("#" + escapeId(id));
    return el && el.classList.contains("nv-panel") ? el : null;
}

// Keep open exactly the chain of panels that the pointer is over, plus open a
// hovered trigger's panel. Closes everything else.
export function hoverSync(nv: Navalone, target: HTMLElement): void {
    const keep: HTMLElement[] = [];
    let p: HTMLElement | null | undefined = target.closest<HTMLElement>(".nv-panel");
    while (p) {
        keep.push(p);
        p = p._nvParentPanel;
    }
    const trig = target.closest<HTMLElement>(".nv-bar-item, .nv-d-item");
    let toOpen: HTMLElement | null = null;
    if (trig && trig._nvPanel && !trig.classList.contains("is-disabled")) {
        toOpen = trig;
        keep.push(trig._nvPanel);
    }
    nv._openPanels.slice().forEach((panel) => {
        if (keep.indexOf(panel) < 0) {
            closeDesktop(nv, panel);
        }
    });
    if (toOpen && toOpen._nvPanel) {
        openDesktop(nv, toOpen, toOpen._nvPanel);
    }
}

export function desktopKeys(
    nv: Navalone,
    e: KeyboardEvent,
    barItem: HTMLElement | null,
    dItem: HTMLElement | null
): void {
    const key = e.key;
    if (barItem) {
        const items = menubarItems(nv._menubar);
        const idx = items.indexOf(barItem);
        if (key === "ArrowRight") {
            e.preventDefault();
            rove(items, idx, 1);
        } else if (key === "ArrowLeft") {
            e.preventDefault();
            rove(items, idx, -1);
        } else if (key === "ArrowDown" || key === "Enter" || key === " ") {
            if (barItem._nvPanel) {
                e.preventDefault();
                openDesktop(nv, barItem, barItem._nvPanel);
                focusFirstDesktop(barItem._nvPanel);
            }
        } else if (key === "Escape") {
            closeDesktopAll(nv);
        }
        return;
    }

    // Inside a desktop panel.
    const item = dItem as HTMLElement;
    const panel = item.closest(".nv-panel") as HTMLElement;
    const rows = desktopRows(panel);
    const idx = rows.indexOf(item);
    if (key === "ArrowDown") {
        e.preventDefault();
        rove(rows, idx, 1);
    } else if (key === "ArrowUp") {
        e.preventDefault();
        rove(rows, idx, -1);
    } else if (key === "ArrowRight") {
        if (item._nvPanel) {
            e.preventDefault();
            openDesktop(nv, item, item._nvPanel);
            focusFirstDesktop(item._nvPanel);
        }
    } else if (key === "ArrowLeft" || key === "Escape") {
        e.preventDefault();
        closeDesktop(nv, panel);
        if (panel._nvTrigger) {
            panel._nvTrigger.tabIndex = 0;
            panel._nvTrigger.focus();
        }
    } else if (key === "Enter" || key === " ") {
        if (item._nvPanel) {
            e.preventDefault();
            openDesktop(nv, item, item._nvPanel);
            focusFirstDesktop(item._nvPanel);
        }
    }
}
