import { build } from "esbuild";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, "..");

async function buildApp() {
  try {
    await build({
      entryPoints: [join(rootDir, "src/index.tsx")],
      bundle: true,
      outfile: join(rootDir, "dist/index.js"),
      platform: "node",
      format: "esm",
      external: ["ws", "@hono/node-server", "xlsx"],
      jsx: "automatic",
      jsxImportSource: "hono/jsx",
      loader: {
        ".tsx": "tsx",
        ".ts": "ts",
        ".jsx": "jsx",
        ".js": "js",
      },
    });
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

buildApp();
