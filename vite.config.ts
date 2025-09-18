import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Enable ads - other values will come from your .env file
    'import.meta.env.VITE_ADS_ENABLED': JSON.stringify('true'),
    'import.meta.env.VITE_ADS_DEBUG': JSON.stringify('true'),
  },
}));
