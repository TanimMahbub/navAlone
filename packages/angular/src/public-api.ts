/**
 * Public entry for @navalone/angular. Exports the standalone component and
 * re-exports the core's public types so consumers never hand-redefine the shape.
 */
export { NavaloneComponent } from "./navalone.component";

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
