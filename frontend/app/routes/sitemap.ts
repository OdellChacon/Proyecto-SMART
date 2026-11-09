import { obtenerOpcional } from "~/lib/contenido.server";
import { MENU } from "~/lib/mapa";
import type { CarreraTarjeta, CategoriaDocumento, NoticiaTarjeta, Pagina } from "~/lib/tipos";

import type { Route } from "./+types/sitemap";

/** sitemap.xml para Google y el ministerio: páginas fijas + carreras + noticias. */
export async function loader({ request }: Route.LoaderArgs) {
  const origen = process.env.SITIO_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  const [carreras, noticias, categorias] = await Promise.all([
    obtenerOpcional<CarreraTarjeta[]>("carreras/", []),
    obtenerOpcional<Pagina<NoticiaTarjeta>>("noticias/?tamano=30", {
      count: 0, next: null, previous: null, results: [],
    }),
    obtenerOpcional<CategoriaDocumento[]>("documentos/categorias/", []),
  ]);

  const rutas = new Set<string>(["/", "/eventos", "/galeria", "/privacidad"]);
  for (const s of MENU) {
    rutas.add(s.url);
    for (const h of s.hijos) if (!h.url.includes("#")) rutas.add(h.url);
  }
  carreras.forEach((c) => rutas.add(`/carreras/${c.slug}`));
  categorias.forEach((c) => rutas.add(`/normativa/${c.slug}`));

  const urls = [
    ...[...rutas].map((r) => `<url><loc>${origen}${r}</loc></url>`),
    ...noticias.results.map(
      (n) => `<url><loc>${origen}/noticias/${n.slug}</loc><lastmod>${n.fecha.slice(0, 10)}</lastmod></url>`,
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
