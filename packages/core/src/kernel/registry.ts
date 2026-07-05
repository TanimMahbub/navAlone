/**
 * The feature registry — the seam between the always-present kernel and the
 * optional feature modules (submenu flavors, mobile drawer engines, responsive
 * strategies and the smart-position behaviour).
 *
 * A feature is a plain object with an `install(api)` function that returns the
 * hooks it contributes. `Navalone.use(feature)` merges those hooks in here and
 * the kernel consults the registry at build/behaviour time, throwing a clear
 * "feature not included" error when a config asks for something that was never
 * registered (instead of silently rendering nothing).
 *
 * The registry is static — shared by the class, not per instance — so that
 * standalone IIFE chunks can self-register against the global kernel:
 * `window.Navalone.use(feature)`.
 */
import type { Navalone } from "./navalone";
import type { NavaloneItem, NavaloneSubmenu } from "../types";
import type { FillRowOptions } from "./render";

/** Fills the body of a just-created desktop panel for one `display` value. */
export type PanelBuilder = (
    nv: Navalone,
    panel: HTMLElement,
    submenu: NavaloneSubmenu,
    level: number
) => void;

/** Builds + attaches a nested (flyout) panel to a desktop panel row. */
export type AttachFlyout = (
    nv: Navalone,
    row: HTMLElement,
    li: HTMLElement,
    submenu: NavaloneSubmenu,
    level: number,
    parentPanel: HTMLElement
) => void;

/** Everything a mobile drawer engine contributes beyond its click handling. */
export interface DrawerEngine {
    /** Extra class for the `.nv-panels` host (e.g. `"nv-acc"`). */
    hostClass?: string;
    /** Build the panels that live inside the drawer's `.nv-panels` host. */
    render(nv: Navalone): HTMLElement[];
    /** Collapse back to the root state (drawer re-open, mode growth). */
    reset(nv: Navalone): void;
    navigateTo?(nv: Navalone, panelId: string, trigger: HTMLElement | null): boolean;
    back?(nv: Navalone): boolean;
    /** Filter the ArrowUp/Down focus candidates inside the drawer. */
    filterFocusable?(nv: Navalone, items: HTMLElement[]): HTMLElement[];
}

/** Passed to `positionPanel` hooks so they can share the kernel's capping. */
export interface PositionContext {
    vw: number;
    vh: number;
    margin: number;
    /** Height-cap a panel; `allowShift` lets a side panel shift up first. */
    capVertical(panel: HTMLElement, allowShift: boolean): void;
    /** Re-cap every ancestor panel after an in-flow child grew them. */
    capAncestors(panel: HTMLElement): void;
}

/** Save-and-restore inline style setter used during natural-width measuring. */
export type StyleSetter = (el: HTMLElement, prop: string, value: string) => void;

/** The hooks a feature's `install()` can return. All optional. */
export interface FeatureHooks {
    /** Desktop panel builders, keyed by `display` value. */
    panels?: Record<string, PanelBuilder>;
    /** `display` values whose declarative markup parses into `columns`. */
    columnDisplays?: string[];
    /** Mobile drawer engines, keyed by `mobileMenu` value. */
    drawers?: Record<string, DrawerEngine>;
    /** Responsive-mode initialisers, keyed by `responsive` value. */
    responsive?: Record<string, (nv: Navalone) => void>;
    /** Position initialisers keyed by `position` value (e.g. `"smart"`). */
    positions?: Record<string, (nv: Navalone) => void>;
    attachFlyout?: AttachFlyout;
    /** Delegated root click. Return `true` when the event was handled. */
    onClick?: (nv: Navalone, e: Event, target: HTMLElement) => boolean;
    /** Delegated root keydown. Return `true` when the event was handled. */
    onKeydown?: (nv: Navalone, e: KeyboardEvent, target: HTMLElement) => boolean;
    /** Desktop hover sync (only called in `openOn: "hover"` desktop mode). */
    onHover?: (nv: Navalone, target: HTMLElement) => void;
    /** Position a just-opened desktop panel. Return `true` when handled. */
    positionPanel?: (panel: HTMLElement, trigger: HTMLElement, ctx: PositionContext) => boolean;
    /** Temporarily widen a closed panel for natural-width measurement. */
    measurePanel?: (panel: HTMLElement, set: StyleSetter) => void;
    /** Focus the entry point of a desktop panel. Return `true` when handled. */
    focusFirstPanel?: (panel: HTMLElement) => boolean;
    /** Veto rows from a desktop panel's keyboard roving (return false = skip). */
    filterDesktopRow?: (row: HTMLElement) => boolean;
    /** Helpers published for dependent features (`api.provided(id)`). */
    provide?: Record<string, unknown>;
}

