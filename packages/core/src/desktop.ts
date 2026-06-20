/**
 * Desktop bar: building the menubar + submenu panels (dropdown / dropdown-lg /
 * mega / arbitrarily-nested flyout) and the open/close/position/keyboard
 * behaviour. Panels are edge-aware — top-level panels clamp horizontally and
 * flyouts flip/shift to stay on screen.
 */
import type { Navalone } from "./navalone";
import type { NavaloneColumn, NavaloneItem, NavaloneSubmenu } from "./types";
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

    fillRow(nv, trigger, item, { hasChild: !!submenu, thumbnails: false, arrow: "down" });
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
    if (display === "mega-tabs") {
        // E-commerce mega: a left category rail switching right-hand content panes.
        panel.className = "nv-panel nv-mega-tabs";
        buildMegaTabs(nv, panel, submenu, level);
    } else if (display === "mega" && Array.isArray(submenu.columns)) {
        panel.className = "nv-panel nv-mega";
        appendMegaColumns(nv, panel, submenu.columns, level, panel);
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

// Append `.nv-col` columns (heading + rows) into a mega host. Shared by the
// plain mega grid and each `mega-tabs` content pane. `parentPanel` is the
// `.nv-panel` the rows belong to (so any deeper flyouts chain to it).
function appendMegaColumns(
    nv: Navalone,
    host: HTMLElement,
    columns: NavaloneColumn[],
    level: number,
    parentPanel: HTMLElement
): void {
    (columns || []).forEach((column) => {
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
            ul.appendChild(buildDesktopRow(nv, child, "mega", level, parentPanel));
        });
        col.appendChild(ul);
        host.appendChild(col);
    });
}

// Build the e-commerce mega: a left rail of category buttons (`submenu.items`)
// and a stack of content panes — one per category — of which only the active
// one shows. Hovering / focusing a category reveals its pane. Each category's
// own nested `submenu` provides the pane content (a mega grid or a list).
function buildMegaTabs(
    nv: Navalone,
    panel: HTMLElement,
    submenu: NavaloneSubmenu,
    level: number
): void {
    const nav = document.createElement("div");
    nav.className = "nv-mt-nav";
    nav.setAttribute("role", "none");
    const panes = document.createElement("div");
    panes.className = "nv-mt-panes";

    (submenu.items || []).forEach((cat, i) => {
        const sub = cat.submenu || null;
        const first = i === 0;
        const isLink = !sub && !!cat.href;

        // Left rail button (or link for a navigable category).
        const btn = document.createElement(isLink ? "a" : "button");
        btn.className = "nv-mt-cat" + (first ? " is-active" : "");
        btn.setAttribute("role", "menuitem");
        btn.tabIndex = first ? 0 : -1;
        btn.dataset.mtIndex = String(i);
        if (isLink) {
            const a = btn as HTMLAnchorElement;
            a.href = cat.href as string;
            if (cat.linkTarget) {
                a.target = cat.linkTarget;
            }
        } else {
            (btn as HTMLButtonElement).type = "button";
        }
        if (cat.disabled) {
            btn.classList.add("is-disabled");
            btn.setAttribute("aria-disabled", "true");
            if (!isLink) {
                (btn as HTMLButtonElement).disabled = true;
            }
        }
        // Show the category's icon/thumbnail in the rail (the visual anchor of an
        // e-commerce mega), with the chevron hinting at the content it reveals.
        fillRow(nv, btn, cat, {
            hasChild: !!sub,
            thumbnails: true,
            description: false,
            arrow: sub ? "right" : null
        });
        if (sub) {
            btn.setAttribute("aria-haspopup", "true");
        }
        btn.setAttribute("aria-selected", first ? "true" : "false");
        nav.appendChild(btn);

        // Right content pane fed by the category's own submenu.
        const pane = document.createElement("div");
        pane.className = "nv-mt-pane" + (first ? " is-active" : "");
        pane.dataset.mtIndex = String(i);
        if (sub) {
            const subDisplay = sub.display || "dropdown";
            if (subDisplay === "mega" && Array.isArray(sub.columns)) {
                const grid = document.createElement("div");
                grid.className = "nv-mega nv-mt-grid";
                appendMegaColumns(nv, grid, sub.columns, level + 1, panel);
                pane.appendChild(grid);
            } else {
                const variant = subDisplay === "dropdown-lg" ? "dropdown-lg" : "dropdown";
                const ul = document.createElement("ul");
                ul.setAttribute("role", "none");
                (sub.items || []).forEach((child) => {
                    ul.appendChild(buildDesktopRow(nv, child, variant, level + 1, panel));
                });
                pane.appendChild(ul);
            }
        }
        panes.appendChild(pane);
    });

    panel.appendChild(nav);
    panel.appendChild(panes);
}

