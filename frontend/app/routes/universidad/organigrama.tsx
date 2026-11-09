import { PaginaDeSeccion, Pendiente } from "~/components/sitio/Pagina";
import { metaDePagina } from "~/lib/meta";
import { useSitio } from "~/lib/useSitio";

import type { Route } from "./+types/organigrama";

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Organigrama", "Estructura organizativa de la universidad.");

const NIVEL = [
  "bg-marca text-sobre-marca",
  "bg-marca-medio text-sobre-marca",
  "border border-borde bg-superficie",
];

export default function Organigrama() {
  const { organigrama, organigrama_descripcion: niveles } = useSitio();
  return (
    <PaginaDeSeccion seccion="/la-universidad" titulo="Organigrama" url="/la-universidad/organigrama">
      <div className="flex flex-col gap-8">
        {organigrama && (
          <figure className="flex flex-col gap-3">
            <img
              src={organigrama}
              alt="Organigrama de la universidad (descrito en texto más abajo)"
              className="w-full rounded-lg border border-borde"
            />
            <figcaption className="text-sm text-texto-secundario">
              <a href={organigrama}>Abrir el organigrama en tamaño completo</a>
            </figcaption>
          </figure>
        )}
        {niveles.length > 0 && (
          <section aria-labelledby="t-estructura">
            <h2 id="t-estructura" className="mb-6 text-2xl">
              Estructura
            </h2>
            <ol className="flex flex-col items-center">
              {niveles.map((n, i) => (
                <li key={n} className="flex w-full max-w-md flex-col items-center">
                  {i > 0 && <span aria-hidden className="h-6 w-0.5 bg-borde-fuerte" />}
                  <span
                    className={`w-full rounded-md px-5 py-4 text-center font-semibold ${NIVEL[Math.min(i, 2)]}`}
                  >
                    {n}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {!organigrama && niveles.length === 0 && (
          <Pendiente>El organigrama está pendiente de publicar.</Pendiente>
        )}
      </div>
    </PaginaDeSeccion>
  );
}
