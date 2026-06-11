import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 11053,
    proxy: {
      "/api": "http://127.0.0.1:11052",
      "/health": "http://127.0.0.1:11052",
    },
  },
  build: { outDir: "dist" },
});
