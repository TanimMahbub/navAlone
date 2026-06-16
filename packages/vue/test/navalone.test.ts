import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { Navalone, type NavaloneItem } from "../src/index";

const items: NavaloneItem[] = [
    {
        label: "Company",
        submenu: {
            id: "company",
            display: "dropdown",
            items: [
                { label: "About", href: "#about" },
                { label: "Careers", href: "#careers", badge: "5" }
            ]
        }
    },
    { label: "Pricing", href: "#pricing" }
];

/** The methods `expose`d by the component, accessed via the wrapper's vm. */
interface ExposedMenu {
    open(): void;
    openSubmenu(id: string): void;
    instance: unknown;
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("@navalone/vue", () => {
    it("renders the desktop bar from the items model", () => {
        const wrapper = mount(Navalone, { props: { items, logo: "Acme" } });
        expect(wrapper.find(".navalone").exists()).toBe(true);
        expect(wrapper.findAll(".nv-menubar > li").length).toBe(2);
        wrapper.unmount();
    });

    it("exposes methods and emits submenuopen when a submenu opens", async () => {
        const wrapper = mount(Navalone, { props: { items } });
        const vm = wrapper.vm as unknown as ExposedMenu;
        expect(vm.instance).toBeTruthy();

        vm.openSubmenu("company");
        await wrapper.vm.$nextTick();

        const events = wrapper.emitted("submenuopen");
        expect(events).toBeTruthy();
        const detail = events![0][0] as { id: string; panel: HTMLElement };
        // The desktop dropdown panel from the event detail is open and holds the
        // company submenu's rows.
        expect(detail.panel.classList.contains("is-open")).toBe(true);
        expect(detail.panel.textContent).toContain("Careers");
        wrapper.unmount();
    });

    it("opens the drawer and emits open", async () => {
        const wrapper = mount(Navalone, { props: { items } });
        const vm = wrapper.vm as unknown as ExposedMenu;

        vm.open();
        await wrapper.vm.$nextTick();

        expect(wrapper.find(".navalone").classes()).toContain("nv-open");
        expect(wrapper.emitted("open")).toBeTruthy();
        wrapper.unmount();
    });

    it("calls destroy() on unmount, reverting the host element", () => {
        const wrapper = mount(Navalone, { props: { items } });
        const host = wrapper.element as HTMLElement;
        expect(host.querySelector(".nv-bar")).toBeTruthy();

        wrapper.unmount();
        expect(host.querySelector(".nv-bar")).toBeNull();
    });
});
