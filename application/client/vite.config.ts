import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [nodePolyfills(), babel()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  test: {
    includeSource: ["src/**/*.ts"],
  },
});
