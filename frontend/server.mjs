/**
 * Servidor de producción del sitio público.
 *
 * - Entrega las páginas ya armadas (render en servidor) y los archivos de /assets.
 * - Reenvía /api, /admin, /static y /media a Django, para que el navegador vea un solo
 *   dominio: la cookie de sesión y la protección CSRF funcionan sin CORS (igual que el
 *   proxy de Vite en desarrollo).
 *
 * Variables: PORT (Render la define), API_INTERNA_URL (dirección interna de Django).
 */
import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const PUERTO = Number(process.env.PORT || 3000);
// Render entrega la dirección interna como «host:puerto»; se completa con http://.
const crudo = process.env.API_INTERNA_URL || "http://127.0.0.1:8077";
const API = (/^https?:\/\//.test(crudo) ? crudo : `http://${crudo}`).replace(/\/$/, "");
// Django necesita saber que la conexión original era HTTPS y desde qué IP llegó.
const PROXIES_DE_CONFIANZA = Number(process.env.PROXIES_DE_CONFIANZA || 1);

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", PROXIES_DE_CONFIANZA);
app.use(compression());

app.get("/salud", (_req, res) => res.json({ estado: "ok" }));

const haciaDjango = createProxyMiddleware({
  target: API,
  changeOrigin: false, // Django valida el Host contra ALLOWED_HOSTS: llega el dominio público
  xfwd: true,
  pathFilter: ["/api", "/admin", "/static", "/media"],
});
app.use(haciaDjango);

// Archivos con huella en el nombre: se guardan en caché un año.
app.use("/assets", express.static("build/client/assets", { immutable: true, maxAge: "1y" }));
app.use(express.static("build/client", { maxAge: "1h" }));

app.all(
  "*splat",
  createRequestHandler({ build: () => import("./build/server/index.js") }),
);

app.listen(PUERTO, () => {
  console.log(`Sitio en http://localhost:${PUERTO} (API: ${API})`);
});
