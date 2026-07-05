/**
 * Bare-kernel entry (`navalone/kernel`) for tree-shaking ESM consumers who
 * compose their own feature set:
 *
 *     import { Navalone } from "navalone/kernel";
 *     import { dropdown } from "navalone/features/dropdown";
 *     import { drawerDrilldown } from "navalone/features/drawer-drilldown";
 *     import { responsiveDynamic } from "navalone/features/responsive-dynamic";
 *     Navalone.use(dropdown).use(drawerDrilldown).use(responsiveDynamic);
 *
 * No feature is preregistered here; configs that reference an absent feature
 * fail with a clear "feature not included" error. The package's default entry
 * (`navalone`) preregisters everything instead.
 */
export { Navalone } from "./kernel/navalone";
export { Navalone as default } from "./kernel/navalone";

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
