import { defineConfig } from "tsup";

export default defineConfig({
  tsconfig: "./tsconfig.json",
  external: ["react", "react-dom"],
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  minify: false,
  sourcemap: true,
});