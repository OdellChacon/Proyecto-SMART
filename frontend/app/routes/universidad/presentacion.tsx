import { Link } from "react-router";

import { PaginaDeSeccion, Parrafos, Pendiente } from "~/components/sitio/Pagina";
import { Icono } from "~/components/ui/Icono";
import { MENU } from "~/lib/mapa";
import { metaDePagina } from "~/lib/meta";
import { useSitio } from "~/lib/useSitio";

import type { Route } from "./+types/presentacion";

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "La Universidad", "Quiénes somos: historia, misión, autoridades y sede.");

export default function LaUniversidad() {
  const sitio = useSitio();
  const paginas = MENU[0]?.hijos ?? [];
  return (
    <PaginaDeSeccion
      seccion="/la-universidad"
      titulo="La Universidad"
      url="/la-universidad"
      introduccion={sitio.lema || undefined}
    >
      <div className="flex flex-col gap-12">
        {sitio.mision ? (
          <section
            aria-labelledby="t-mision"
            className="flex flex-col gap-4 rounded-lg border-l-4 border-acento bg-sutil p-6 lg:p-8"
          >
            <h2 id="t-mision" className="text-xl">
              Nuestra misión
            </h2>
            <Parrafos texto={sitio.mision} className="text-xl leading-9" />
          </section>
        ) : (
          <Pendiente>La misión de la universidad está pendiente de publicar.</Pendiente>
        )}

        <section aria-labelledby="t-conoce">
          <h2 id="t-conoce" className="mb-6 text-2xl">
            Conoce la universidad
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {paginas.map((p) => (
              <li key={p.url}>
                <Link
                  to={p.url}
                  prefetch="intent"
                  className="group flex min-h-20 items-center justify-between gap-4 rounded-lg border border-borde bg-superficie px-6 py-4 text-lg font-semibold text-texto no-underline transition-colors hover:border-marca-medio hover:bg-marca-sutil"
                >
                  {p.titulo}
                  <Icono nombre="flecha-derecha" className="text-marca-medio" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {sitio.datos_legales.length > 0 && (
          <section aria-labelledby="t-legal">
            <h2 id="t-legal" className="mb-4 text-2xl">
              Datos legales
            </h2>
            <dl className="grid gap-px overflow-hidden rounded-lg border border-borde bg-borde">
              {sitio.datos_legales.map((linea) => {
                const [clave = "", ...resto] = linea.split(":");
                const tieneClave = resto.length > 0;
                return (
                  <div
                    key={linea}
                    className="grid gap-1 bg-superficie px-5 py-4 sm:grid-cols-[18rem_1fr]"
                  >
                    <dt className="font-semibold">{tieneClave ? clave : "Dato"}</dt>
                    <dd className="text-texto-secundario">
                      {tieneClave ? resto.join(":").trim() : linea}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}
      </div>
    </PaginaDeSeccion>
  );
}
