/**
 * Feature: nested side-flyout submenus — a desktop panel row that opens its
 * own child panel to the side, arbitrarily deep. Owns the edge-aware flyout
 * positioning: open right, flip left when there is no room, and as a last
 * resort drop in-flow below the parent row ("drill in place"). CSS chunk:
 * styles/flyout.css.
 */
import type { NavaloneFeature } from "../kernel/registry";

export const flyout: NavaloneFeature = {
    id: "flyout",
    label: "Multi-level flyout",
    group: "submenu",
    description: "Nested submenus that fly out beside their parent row, any depth.",
    install(api) {
        return {
            attachFlyout: (nv, row, li, submenu, level, parentPanel) => {
                row.setAttribute("aria-haspopup", "true");
                row.setAttribute("aria-expanded", "false");
                const panel = api.buildDesktopPanel(nv, submenu, level + 1);
                panel.classList.add("nv-flyout");
                row.setAttribute("aria-controls", panel.id);
                row._nvPanel = panel;
                panel._nvTrigger = row;
                panel._nvParentPanel = parentPanel || null;
                li.appendChild(panel);
            },
            positionPanel: (panel, _trigger, ctx) => {
                if (!panel.classList.contains("nv-flyout")) {
                    return false;
                }
                panel.classList.remove("nv-flip-x", "nv-flip-y", "nv-flyout-below");
                // Default opens to the right of the parent row.
                let rect = panel.getBoundingClientRect();
                if (rect.right > ctx.vw - ctx.margin) {
                    // No room on the right — try opening to the left.
                    panel.classList.add("nv-flip-x");
                    rect = panel.getBoundingClientRect();
                    if (rect.left < ctx.margin) {
                        // No room on either side — drill in place: drop the
                        // nested panel in-flow below its parent row instead of
                        // flying off-screen.
                        panel.classList.remove("nv-flip-x");
                        panel.classList.add("nv-flyout-below");
                        // The now in-flow panel grew its ancestor panels;
                        // re-cap them so they keep fitting the viewport.
                        ctx.capAncestors(panel);
                    }
                }
                // A side flyout may shift up to stay on screen; an in-flow
                // (below) flyout only height-caps.
                ctx.capVertical(panel, !panel.classList.contains("nv-flyout-below"));
                return true;
            }
        };
    }
};
