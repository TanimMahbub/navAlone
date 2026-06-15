import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `pnpm --filter @navalone/react example` runs this (root = the example dir).
export default defineConfig({
    plugins: [react()],
    server: { port: 5181 }
});
