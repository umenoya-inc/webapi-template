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
      "./lint/contract-style/index.js",
    ],
    overrides: [
      {
        files: ["src/routes/**/*.ts", "src/modules/**/*.ts"],
        rules: {
          "module-boundary/no-module-internal-import": "error",
          "single-export/one-export-per-file": "error",
          "import-style/no-namespace-import": "error",
          "test-boundary/no-testutil-in-production": "error",
          "contract-style/require-fn-as-const": "error",
        },
      },
    ],
  },
})
