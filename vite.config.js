import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  root: "/github-page/",
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: "../src",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
      },
    },
  },
  publicDir: resolve(__dirname, "public"),
});
