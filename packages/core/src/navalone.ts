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
import { toCssLength } from "./dom";
import { buildModel } from "./model";
import {
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
    _destroyed = false;
    _lastFocus: HTMLElement | null = null;
    _hoverCloseTimer: number | undefined; // debounced desktop hover-close

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
        breakpoint: 960,
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
        this._mql = window.matchMedia("(max-width: " + this.options.breakpoint + "px)");
        this._mode = this._mql.matches ? "mobile" : "desktop";
        this.root.classList.add(this._mode === "mobile" ? "nv-mode-mobile" : "nv-mode-desktop");
        this._listen(this._mql, "change", this._onModeChange);

        this._listen(this.root, "click", this._onClick);
        this._listen(this.root, "keydown", this._onKeydown);
        this._listen(this.root, "mouseover", this._onOver);
        this._listen(this.root, "mouseleave", this._onLeave);
        this._listen(this.root, "focusout", this._onFocusOut);
        this._listen(document, "click", this._onDocClick);
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

    _onModeChange = (): void => {
        const isMobile = this._mql.matches;
        const mode = isMobile ? "mobile" : "desktop";
        if (mode === this._mode) {
            return;
        }
        if (this._mode === "desktop") {
            closeDesktopAll(this);
        }
        this._mode = mode;
        this.root.classList.toggle("nv-mode-mobile", isMobile);
        this.root.classList.toggle("nv-mode-desktop", !isMobile);

        if (isMobile) {
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
    };

    _onKeydown = (e: Event): void => {
        const ev = e as KeyboardEvent;
        const target = ev.target as HTMLElement;
        const barItem = target.closest<HTMLElement>(".nv-bar-item");
        const dItem = target.closest<HTMLElement>(".nv-d-item");
        if (this._mode === "desktop" && (barItem || dItem)) {
            desktopKeys(this, ev, barItem, dItem);
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
