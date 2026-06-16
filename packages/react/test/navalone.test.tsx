import { createRef } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Navalone, type NavaloneHandle, type NavaloneItem } from "../src/index";

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

afterEach(() => {
    document.body.innerHTML = "";
});

describe("@navalone/react", () => {
    it("renders the desktop bar from the items model", () => {
        const { container } = render(<Navalone items={items} logo="Acme" />);
        expect(container.querySelector(".navalone")).toBeTruthy();
        expect(container.querySelectorAll(".nv-menubar > li").length).toBe(2);
    });

    it("exposes the public methods through a ref and opens a submenu", () => {
        const onSubmenuOpen = vi.fn();
        const ref = createRef<NavaloneHandle>();
        render(<Navalone ref={ref} items={items} onSubmenuOpen={onSubmenuOpen} />);

        expect(ref.current?.instance).toBeTruthy();
        act(() => {
            ref.current?.openSubmenu("company");
        });

        expect(onSubmenuOpen).toHaveBeenCalledTimes(1);
        const detail = onSubmenuOpen.mock.calls[0][0];
        // The desktop dropdown panel from the event detail is open and holds the
        // company submenu's rows.
        expect(detail.panel.classList.contains("is-open")).toBe(true);
        expect(detail.panel.textContent).toContain("Careers");
    });

    it("opens the drawer and fires onOpen", () => {
        const onOpen = vi.fn();
        const ref = createRef<NavaloneHandle>();
        const { container } = render(<Navalone ref={ref} items={items} onOpen={onOpen} />);

        act(() => {
            ref.current?.open();
        });
        expect(container.querySelector(".navalone")?.classList.contains("nv-open")).toBe(true);
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it("calls destroy() on unmount, reverting the host element", () => {
        const ref = createRef<NavaloneHandle>();
        const { container, unmount } = render(<Navalone ref={ref} items={items} />);
        const host = container.firstElementChild as HTMLElement;
        const destroySpy = vi.spyOn(ref.current!.instance!, "destroy");

        expect(host.querySelector(".nv-bar")).toBeTruthy();
        unmount();

        expect(destroySpy).toHaveBeenCalledTimes(1);
        // After destroy the host's generated chrome is gone.
        expect(host.querySelector(".nv-bar")).toBeNull();
    });

    it("keeps the latest callback without rebuilding when only the handler changes", () => {
        const ref = createRef<NavaloneHandle>();
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = render(<Navalone ref={ref} items={items} onOpen={first} />);
        const instance = ref.current?.instance;

        rerender(<Navalone ref={ref} items={items} onOpen={second} />);
        // Same instance — no teardown just because the handler identity changed.
        expect(ref.current?.instance).toBe(instance);

        act(() => {
            ref.current?.open();
        });
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });
});
