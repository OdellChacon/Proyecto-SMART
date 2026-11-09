import { Link } from "react-router";

import { PaginaDeSeccion, Parrafos, Pendiente } from "~/components/sitio/Pagina";
import { Icono } from "~/components/ui/Icono";
import { metaDePagina } from "~/lib/meta";
import { useSitio } from "~/lib/useSitio";

import type { Route } from "./+types/sede";

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Sede e instalaciones", "Nuestra sede, aulas y espacios.");

export default function Sede() {
  const { sede, direccion } = useSitio();
  return (
    <PaginaDeSeccion seccion="/la-universidad" titulo="Sede e instalaciones" url="/la-universidad/sede">
      <div className="flex flex-col gap-8">
        {direccion && (
          <p className="flex items-start gap-3 rounded-lg bg-marca-sutil px-5 py-4 text-marca">
            <Icono nombre="ubicacion" className="mt-0.5" />
            <span>
              <strong>Dirección:</strong> {direccion}.{" "}
              <Link to="/contacto#ubicacion">Ver el mapa</Link>
            </span>
          </p>
        )}
        {sede ? (
          <Parrafos texto={sede} />
        ) : (
          <Pendiente>La descripción de la sede está pendiente de publicar.</Pendiente>
        )}
        <p>
          <Link to="/galeria" className="inline-flex items-center gap-2 font-semibold">
            <Icono nombre="imagen" /> Ver fotos de la sede en la galería
          </Link>
        </p>
      </div>
    </PaginaDeSeccion>
  );
}
