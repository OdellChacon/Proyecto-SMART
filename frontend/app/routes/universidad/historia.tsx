import { PaginaDeSeccion, Parrafos, Pendiente } from "~/components/sitio/Pagina";
import { metaDePagina } from "~/lib/meta";
import { useSitio } from "~/lib/useSitio";

import type { Route } from "./+types/historia";

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Historia", "Reseña histórica de la universidad.");

export default function Historia() {
  const { historia } = useSitio();
  return (
    <PaginaDeSeccion seccion="/la-universidad" titulo="Historia" url="/la-universidad/historia">
      {historia ? (
        <Parrafos texto={historia} />
      ) : (
        <Pendiente>La reseña histórica está pendiente de publicar.</Pendiente>
      )}
    </PaginaDeSeccion>
  );
}
