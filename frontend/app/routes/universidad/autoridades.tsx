import { PaginaDeSeccion, Parrafos, Pendiente } from "~/components/sitio/Pagina";
import { Foto } from "~/components/ui/Foto";
import { Icono } from "~/components/ui/Icono";
import { obtener } from "~/lib/contenido.server";
import { metaDePagina } from "~/lib/meta";
import type { Autoridad } from "~/lib/tipos";

import type { Route } from "./+types/autoridades";

export async function loader() {
  return { autoridades: await obtener<Autoridad[]>("autoridades/") };
}

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Autoridades", "Autoridades de la universidad.");

export default function Autoridades({ loaderData }: Route.ComponentProps) {
  const { autoridades } = loaderData;
  return (
    <PaginaDeSeccion seccion="/la-universidad" titulo="Autoridades" url="/la-universidad/autoridades">
      {autoridades.length === 0 ? (
        <Pendiente>La lista de autoridades está pendiente de publicar.</Pendiente>
      ) : (
        <ul className="grid gap-6 xl:grid-cols-2">
          {autoridades.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-5 rounded-lg border border-borde p-6 sm:flex-row"
            >
              {a.foto ? (
                <Foto
                  imagen={a.foto}
                  alt={`Foto de ${a.nombre}`}
                  sizes="128px"
                  className="h-40 w-32 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-40 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-md bg-marca-sutil text-xs font-semibold text-marca-medio">
                  <Icono nombre="usuario" tamano={40} />
                  Foto pendiente
                </div>
              )}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold tracking-wide text-acento uppercase">{a.cargo}</p>
                <h2 className="text-xl">{a.nombre}</h2>
                {a.resena && (
                  <Parrafos texto={a.resena} className="text-base leading-7 text-texto-secundario" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PaginaDeSeccion>
  );
}
