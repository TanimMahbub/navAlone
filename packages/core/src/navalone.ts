/**
 * Navalone — a free, open-source responsive main-menu plugin.
 *
 * One normalised `items` model drives TWO presentations:
 *   - Desktop (>= breakpoint): a horizontal bar [logo] [center menu] [right
 *     buttons]. Submenus render as dropdown / dropdown-lg / mega (columns) plus
 *     arbitrarily-nested side-flyouts; panels are edge-aware.
 *   - Mobile (< breakpoint): the bar collapses to a hamburger that opens the
 *     sliding drill-down as a true off-canvas drawer (backdrop, scroll-lock,
 *     focus trap, Escape/backdrop to close).
 *
 * Authored in TypeScript and split into concern-focused modules, but compiled
 * to a single `Navalone` class with the public API unchanged. The free
 * functions in `desktop.ts` / `drawer.ts` / `model.ts` / `a11y.ts` take this
 * instance as their first argument; the class owns the state and orchestration.
 *
 *     const menu = new Navalone(".mm", { logo: "Brand", items: [...] });
 */
import type {
    NavaloneEventDetailMap,
    NavaloneEventType,
    NavaloneItem,
    NavaloneOptions,
    NavaloneTarget,
    ResolvedNavaloneOptions
} from "./types";
import { toCssLength, findScrollParent, scrollTopOf } from "./dom";
import { buildModel } from "./model";
import {
    activateMegaTab,
    buildBar,
    closeDesktopAll,
    closeSubmenuById,
    desktopKeys,
    hoverSync,
    openSubmenuById,
    toggleDesktop
} from "./desktop";
import {
    activePanel,
    back,
    buildDrawer,
    closeDrawer,
    initHeight,
    navigateTo,
    openDrawer,
    remeasure,
    setupPanels,
    toggleAccordion
} from "./drawer";
import { trapTab } from "./a11y";

export class Navalone {
    root!: HTMLElement;
    options!: ResolvedNavaloneOptions;

    _originalHTML = "";
    _originalStyle: string | null = null;
    _originalClass = "";

    _model: NavaloneItem[] = [];
    _panels: HTMLElement[] = []; // mobile drill-down .menu-level panels
    _desktopPanels: Record<string, HTMLElement> = {}; // submenu.id -> desktop .nv-panel
    _triggers = new Map<string, HTMLElement>(); // panelId -> trigger that opened it (mobile)
    _stack: string[] = []; // active mobile navigation stack of panel ids
    _openPanels: HTMLElement[] = []; // open desktop .nv-panel elements (chain order)
    _cleanups: Array<() => void> = []; // listener removers, run on destroy()
    _drawerOpen = false;
    _mode: "mobile" | "desktop" | null = null;
    _condensed = false; // desktop bar in its condensed (tightened) layout
    _destroyed = false;
    _lastFocus: HTMLElement | null = null;
    _hoverCloseTimer: number | undefined; // debounced desktop hover-close

    // `responsive: "dynamic"` content-measurement bookkeeping. Natural widths are
    // cached (so transitions can be decided even while in mobile mode, where the
    // menubar is hidden and cannot be measured) and refreshed whenever the bar is
    // measurable. `_chrome` is the non-menu width (logo + buttons + gaps/padding).
    _ro: ResizeObserver | null = null;
    _condenseMql: MediaQueryList | null = null; // static-mode condense threshold
    _dynTicking = false;
    _natFull = 0; // menu's natural content width, full size
    _natCond = 0; // menu's natural content width, condensed
    _chrome = 0; // bar width consumed by everything except the menu track
    _panelNeed = 0; // widest top-level submenu panel's natural (unclamped) width

    // `position: "smart"` auto-hide bookkeeping.
    _smartScroller: HTMLElement | Window | null = null;
    _smartLastY = 0;
    _smartTicking = false;

    _mql!: MediaQueryList;
    _bar!: HTMLElement;
    _backdrop!: HTMLElement;
    _drawer!: HTMLElement;
    _hamburger!: HTMLButtonElement;
    _menubar!: HTMLUListElement;
    _drawerClose!: HTMLButtonElement;
    _panelHost!: HTMLElement;
    _rootPanel!: HTMLElement;

