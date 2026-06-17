/**
 * Angular wrapper for Navalone. A thin standalone component: it mounts the
 * framework-agnostic core into a host element on init, rebuilds it when the data
 * `@Input()`s change, and calls `destroy()` on destroy. No menu behaviour is
 * re-implemented — the core's events are surfaced as `@Output()`s.
 *
 * SSR-safe: the core is only instantiated in `ngAfterViewInit` (which does not
 * run on the server) and importing `navalone` never touches `window`.
 */
import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    ViewChild,
    ViewEncapsulation
} from "@angular/core";
import {
    Navalone as NavaloneCore,
    type NavaloneOptions,
    type NavaloneItem,
    type NavaloneLogo,
    type NavaloneButton,
    type NavaloneMenuAlign,
    type NavaloneOpenOn,
    type NavaloneDrawerSide,
    type NavalonePosition,
    type NavaloneTitleOption,
    type NavaloneNavigateDetail,
    type NavaloneBackDetail,
    type NavaloneOpenDetail,
    type NavaloneCloseDetail,
    type NavaloneSubmenuOpenDetail,
    type NavaloneSubmenuCloseDetail
} from "navalone";

@Component({
    selector: "navalone-menu",
    standalone: true,
    // The core builds its DOM into this inner host element.
    template: "<div #host></div>",
    encapsulation: ViewEncapsulation.None
})
export class NavaloneComponent implements AfterViewInit, OnChanges, OnDestroy {
    /* ----------------------------- Data inputs --------------------------- */
    @Input() items?: NavaloneItem[];
    @Input() logo?: NavaloneLogo;
    @Input() rightButtons?: NavaloneButton[];
    @Input() showRightButtons?: boolean;
    @Input() width?: string | number;
    @Input() animationDuration?: string | number;
    @Input() theme?: Record<string, string>;
    @Input() rootId?: string;
    @Input() title?: NavaloneTitleOption;
    @Input() showThumbnails?: boolean;
    @Input() breakpoint?: number;
    @Input() position?: NavalonePosition;
    @Input() menuAlign?: NavaloneMenuAlign;
    @Input() openOn?: NavaloneOpenOn;
    @Input() drawerSide?: NavaloneDrawerSide;
    @Input() drawerLabel?: string;

    /* ------------------------------- Outputs ----------------------------- */
    @Output() navigate = new EventEmitter<NavaloneNavigateDetail>();
    @Output() back = new EventEmitter<NavaloneBackDetail>();
    @Output() open = new EventEmitter<NavaloneOpenDetail>();
    @Output() close = new EventEmitter<NavaloneCloseDetail>();
    @Output() submenuopen = new EventEmitter<NavaloneSubmenuOpenDetail>();
    @Output() submenuclose = new EventEmitter<NavaloneSubmenuCloseDetail>();

    @ViewChild("host", { static: true }) private hostRef!: ElementRef<HTMLElement>;

    private instance: NavaloneCore | null = null;

    private static readonly DATA_KEYS = [
        "items",
        "logo",
        "rightButtons",
        "showRightButtons",
        "width",
        "animationDuration",
        "theme",
        "rootId",
        "title",
        "showThumbnails",
        "breakpoint",
        "position",
        "menuAlign",
        "openOn",
        "drawerSide",
        "drawerLabel"
    ] as const;

    ngAfterViewInit(): void {
        this.build();
    }

    ngOnChanges(): void {
        // Skip the first change set (before the view/host exists); afterwards
        // rebuild from the new data inputs.
        if (this.instance) {
            this.instance.destroy();
            this.build();
        }
    }

    ngOnDestroy(): void {
        this.instance?.destroy();
        this.instance = null;
    }

    private collectOptions(): NavaloneOptions {
        const out: Record<string, unknown> = {};
        for (const key of NavaloneComponent.DATA_KEYS) {
            const value = (this as Record<string, unknown>)[key];
            if (value !== undefined) {
                out[key] = value;
            }
        }
        return out as NavaloneOptions;
    }

    private build(): void {
        this.instance = new NavaloneCore(this.hostRef.nativeElement, {
            ...this.collectOptions(),
            onNavigate: (d) => this.navigate.emit(d),
            onBack: (d) => this.back.emit(d),
            onOpen: (d) => this.open.emit(d),
            onClose: (d) => this.close.emit(d),
            onSubmenuOpen: (d) => this.submenuopen.emit(d),
            onSubmenuClose: (d) => this.submenuclose.emit(d)
        });
    }

    /* ----------------------------- Public API ---------------------------- */
    openDrawer(): void {
        this.instance?.open();
    }
    closeDrawer(): void {
        this.instance?.close();
    }
    toggle(): void {
        this.instance?.toggle();
    }
    navigateTo(panelId: string, trigger?: HTMLElement | null): boolean {
        return this.instance?.navigateTo(panelId, trigger ?? null) ?? false;
    }
    goBack(): boolean {
        return this.instance?.back() ?? false;
    }
    openSubmenu(id: string): void {
        this.instance?.openSubmenu(id);
    }
    closeSubmenu(id: string): void {
        this.instance?.closeSubmenu(id);
    }
    closeAll(): void {
        this.instance?.closeAll();
    }
    destroy(): void {
        this.instance?.destroy();
    }
    /** The underlying core instance (null before init / after destroy). */
    get core(): NavaloneCore | null {
        return this.instance;
    }
}
