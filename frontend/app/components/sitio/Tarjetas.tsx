import { Link } from "react-router";

import { Foto } from "~/components/ui/Foto";
import { Icono } from "~/components/ui/Icono";
import { ETIQUETA, FLECHA, FOCO_INTERNO, LineaAcento, TARJETA_ENLACE } from "~/components/ui/Tarjeta";
import { fecha } from "~/lib/formato";
import type { CarreraTarjeta, NoticiaTarjeta } from "~/lib/tipos";

/**
 * Espacio para una foto que la universidad todavía no entregó.
 * Se ve como espacio reservado, no como una foto: así nadie lo confunde.
 */
export function FotoPendiente({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-marca-medio text-sobre-marca-suave ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, rgba(255,255,255,.05) 0 2px, transparent 2px 22px)",
      }}
    >
      <span className="flex items-center gap-2 px-4 text-center text-sm font-semibold">
        <Icono nombre="imagen" tamano={20} />
        {texto}
      </span>
    </div>
  );
}

const ICONO_CARRERA: Record<string, string> = {
  administracion: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6",
  informatica: "M4 5h16v10H4zM2 19h20M9 15v4M15 15v4",
  enfermeria: "M12 21s-7-4.5-9-9.5C1.6 7.6 4 4 7.5 4c2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4 20 4 22.4 7.6 21 11.5 19 16.5 12 21 12 21zM12 9v5M9.5 11.5h5",
};

function IconoCarrera({ slug, tamano }: { slug: string; tamano: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={ICONO_CARRERA[slug] ?? "M22 10 12 5 2 10l10 5 10-5z"} />
    </svg>
  );
}

/**
 * Carrera como fila de un índice (portada): número, foto, nombre, resumen y ficha corta.
 * Toda la fila es el enlace; al pasar el puntero la foto se acerca y el círculo de la
 * flecha se rellena de azul.
 */
