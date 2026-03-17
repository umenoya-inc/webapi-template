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
  },
  lint: {
    jsPlugins: ["./lint/module-boundary/index.js", "./lint/single-export/index.js"],
    overrides: [
      {
        files: ["src/routes/**/*.ts", "src/modules/**/*.ts"],
        rules: {
          "module-boundary/no-module-internal-import": "error",
          "single-export/one-export-per-file": "error",
        },
      },
    ],
  },
})
