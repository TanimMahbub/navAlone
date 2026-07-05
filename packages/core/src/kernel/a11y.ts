/**
 * Pure accessibility / focus helpers. These operate only on the elements passed
 * to them (no plugin state), so they are trivially unit-testable. Feature
 * modules refine two of them through the registry: `desktopRows` (row vetoes)
 * and `focusFirstDesktop` (panel entry points).
 */
import { registry } from "./registry";

/** Move roving tabindex/focus within a list, wrapping at both ends. */
export function rove(list: HTMLElement[], current: number, dir: number): void {
    if (!list.length) {
        return;
    }
    let i = current + dir;
    if (i < 0) {
        i = list.length - 1;
    }
    if (i >= list.length) {
        i = 0;
    }
    if (list[current]) {
        list[current].tabIndex = -1;
    }
    list[i].tabIndex = 0;
    list[i].focus();
}

/** Cycle Tab / Shift+Tab within the drawer (focus trap). */
export function trapTab(drawer: HTMLElement, e: KeyboardEvent): void {
    const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
            "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
        )
    ).filter((el) => el.offsetParent !== null || el === drawer);
    if (!focusable.length) {
        return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
    }
}

/**
 * Focus a preferred element inside the panel, else its first enabled row.
 *
 * `preventScroll` is essential here: during a drill the incoming panel is still
 * transformed off-screen (translateX(±100%)) at the moment we focus into it.
 * Without it the browser scrolls the `.nv-panels` container horizontally to
 * bring the focused row into view, and that scroll persists after the transform
 * settles — leaving the active panel shoved one full width off-screen (a blank
 * drawer body). The slide-in is purely transform-driven, so we never want focus
 * to move the container.
 */
export function focusPanel(panel: HTMLElement, preferred?: HTMLElement | null): void {
    if (preferred && panel.contains(preferred)) {
        preferred.focus({ preventScroll: true });
        return;
    }
    const first = panel.querySelector<HTMLElement>(
        "li > button:not([disabled]):not(.is-disabled), li > a:not(.is-disabled)"
    );
    if (first) {
        first.focus({ preventScroll: true });
    }
}

/**
 * Rows that belong directly to a desktop panel (excludes nested flyout rows).
 * Features can veto rows via `filterDesktopRow` hooks — e.g. the e-commerce
 * mega excludes rows of an inactive (hidden) pane so roving stays in view.
 */
export function desktopRows(panel: HTMLElement): HTMLElement[] {
    return Array.from(panel.querySelectorAll<HTMLElement>(".nv-d-item")).filter((row) => {
        if (row.closest(".nv-panel") !== panel || row.classList.contains("is-disabled")) {
            return false;
        }
        return registry.rowFilters.every((keep) => keep(row));
    });
}

/**
 * Focus (and make tabbable) the entry point of a desktop panel. Features get
 * first refusal via `focusFirstPanel` hooks (e.g. the e-commerce mega focuses
 * its first rail category); the default is the first enabled row.
 */
export function focusFirstDesktop(panel: HTMLElement): void {
    for (const hook of registry.focusFirst) {
        if (hook(panel)) {
            return;
        }
    }
    const first = desktopRows(panel)[0];
    if (first) {
        first.tabIndex = 0;
        first.focus();
    }
}

/** Top-level menubar triggers, in order. */
export function menubarItems(menubar: HTMLElement): HTMLElement[] {
    return Array.from(menubar.querySelectorAll<HTMLElement>(":scope > li > .nv-bar-item"));
}

/** The chain of open-panel ancestors of a trigger (closest first). */
export function ancestorPanels(trigger: HTMLElement): HTMLElement[] {
    const chain: HTMLElement[] = [];
    let p: HTMLElement | null | undefined = trigger.closest<HTMLElement>(".nv-panel");
    while (p) {
        chain.push(p);
        p = p._nvParentPanel;
    }
    return chain;
}

/** Is `panel` nested somewhere beneath `ancestor`? */
export function isDescendantPanel(panel: HTMLElement, ancestor: HTMLElement): boolean {
    let p = panel._nvParentPanel;
    while (p) {
        if (p === ancestor) {
            return true;
        }
        p = p._nvParentPanel;
    }
    return false;
}

/** The visible label text of a row/trigger. */
export function labelOf(el: HTMLElement): string | null {
    const label = el.querySelector(".nv-label");
    return label ? label.textContent : (el.textContent ?? "").replace(/\s*→\s*$/, "").trim();
}
