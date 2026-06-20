/**
 * Public type definitions for Navalone — the data contract, options, event
 * detail payloads and the resolved-options shape. These are authoring-only and
 * compiled away; vanilla `<script>` consumers never see them.
 */

export type NavaloneDisplay = "dropdown" | "dropdown-lg" | "mega" | "mega-tabs";
export type NavaloneMenuAlign = "left" | "center" | "right";
export type NavaloneOpenOn = "hover" | "click";
export type NavaloneDrawerSide = "left" | "right";
/**
 * How submenus behave inside the mobile drawer:
 *   - `"drilldown"` (default): tapping a row slides to a new panel (the
 *     app-style sliding drill-down), with a back button to return.
 *   - `"accordion"`: tapping a row expands its submenu inline on the same
 *     screen; no sliding, no back button.
 */
export type NavaloneMobileMenu = "drilldown" | "accordion";
/**
 * How the menu bar is positioned on the page:
 *   - `"fixed"` (default): pinned to the top of the viewport from the start, so
 *     it always stays on top as the page scrolls.
 *   - `"sticky"`: sits in normal document flow (so it can start a little down
 *     from the top — below a header strip with phone/email/social, say) and pins
 *     to the top once you scroll to its position.
 *   - `"smart"`: like `"sticky"`, but after you scroll down a while it slides up
 *     out of view, and reappears the moment you scroll back up (auto-hide).
 *   - `"static"`: stays in normal flow and scrolls away with the page — never
 *     pinned.
 */
export type NavalonePosition = "fixed" | "sticky" | "smart" | "static";
/**
 * How the bar decides when to collapse from the desktop layout to the mobile
 * drawer:
 *   - `"dynamic"` (default): content-aware. The center menu's real width is
 *     measured and compared against the space left between the logo and the
 *     right-side buttons — regardless of screen size. The first time the menu no
 *     longer fits it is *condensed* (smaller font, tighter gaps/padding); if it
 *     still doesn't fit it *collapses* to the hamburger drawer. No breakpoint to
 *     guess at — it folds exactly when it would otherwise overlap.
 *   - `"static"`: classic, breakpoint-driven. The bar collapses at `breakpoint`
 *     (and optionally condenses at `condenseBreakpoint`), independent of how much
 *     menu content there is.
 */
export type NavaloneResponsive = "dynamic" | "static";

/** A column inside a mega-menu submenu. Flattens to a group on mobile. */
export interface NavaloneColumn {
    heading?: string;
    items?: NavaloneItem[];
}

/**
 * A nested panel. Use `items` for dropdowns/flyouts and the e-commerce
 * `"mega-tabs"` rail, `columns` for the `"mega"` grid.
 *
 * For `display: "mega-tabs"` (the "E-commerce mega menu") each entry in `items`
 * is a *category*: its `label`/`icon` becomes a button in the left rail, and its
 * own nested `submenu` (a `"mega"` grid of columns, or a plain list) renders in
 * the right-hand pane that the category reveals on hover/focus. The same data
 * collapses to the mobile drawer as a normal drill-down (tap a category → its
 * columns flatten to grouped rows).
 */
export interface NavaloneSubmenu {
    id?: string;
    title?: string;
    /** Desktop presentation hint. Defaults to `"dropdown"`. */
    display?: NavaloneDisplay;
    /** Rows for dropdowns/flyouts; categories for the `"mega-tabs"` rail. */
    items?: NavaloneItem[];
    /** Columns for the `"mega"` grid. */
    columns?: NavaloneColumn[];
}

/** A single menu entry. The same item drives desktop and mobile. */
export interface NavaloneItem {
    label?: string;
    /** Renders the row as a link (when it has no submenu/target). */
    href?: string;
    /** `target` attribute for link rows, e.g. `"_blank"`. */
    linkTarget?: string;
    /** Id of an existing declarative panel to drill into (mobile). */
    target?: string;
    submenu?: NavaloneSubmenu;
    /** Glyph/emoji shown when there is no `image`. */
    icon?: string;
    /** Thumbnail URL shown in the row (mobile, when `showThumbnails`). */
    image?: string;
    imageAlt?: string;
    /** Secondary line (desktop metadata, also rendered on mobile). */
    description?: string;
    /** Small pill, e.g. a count or `"New"`. */
    badge?: string;
    disabled?: boolean;
}

export interface NavaloneLogoConfig {
    text?: string;
    img?: string;
    alt?: string;
    href?: string;
}

export type NavaloneLogo = string | NavaloneLogoConfig;

export interface NavaloneButton {
    label?: string;
    href?: string;
    icon?: string;
    /** e.g. `"primary"` for a filled CTA. */
    variant?: string;
    linkTarget?: string;
}

