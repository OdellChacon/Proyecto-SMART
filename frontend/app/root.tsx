import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import fuenteSans from "@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2?url";
import fuenteSerif from "@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2?url";

import estilos from "./styles/app.css?url";

/**
 * Analítica de visitas con Cloudflare Web Analytics: no usa cookies ni datos personales,
 * así que no necesita aviso de consentimiento. Se activa con VITE_CF_ANALYTICS_TOKEN.
 */
const ANALITICA = import.meta.env.VITE_CF_ANALYTICS_TOKEN as string | undefined;

export const links: Route.LinksFunction = () => [
  // Las dos fuentes se piden de inmediato, sin esperar a leer el CSS (mejora el primer dibujo).
  { rel: "preload", href: fuenteSans, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "preload", href: fuenteSerif, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: estilos },
  { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0F2A47" />
        <Meta />
        <Links />
      </head>
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-superficie focus:px-4 focus:py-3 focus:font-semibold"
        >
          Saltar al contenido
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
        {ANALITICA && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: ANALITICA })}
          />
        )}
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let titulo = "Algo salió mal";
  let detalle = "Ocurrió un error inesperado. Recarga la página o vuelve más tarde.";
  if (isRouteErrorResponse(error) && error.status === 404) {
    titulo = "No encontramos esta página";
    detalle = "Puede que la dirección esté mal escrita o que la página ya no exista.";
  }
  return (
    <main id="contenido" className="mx-auto flex max-w-2xl flex-col gap-4 px-5 py-16">
      <h1 className="text-2xl lg:text-3xl">{titulo}</h1>
      <p className="text-lg text-texto-secundario">{detalle}</p>
      <p>
        <a href="/">Volver al inicio</a>
      </p>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="overflow-x-auto rounded-md bg-sutil p-4 text-sm">{error.stack}</pre>
      )}
    </main>
  );
}
