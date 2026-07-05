/**
 * Feature: `display: "mega"` — the column-grid mega menu (headed columns of
 * rich rows with thumbnails, descriptions and badges). Publishes its column
 * builder for the e-commerce mega (`mega-tabs`), which reuses the same grid
 * inside its content panes. CSS chunk: styles/mega.css.
 */
import type { Navalone } from "../kernel/navalone";
import type { NavaloneFeature } from "../kernel/registry";
import type { NavaloneColumn } from "../types";

export const mega: NavaloneFeature = {
    id: "mega",
    label: "Mega menu",
    group: "submenu",
    description: "Column-grid mega menu with headings, thumbnails and descriptions.",
    install(api) {
        // Append `.nv-col` columns (heading + rows) into a mega host. Shared by
        // the plain mega grid and each mega-tabs content pane. `parentPanel` is
        // the `.nv-panel` the rows belong to (deeper flyouts chain to it).
        const appendColumns = (
            nv: Navalone,
            host: HTMLElement,
            columns: NavaloneColumn[],
            level: number,
            parentPanel: HTMLElement
        ): void => {
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
                    ul.appendChild(api.buildDesktopRow(nv, child, true, level, parentPanel));
                });
                col.appendChild(ul);
                host.appendChild(col);
            });
        };

        return {
            panels: {
                mega: (nv, panel, submenu, level) => {
                    panel.className = "nv-panel nv-mega";
                    // A mega without explicit columns renders its flat `items`
                    // as a single unlabelled column.
                    const columns = Array.isArray(submenu.columns)
                        ? submenu.columns
                        : [{ items: submenu.items || [] }];
                    appendColumns(nv, panel, columns, level, panel);
                }
            },
            columnDisplays: ["mega"],
            // During natural-width measurement, stop the mega grids wrapping
            // and pin each column to its basis so the measured width is the
            // full side-by-side span (the "looks good" width).
            measurePanel: (panel, set) => {
                const megas: HTMLElement[] = [];
                if (panel.classList.contains("nv-mega")) {
                    megas.push(panel);
                }
                panel.querySelectorAll<HTMLElement>(".nv-mega").forEach((m) => megas.push(m));
                megas.forEach((m) => {
                    set(m, "flex-wrap", "nowrap");
                    Array.from(m.children).forEach((c) => {
                        const col = c as HTMLElement;
                        if (col.classList.contains("nv-col")) {
                            set(col, "flex-grow", "0");
                            set(col, "flex-shrink", "0");
                        }
                    });
                });
            },
            provide: { appendColumns }
        };
    }
};
