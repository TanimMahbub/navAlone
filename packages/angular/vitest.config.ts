import angular from "@analogjs/vite-plugin-angular";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [angular()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./test/setup.ts"],
        include: ["test/**/*.test.ts"],
        pool: "threads"
    }
});