export interface NavaloneTitleContext {
    label: string | null;
    panelId: string;
    trigger: HTMLElement | null;
}

/** `true` derives the panel title from the trigger; or pass a formatter. */
export type NavaloneTitleOption = boolean | ((ctx: NavaloneTitleContext) => string);

/* ----------------------------- Event details ----------------------------- */

export interface NavaloneNavigateDetail {
    from: string;
    to: string;
    trigger: HTMLElement | null;
}

export interface NavaloneBackDetail {
    from: string;
    to: string;
}

export type NavaloneOpenDetail = Record<string, never>;
export type NavaloneCloseDetail = Record<string, never>;

export interface NavaloneSubmenuOpenDetail {
    id: string;
    trigger: HTMLElement;
    panel: HTMLElement;
}

export interface NavaloneSubmenuCloseDetail {
    id: string;
    panel: HTMLElement;
}

export type NavaloneEventType =
    | "navigate"
    | "back"
    | "open"
    | "close"
    | "submenuopen"
    | "submenuclose";

export interface NavaloneEventDetailMap {
    navigate: NavaloneNavigateDetail;
    back: NavaloneBackDetail;
    open: NavaloneOpenDetail;
    close: NavaloneCloseDetail;
    submenuopen: NavaloneSubmenuOpenDetail;
    submenuclose: NavaloneSubmenuCloseDetail;
}

/* ------------------------------- Options --------------------------------- */

/** Options with every default applied (the shape held on the instance). */
export interface ResolvedNavaloneOptions {
    // Phase 1
    width: string | number | null;
    animationDuration: string | number | null;
    theme: Record<string, string> | null;
    items: NavaloneItem[] | null;
    rootId: string | null;
    title: NavaloneTitleOption;
    showThumbnails: boolean;
    onNavigate: ((detail: NavaloneNavigateDetail) => void) | null;
    onBack: ((detail: NavaloneBackDetail) => void) | null;
    // Phase 2
    /**
     * How collapsing is decided. `"dynamic"` (default) measures the menu and
     * folds it exactly when it would overlap the logo/buttons; `"static"` uses
     * the `breakpoint` / `condenseBreakpoint` pixel thresholds.
     */
    responsive: NavaloneResponsive;
    /**
     * Static-mode collapse width (px): at or below this viewport width the bar
     * collapses to the drawer. Ignored when `responsive` is `"dynamic"`.
     */
    breakpoint: number;
    /**
     * Static-mode condense width (px): at or below this viewport width (but
     * above `breakpoint`) the desktop bar condenses — smaller font and tighter
     * spacing — before it collapses. `null` (default) disables the condense step.
     * Ignored when `responsive` is `"dynamic"` (which condenses automatically).
     */
    condenseBreakpoint: number | null;
    /** How the bar is positioned on the page. Defaults to `"fixed"`. */
    position: NavalonePosition;
    menuAlign: NavaloneMenuAlign;
    openOn: NavaloneOpenOn;
    drawerSide: NavaloneDrawerSide;
    /** Mobile submenu behaviour: sliding drill-down (default) or inline accordion. */
    mobileMenu: NavaloneMobileMenu;
    logo: NavaloneLogo | null;
    rightButtons: NavaloneButton[] | null;
    showRightButtons: boolean;
    /**
     * Where the right-side buttons live below the breakpoint. `false` (default)
     * keeps them on the right of the bar at every screen size; `true` collapses
     * them into the drawer footer on medium/small screens.
     */
    rightButtonsFooter: boolean;
    drawerLabel: string;
    onOpen: ((detail: NavaloneOpenDetail) => void) | null;
    onClose: ((detail: NavaloneCloseDetail) => void) | null;
    onSubmenuOpen: ((detail: NavaloneSubmenuOpenDetail) => void) | null;
    onSubmenuClose: ((detail: NavaloneSubmenuCloseDetail) => void) | null;
}

/** Public options — every field optional; omitted ones fall back to defaults. */
export type NavaloneOptions = Partial<ResolvedNavaloneOptions>;

/** `new Navalone(target, options)` accepts a selector string or an element. */
export type NavaloneTarget = string | Element;

/**
 * Internal element augmentations. Trigger ⇄ panel references are stashed on the
 * elements themselves (mirroring the original plain-JS implementation).
 */
declare global {
    interface HTMLElement {
        /** Desktop submenu panel opened by this trigger. */
        _nvPanel?: HTMLElement;
        /** Trigger that opens this desktop panel. */
        _nvTrigger?: HTMLElement | null;
        /** Parent desktop panel of this flyout (null for top-level). */
        _nvParentPanel?: HTMLElement | null;
    }
}
