import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("http://localhost:4000"),
  },
  server: {
    port: 4200,
    host: true,
    allowedHosts: ["localhost", ".ngrok-free.app", ".ngrok.io"],
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
