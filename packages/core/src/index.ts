/**
 * Package entry for bundler / Node consumers — the batteries-included build:
 * every feature module is preregistered here, so `new Navalone(...)` behaves
 * exactly like the original monolith. Vanilla `<script>` users instead load
 * `dist/navalone.global.js` (see src/global.ts), which assigns
 * `window.Navalone`. Importing this module never touches `window`, so it is
 * SSR-safe.
 *
 * Tree-shaking consumers who want only some features import `navalone/kernel`
 * plus individual `navalone/features/*` modules instead (see src/kernel.ts).
 */
import { Navalone } from "./kernel/navalone";
import { dropdown } from "./features/dropdown";
import { dropdownLg } from "./features/dropdown-lg";
import { mega } from "./features/mega";
import { megaTabs } from "./features/mega-tabs";
import { flyout } from "./features/flyout";
import { drawerDrilldown } from "./features/drawer-drilldown";
import { drawerAccordion } from "./features/drawer-accordion";
import { responsiveDynamic } from "./features/responsive-dynamic";
import { responsiveStatic } from "./features/responsive-static";
import { positionSmart } from "./features/position-smart";

Navalone.use(dropdown)
    .use(dropdownLg)
    .use(mega)
    .use(megaTabs)
    .use(flyout)
    .use(drawerDrilldown)
    .use(drawerAccordion)
    .use(responsiveDynamic)
    .use(responsiveStatic)
    .use(positionSmart);

export { Navalone };
export { Navalone as default };

export {
    dropdown,
    dropdownLg,
    mega,
    megaTabs,
    flyout,
    drawerDrilldown,
    drawerAccordion,
    responsiveDynamic,
    responsiveStatic,
    positionSmart
};

export type {
    NavaloneFeature,
    FeatureHooks,
    NavaloneKernelApi,
    DrawerEngine,
    PanelBuilder,
    PositionContext,
    StyleSetter
} from "./kernel/registry";

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
} from "./types";
