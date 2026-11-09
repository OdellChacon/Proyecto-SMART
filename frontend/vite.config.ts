import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Lee el .env de la raíz del monorepo.
  const env = loadEnv(mode, "..", "");
  const api = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8077";

  return {
    envDir: "..",
    plugins: [tailwindcss(), reactRouter()],
    resolve: { tsconfigPaths: true },
    server: {
      port: 5180,
      strictPort: true,
      // Mismo origen para el navegador: la cookie de sesión y la CSRF funcionan sin CORS.
      proxy: {
        "/api": { target: api, changeOrigin: true },
        "/admin": { target: api, changeOrigin: true },
        "/static": { target: api, changeOrigin: true },
        "/media": { target: api, changeOrigin: true },
      },
    },
  };
});
