import { Link } from "react-router";

import { PaginaDeSeccion } from "~/components/sitio/Pagina";
import { FotoPendiente } from "~/components/sitio/Tarjetas";
import { Foto } from "~/components/ui/Foto";
import { LineaAcento, TARJETA_ENLACE } from "~/components/ui/Tarjeta";
import { obtener } from "~/lib/contenido.server";
import { fecha } from "~/lib/formato";
import { metaDePagina } from "~/lib/meta";
import type { AlbumTarjeta } from "~/lib/tipos";

import type { Route } from "./+types/galeria";

export async function loader() {
  return { albumes: await obtener<AlbumTarjeta[]>("galeria/") };
}

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Galería de fotos", "Fotos de la sede, las actividades y la comunidad.");

export default function Galeria({ loaderData }: Route.ComponentProps) {
  const { albumes } = loaderData;
  return (
    <PaginaDeSeccion seccion="/noticias" titulo="Galería de fotos" url="/galeria">
      {albumes.length === 0 ? (
        <p className="text-texto-secundario">Pronto publicaremos fotos de la sede y de nuestras actividades.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {albumes.map((a, i) => (
            <li key={a.id} className={`${TARJETA_ENLACE} flex flex-col`}>
              <div className="overflow-hidden">
              {a.portada ? (
                <Foto imagen={a.portada.imagen} alt="" sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" loading={i < 3 ? "eager" : "lazy"} className="aspect-[3/2] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none" />
              ) : (
                <FotoPendiente texto="Álbum sin fotos" className="aspect-[3/2] w-full" />
              )}
              </div>
              <div className="flex flex-col gap-1 p-5">
                <h2 className="text-xl">
                  <Link to={`/galeria/${a.id}`} className="text-texto no-underline after:absolute after:inset-0 focus-visible:outline-none">
                    {a.titulo}
                  </Link>
                </h2>
                <p className="text-sm text-texto-secundario">
                  {fecha(a.fecha)} · {a.total_fotos} {a.total_fotos === 1 ? "foto" : "fotos"}
                </p>
              </div>
              <LineaAcento />
            </li>
          ))}
        </ul>
      )}
    </PaginaDeSeccion>
  );
}