export function FilaCarrera({ carrera, numero }: { carrera: CarreraTarjeta; numero: number }) {
  const datos = [
    ["Título", carrera.titulo_otorgado],
    ["Duración", carrera.duracion],
    ["Modalidad", carrera.modalidad],
  ].filter(([, v]) => v);
  return (
    <article
      className={`group relative grid gap-5 rounded-sm py-7 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-7 xl:grid-cols-[14rem_minmax(0,1fr)_auto] ${FOCO_INTERNO}`}
    >
      <div className="overflow-hidden rounded-lg bg-marca-sutil">
        {carrera.imagen ? (
          <Foto
            imagen={carrera.imagen}
            alt=""
            sizes="(min-width: 640px) 14rem, 100vw"
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] motion-reduce:transition-none sm:aspect-[4/3]"
          />
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center text-marca-medio sm:aspect-[4/3]">
            <IconoCarrera slug={carrera.slug} tamano={40} />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <p className={`${ETIQUETA} flex items-center gap-2 text-acento`}>
          <span className="tabular-nums">{String(numero).padStart(2, "0")}</span>
          <span aria-hidden className="h-px w-6 bg-acento/40" />
          <span className="text-marca-medio">
            <IconoCarrera slug={carrera.slug} tamano={16} />
          </span>
        </p>
        <h3 className="text-2xl lg:text-[1.75rem] lg:leading-9">
          <Link
            to={`/carreras/${carrera.slug}`}
            prefetch="intent"
            className="text-texto no-underline transition-colors after:absolute after:inset-0 group-hover:text-marca-medio focus-visible:outline-none"
          >
            {carrera.nombre}
          </Link>
        </h3>
        {carrera.resumen && <p className="max-w-prose text-texto-secundario">{carrera.resumen}</p>}
        {datos.length > 0 && (
          <dl className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {datos.map(([k, v]) => (
              <div key={k} className="flex gap-1.5">
                <dt className="text-texto-secundario">{k}:</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <span
        aria-hidden
        className="hidden size-12 items-center justify-center rounded-full border border-borde text-marca-medio transition-colors duration-300 group-hover:border-marca group-hover:bg-marca group-hover:text-sobre-marca xl:flex"
      >
        <Icono nombre="flecha-derecha" tamano={20} className="transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
      <LineaAcento />
    </article>
  );
}

export function TarjetaCarrera({ carrera, nivel = 3 }: { carrera: CarreraTarjeta; nivel?: 2 | 3 }) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  const datos = [
    ["Título", carrera.titulo_otorgado],
    ["Duración", carrera.duracion],
    ["Modalidad", carrera.modalidad],
  ].filter(([, v]) => v);
  return (
    <article className={`${TARJETA_ENLACE} flex flex-col`}>
      {carrera.imagen && (
        <div className="overflow-hidden">
          <Foto
            imagen={carrera.imagen}
            alt=""
            sizes="(min-width: 768px) 33vw, 100vw"
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-5 p-6 lg:p-7">
        <div className="flex flex-col gap-3">
          <p className={`${ETIQUETA} flex items-center gap-2 text-acento`}>
            <span className="text-marca-medio">
              <IconoCarrera slug={carrera.slug} tamano={18} />
            </span>
            Carrera
          </p>
          <Titulo className="text-2xl">
            <Link
              to={`/carreras/${carrera.slug}`}
              prefetch="intent"
              className="text-texto no-underline after:absolute after:inset-0 focus-visible:outline-none"
            >
              {carrera.nombre}
            </Link>
          </Titulo>
          {carrera.resumen && <p className="line-clamp-3 text-texto-secundario">{carrera.resumen}</p>}
        </div>
        {datos.length > 0 && (
          <dl className="mt-auto flex flex-col divide-y divide-borde border-y border-borde text-sm">
            {datos.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-texto-secundario">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <span className={`inline-flex items-center gap-2 font-semibold text-enlace ${datos.length ? "" : "mt-auto"}`} aria-hidden>
          Ver carrera <Icono nombre="flecha-derecha" tamano={18} className={FLECHA} />
        </span>
      </div>
      <LineaAcento />
    </article>
  );
}

/**
 * Noticia principal de la portada: foto grande, fecha, título y resumen, sin caja.
 * Toda la pieza es el enlace.
 */
export function NoticiaPrincipal({ noticia }: { noticia: NoticiaTarjeta }) {
  return (
    <article className={`group relative flex flex-col gap-6 rounded-lg ${FOCO_INTERNO}`}>
      <div className="overflow-hidden rounded-lg bg-marca-sutil">
        {noticia.imagen ? (
          <Foto
            imagen={noticia.imagen}
            alt={noticia.imagen_descripcion}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="aspect-[3/2] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <FotoPendiente texto="Sin imagen" className="aspect-[3/2] w-full" />
        )}
      </div>
      <div className="flex flex-col gap-3">
        <p className={`${ETIQUETA} text-acento`}>
          <time dateTime={noticia.fecha}>{fecha(noticia.fecha)}</time>
        </p>
        <h3 className="text-[1.75rem] leading-9 text-pretty lg:text-[2rem] lg:leading-10">
          <Link
            to={`/noticias/${noticia.slug}`}
            prefetch="intent"
            className="text-texto no-underline decoration-acento decoration-2 underline-offset-[6px] after:absolute after:inset-0 group-hover:underline focus-visible:outline-none"
          >
            {noticia.titulo}
          </Link>
        </h3>
        <p className="max-w-prose text-lg text-texto-secundario">{noticia.resumen}</p>
        <span className="inline-flex items-center gap-2 font-semibold text-enlace" aria-hidden>
          Leer noticia <Icono nombre="flecha-derecha" tamano={18} className={FLECHA} />
        </span>
      </div>
    </article>
  );
}

/** Noticia secundaria como fila: fecha y título a la izquierda, miniatura a la derecha. */
export function FilaNoticia({ noticia }: { noticia: NoticiaTarjeta }) {
  return (
    <article
      className={`group relative grid grid-cols-[minmax(0,1fr)_6rem] items-start gap-5 rounded-sm py-6 sm:grid-cols-[minmax(0,1fr)_8.5rem] ${FOCO_INTERNO}`}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <p className={`${ETIQUETA} text-texto-secundario`}>
          <time dateTime={noticia.fecha}>{fecha(noticia.fecha)}</time>
        </p>
        <h3 className="text-xl leading-7 text-pretty">
          <Link
            to={`/noticias/${noticia.slug}`}
            prefetch="intent"
            className="text-texto no-underline transition-colors after:absolute after:inset-0 group-hover:text-marca-medio focus-visible:outline-none"
          >
            {noticia.titulo}
          </Link>
        </h3>
        <p className="line-clamp-2 hidden text-texto-secundario sm:block">{noticia.resumen}</p>
      </div>
      <div className="overflow-hidden rounded-md bg-marca-sutil">
        {noticia.imagen ? (
          <Foto
            imagen={noticia.imagen}
            alt=""
            sizes="9rem"
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-marca-medio">
            <Icono nombre="imagen" tamano={22} />
          </div>
        )}
      </div>
      <LineaAcento />
    </article>
  );
}

export function TarjetaNoticia({
  noticia,
  destacada = false,
  nivel = 3,
}: {
  noticia: NoticiaTarjeta;
  destacada?: boolean;
  nivel?: 2 | 3;
}) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <article
      className={`${TARJETA_ENLACE} flex flex-col ${destacada ? "md:col-span-2 md:grid md:grid-cols-2" : ""}`}
    >
      <div className="overflow-hidden">
        {noticia.imagen ? (
          <Foto
            imagen={noticia.imagen}
            alt={noticia.imagen_descripcion}
            sizes={destacada ? "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"}
            className={`aspect-[3/2] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none ${destacada ? "md:h-full" : ""}`}
          />
        ) : (
          <FotoPendiente texto="Sin imagen" className="aspect-[3/2] w-full" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className={`${ETIQUETA} text-texto-secundario`}>
          <time dateTime={noticia.fecha}>{fecha(noticia.fecha)}</time>
        </p>
        <Titulo className={`text-pretty ${destacada ? "text-2xl" : "text-xl"}`}>
          <Link
            to={`/noticias/${noticia.slug}`}
            prefetch="intent"
            className="text-texto no-underline after:absolute after:inset-0 focus-visible:outline-none"
          >
            {noticia.titulo}
          </Link>
        </Titulo>
        <p className="line-clamp-3 text-texto-secundario">{noticia.resumen}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-1 text-sm font-semibold text-enlace" aria-hidden>
          Leer noticia <Icono nombre="flecha-derecha" tamano={16} className={FLECHA} />
        </span>
      </div>
      <LineaAcento />
    </article>
  );
}
