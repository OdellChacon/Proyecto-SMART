import { data, Form, Link } from "react-router";

import { EnlaceBoton } from "~/components/ui/Boton";
import { Icono } from "~/components/ui/Icono";
import { MENU } from "~/lib/mapa";
import { metaDePagina } from "~/lib/meta";

import type { Route } from "./+types/no-encontrada";

export const meta: Route.MetaFunction = ({ matches }) => [
  ...metaDePagina(matches, "Página no encontrada"),
  { name: "robots", content: "noindex" },
];

export function loader() {
  return data(null, { status: 404 });
}

export default function NoEncontrada() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6 lg:py-24">
      <p className="text-xs font-bold tracking-widest text-acento uppercase">Error 404</p>
      <h1 className="text-[2.25rem] leading-[2.75rem] lg:text-3xl">No encontramos esta página</h1>
      <p className="text-lg text-texto-secundario">
        Puede que la dirección esté mal escrita o que la página ya no exista. Prueba a buscar lo que
        necesitas o entra por una de las secciones.
      </p>
      <Form method="get" action="/buscar" role="search" className="flex max-w-xl flex-col gap-3 sm:flex-row">
        <label htmlFor="q-404" className="sr-only">Buscar en el sitio</label>
        <input id="q-404" name="q" type="search" placeholder="Buscar en el sitio"
          className="min-h-14 flex-1 rounded-md border-[1.5px] border-borde-campo px-4 text-base focus:border-foco" />
        <button type="submit" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-marca-medio px-6 font-semibold text-sobre-marca hover:bg-marca">
          <Icono nombre="buscar" /> Buscar
        </button>
      </Form>
      <ul className="flex flex-wrap gap-2">
        {MENU.map((s) => (
          <li key={s.url}>
            <Link to={s.url} className="inline-flex min-h-11 items-center rounded-full border border-borde px-4 font-semibold no-underline hover:bg-marca-sutil">
              {s.titulo}
            </Link>
          </li>
        ))}
      </ul>
      <EnlaceBoton to="/" estilo="secundario" icono="flecha-izquierda" iconoAntes className="self-start">
        Volver al inicio
      </EnlaceBoton>
    </div>
  );
}