// Reveal one category's pane (and mark its rail button selected). Pure DOM —
// called from hover, click and keyboard.
export function activateMegaTab(cat: HTMLElement): void {
    const panel = cat.closest<HTMLElement>(".nv-mega-tabs");
    if (!panel) {
        return;
    }
    const idx = cat.dataset.mtIndex;
    panel.querySelectorAll<HTMLElement>(".nv-mt-cat").forEach((c) => {
        const active = c === cat;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-selected", active ? "true" : "false");
    });
    panel.querySelectorAll<HTMLElement>(".nv-mt-pane").forEach((p) => {
        p.classList.toggle("is-active", p.dataset.mtIndex === idx);
    });
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
        arrow: submenu ? "right" : null
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
    // Only flip the open state — leave the resolved position (left/top, flip-x,
    // below, scroll cap) untouched so the panel fades out exactly where it sits.
    // Stripping those synchronously made the still-visible panel jump mid-fade.
    // positionPanel() fully re-resets everything when the panel is next opened.
    panel.classList.remove("is-open");
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
// viewport; flyouts open to the side, flip when they would overflow, and drop
// in-flow below their parent row when there is no room on either side. Any
// panel that would run off the bottom of the screen is height-capped to scroll
// internally so it always fits.
export function positionPanel(panel: HTMLElement, trigger: HTMLElement): void {
    const margin = 8;
    panel.style.left = panel.style.right = panel.style.top = panel.style.maxHeight = "";
    panel.classList.remove("nv-flip-x", "nv-flip-y", "nv-flyout-below", "nv-scroll");

    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    if (panel.classList.contains("nv-flyout")) {
        // Default opens to the right of the parent row.
        let rect = panel.getBoundingClientRect();
        if (rect.right > vw - margin) {
            // No room on the right — try opening to the left.
            panel.classList.add("nv-flip-x");
            rect = panel.getBoundingClientRect();
            if (rect.left < margin) {
                // No room on either side — drill in place: drop the nested panel
                // in-flow below its parent row instead of flying off-screen.
                panel.classList.remove("nv-flip-x");
                panel.classList.add("nv-flyout-below");
                // The now in-flow panel grew its ancestor panels; re-cap them so
                // they keep fitting the viewport.
                capAncestors(panel, vh, margin);
            }
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

    capVertical(panel, vh, margin);
}

// Keep a panel within the viewport's height: shift a side-flyout up first, then
// cap the height (scrolling internally) if it still runs past the bottom edge.
function capVertical(panel: HTMLElement, vh: number, margin: number): void {
    let rect = panel.getBoundingClientRect();
    const sideFlyout =
        panel.classList.contains("nv-flyout") &&
        !panel.classList.contains("nv-flyout-below");
    if (sideFlyout && rect.bottom > vh - margin) {
        panel.style.top = vh - margin - rect.bottom + "px";
        rect = panel.getBoundingClientRect();
    }
    const avail = vh - margin - rect.top;
    if (rect.height > avail + 1) {
        panel.style.maxHeight = Math.max(avail, 80) + "px";
        panel.classList.add("nv-scroll");
    }
}

// Re-cap every ancestor panel after an in-flow (below) flyout grows them.
function capAncestors(panel: HTMLElement, vh: number, margin: number): void {
    let p = panel._nvParentPanel;
    while (p) {
        capVertical(p, vh, margin);
        p = p._nvParentPanel;
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
    const overPanel = target.closest<HTMLElement>(".nv-panel");
    const trig = target.closest<HTMLElement>(".nv-bar-item, .nv-d-item");
    // Neutral area (the small gaps between a trigger and its panel, the logo,
    // bar padding, etc.): don't close anything. Closing here is what made the
    // dropdowns "twitchy" — the pointer briefly crossed dead space on its way to
    // the panel and the panel vanished. Leaving the bar entirely is handled by
    // the (debounced) mouseleave on the root instead.
    if (!overPanel && !trig) {
        return;
    }

    // Hovering a category in the e-commerce rail reveals its content pane.
    const mtCat = target.closest<HTMLElement>(".nv-mt-cat");
    if (mtCat && !mtCat.classList.contains("is-disabled")) {
        activateMegaTab(mtCat);
    }

    const keep: HTMLElement[] = [];
    let p: HTMLElement | null | undefined = overPanel;
    while (p) {
        keep.push(p);
        p = p._nvParentPanel;
    }
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
    dItem: HTMLElement | null,
    mtCat: HTMLElement | null
): void {
    const key = e.key;

    // Category rail of the e-commerce mega: Up/Down move (and reveal) categories;
    // Right/Enter step into the active pane; Left/Escape close back to the bar.
    if (mtCat) {
        const tabs = mtCat.closest<HTMLElement>(".nv-mega-tabs");
        const panel = mtCat.closest<HTMLElement>(".nv-panel");
        if (!tabs || !panel) {
            return;
        }
        const cats = Array.from(tabs.querySelectorAll<HTMLElement>(".nv-mt-cat")).filter(
            (c) => !c.classList.contains("is-disabled")
        );
        const idx = cats.indexOf(mtCat);
        if (key === "ArrowDown" || key === "ArrowUp") {
            e.preventDefault();
            let n = idx + (key === "ArrowDown" ? 1 : -1);
            if (n < 0) {
                n = cats.length - 1;
            }
            if (n >= cats.length) {
                n = 0;
            }
            mtCat.tabIndex = -1;
            cats[n].tabIndex = 0;
            cats[n].focus();
            activateMegaTab(cats[n]);
        } else if (key === "ArrowRight" || key === "Enter" || key === " ") {
            // Step into the revealed pane (first enabled row of the active pane).
            const row = desktopRows(panel)[0];
            if (row) {
                e.preventDefault();
                row.tabIndex = 0;
                row.focus();
            }
        } else if (key === "ArrowLeft" || key === "Escape") {
            e.preventDefault();
            closeDesktop(nv, panel);
            if (panel._nvTrigger) {
                panel._nvTrigger.tabIndex = 0;
                panel._nvTrigger.focus();
            }
        }
        return;
    }

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
    } else if (key === "ArrowLeft") {
        e.preventDefault();
        // Inside an e-commerce mega pane, Left returns to the category rail
        // rather than closing the whole panel.
        const cat = panel.classList.contains("nv-mega-tabs")
            ? panel.querySelector<HTMLElement>(".nv-mt-cat.is-active")
            : null;
        if (cat) {
            item.tabIndex = -1;
            cat.tabIndex = 0;
            cat.focus();
        } else {
            closeDesktop(nv, panel);
            if (panel._nvTrigger) {
                panel._nvTrigger.tabIndex = 0;
                panel._nvTrigger.focus();
            }
        }
    } else if (key === "Escape") {
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
