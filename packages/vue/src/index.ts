/**
 * Vue 3 wrapper for Navalone. A thin adapter: mounts the framework-agnostic core
 * into a host `<div>` on mount, rebuilds it when the data props change, and calls
 * `destroy()` on unmount. No menu behaviour is re-implemented here.
 *
 * Implemented as a render-function component (no SFC) so the library build needs
 * no Vue template compiler. Props mirror the core's data options, the core's
 * events are re-emitted, and the public methods are `expose`d.
 *
 * SSR-safe: the core is only instantiated inside `onMounted` (client-only) and
 * importing `navalone` never touches `window`.
 */
import {
    defineComponent,
    h,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
    type PropType,
    type SetupContext
} from "vue";
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
    type NavaloneResponsive,
    type NavaloneTitleOption
} from "navalone";

export type {
    NavaloneOptions,
    ResolvedNavaloneOptions,
    NavaloneItem,
    NavaloneSubmenu,
    NavaloneColumn,
    NavaloneLogo,
    NavaloneLogoConfig,
    NavaloneButton,
    NavaloneDisplay,
    NavaloneMenuAlign,
    NavaloneOpenOn,
    NavaloneDrawerSide,
    NavalonePosition,
    NavaloneResponsive,
    NavaloneMobileMenu,
    NavaloneTitleOption,
    NavaloneTitleContext,
    NavaloneEventType,
    NavaloneEventDetailMap,
    NavaloneNavigateDetail,
    NavaloneBackDetail,
    NavaloneOpenDetail,
    NavaloneCloseDetail,
    NavaloneSubmenuOpenDetail,
    NavaloneSubmenuCloseDetail
} from "navalone";

/**
 * Data option props mirror {@link NavaloneOptions} (everything except the `on*`
 * callbacks, which are surfaced as emitted events instead). `PropType<…>` pulls
 * each type straight from the core, so the shape stays in sync with its `.d.ts`.
 */
const navaloneProps = {
    items: { type: Array as PropType<NavaloneItem[]>, default: undefined },
    logo: { type: [String, Object] as PropType<NavaloneLogo>, default: undefined },
    rightButtons: { type: Array as PropType<NavaloneButton[]>, default: undefined },
    showRightButtons: { type: Boolean, default: undefined },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    animationDuration: {
        type: [String, Number] as PropType<string | number>,
        default: undefined
    },
    theme: { type: Object as PropType<Record<string, string>>, default: undefined },
    rootId: { type: String, default: undefined },
    title: { type: [Boolean, Function] as PropType<NavaloneTitleOption>, default: undefined },
    showThumbnails: { type: Boolean, default: undefined },
    responsive: { type: String as PropType<NavaloneResponsive>, default: undefined },
    breakpoint: { type: Number, default: undefined },
    condenseBreakpoint: { type: Number, default: undefined },
    position: { type: String as PropType<NavalonePosition>, default: undefined },
    menuAlign: { type: String as PropType<NavaloneMenuAlign>, default: undefined },
    openOn: { type: String as PropType<NavaloneOpenOn>, default: undefined },
    drawerSide: { type: String as PropType<NavaloneDrawerSide>, default: undefined },
    drawerLabel: { type: String, default: undefined }
} as const;

/** The events re-emitted from the core (the `navalone:*` event names). */
const emits = ["navigate", "back", "open", "close", "submenuopen", "submenuclose"] as const;

type NavaloneProps = {
    [K in keyof typeof navaloneProps]?: NavaloneOptions[K & keyof NavaloneOptions];
};

/**
 * The methods and getters `expose`d on the component instance. Vue cannot infer
 * exposed members for render-function components, so template refs should be
 * typed with this explicitly: `const menu = ref<NavaloneExposed | null>(null)`.
 */
export interface NavaloneExposed {
    open: () => void;
    close: () => void;
    toggle: () => void;
    navigateTo: (panelId: string, trigger?: HTMLElement | null) => boolean;
    back: () => boolean;
    openSubmenu: (id: string) => void;
    closeSubmenu: (id: string) => void;
    closeAll: () => void;
    destroy: () => void;
    readonly instance: NavaloneCore | null;
}

/** Collect only the defined data props into a core options object. */
function collectOptions(props: NavaloneProps): NavaloneOptions {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(navaloneProps)) {
        const value = (props as Record<string, unknown>)[key];
        if (value !== undefined) {
            out[key] = value;
        }
    }
    return out as NavaloneOptions;
}

export const Navalone = defineComponent({
    name: "Navalone",
    props: navaloneProps,
    emits: emits as unknown as string[],
    setup(props, { expose, emit }: SetupContext) {
        const host = ref<HTMLDivElement | null>(null);
        let instance: NavaloneCore | null = null;

        function build() {
            if (!host.value) {
                return;
            }
            instance = new NavaloneCore(host.value, {
                ...collectOptions(props),
                onNavigate: (d) => emit("navigate", d),
                onBack: (d) => emit("back", d),
                onOpen: (d) => emit("open", d),
                onClose: (d) => emit("close", d),
                onSubmenuOpen: (d) => emit("submenuopen", d),
                onSubmenuClose: (d) => emit("submenuclose", d)
            });
        }

        function teardown() {
            instance?.destroy();
            instance = null;
        }

        onMounted(build);
        onBeforeUnmount(teardown);

        // Rebuild when the structural data props change. JSON.stringify of the
        // collected data options is a cheap structural signature.
        watch(
            () => JSON.stringify(collectOptions(props)),
            () => {
                teardown();
                build();
            }
        );

        const exposed: NavaloneExposed = {
            open: () => instance?.open(),
            close: () => instance?.close(),
            toggle: () => instance?.toggle(),
            navigateTo: (panelId: string, trigger?: HTMLElement | null) =>
                instance?.navigateTo(panelId, trigger ?? null) ?? false,
            back: () => instance?.back() ?? false,
            openSubmenu: (id: string) => instance?.openSubmenu(id),
            closeSubmenu: (id: string) => instance?.closeSubmenu(id),
            closeAll: () => instance?.closeAll(),
            destroy: () => instance?.destroy(),
            get instance() {
                return instance;
            }
        };
        expose(exposed);

        return () => h("div", { ref: host });
    }
});

export default Navalone;
