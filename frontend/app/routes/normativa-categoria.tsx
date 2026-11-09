import { data } from "react-router";

import { DocumentosFiltrables } from "~/components/sitio/ListaDocumentos";
import { PaginaDeSeccion } from "~/components/sitio/Pagina";
import { obtener } from "~/lib/contenido.server";
import { metaDePagina } from "~/lib/meta";
import type { CategoriaDocumento, Documento } from "~/lib/tipos";

import type { Route } from "./+types/normativa-categoria";

export async function loader({ params }: Route.LoaderArgs) {
  const slug = encodeURIComponent(params.categoria);
  const [categorias, documentos] = await Promise.all([
    obtener<CategoriaDocumento[]>("documentos/categorias/"),
    obtener<Documento[]>(`documentos/?categoria=${slug}`),
  ]);
  const categoria = categorias.find((c) => c.slug === params.categoria);
  if (!categoria) throw data(null, { status: 404 });
  return { categoria, documentos };
}

export const meta: Route.MetaFunction = ({ matches, data }) =>
  metaDePagina(matches, data?.categoria.nombre ?? "Normativa", data?.categoria.descripcion);

export default function NormativaCategoria({ loaderData }: Route.ComponentProps) {
  const { categoria, documentos } = loaderData;
  return (
    <PaginaDeSeccion
      seccion="/normativa"
      titulo={categoria.nombre}
      url={`/normativa/${categoria.slug}`}
      introduccion={categoria.descripcion || undefined}
    >
      {documentos.length ? (
        <DocumentosFiltrables documentos={documentos} />
      ) : (
        <p className="text-texto-secundario">Todavía no hay documentos publicados en esta categoría.</p>
      )}
    </PaginaDeSeccion>
  );
}
