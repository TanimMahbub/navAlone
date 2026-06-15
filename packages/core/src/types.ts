/**
 * Public type definitions for Navalone — the data contract, options, event
 * detail payloads and the resolved-options shape. These are authoring-only and
 * compiled away; vanilla `<script>` consumers never see them.
 */

export type NavaloneDisplay = "dropdown" | "dropdown-lg" | "mega";
export type NavaloneMenuAlign = "left" | "center" | "right";
export type NavaloneOpenOn = "hover" | "click";
export type NavaloneDrawerSide = "left" | "right";

/** A column inside a mega-menu submenu. Flattens to a group on mobile. */
export interface NavaloneColumn {
    heading?: string;
    items?: NavaloneItem[];
}

/** A nested panel. Use `items` for dropdowns/flyouts, `columns` for mega menus. */
export interface NavaloneSubmenu {
    id?: string;
    title?: string;
    /** Desktop presentation hint. Defaults to `"dropdown"`. */
    display?: NavaloneDisplay;
    items?: NavaloneItem[];
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
    breakpoint: number;
    menuAlign: NavaloneMenuAlign;
    openOn: NavaloneOpenOn;
    drawerSide: NavaloneDrawerSide;
    logo: NavaloneLogo | null;
    rightButtons: NavaloneButton[] | null;
    showRightButtons: boolean;
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
