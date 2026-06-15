import { Component, ViewChild } from "@angular/core";
// In a real app this is `import { NavaloneComponent } from "@navalone/angular"`.
import { NavaloneComponent } from "../src/public-api";
import { demoItems } from "./demo-items";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [NavaloneComponent],
    template: `
        <navalone-menu
            #menu
            [items]="items"
            [logo]="{ text: 'Navalone', href: '#' }"
            [rightButtons]="[
                { label: 'Log in', href: '#login' },
                { label: 'Sign up', href: '#signup', variant: 'primary' }
            ]"
            (open)="push('drawer opened')"
            (close)="push('drawer closed')"
            (submenuopen)="push('submenu opened: ' + $event.id)"
            (submenuclose)="push('submenu closed: ' + $event.id)"
            (navigate)="push('navigate ' + $event.from + ' → ' + $event.to)"
        ></navalone-menu>

        <section style="max-width:720px;margin:2rem auto;padding:0 1rem">
            <h1>&#64;navalone/angular example</h1>
            <p>Resize below the breakpoint (960px) to collapse into the mobile drawer.</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button (click)="menu.openDrawer()">open drawer</button>
                <button (click)="menu.closeDrawer()">close drawer</button>
                <button (click)="menu.openSubmenu('resources')">open mega (desktop)</button>
                <button (click)="menu.closeAll()">close all</button>
            </div>
            <h2>Event log</h2>
            <ul id="event-log">
                @for (line of log; track $index) {
                    <li>{{ line }}</li>
                }
            </ul>
        </section>
    `
})
export class AppComponent {
    @ViewChild("menu") menu!: NavaloneComponent;
    items = demoItems;
    log: string[] = [];

    push(line: string): void {
        this.log = [line, ...this.log].slice(0, 8);
    }
}
