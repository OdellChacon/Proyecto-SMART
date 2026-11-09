import { Link } from "react-router";

import { DocumentosFiltrables } from "~/components/sitio/ListaDocumentos";
import { PaginaDeSeccion, TituloBloque } from "~/components/sitio/Pagina";
import { Icono } from "~/components/ui/Icono";
import { FLECHA, LineaAcento, TARJETA_ENLACE } from "~/components/ui/Tarjeta";
import { obtener } from "~/lib/contenido.server";
import { metaDePagina } from "~/lib/meta";
import type { CategoriaDocumento, Documento } from "~/lib/tipos";

import type { Route } from "./+types/normativa";

export async function loader() {
  const [categorias, documentos] = await Promise.all([
    obtener<CategoriaDocumento[]>("documentos/categorias/"),
    obtener<Documento[]>("documentos/"),
  ]);
  return { categorias, documentos };
}

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Normativa", "Reglamentos, documentos legales y formatos descargables.");

export default function Normativa({ loaderData }: Route.ComponentProps) {
  const { categorias, documentos } = loaderData;
  return (
    <PaginaDeSeccion
      seccion="/normativa"
      titulo="Normativa"
      url="/normativa"
      introduccion="Los reglamentos y documentos oficiales de la universidad, listos para descargar."
    >
      <div className="flex flex-col gap-14">
        <ul className="grid gap-4 md:grid-cols-3">
          {categorias.map((c) => (
            <li key={c.slug}>
              <Link
                to={`/normativa/${c.slug}`}
                prefetch="intent"
                className={`${TARJETA_ENLACE} flex h-full flex-col gap-3 p-6 text-texto no-underline`}
              >
                <Icono nombre="documento" className="text-marca-medio" tamano={26} />
                <span className="font-serif text-xl font-semibold">{c.nombre}</span>
                {c.descripcion && <span className="text-texto-secundario">{c.descripcion}</span>}
                <span className="mt-auto flex items-center justify-between gap-3 border-t border-borde pt-3 text-sm font-semibold text-enlace">
                  {c.total} {c.total === 1 ? "documento" : "documentos"}
                  <Icono nombre="flecha-derecha" tamano={18} className={FLECHA} />
                </span>
                <LineaAcento />
              </Link>
            </li>
          ))}
        </ul>
        {documentos.length > 0 && (
          <section aria-labelledby="t-documentos">
            <TituloBloque id="t-documentos">Todos los documentos</TituloBloque>
            <DocumentosFiltrables documentos={documentos} />
          </section>
        )}
      </div>
    </PaginaDeSeccion>
  );
}
