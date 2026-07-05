/**
 * Feature: `display: "dropdown"` — the simple desktop submenu panel (a plain
 * text list). CSS chunk: styles/dropdown.css.
 */
import type { NavaloneFeature } from "../kernel/registry";

export const dropdown: NavaloneFeature = {
    id: "dropdown",
    label: "Dropdown",
    group: "submenu",
    description: "Simple dropdown submenu panel (plain text list).",
    install(api) {
        return {
            panels: {
                dropdown: (nv, panel, submenu, level) => {
                    panel.className = "nv-panel nv-dropdown";
                    panel.appendChild(
                        api.buildRowList(nv, submenu.items || [], false, level, panel)
                    );
                }
            }
        };
    }
};
