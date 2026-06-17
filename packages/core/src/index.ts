/**
 * Package entry for bundler / Node consumers. Vanilla `<script>` users instead
 * load `dist/navalone.global.js` (see src/global.ts), which assigns
 * `window.Navalone`. Importing this module never touches `window`, so it is
 * SSR-safe.
 */
export { Navalone } from "./navalone";
export { Navalone as default } from "./navalone";

export type {
    NavaloneOptions,
    ResolvedNavaloneOptions,
    NavaloneTarget,
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
} from "./types";
