import * as esbuild from "esbuild";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTS = [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.js"];

function resolveAlias(rawPath) {
  for (const ext of EXTS) {
    const full = rawPath + ext;
    if (fs.existsSync(full)) return full;
  }
  return rawPath;
}

await esbuild.build({
  entryPoints: ["api/_src.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
  outfile: "api/index.js",
  plugins: [
    {
      name: "tsconfig-paths",
      setup(build) {
        build.onResolve({ filter: /^@shared\// }, (args) => ({
          path: resolveAlias(
            path.resolve(__dirname, args.path.replace("@shared/", "shared/"))
          ),
        }));
        build.onResolve({ filter: /^@\// }, (args) => ({
          path: resolveAlias(
            path.resolve(__dirname, args.path.replace("@/", ""))
          ),
        }));
      },
    },
  ],
});

console.log("Server bundle built → api/index.js");
