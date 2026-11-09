import { CabeceraPagina } from "~/components/sitio/Pagina";
import { TarjetaCarrera } from "~/components/sitio/Tarjetas";
import { EnlaceBoton } from "~/components/ui/Boton";
import { obtener } from "~/lib/contenido.server";
import { metaDePagina } from "~/lib/meta";
import type { CarreraTarjeta } from "~/lib/tipos";

import type { Route } from "./+types/carreras";

export async function loader() {
  return { carreras: await obtener<CarreraTarjeta[]>("carreras/") };
}

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Carreras", "Conoce nuestras carreras: título, duración, modalidad y pensum.");

export default function Carreras({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <CabeceraPagina
        titulo="Nuestras carreras"
        ruta={[{ titulo: "Carreras", url: "/carreras" }]}
        introduccion="Elige la carrera que te interesa para ver qué aprenderás, dónde podrás trabajar y su pensum completo."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {loaderData.carreras.map((c) => (
            <TarjetaCarrera key={c.slug} carrera={c} nivel={2} />
          ))}
        </div>
        <section
          aria-labelledby="t-dudas"
          className="mt-14 flex flex-col items-start gap-5 rounded-lg bg-marca p-8 text-sobre-marca lg:flex-row lg:items-center lg:justify-between lg:p-10"
        >
          <div className="flex flex-col gap-2">
            <h2 id="t-dudas" className="text-2xl text-sobre-marca">
              ¿No sabes cuál elegir?
            </h2>
            <p className="text-sobre-marca-suave">
              Escríbenos y te ayudamos a decidir según tus intereses.
            </p>
          </div>
          <EnlaceBoton to="/admision/solicitar-informacion" icono="flecha-derecha">
            Solicitar información
          </EnlaceBoton>
        </section>
      </div>
    </>
  );
}
