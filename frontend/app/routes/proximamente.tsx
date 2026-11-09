import { useLocation } from "react-router";

import { EnlaceBoton } from "~/components/ui/Boton";
import { Icono } from "~/components/ui/Icono";
import { metaDePagina } from "~/lib/meta";

import type { Route } from "./+types/proximamente";

const SISTEMAS: Record<string, { titulo: string; texto: string }> = {
  "/control-de-estudios": {
    titulo: "Control de estudios",
    texto: "Aquí podrás consultar tus notas, tu récord académico, inscribir materias y pedir constancias.",
  },
  "/aula-virtual": {
    titulo: "Aula virtual",
    texto: "Aquí encontrarás tus clases, los materiales de cada materia y podrás entregar tus trabajos.",
  },
};

export const meta: Route.MetaFunction = ({ matches, location }) => [
  ...metaDePagina(matches, SISTEMAS[location.pathname]?.titulo ?? "Próximamente"),
  { name: "robots", content: "noindex" },
];

/** Accesos a los sistemas académicos: se activan en las fases siguientes. */
export default function Proximamente() {
  const { pathname } = useLocation();
  const s = SISTEMAS[pathname] ?? { titulo: "Próximamente", texto: "" };
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:py-24">
      <span className="inline-flex size-16 items-center justify-center rounded-lg bg-marca-sutil text-marca-medio">
        <Icono nombre="birrete" tamano={36} />
      </span>
      <p className="text-xs font-bold tracking-widest text-acento uppercase">Próximamente</p>
      <h1 className="text-[2.25rem] leading-[2.75rem] lg:text-3xl">{s.titulo}</h1>
      <p className="text-xl leading-8 text-texto-secundario">
        Estamos preparando este servicio. {s.texto} Te avisaremos en las noticias del sitio cuando
        esté disponible.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <EnlaceBoton to="/" estilo="secundario" icono="flecha-izquierda" iconoAntes>
          Volver al inicio
        </EnlaceBoton>
        <EnlaceBoton to="/noticias">Ver las noticias</EnlaceBoton>
      </div>
    </div>
  );
}
