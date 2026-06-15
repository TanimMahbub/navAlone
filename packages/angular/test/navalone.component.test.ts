import { Component, ViewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { NavaloneComponent } from "../src/navalone.component";
import type { NavaloneItem, NavaloneSubmenuOpenDetail } from "../src/public-api";

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

@Component({
    standalone: true,
    imports: [NavaloneComponent],
    template: `<navalone-menu
        #menu
        [items]="items"
        (open)="opened = true"
        (submenuopen)="lastSubmenu = $event"
    ></navalone-menu>`
})
class HostComponent {
    @ViewChild("menu") menu!: NavaloneComponent;
    items = items;
    opened = false;
    lastSubmenu: NavaloneSubmenuOpenDetail | null = null;
}

function setup(): { fixture: ComponentFixture<HostComponent>; host: HostComponent } {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance };
}

describe("@navalone/angular", () => {
    it("renders the desktop bar from the items model", () => {
        const { fixture } = setup();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector(".navalone")).toBeTruthy();
        expect(el.querySelectorAll(".nv-menubar > li").length).toBe(2);
        fixture.destroy();
    });

    it("opens a submenu and emits submenuopen", () => {
        const { fixture, host } = setup();
        host.menu.openSubmenu("company");
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector("#company")?.classList.contains("is-open")).toBe(true);
        expect(host.lastSubmenu?.id).toBe("company");
        fixture.destroy();
    });

    it("opens the drawer and emits open", () => {
        const { fixture, host } = setup();
        host.menu.openDrawer();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector(".navalone")?.classList.contains("nv-open")).toBe(true);
        expect(host.opened).toBe(true);
        fixture.destroy();
    });

    it("calls destroy() on teardown, reverting the host element", () => {
        const { fixture, host } = setup();
        const coreHost = host.menu.core!["root"] as HTMLElement;
        expect(coreHost.querySelector(".nv-bar")).toBeTruthy();
        fixture.destroy();
        expect(coreHost.querySelector(".nv-bar")).toBeNull();
    });
});
