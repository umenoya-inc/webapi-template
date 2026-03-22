import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite-plus"
import devServer from "@hono/vite-dev-server"
import build from "@hono/vite-build/node"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    devServer({
      entry: "src/index.ts",
    }),
    build({
      entry: "src/index.ts",
    }),
  ],
  test: {
    setupFiles: ["./src/testing/effectErrorHandler.setup.ts"],
  },
  fmt: {
    semi: false,
    quoteProps: "preserve",
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      "./lint/module-boundary/index.js",
      "./lint/single-export/index.js",
      "./lint/import-style/index.js",
      "./lint/test-boundary/index.js",
      "./lint/type-complexity/index.js",
      "./lint/db-safety/index.js",
      "./lint/effect-structure/index.js",
      "./lint/naming-convention/index.js",
    ],
    overrides: [
      {
        files: ["src/**/*.ts"],
        rules: {
          "module-boundary/no-module-internal-import": [
            "error",
            { basePath: "src", aliasPrefix: "@/" },
          ],
          "module-boundary/enforce-dependencies": ["error", { basePath: "src", aliasPrefix: "@/" }],
          "single-export/one-export-per-file": "error",
          "import-style/no-namespace-import": "error",
          "test-boundary/no-testutil-in-production": "error",
          "type-complexity/type-expansion-cost": "warn",
          "db-safety/no-write-in-query": "error",
          "naming-convention/no-plural-table-name": "error",
          "effect-structure/no-service-in-db-effect": ["warn", { basePath: "src" }],
          "effect-structure/no-leaf-in-api-effect": ["warn", { basePath: "src" }],
        },
      },
    ],
  },
})
