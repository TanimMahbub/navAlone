import { useRef, useState } from "react";
// In a real app this is `import { Navalone } from "@navalone/react"`.
import { Navalone, type NavaloneHandle } from "../src/index";
import { demoItems } from "./demo-items";

export default function App() {
    const menuRef = useRef<NavaloneHandle>(null);
    const [log, setLog] = useState<string[]>([]);

    const push = (line: string) => setLog((prev) => [line, ...prev].slice(0, 8));

    return (
        <main style={{ fontFamily: "system-ui, sans-serif" }}>
            <Navalone
                ref={menuRef}
                items={demoItems}
                logo={{ text: "Navalone", href: "#" }}
                rightButtons={[
                    { label: "Log in", href: "#login" },
                    { label: "Sign up", href: "#signup", variant: "primary" }
                ]}
                onOpen={() => push("drawer opened")}
                onClose={() => push("drawer closed")}
                onSubmenuOpen={(d) => push(`submenu opened: ${d.id}`)}
                onSubmenuClose={(d) => push(`submenu closed: ${d.id}`)}
                onNavigate={(d) => push(`navigate ${d.from} → ${d.to}`)}
            />

            <section style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
                <h1>@navalone/react example</h1>
                <p>Resize below the breakpoint (960px) to collapse into the mobile drawer.</p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => menuRef.current?.open()}>open drawer</button>
                    <button onClick={() => menuRef.current?.close()}>close drawer</button>
                    <button onClick={() => menuRef.current?.openSubmenu("resources")}>
                        open mega (desktop)
                    </button>
                    <button onClick={() => menuRef.current?.closeAll()}>close all</button>
                </div>

                <h2>Event log</h2>
                <ul id="event-log">
                    {log.map((line, i) => (
                        <li key={i}>{line}</li>
                    ))}
                </ul>
            </section>
        </main>
    );
}