    static defaults: ResolvedNavaloneOptions = {
        // Phase 1
        width: "320px",
        animationDuration: 300,
        theme: null,
        items: null,
        rootId: null,
        title: true,
        showThumbnails: true,
        onNavigate: null,
        onBack: null,
        // Phase 2
        responsive: "dynamic",
        breakpoint: 960,
        condenseBreakpoint: null,
        position: "fixed",
        menuAlign: "center",
        openOn: "hover",
        drawerSide: "left",
        mobileMenu: "drilldown",
        logo: null,
        rightButtons: null,
        showRightButtons: true,
        rightButtonsFooter: false,
        drawerLabel: "Menu",
        onOpen: null,
        onClose: null,
        onSubmenuOpen: null,
        onSubmenuClose: null
    };

    static _callbacks: Record<NavaloneEventType, keyof ResolvedNavaloneOptions> = {
        navigate: "onNavigate",
        back: "onBack",
        open: "onOpen",
        close: "onClose",
        submenuopen: "onSubmenuOpen",
        submenuclose: "onSubmenuClose"
    };

    constructor(target: NavaloneTarget, options?: NavaloneOptions) {
        const root = typeof target === "string" ? document.querySelector(target) : target;
        if (!root) {
            throw new Error("Navalone: target element not found");
        }
        this.root = root as HTMLElement;

        this.options = Object.assign({}, Navalone.defaults, options) as ResolvedNavaloneOptions;

        // Snapshot original DOM so destroy() can fully revert.
        this._originalHTML = this.root.innerHTML;
        this._originalStyle = this.root.getAttribute("style");
        this._originalClass = this.root.className;

        this._init();
    }

    /* ----------------------------- Initialisation ------------------------ */

    _init(): void {
        this.root.classList.add("mm", "navalone");

        // Build the normalised item model from config OR declarative markup,
        // then render both presentations from it (no data duplication).
        this._model = buildModel(this);

        this.root.innerHTML = "";
        this._applyOptions();
        this._build();

        setupPanels(this);
        initHeight(this);

        // Responsive switching. Decide the initial mode without animating.
        if (this.options.responsive === "static") {
            this._initStatic();
        } else {
            this._initDynamic();
        }

        this._listen(this.root, "click", this._onClick);
        this._listen(this.root, "keydown", this._onKeydown);
        this._listen(this.root, "mouseover", this._onOver);
        this._listen(this.root, "mouseleave", this._onLeave);
        this._listen(this.root, "focusout", this._onFocusOut);
        this._listen(document, "click", this._onDocClick);

        if (this.options.position === "smart") {
            this._setupSmartScroll();
        }
    }

    /* ----------------------- Responsive: static -------------------------- */

    // Classic breakpoint-driven collapsing via matchMedia: collapse at
    // `breakpoint`, optionally condense at `condenseBreakpoint` first.
    _initStatic(): void {
        this._mql = window.matchMedia("(max-width: " + this.options.breakpoint + "px)");
        this._listen(this._mql, "change", this._onModeChange);
        const cb = this.options.condenseBreakpoint;
        if (cb != null) {
            this._condenseMql = window.matchMedia("(max-width: " + cb + "px)");
            this._listen(this._condenseMql, "change", this._onModeChange);
        }
        this._applyStatic();
    }

    _applyStatic(): void {
        const mobile = this._mql.matches;
        // Condense only while still on the desktop bar and only between the two
        // thresholds (`condenseBreakpoint` must sit above `breakpoint`).
        const condensed = !mobile && !!this._condenseMql && this._condenseMql.matches;
        this._setCondensed(condensed);
        this._setMode(mobile ? "mobile" : "desktop");
    }

    _onModeChange = (): void => {
        this._applyStatic();
    };

    /* ----------------------- Responsive: dynamic ------------------------- */

