import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [nodePolyfills(), react(), tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  test: {
    includeSource: ["src/**/*.ts"],
  },
});
