import { useEffect, useRef, useState } from "react";
import { data, Link } from "react-router";

import { CabeceraPagina } from "~/components/sitio/Pagina";
import { Foto } from "~/components/ui/Foto";
import { Icono } from "~/components/ui/Icono";
import { obtener } from "~/lib/contenido.server";
import { fecha } from "~/lib/formato";
import { metaDePagina } from "~/lib/meta";
import type { Album } from "~/lib/tipos";

import type { Route } from "./+types/album";

export async function loader({ params }: Route.LoaderArgs) {
  if (!/^\d+$/.test(params.id)) throw new Response(null, { status: 404 });
  return { album: await obtener<Album>(`galeria/${params.id}/`) };
}

export const meta: Route.MetaFunction = ({ matches, data }) =>
  metaDePagina(matches, data?.album.titulo ?? "Álbum", data?.album.descripcion);

export default function AlbumPagina({ loaderData }: Route.ComponentProps) {
  const { album } = loaderData;
  const [actual, setActual] = useState<number | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const foto = actual != null ? album.fotos[actual] : undefined;

  const abrir = (i: number) => {
    setActual(i);
    dialogo.current?.showModal();
  };
  const mover = (paso: number) =>
    setActual((i) => (i == null ? i : (i + paso + album.fotos.length) % album.fotos.length));

  // Precarga la foto anterior y la siguiente para que el cambio sea inmediato.
  useEffect(() => {
    if (actual == null) return;
    for (const paso of [1, -1]) {
      const vecina = album.fotos[(actual + paso + album.fotos.length) % album.fotos.length];
      if (vecina) new Image().src = vecina.imagen.grande;
    }
  }, [actual, album.fotos]);

  // En el teléfono se cambia de foto deslizando el dedo.
  const inicioToque = useRef<number | null>(null);

  return (
    <>
      <CabeceraPagina
        titulo={album.titulo}
        ruta={[
          { titulo: "Noticias", url: "/noticias" },
          { titulo: "Galería", url: "/galeria" },
          { titulo: album.titulo, url: `/galeria/${album.id}` },
        ]}
        introduccion={
          <>
            {album.descripcion && <p>{album.descripcion}</p>}
            <p className="mt-1 text-base">{fecha(album.fecha)} · {album.fotos.length} fotos</p>
          </>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
          {album.fotos.map((f, i) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => abrir(i)}
                className="group block w-full overflow-hidden rounded-md"
                aria-label={`Ver en grande: ${f.descripcion}`}
              >
                <Foto imagen={f.imagen} alt="" sizes="(min-width: 768px) 33vw, 50vw" loading={i < 6 ? "eager" : "lazy"} className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-10">
          <Link to="/galeria" className="inline-flex min-h-11 items-center gap-2 font-semibold">
            <Icono nombre="flecha-izquierda" /> Volver a la galería
          </Link>
        </p>
      </div>

      {/* Visor: <dialog> nativo atrapa el foco y se cierra con Escape */}
      <dialog
        ref={dialogo}
        onClose={() => setActual(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") mover(1);
          if (e.key === "ArrowLeft") mover(-1);
        }}
        aria-label="Visor de fotos"
        className="m-auto w-[min(72rem,calc(100vw-2rem))] max-w-none bg-transparent p-0 backdrop:bg-black/85 open:animate-aparecer"
      >
        {foto && (
          <figure className="flex flex-col gap-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => dialogo.current?.close()}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-4 font-semibold text-texto transition-colors hover:bg-sutil"
              >
                <Icono nombre="cerrar" /> Cerrar
              </button>
            </div>
            <img
              key={foto.id}
              src={foto.imagen.grande}
              alt={foto.descripcion}
              onPointerDown={(e) => {
                if (e.pointerType !== "mouse") inicioToque.current = e.clientX;
              }}
              onPointerUp={(e) => {
                if (inicioToque.current == null) return;
                const distancia = e.clientX - inicioToque.current;
                inicioToque.current = null;
                if (Math.abs(distancia) > 50) mover(distancia < 0 ? 1 : -1);
              }}
              className="max-h-[75vh] w-full touch-pan-y rounded-md object-contain select-none animate-aparecer"
            />
            <figcaption className="flex flex-wrap items-center justify-between gap-3 text-white">
              <span>{foto.descripcion}</span>
              <span className="flex items-center gap-2">
                <button type="button" onClick={() => mover(-1)} className="inline-flex min-h-11 items-center gap-1 rounded-md bg-white/15 px-3 font-semibold hover:bg-white/25">
                  <Icono nombre="flecha-izquierda" /> Anterior
                </button>
                <span aria-live="polite" className="px-2 text-sm">
                  {(actual ?? 0) + 1} de {album.fotos.length}
                </span>
                <button type="button" onClick={() => mover(1)} className="inline-flex min-h-11 items-center gap-1 rounded-md bg-white/15 px-3 font-semibold hover:bg-white/25">
                  Siguiente <Icono nombre="flecha-derecha" />
                </button>
              </span>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}
