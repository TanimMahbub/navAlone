/**
 * Feature: `display: "mega-tabs"` — the E-commerce mega menu: a left category
 * rail switching right-hand content panes. Each category's own nested
 * `submenu` (a mega grid of columns, or a plain list) renders in the pane the
 * category reveals on hover/focus/click. Depends on `mega` for the pane
 * grids. CSS chunk: styles/mega-tabs.css.
 */
import type { Navalone } from "../kernel/navalone";
import type { NavaloneFeature } from "../kernel/registry";
import type { NavaloneColumn } from "../types";

type AppendColumns = (
    nv: Navalone,
    host: HTMLElement,
    columns: NavaloneColumn[],
    level: number,
    parentPanel: HTMLElement
) => void;

// Reveal one category's pane (and mark its rail button selected). Pure DOM —
// called from hover, click and keyboard.
function activateMegaTab(cat: HTMLElement): void {
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

export const megaTabs: NavaloneFeature = {
    id: "mega-tabs",
    label: "E-commerce mega menu",
    group: "submenu",
    description: "Mega menu with a category rail revealing per-category content panes.",
    deps: ["mega"],
    install(api) {
        return {
            panels: {
                "mega-tabs": (nv, panel, submenu, level) => {
                    panel.className = "nv-panel nv-mega-tabs";
                    const appendColumns = api.provided("mega")
                        .appendColumns as AppendColumns;

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
                        // Show the category's icon/thumbnail in the rail (the
                        // visual anchor of an e-commerce mega), with the chevron
                        // hinting at the content it reveals.
                        api.fillRow(nv, btn, cat, {
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
                                appendColumns(nv, grid, sub.columns, level + 1, panel);
                                pane.appendChild(grid);
                            } else {
                                const rich = subDisplay === "dropdown-lg";
                                pane.appendChild(
                                    api.buildRowList(nv, sub.items || [], rich, level + 1, panel)
                                );
                            }
                        }
                        panes.appendChild(pane);
                    });

                    panel.appendChild(nav);
                    panel.appendChild(panes);
                }
            },
            // Clicking a category reveals its pane (keeps the panel open even
            // with openOn: "click", where there is no hover to switch on). A
            // navigable category (rendered as a link) is left to follow its
            // href.
            onClick: (nv, e, target) => {
                const mtCat = target.closest<HTMLElement>(".nv-mt-cat");
                if (
                    !mtCat ||
                    !nv.root.contains(mtCat) ||
                    mtCat.classList.contains("is-disabled")
                ) {
                    return false;
                }
                if (mtCat.tagName !== "A") {
                    e.preventDefault();
                }
                activateMegaTab(mtCat);
                return true;
            },
            // Hovering a category in the rail reveals its content pane.
            onHover: (_nv, target) => {
                const mtCat = target.closest<HTMLElement>(".nv-mt-cat");
                if (mtCat && !mtCat.classList.contains("is-disabled")) {
                    activateMegaTab(mtCat);
                }
            },
            // Category rail keys: Up/Down move (and reveal) categories;
            // Right/Enter step into the active pane; Left/Escape close back to
            // the bar. Inside a pane, Left returns to the rail instead of
            // closing the whole panel.
            onKeydown: (nv, e, target) => {
                if (nv._mode !== "desktop") {
                    return false;
                }
                const key = e.key;
                const mtCat = target.closest<HTMLElement>(".nv-mt-cat");
                if (mtCat) {
                    const tabs = mtCat.closest<HTMLElement>(".nv-mega-tabs");
                    const panel = mtCat.closest<HTMLElement>(".nv-panel");
                    if (!tabs || !panel) {
                        return true;
                    }
                    const cats = Array.from(
                        tabs.querySelectorAll<HTMLElement>(".nv-mt-cat")
                    ).filter((c) => !c.classList.contains("is-disabled"));
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
                        // Step into the revealed pane (its first enabled row).
                        const row = api.desktopRows(panel)[0];
                        if (row) {
                            e.preventDefault();
                            row.tabIndex = 0;
                            row.focus();
                        }
                    } else if (key === "ArrowLeft" || key === "Escape") {
                        e.preventDefault();
                        api.closeDesktop(nv, panel);
                        if (panel._nvTrigger) {
                            panel._nvTrigger.tabIndex = 0;
                            panel._nvTrigger.focus();
                        }
                    }
                    return true;
                }
                // Inside an e-commerce mega pane, Left returns to the rail.
                if (key === "ArrowLeft") {
                    const dItem = target.closest<HTMLElement>(".nv-d-item");
                    const panel = dItem
                        ? (dItem.closest(".nv-panel") as HTMLElement | null)
                        : null;
                    if (dItem && panel && panel.classList.contains("nv-mega-tabs")) {
                        const cat = panel.querySelector<HTMLElement>(".nv-mt-cat.is-active");
                        if (cat) {
                            e.preventDefault();
                            dItem.tabIndex = -1;
                            cat.tabIndex = 0;
                            cat.focus();
                            return true;
                        }
                    }
                }
                return false;
            },
            // The panel's keyboard entry point is the first rail category.
            focusFirstPanel: (panel) => {
                if (!panel.classList.contains("nv-mega-tabs")) {
                    return false;
                }
                const cat = panel.querySelector<HTMLElement>(".nv-mt-cat:not(.is-disabled)");
                if (cat) {
                    cat.tabIndex = 0;
                    cat.focus();
                }
                return true;
            },
            // Rows of an inactive (hidden) pane stay out of keyboard roving.
            filterDesktopRow: (row) => {
                const pane = row.closest<HTMLElement>(".nv-mt-pane");
                return !pane || pane.classList.contains("is-active");
            },
            // Uncap the rail during natural-width measurement so it counts at
            // its full width.
            measurePanel: (panel, set) => {
                panel
                    .querySelectorAll<HTMLElement>(".nv-mt-nav")
                    .forEach((rail) => set(rail, "max-width", "none"));
            }
        };
    }
};
