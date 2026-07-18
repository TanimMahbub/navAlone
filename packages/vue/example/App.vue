<script setup lang="ts">
import { ref } from "vue";
// In a real app this is `import { Navalone } from "@navalone/vue"`.
import { Navalone, type NavaloneExposed } from "../src/index";
import { demoItems } from "./demo-items";

const menu = ref<NavaloneExposed | null>(null);
const log = ref<string[]>([]);

function push(line: string) {
    log.value = [line, ...log.value].slice(0, 8);
}
</script>

<template>
    <main style="font-family: system-ui, sans-serif">
        <Navalone
            ref="menu"
            :items="demoItems"
            :logo="{ text: 'Navalone', href: '#' }"
            :right-buttons="[
                { label: 'Log in', href: '#login' },
                { label: 'Sign up', href: '#signup', variant: 'primary' }
            ]"
            @open="push('drawer opened')"
            @close="push('drawer closed')"
            @submenuopen="(d) => push(`submenu opened: ${d.id}`)"
            @submenuclose="(d) => push(`submenu closed: ${d.id}`)"
            @navigate="(d) => push(`navigate ${d.from} → ${d.to}`)"
        />

        <section style="max-width: 720px; margin: 2rem auto; padding: 0 1rem">
            <h1>@navalone/vue example</h1>
            <p>Resize below the breakpoint (960px) to collapse into the mobile drawer.</p>

            <div style="display: flex; gap: 8px; flex-wrap: wrap">
                <button @click="menu?.open()">open drawer</button>
                <button @click="menu?.close()">close drawer</button>
                <button @click="menu?.openSubmenu('resources')">open mega (desktop)</button>
                <button @click="menu?.closeAll()">close all</button>
            </div>

            <h2>Event log</h2>
            <ul id="event-log">
                <li v-for="(line, i) in log" :key="i">{{ line }}</li>
            </ul>
        </section>
    </main>
</template>