/** A self-contained Navalone feature module. */
export interface NavaloneFeature {
    id: string;
    /** Human label/description surfaced in the Studio manifest. */
    label?: string;
    description?: string;
    /** Studio option group: "submenu" | "drawer" | "responsive" | "position". */
    group?: string;
    /** Feature ids that must be registered before this one. */
    deps?: string[];
    install(api: NavaloneKernelApi): FeatureHooks | void;
}

/** The kernel surface handed to `feature.install()`. */
export interface NavaloneKernelApi {
    registry: Registry;
    /** Helpers published by an already-registered feature. */
    provided(featureId: string): Record<string, unknown>;
    /* dom */
    uid(prefix: string): string;
    escapeId(id: string): string;
    toCssLength(value: string | number): string;
    durationMs(value: string | number | null): number;
    /* shared row/chrome rendering */
    chevronSvg(dir: "down" | "right" | "left"): string;
    fillRow(nv: Navalone, el: HTMLElement, item: NavaloneItem, opts: FillRowOptions): void;
    /* desktop panels */
    buildDesktopPanel(nv: Navalone, submenu: NavaloneSubmenu, level: number): HTMLElement;
    buildRowList(
        nv: Navalone,
        items: NavaloneItem[],
        rich: boolean,
        level: number,
        parentPanel: HTMLElement
    ): HTMLElement;
    buildDesktopRow(
        nv: Navalone,
        item: NavaloneItem,
        rich: boolean,
        level: number,
        parentPanel: HTMLElement
    ): HTMLElement;
    openDesktop(nv: Navalone, trigger: HTMLElement, panel: HTMLElement): void;
    closeDesktop(nv: Navalone, panel: HTMLElement): void;
    closeDesktopAll(nv: Navalone): void;
    desktopRows(panel: HTMLElement): HTMLElement[];
    focusFirstDesktop(panel: HTMLElement): void;
    rove(list: HTMLElement[], current: number, dir: number): void;
    /* drawer */
    focusPanel(panel: HTMLElement, preferred?: HTMLElement | null): void;
    labelOf(el: HTMLElement): string | null;
    setActive(nv: Navalone, panel: HTMLElement): void;
    setHiddenState(panel: HTMLElement, hidden: boolean): void;
    updateHeight(nv: Navalone, panel: HTMLElement): void;
    activePanel(nv: Navalone): HTMLElement | null;
    panelById(nv: Navalone, id: string): HTMLElement | null;
}

export interface Registry {
    features: Record<string, NavaloneFeature>;
    panels: Record<string, PanelBuilder>;
    columnDisplays: string[];
    drawers: Record<string, DrawerEngine>;
    responsive: Record<string, (nv: Navalone) => void>;
    positions: Record<string, (nv: Navalone) => void>;
    attachFlyout: AttachFlyout | null;
    click: Array<NonNullable<FeatureHooks["onClick"]>>;
    keydown: Array<NonNullable<FeatureHooks["onKeydown"]>>;
    hover: Array<NonNullable<FeatureHooks["onHover"]>>;
    positioners: Array<NonNullable<FeatureHooks["positionPanel"]>>;
    measurers: Array<NonNullable<FeatureHooks["measurePanel"]>>;
    focusFirst: Array<NonNullable<FeatureHooks["focusFirstPanel"]>>;
    rowFilters: Array<NonNullable<FeatureHooks["filterDesktopRow"]>>;
    provided: Record<string, Record<string, unknown>>;
}

export const registry: Registry = {
    features: {},
    panels: {},
    columnDisplays: [],
    drawers: {},
    responsive: {},
    positions: {},
    attachFlyout: null,
    click: [],
    keydown: [],
    hover: [],
    positioners: [],
    measurers: [],
    focusFirst: [],
    rowFilters: [],
    provided: {}
};

/** A consistent, actionable error for configs that need an absent feature. */
export function featureError(what: string, featureId: string): Error {
    return new Error(
        "Navalone: " +
            what +
            ' requires the "' +
            featureId +
            '" feature, which is not included in this build. Import it from ' +
            '"navalone/features/' +
            featureId +
            '" and register it with Navalone.use(...), or include its chunk ' +
            "after the kernel."
    );
}
