import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import devServer from "@hono/vite-dev-server";
import build from "@hono/vite-build/node";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  lint: {
    overrides: [
      {
        files: ["src/routes/**/*.ts", "src/modules/**/*.ts"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  regex: "^@/modules/[^/]+/.+",
                  message:
                    "モジュールの内部ファイルに直接アクセスしないでください。@/modules/<module名> 経由でインポートしてください。",
                },
                {
                  regex: "^\\.\\./",
                  message:
                    "相対パスでのモジュール外へのアクセスは禁止されています。@/modules/<module名> 経由でインポートしてください。",
                },
              ],
            },
          ],
        },
      },
    ],
  },
});