    // Content-aware collapsing. Measure the menu's natural width against the
    // space the bar can give it; condense first, collapse second.
    _initDynamic(): void {
        // Measure while the bar is in its pristine desktop layout (no mode class
        // added yet, so the menubar is visible and measurable).
        this._measureNaturals();
        // Default to desktop, then let the first measurement pass refine it. In a
        // layout-less environment (jsdom) measurement is 0 and we simply stay on
        // the desktop bar — matching the previous default-desktop behaviour.
        this._mode = "desktop";
        this.root.classList.add("nv-mode-desktop");
        this._applyDynamic();

        if (typeof ResizeObserver === "function") {
            this._ro = new ResizeObserver(this._onBarResize);
            this._ro.observe(this._bar);
        }
        // Re-measure once web fonts settle (they change the menu's real width).
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                if (!this._destroyed) {
                    this._applyDynamic();
                }
            });
        }
    }

    _onBarResize = (): void => {
        if (this._dynTicking) {
            return;
        }
        this._dynTicking = true;
        window.requestAnimationFrame(() => {
            this._dynTicking = false;
            if (!this._destroyed) {
                this._applyDynamic();
            }
        });
    };

    _applyDynamic(): void {
        const barWidth = this._bar.clientWidth;
        if (!barWidth) {
            return; // not laid out yet (or hidden) — keep the current state
        }
        // Keep the cached natural widths fresh whenever the bar is measurable
        // (desktop mode); in mobile mode the menubar is hidden, so reuse the
        // last good measurement to decide whether there is room to expand.
        if (this._mode === "desktop") {
            this._measureNaturals();
        }
        const available = barWidth - this._chrome;
        let mode: "mobile" | "desktop";
        let condensed: boolean;
        if (this._natFull <= available) {
            mode = "desktop";
            condensed = false;
        } else if (this._natCond <= available) {
            mode = "desktop";
            condensed = true;
        } else {
            mode = "mobile";
            condensed = false;
        }
        // Panel-aware collapse: the bar fitting is necessary but not sufficient.
        // A tiny bar (e.g. one "Categories" item) easily fits a narrow screen, yet
        // its dropdown/mega/mega-tabs panel may be far wider — staying on the
        // desktop bar would only show that panel clamped and crowded. So if the
        // widest panel can't open at its natural width (within the same 16px
        // viewport gutter the panel CSS reserves), fold to the drawer instead,
        // where the same content drills down comfortably.
        if (mode === "desktop" && this._panelNeed > barWidth - 16) {
            mode = "mobile";
            condensed = false;
        }
        this._setCondensed(condensed);
        this._setMode(mode);
    }

    // Sum of the menubar items' widths plus the inter-item gaps — the menu's
    // intrinsic width, independent of the track it is currently squeezed into
    // (the items never wrap), so it is comparable across condensed/full states.
    _menuNeed(): number {
        const kids = this._menubar.children;
        let width = 0;
        for (let i = 0; i < kids.length; i++) {
            width += (kids[i] as HTMLElement).getBoundingClientRect().width;
        }
        if (kids.length > 1) {
            const cs = getComputedStyle(this._menubar);
            const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
            width += gap * (kids.length - 1);
        }
        return width;
    }

    // Cache the menu's natural widths (full + condensed) and the chrome width.
    // Toggles the condensed class to read both, then restores the prior state.
    // No-op when the menubar is not measurable (collapsed/hidden).
    _measureNaturals(): void {
        const bar = this._bar;
        const menubar = this._menubar;
        if (!bar.clientWidth || menubar.offsetParent === null) {
            return;
        }
        const wasCondensed = this.root.classList.contains("nv-condensed");
        this.root.classList.remove("nv-condensed");
        this._natFull = this._menuNeed();
        // chrome = everything that isn't the menu track (logo, buttons, the bar's
        // outer gaps and horizontal padding); stable across condense toggles since
        // condensing only tightens the menubar itself.
        this._chrome = bar.clientWidth - menubar.clientWidth;
        this.root.classList.add("nv-condensed");
        this._natCond = this._menuNeed();
        if (!wasCondensed) {
            this.root.classList.remove("nv-condensed");
        }
        this._measurePanels();
    }

    // Cache the widest top-level submenu panel's natural width — the width it
    // wants laid out *un-crowded*: mega columns side by side (not wrapped) and the
    // category rail at full width. That is the "looks good" width; below it the
    // panel can only show clamped/wrapped, which is the cue to fold to the drawer.
    //
    // Panels are `visibility: hidden` (not `display: none`), so they are laid out
    // and measurable while closed. We temporarily lift the panel's viewport cap,
    // stop the mega grids from wrapping, and uncap the rail, read the width, then
    // restore everything — invisibly, within this synchronous pass (no paint in
    // between). Only panels that open straight from the bar count (a
    // `.nv-bar-li`'s own panel); nested flyouts have their own narrow fall-back.
    _measurePanels(): void {
        const panels = this._menubar.querySelectorAll<HTMLElement>(".nv-bar-li > .nv-panel");
        let max = 0;
        panels.forEach((panel) => {
            const restore: Array<() => void> = [];
            // Save a single inline style property and queue its exact restoration.
            const set = (el: HTMLElement, prop: string, val: string) => {
                const prev = el.style.getPropertyValue(prop);
                el.style.setProperty(prop, val);
                restore.push(() =>
                    prev ? el.style.setProperty(prop, prev) : el.style.removeProperty(prop)
                );
            };
            // Lift the panel's viewport cap so it can grow to its content width.
            set(panel, "max-width", "none");
            // `.nv-mega` is both the plain mega panel itself and each mega-tabs
            // content grid. Stop its columns wrapping and pin each to its basis
            // (no grow/shrink) so we read the full side-by-side span rather than
            // the shrunk-to-fit width the live cap would produce.
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
            // Uncap the e-commerce rail so it counts at its full width too.
            panel
                .querySelectorAll<HTMLElement>(".nv-mt-nav")
                .forEach((rail) => set(rail, "max-width", "none"));
            max = Math.max(max, panel.getBoundingClientRect().width);
            restore.forEach((fn) => fn());
        });
        this._panelNeed = max;
    }

    /* --------------------- Mode / condense transitions ------------------- */

    _setCondensed(condensed: boolean): void {
        if (condensed === this._condensed) {
            return;
        }
        this._condensed = condensed;
        this.root.classList.toggle("nv-condensed", condensed);
    }

    _setMode(mode: "mobile" | "desktop"): void {
        if (mode === this._mode) {
            return;
        }
        if (this._mode === "desktop") {
            closeDesktopAll(this);
        }
        this._mode = mode;
        const isMobile = mode === "mobile";
        this.root.classList.toggle("nv-mode-mobile", isMobile);
        this.root.classList.toggle("nv-mode-desktop", !isMobile);

        if (isMobile) {
            // Condensing is a desktop-only concern; drop it on the way to mobile.
            this._setCondensed(false);
            // Re-measure the drill-down height without animating from the stale
            // desktop value.
            remeasure(this);
        } else if (this._drawerOpen) {
            // Collapse the drawer state when growing to desktop.
            this._drawerOpen = false;
            this.root.classList.remove("nv-open");
            document.body.classList.remove("nv-scroll-lock");
            this._backdrop.hidden = true;
            if (this._hamburger) {
                this._hamburger.setAttribute("aria-expanded", "false");
            }
        }
    }

    /* ------------------------- Smart (auto-hide) bar --------------------- */

    // `position: "smart"`: hide the bar when scrolling down past it, reveal it on
    // any upward scroll. The transform is applied to the bar (not the root) so
    // the off-canvas drawer's fixed-positioning containing block is never
    // disturbed. Watches the nearest scroll container (window on a normal page).
    _setupSmartScroll(): void {
        const scroller = findScrollParent(this.root);
        this._smartScroller = scroller;
        this._smartLastY = scrollTopOf(scroller);
        this._listen(scroller, "scroll", this._onSmartScroll);
    }

    _onSmartScroll = (): void => {
        if (this._smartTicking) {
            return;
        }
        this._smartTicking = true;
        window.requestAnimationFrame(() => {
            this._smartTicking = false;
            if (!this._destroyed) {
                this._updateSmart();
            }
        });
    };

    _updateSmart(): void {
        // Never hide while the drawer is open (the hamburger lives in the bar).
        if (this._drawerOpen) {
            this.root.classList.remove("nv-hidden");
            return;
        }
        const y = Math.max(scrollTopOf(this._smartScroller as HTMLElement | Window), 0);
        const last = this._smartLastY;
        const barH = this._bar ? this._bar.offsetHeight : 0;
        if (y <= barH) {
            // At (or above) the bar's resting spot — always visible.
            this.root.classList.remove("nv-hidden");
        } else if (y > last + 4) {
            this.root.classList.add("nv-hidden"); // scrolling down
        } else if (y < last - 4) {
            this.root.classList.remove("nv-hidden"); // scrolling up
        }
        this._smartLastY = y;
    }

    _listen(target: EventTarget, type: string, handler: EventListener): void {
        target.addEventListener(type, handler);
        this._cleanups.push(() => target.removeEventListener(type, handler));
    }

    _applyOptions(): void {
        const o = this.options;
        if (o.width != null) {
            this.root.style.setProperty("--nv-width", toCssLength(o.width));
        }
        if (o.animationDuration != null) {
            const d =
                typeof o.animationDuration === "number"
                    ? o.animationDuration + "ms"
                    : o.animationDuration;
            this.root.style.setProperty("--nv-duration", d);
        }
        if (o.theme && typeof o.theme === "object") {
            const theme = o.theme;
            Object.keys(theme).forEach((key) => {
                this.root.style.setProperty(key, theme[key]);
            });
        }
        this.root.classList.add("nv-pos-" + (o.position || "fixed"));
        this.root.classList.add("nv-align-" + (o.menuAlign || "center"));
        this.root.classList.add("nv-side-" + (o.drawerSide || "left"));
        if (o.rightButtonsFooter) {
            this.root.classList.add("nv-rt-footer");
        }
    }

    _build(): void {
        this._bar = buildBar(this);
        this.root.appendChild(this._bar);

        this._backdrop = document.createElement("div");
        this._backdrop.className = "nv-backdrop";
        this._backdrop.hidden = true;
        this.root.appendChild(this._backdrop);

        this._drawer = buildDrawer(this);
        this.root.appendChild(this._drawer);

        if (this._hamburger) {
            this._hamburger.setAttribute("aria-controls", this._drawer.id);
        }
    }

    /* ------------------------------ Public API --------------------------- */

    open(): this {
        openDrawer(this);
        return this;
    }

    close(): this {
        closeDrawer(this);
        return this;
    }

    toggle(): this {
        return this._drawerOpen ? this.close() : this.open();
    }

    navigateTo(panelId: string, trigger?: HTMLElement | null): boolean {
        return navigateTo(this, panelId, trigger ?? null);
    }

    back(): boolean {
        return back(this);
    }

    openSubmenu(id: string): this {
        openSubmenuById(this, id);
        return this;
    }

    closeSubmenu(id: string): this {
        closeSubmenuById(this, id);
        return this;
    }

    closeAll(): this {
        closeDesktopAll(this);
        return this;
    }

    destroy(): void {
        if (this._destroyed) {
            return;
        }
        this._cleanups.forEach((fn) => fn());
        this._cleanups = [];
        if (this._ro) {
            this._ro.disconnect();
            this._ro = null;
        }
        window.clearTimeout(this._hoverCloseTimer);
        document.body.classList.remove("nv-scroll-lock");

        this.root.innerHTML = this._originalHTML;
        if (this._originalStyle) {
            this.root.setAttribute("style", this._originalStyle);
        } else {
            this.root.removeAttribute("style");
        }
        this.root.className = this._originalClass;

        this._panels = [];
        this._triggers.clear();
        this._stack = [];
        this._openPanels = [];
        this._destroyed = true;
    }

    /* -------------------------------- Events ----------------------------- */

    _emit<T extends NavaloneEventType>(type: T, detail: NavaloneEventDetailMap[T]): void {
        this.root.dispatchEvent(
            new CustomEvent("navalone:" + type, { detail, bubbles: true })
        );
        const cbName = Navalone._callbacks[type];
        const fn = this.options[cbName] as ((d: NavaloneEventDetailMap[T]) => void) | null;
        if (typeof fn === "function") {
            fn(detail);
        }
    }

    _onClick = (e: Event): void => {
        const target = e.target as HTMLElement;
        // Hamburger / drawer chrome.
        if (this._hamburger && target.closest(".nv-hamburger") === this._hamburger) {
            e.preventDefault();
            this.toggle();
            return;
        }
        if (target.closest(".nv-drawer-close")) {
            e.preventDefault();
            this.close();
            return;
        }
        if (target === this._backdrop) {
            this.close();
            return;
        }

        // E-commerce mega: clicking a category reveals its pane (keeps the panel
        // open even with openOn: "click", where there is no hover to switch on).
        // A navigable category (rendered as a link) is left to follow its href.
        const mtCat = target.closest<HTMLElement>(".nv-mt-cat");
        if (mtCat && this.root.contains(mtCat) && !mtCat.classList.contains("is-disabled")) {
            if (mtCat.tagName !== "A") {
                e.preventDefault();
            }
            activateMegaTab(mtCat);
            return;
        }

        // Desktop triggers (bar + dropdown rows).
        const desktopTrigger = target.closest<HTMLElement>(".nv-bar-item, .nv-d-item");
        if (desktopTrigger && this.root.contains(desktopTrigger)) {
            if (desktopTrigger.classList.contains("is-disabled")) {
                e.preventDefault();
                return;
            }
            if (desktopTrigger._nvPanel) {
                e.preventDefault();
                toggleDesktop(this, desktopTrigger, desktopTrigger._nvPanel);
                return;
            }
            // Leaf link/button: let it act, then collapse the menu chain.
            closeDesktopAll(this);
            return;
        }

        // Mobile rows: drill-down navigation or inline accordion toggle.
        const item = target.closest<HTMLElement>(".menu-item");
        if (item && this._panelHost.contains(item)) {
            if ((item as HTMLButtonElement).disabled || item.classList.contains("is-disabled")) {
                e.preventDefault();
                return;
            }
            if (this.options.mobileMenu === "accordion") {
                if (item.getAttribute("aria-controls")) {
                    e.preventDefault();
                    toggleAccordion(this, item);
                }
                return;
            }
            if (item.dataset.target) {
                e.preventDefault();
                navigateTo(this, item.dataset.target, item);
                return;
            }
        }

        const backBtn = target.closest<HTMLElement>(".back-button");
        if (backBtn && this._panelHost.contains(backBtn)) {
            e.preventDefault();
            back(this);
        }
    };

    _onOver = (e: Event): void => {
        if (this.options.openOn !== "hover" || this._mode !== "desktop") {
            return;
        }
        // Re-entering the menu cancels any pending close, so traversing a small
        // gap (which momentarily fires mouseleave) won't drop the open panel.
        window.clearTimeout(this._hoverCloseTimer);
        this._hoverCloseTimer = undefined;
        hoverSync(this, e.target as HTMLElement);
    };

    _onLeave = (): void => {
        if (this.options.openOn !== "hover" || this._mode !== "desktop") {
            return;
        }
        // Defer the close briefly: if the pointer crossed a gap (trigger → panel,
        // parent → flyout) it re-enters within this window and _onOver cancels it.
        window.clearTimeout(this._hoverCloseTimer);
        this._hoverCloseTimer = window.setTimeout(() => {
            this._hoverCloseTimer = undefined;
            if (!this._destroyed) {
                closeDesktopAll(this);
            }
        }, 160);
    };

    _onDocClick = (e: Event): void => {
        const target = e.target as HTMLElement;
        if (this._mode === "desktop" && this._openPanels.length && !target.closest(".nv-bar")) {
            closeDesktopAll(this);
        }
    };

    _onFocusOut = (e: Event): void => {
        if (this._mode !== "desktop" || !this._openPanels.length) {
            return;
        }
        const to = (e as FocusEvent).relatedTarget as HTMLElement | null;
        if (to && this._bar.contains(to)) {
            return;
        }
        // Focus genuinely left the bar (relatedTarget outside it).
        if (to) {
            closeDesktopAll(this);
        }
    };

    _onKeydown = (e: Event): void => {
        const ev = e as KeyboardEvent;
        const target = ev.target as HTMLElement;
        const barItem = target.closest<HTMLElement>(".nv-bar-item");
        const dItem = target.closest<HTMLElement>(".nv-d-item");
        const mtCat = target.closest<HTMLElement>(".nv-mt-cat");
        if (this._mode === "desktop" && (barItem || dItem || mtCat)) {
            desktopKeys(this, ev, barItem, dItem, mtCat);
            return;
        }

        // Mobile / drawer context.
        if (ev.key === "Escape") {
            ev.preventDefault();
            if (this._stack.length > 1) {
                back(this);
            } else {
                this.close();
            }
            return;
        }

        if (this._drawerOpen && ev.key === "Tab") {
            trapTab(this._drawer, ev);
            return;
        }

        if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
            const panel = activePanel(this);
            if (!panel) {
                return;
            }
            let items = Array.from(
                panel.querySelectorAll<HTMLElement>(
                    "li > button:not([disabled]):not(.is-disabled), li > a:not(.is-disabled)"
                )
            );
            if (this.options.mobileMenu === "accordion") {
                // Skip rows inside a collapsed (inert) accordion panel.
                items = items.filter(
                    (el) => !el.closest('.nv-acc-panel[aria-hidden="true"]')
                );
            }
            if (!items.length) {
                return;
            }
            ev.preventDefault();
            const current = items.indexOf(document.activeElement as HTMLElement);
            let next = ev.key === "ArrowDown" ? current + 1 : current - 1;
            if (next < 0) {
                next = items.length - 1;
            }
            if (next >= items.length) {
                next = 0;
            }
            items[next].focus();
        }
    };
}
