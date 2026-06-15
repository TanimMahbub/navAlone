import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

// Flat config. Formatting (4-space JS/TS, tab CSS) is owned by Prettier; ESLint
// handles code-quality only, with eslint-config-prettier disabling any rules
// that would conflict with the formatter.
export default tseslint.config(
    {
        ignores: [
            "**/dist/**",
            "**/node_modules/**",
            "**/*.min.js",
            "**/coverage/**",
            // legacy plain-JS prototype, superseded by packages/core
            "app.js",
            "app.css"
        ]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
        }
    },
    {
        // Node-run build/test scripts use Node globals.
        files: ["**/*.mjs", "**/*.cjs", "**/scripts/**", "**/test/e2e/**"],
        languageOptions: {
            globals: {
                console: "readonly",
                process: "readonly",
                URL: "readonly",
                URLSearchParams: "readonly"
            }
        }
    }
);
