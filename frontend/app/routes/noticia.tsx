import { Link } from "react-router";

import { Compartir } from "~/components/sitio/Compartir";
import { Migas, Parrafos } from "~/components/sitio/Pagina";
import { Foto } from "~/components/ui/Foto";
import { Icono } from "~/components/ui/Icono";
import { obtener } from "~/lib/contenido.server";
import { fecha } from "~/lib/formato";
import { metaDePagina } from "~/lib/meta";
import type { Noticia } from "~/lib/tipos";

import type { Route } from "./+types/noticia";

export async function loader({ params }: Route.LoaderArgs) {
  return { noticia: await obtener<Noticia>(`noticias/${encodeURIComponent(params.slug)}/`) };
}

export const meta: Route.MetaFunction = ({ matches, data }) => {
  const n = data?.noticia;
  const base = metaDePagina(matches, n?.titulo ?? "Noticia", n?.resumen);
  return n?.imagen ? [...base, { property: "og:image", content: n.imagen.grande }, { property: "og:type", content: "article" }] : base;
};

export default function NoticiaPagina({ loaderData }: Route.ComponentProps) {
  const { noticia: n } = loaderData;
  return (
    <article>
      <header className="border-b border-borde bg-sutil">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-10 sm:px-6 lg:py-14">
          <Migas ruta={[{ titulo: "Noticias", url: "/noticias" }, { titulo: n.titulo, url: `/noticias/${n.slug}` }]} />
          <p className="text-texto-secundario">
            <time dateTime={n.fecha}>{fecha(n.fecha)}</time>
          </p>
          <h1 className="text-[2.25rem] leading-[2.75rem] lg:text-3xl">{n.titulo}</h1>
          <p className="text-xl leading-8 text-texto-secundario">{n.resumen}</p>
          <Compartir titulo={n.titulo} texto={n.resumen} />
        </div>
      </header>
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6 lg:py-14">
        {n.imagen && (
          <figure className="flex flex-col gap-2">
            <Foto imagen={n.imagen} alt={n.imagen_descripcion} sizes="(min-width: 768px) 720px, 100vw" prioritaria className="w-full rounded-lg object-cover" />
          </figure>
        )}
        <Parrafos texto={n.cuerpo} />
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-borde pt-6">
          <Link to="/noticias" prefetch="intent" className="inline-flex min-h-11 items-center gap-2 font-semibold">
            <Icono nombre="flecha-izquierda" /> Volver a las noticias
          </Link>
          <Compartir titulo={n.titulo} texto={n.resumen} />
        </div>
      </div>
    </article>
  );
}
