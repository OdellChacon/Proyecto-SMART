import type { Route } from "./+types/robots";

export function loader({ request }: Route.LoaderArgs) {
  const origen = process.env.SITIO_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  const texto = [
    "User-agent: *",
    "Disallow: /admin/",
    "Disallow: /api/",
    "Disallow: /cuenta",
    "Disallow: /buscar",
    `Sitemap: ${origen}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(texto, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
