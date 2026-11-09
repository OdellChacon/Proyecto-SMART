import { Form, Link } from "react-router";

import { ListaDocumentos } from "~/components/sitio/ListaDocumentos";
import { CabeceraPagina, TituloBloque } from "~/components/sitio/Pagina";
import { TarjetaCarrera, TarjetaNoticia } from "~/components/sitio/Tarjetas";
import { Icono } from "~/components/ui/Icono";
import { obtener } from "~/lib/contenido.server";
import { metaDePagina } from "~/lib/meta";
import type { ResultadosBusqueda } from "~/lib/tipos";

import type { Route } from "./+types/buscar";

export async function loader({ request }: Route.LoaderArgs) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return { q, resultados: null };
  return { q, resultados: await obtener<ResultadosBusqueda>(`buscar/?q=${encodeURIComponent(q)}`) };
}

export const meta: Route.MetaFunction = ({ matches, data }) => [
  ...metaDePagina(matches, data?.q ? `Resultados para «${data.q}»` : "Buscar"),
  { name: "robots", content: "noindex" },
];

const SUGERENCIAS = ["Admisión", "Pensum", "Reglamento", "Enfermería", "Horario"];

export default function Buscar({ loaderData }: Route.ComponentProps) {
  const { q, resultados: r } = loaderData;
  const total = r ? r.carreras.length + r.noticias.length + r.documentos.length + r.paginas.length : 0;

  return (
    <>
      <CabeceraPagina titulo="Buscar en el sitio" ruta={[{ titulo: "Buscar", url: "/buscar" }]}>
        <Form method="get" role="search" className="flex max-w-2xl flex-col gap-3 pt-2 sm:flex-row">
          <label htmlFor="q" className="sr-only">¿Qué estás buscando?</label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            key={q}
            placeholder="Escribe lo que buscas, por ejemplo: requisitos"
            className="min-h-14 flex-1 rounded-md border-[1.5px] border-borde-campo bg-superficie px-4 text-base focus:border-foco"
          />
          <button type="submit" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-marca-medio px-7 font-semibold text-sobre-marca hover:bg-marca">
            <Icono nombre="buscar" /> Buscar
          </button>
        </Form>
      </CabeceraPagina>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        {!r ? (
          <div className="flex flex-col gap-4">
            <p className="text-lg text-texto-secundario">
              {q ? "Escribe al menos 2 letras para buscar." : "Prueba con alguna de estas búsquedas:"}
            </p>
            <ul className="flex flex-wrap gap-2">
              {SUGERENCIAS.map((s) => (
                <li key={s}>
                  <Link to={`/buscar?q=${encodeURIComponent(s)}`} className="inline-flex min-h-11 items-center rounded-full border border-borde px-4 font-semibold no-underline hover:bg-marca-sutil">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : total === 0 ? (
          <div className="flex max-w-2xl flex-col gap-4">
            <h2 className="text-2xl">No encontramos resultados para «{q}»</h2>
            <ul className="flex list-disc flex-col gap-2 pl-6 text-texto-secundario">
              <li>Revisa que las palabras estén bien escritas.</li>
              <li>Prueba con una palabra más general, como «carreras» o «requisitos».</li>
              <li>
                Si no lo encuentras, <Link to="/contacto">escríbenos</Link> y te ayudamos.
              </li>
            </ul>
          </div>
        ) : (
          <div className="flex flex-col gap-14">
            <p aria-live="polite" className="text-lg">
              {total} {total === 1 ? "resultado" : "resultados"} para «<strong>{q}</strong>».
            </p>
            {r.paginas.length > 0 && (
              <section aria-labelledby="r-paginas">
                <TituloBloque id="r-paginas">Páginas</TituloBloque>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {r.paginas.map((p) => (
                    <li key={p.url}>
                      <Link to={p.url} prefetch="intent" className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-borde px-5 font-semibold text-texto no-underline transition-colors hover:border-marca-medio hover:bg-marca-sutil">
                        {p.titulo} <Icono nombre="flecha-derecha" className="text-marca-medio" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {r.carreras.length > 0 && (
              <section aria-labelledby="r-carreras">
                <TituloBloque id="r-carreras">Carreras</TituloBloque>
                <div className="grid gap-6 md:grid-cols-3">
                  {r.carreras.map((c) => <TarjetaCarrera key={c.slug} carrera={c} />)}
                </div>
              </section>
            )}
            {r.noticias.length > 0 && (
              <section aria-labelledby="r-noticias">
                <TituloBloque id="r-noticias">Noticias</TituloBloque>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {r.noticias.map((n) => <TarjetaNoticia key={n.slug} noticia={n} />)}
                </div>
              </section>
            )}
            {r.documentos.length > 0 && (
              <section aria-labelledby="r-documentos">
                <TituloBloque id="r-documentos">Documentos</TituloBloque>
                <ListaDocumentos documentos={r.documentos} />
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
