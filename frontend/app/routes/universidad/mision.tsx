import { PaginaDeSeccion, Parrafos, Pendiente } from "~/components/sitio/Pagina";
import { metaDePagina } from "~/lib/meta";
import { useSitio } from "~/lib/useSitio";

import type { Route } from "./+types/mision";

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Misión, visión y valores", "Misión, visión y valores de la universidad.");

export default function Mision() {
  const { mision, vision, valores } = useSitio();
  const bloques = [
    { id: "mision", titulo: "Misión", texto: mision },
    { id: "vision", titulo: "Visión", texto: vision },
  ];
  return (
    <PaginaDeSeccion
      seccion="/la-universidad"
      titulo="Misión, visión y valores"
      url="/la-universidad/mision-vision-valores"
    >
      <div className="flex flex-col gap-10">
        <div className="grid gap-6 md:grid-cols-2">
          {bloques.map((b) => (
            <section
              key={b.id}
              aria-labelledby={`t-${b.id}`}
              className="flex flex-col gap-4 rounded-lg border-t-4 border-marca bg-sutil p-6 lg:p-8"
            >
              <h2 id={`t-${b.id}`} className="text-2xl">
                {b.titulo}
              </h2>
              {b.texto ? <Parrafos texto={b.texto} /> : <Pendiente>Pendiente de publicar.</Pendiente>}
            </section>
          ))}
        </div>
        <section aria-labelledby="t-valores">
          <h2 id="t-valores" className="mb-6 text-2xl">
            Valores
          </h2>
          {valores.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {valores.map((v) => (
                <li key={v.nombre} className="flex flex-col gap-2 rounded-lg border border-borde p-6">
                  <p className="font-serif text-xl font-semibold text-marca">{v.nombre}</p>
                  {v.descripcion && <p className="text-texto-secundario">{v.descripcion}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <Pendiente>Los valores institucionales están pendientes de publicar.</Pendiente>
          )}
        </section>
      </div>
    </PaginaDeSeccion>
  );
}
