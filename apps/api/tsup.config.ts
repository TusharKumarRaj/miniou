import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  splitting: false,
  bundle: true,
  // Bundle app code; keep workspace packages and native/optional deps external.
  external: [/^@repo\//, "pg", "pg-native"],
  outDir: "./dist",
  clean: true,
  env: { IS_SERVER_BUILD: "true" },
  loader: { ".json": "copy" },
  minify: true,
  sourcemap: false,
  platform: "node",
  target: "node20",
});
