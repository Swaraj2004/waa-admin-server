import { build } from "esbuild";
import path from "path";

build({
  entryPoints: [
    path.resolve("src/devicesRoot.tsx"),
    path.resolve("src/postingRoot.tsx"),
  ],
  bundle: true,
  outdir: "public/static",
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  jsxImportSource: "hono/jsx/dom",
  sourcemap: true,
  loader: {
    ".ts": "ts",
    ".tsx": "tsx",
  },
}).catch(() => console.error("Build failed!"));
