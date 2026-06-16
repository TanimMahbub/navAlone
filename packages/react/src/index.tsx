/**
 * React wrapper for Navalone. A thin adapter: it mounts the framework-agnostic
 * core into a host `<div>` on mount and calls `destroy()` on unmount. No menu
 * behaviour is re-implemented here — props are forwarded to the core and the
 * core's events are surfaced through the matching `on*` props.
 *
 * SSR-safe: the core is never instantiated at import time, only inside an
 * effect (client-only), and importing `navalone` never touches `window`.
 */
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    type CSSProperties,
    type ForwardedRef
} from "react";
import { Navalone as NavaloneCore, type NavaloneOptions } from "navalone";

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

/** The core's callback options — the only function-valued props. */
const CALLBACK_KEYS = [
    "onNavigate",
    "onBack",
    "onOpen",
    "onClose",
    "onSubmenuOpen",
    "onSubmenuClose"
] as const;

/**
 * Imperative handle exposed via `ref`. Mirrors the core's public methods. Each
 * is a no-op (returning a safe default) before mount / after unmount.
 */
export interface NavaloneHandle {
    open(): void;
    close(): void;
    toggle(): void;
    navigateTo(panelId: string, trigger?: HTMLElement | null): boolean;
    back(): boolean;
    openSubmenu(id: string): void;
    closeSubmenu(id: string): void;
    closeAll(): void;
    destroy(): void;
    /** The underlying core instance (null before mount / after unmount). */
    readonly instance: NavaloneCore | null;
}

/**
 * Props are the core's options (data + `on*` callbacks, kept in sync with the
 * core's `.d.ts`) plus the usual host-element attributes.
 */
export interface NavaloneProps extends NavaloneOptions {
    className?: string;
    style?: CSSProperties;
    id?: string;
}

function NavaloneComponent(props: NavaloneProps, ref: ForwardedRef<NavaloneHandle>) {
    const { className, style, id, ...options } = props;

    const hostRef = useRef<HTMLDivElement | null>(null);
    const instanceRef = useRef<NavaloneCore | null>(null);

    // Keep the freshest callbacks without tearing down the instance: the merged
    // options below close over this ref, so changing a handler's identity does
    // not trigger a rebuild.
    const optionsRef = useRef<NavaloneOptions>(options);
    optionsRef.current = options;

    // Structural signature. JSON.stringify drops function values, so only data
    // options (items, logo, theme, breakpoint, …) contribute. The instance is
    // rebuilt when the data changes, never merely because a callback changed.
    const signature = JSON.stringify(options);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) {
            return;
        }

        // Type-erased so the indexed callback assignment below doesn't collapse
        // to an intersection of every detail type.
        const merged: Record<string, unknown> = { ...optionsRef.current };
        // Replace each callback with a stable wrapper that reads the latest
        // handler from the ref at call time.
        for (const key of CALLBACK_KEYS) {
            merged[key] = (detail: unknown) => {
                const fn = optionsRef.current[key] as ((d: unknown) => void) | null | undefined;
                if (typeof fn === "function") {
                    fn(detail);
                }
            };
        }

        const instance = new NavaloneCore(host, merged as NavaloneOptions);
        instanceRef.current = instance;

        return () => {
            instance.destroy();
            instanceRef.current = null;
        };
        // optionsRef is a stable ref; signature captures the structural change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signature]);

    useImperativeHandle(
        ref,
        (): NavaloneHandle => ({
            open: () => void instanceRef.current?.open(),
            close: () => void instanceRef.current?.close(),
            toggle: () => void instanceRef.current?.toggle(),
            navigateTo: (panelId, trigger) =>
                instanceRef.current?.navigateTo(panelId, trigger ?? null) ?? false,
            back: () => instanceRef.current?.back() ?? false,
            openSubmenu: (id) => void instanceRef.current?.openSubmenu(id),
            closeSubmenu: (id) => void instanceRef.current?.closeSubmenu(id),
            closeAll: () => void instanceRef.current?.closeAll(),
            destroy: () => instanceRef.current?.destroy(),
            get instance() {
                return instanceRef.current;
            }
        }),
        []
    );

    return <div ref={hostRef} className={className} style={style} id={id} />;
}

/**
 * `<Navalone items={…} logo={…} {...options} onSubmenuOpen={…} ref={ref} />`
 *
 * Forwards a `ref` exposing the imperative {@link NavaloneHandle}.
 */
export const Navalone = forwardRef<NavaloneHandle, NavaloneProps>(NavaloneComponent);
Navalone.displayName = "Navalone";

export default Navalone;
