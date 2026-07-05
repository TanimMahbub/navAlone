/**
 * Feature: `display: "dropdown-lg"` — the wide dropdown variant whose rows
 * surface thumbnails and descriptions. CSS chunk: styles/dropdown-lg.css.
 */
import type { NavaloneFeature } from "../kernel/registry";

export const dropdownLg: NavaloneFeature = {
    id: "dropdown-lg",
    label: "Large dropdown",
    group: "submenu",
    description: "Wide dropdown submenu with thumbnails and descriptions.",
    install(api) {
        return {
            panels: {
                "dropdown-lg": (nv, panel, submenu, level) => {
                    panel.className = "nv-panel nv-dropdown-lg";
                    panel.appendChild(
                        api.buildRowList(nv, submenu.items || [], true, level, panel)
                    );
                }
            }
        };
    }
};
