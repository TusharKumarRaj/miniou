import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  splitting: false,
  bundle: true,
  noExternal: [/^@repo\//],
  // Bundle workspace packages; keep native/pg and Corsair runtime deps external.
  external: ["pg", "pg-native", "corsair", /^@corsair-dev\//],
  outDir: "./dist",
  clean: true,
  env: { IS_SERVER_BUILD: "true" },
  loader: { ".json": "copy" },
  minify: true,
  sourcemap: false,
  platform: "node",
  target: "node20",
});
