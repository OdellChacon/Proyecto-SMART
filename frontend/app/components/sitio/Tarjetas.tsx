import { Link } from "react-router";

import { Foto } from "~/components/ui/Foto";
import { Icono } from "~/components/ui/Icono";
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

export function TarjetaCarrera({ carrera, nivel = 3 }: { carrera: CarreraTarjeta; nivel?: 2 | 3 }) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  const datos = [
    ["Título", carrera.titulo_otorgado],
    ["Duración", carrera.duracion],
    ["Modalidad", carrera.modalidad],
  ].filter(([, v]) => v);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-borde bg-superficie transition duration-200 hover:-translate-y-0.5 hover:border-marca-medio/40 hover:shadow-md">
      {carrera.imagen && (
        <Foto
          imagen={carrera.imagen}
          alt=""
          sizes="(min-width: 768px) 33vw, 100vw"
          className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      )}
      <div className="flex flex-1 flex-col gap-5 p-6 lg:p-8">
      <span
        className={`inline-flex size-14 items-center justify-center rounded-md bg-marca-sutil text-marca-medio ${
          carrera.imagen ? "-mt-14 shadow-md ring-4 ring-superficie lg:-mt-16" : ""
        }`}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d={ICONO_CARRERA[carrera.slug] ?? "M22 10 12 5 2 10l10 5 10-5z"} />
        </svg>
      </span>
      <div className="flex flex-col gap-2">
        <Titulo className="text-xl">
          <Link
            to={`/carreras/${carrera.slug}`}
            prefetch="intent"
            className="text-texto no-underline after:absolute after:inset-0 after:rounded-lg group-hover:text-marca-medio"
          >
            {carrera.nombre}
          </Link>
        </Titulo>
        {carrera.resumen && <p className="text-texto-secundario">{carrera.resumen}</p>}
      </div>
      {datos.length > 0 && (
        <dl className="mt-auto grid gap-1 border-t border-borde pt-4 text-sm">
          {datos.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-texto-secundario">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <span className="inline-flex items-center gap-2 font-semibold text-enlace" aria-hidden>
        Ver carrera <Icono nombre="flecha-derecha" tamano={20} className="transition-transform group-hover:translate-x-1" />
      </span>
      </div>
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
      className={`group relative flex flex-col overflow-hidden rounded-lg border border-borde bg-superficie transition duration-200 hover:-translate-y-0.5 hover:border-marca-medio/40 hover:shadow-md ${
        destacada ? "md:col-span-2 md:grid md:grid-cols-2" : ""
      }`}
    >
      {noticia.imagen ? (
        <Foto
          imagen={noticia.imagen}
          alt={noticia.imagen_descripcion}
          sizes={destacada ? "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"}
          className={`aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${destacada ? "md:h-full" : ""}`}
        />
      ) : (
        <FotoPendiente texto="Sin imagen" className="aspect-[3/2] w-full" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="text-sm text-texto-secundario">
          <time dateTime={noticia.fecha}>{fecha(noticia.fecha)}</time>
        </p>
        <Titulo className={destacada ? "text-2xl" : "text-xl"}>
          <Link
            to={`/noticias/${noticia.slug}`}
            prefetch="intent"
            className="text-texto no-underline after:absolute after:inset-0 group-hover:text-marca-medio group-hover:underline"
          >
            {noticia.titulo}
          </Link>
        </Titulo>
        <p className="text-texto-secundario">{noticia.resumen}</p>
      </div>
    </article>
  );
}
