import { Link } from "react-router";

import { ListaAvisos } from "~/components/sitio/Avisos";
import { PaginaDeSeccion, TituloBloque } from "~/components/sitio/Pagina";
import { TarjetaNoticia } from "~/components/sitio/Tarjetas";
import { Icono } from "~/components/ui/Icono";
import { obtener, obtenerOpcional } from "~/lib/contenido.server";
import { metaDePagina } from "~/lib/meta";
import type { Aviso, NoticiaTarjeta, Pagina } from "~/lib/tipos";

import type { Route } from "./+types/noticias";

const POR_PAGINA = 9;

export async function loader({ request }: Route.LoaderArgs) {
  const pedida = Number(new URL(request.url).searchParams.get("pagina") ?? "1");
  const pagina = Number.isInteger(pedida) && pedida > 0 ? pedida : 1;
  const [noticias, avisos] = await Promise.all([
    obtener<Pagina<NoticiaTarjeta>>(`noticias/?page=${pagina}`),
    obtenerOpcional<Aviso[]>("avisos/", []),
  ]);
  return { noticias, avisos, pagina, total: Math.max(1, Math.ceil(noticias.count / POR_PAGINA)) };
}

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Noticias", "Noticias y avisos de la universidad.");

export default function Noticias({ loaderData }: Route.ComponentProps) {
  const { noticias, avisos, pagina, total } = loaderData;
  return (
    <PaginaDeSeccion seccion="/noticias" titulo="Noticias" url="/noticias">
      <div className="flex flex-col gap-14">
        {avisos.length > 0 && (
          <section aria-labelledby="avisos" className="scroll-mt-6">
            <TituloBloque id="avisos">Avisos</TituloBloque>
            <ListaAvisos avisos={avisos} />
          </section>
        )}

        <section aria-labelledby="t-noticias">
          <TituloBloque id="t-noticias">Últimas noticias</TituloBloque>
          {noticias.results.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {noticias.results.map((n) => (
                <TarjetaNoticia key={n.slug} noticia={n} />
              ))}
            </div>
          ) : (
            <p className="text-texto-secundario">Todavía no hay noticias publicadas.</p>
          )}
          {total > 1 && (
            <nav aria-label="Páginas de noticias" className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-borde pt-6">
              {pagina > 1 ? (
                <Link to={`?pagina=${pagina - 1}`} className="inline-flex min-h-11 items-center gap-2 font-semibold">
                  <Icono nombre="flecha-izquierda" /> Noticias más recientes
                </Link>
              ) : (
                <span />
              )}
              <span className="text-texto-secundario">
                Página {pagina} de {total}
              </span>
              {pagina < total ? (
                <Link to={`?pagina=${pagina + 1}`} className="inline-flex min-h-11 items-center gap-2 font-semibold">
                  Noticias anteriores <Icono nombre="flecha-derecha" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </div>
    </PaginaDeSeccion>
  );
}
