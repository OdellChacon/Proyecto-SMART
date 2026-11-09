import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";

import { Icono } from "~/components/ui/Icono";
import { parrafos } from "~/lib/formato";
import { MENU, type Enlace } from "~/lib/mapa";

/** Migas de pan: «Inicio › Carreras › Enfermería». */
export function Migas({ ruta }: { ruta: Enlace[] }) {
  return (
    <nav aria-label="Estás en">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-texto-secundario">
        <li>
          <Link to="/" prefetch="intent" className="text-texto-secundario">
            Inicio
          </Link>
        </li>
        {ruta.map((e, i) => (
          <li key={e.url} className="flex items-center gap-2">
            <Icono nombre="chevron-derecha" tamano={16} />
            {i === ruta.length - 1 ? (
              <span aria-current="page" className="text-texto">
                {e.titulo}
              </span>
            ) : (
              <Link to={e.url} prefetch="intent" className="text-texto-secundario">
                {e.titulo}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface CabeceraProps {
  titulo: string;
  ruta: Enlace[];
  introduccion?: ReactNode;
  sobretitulo?: string;
  children?: ReactNode;
}

/** Cabecera de cada página interior: migas, título y una entrada corta. */
export function CabeceraPagina({ titulo, ruta, introduccion, sobretitulo, children }: CabeceraProps) {
  return (
    <div className="border-b border-borde bg-sutil">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:py-14">
        <Migas ruta={ruta} />
        {sobretitulo && (
          <p className="text-xs font-bold tracking-widest text-acento uppercase">{sobretitulo}</p>
        )}
        <h1 className="max-w-4xl text-[2.25rem] leading-[2.75rem] lg:text-3xl">{titulo}</h1>
        {introduccion && (
          <div className="max-w-3xl text-lg text-texto-secundario">{introduccion}</div>
        )}
        {children}
      </div>
    </div>
  );
}

/** Navegación de una sección (La Universidad, Noticias…). Arriba en el teléfono, al lado en escritorio. */
export function NavSeccion({ titulo, enlaces }: { titulo: string; enlaces: Enlace[] }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label={`Páginas de ${titulo}`} className="lg:sticky lg:top-6">
      <p className="mb-3 text-xs font-bold tracking-widest text-texto-secundario uppercase">
        {titulo}
      </p>
      <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {enlaces.map((e) => {
          const actual = pathname === e.url;
          return (
            <li key={e.url} className="shrink-0">
              <NavLink
                to={e.url}
                end
                prefetch="intent"
                aria-current={actual ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-md px-4 font-semibold no-underline transition-colors lg:border-l-4 lg:rounded-l-none ${
                  actual
                    ? "bg-marca-sutil text-marca lg:border-acento"
                    : "border border-borde text-texto hover:bg-sutil lg:border-y-0 lg:border-r-0 lg:border-transparent"
                }`}
              >
                {e.titulo}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Contenido con navegación de sección a la izquierda. */
export function ConNavegacion({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[16rem_1fr] lg:gap-14 lg:py-14">
      <aside>{nav}</aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Texto del panel en párrafos, con ancho cómodo de lectura. */
export function Parrafos({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <div className={`flex max-w-[68ch] flex-col gap-5 text-lg leading-8 ${className}`}>
      {parrafos(texto).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** Lista con viñetas del sistema de diseño. */
export function Lista({ elementos }: { elementos: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {elementos.map((e) => (
        <li key={e} className="flex gap-3">
          <Icono nombre="check" className="mt-1 text-exito" tamano={20} />
          <span>{e}</span>
        </li>
      ))}
    </ul>
  );
}

/** Contenido que la universidad todavía no entregó. Nunca se rellena con datos inventados. */
export function Pendiente({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-dashed border-borde-fuerte bg-sutil px-5 py-4 text-texto-secundario">
      <Icono nombre="info" className="mt-0.5" />
      <p>{children}</p>
    </div>
  );
}

/** Título de bloque dentro de una página. */
export function TituloBloque({
  id,
  children,
  accion,
}: {
  id?: string;
  children: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h2 id={id} className="scroll-mt-6 text-2xl">
        {children}
      </h2>
      {accion}
    </div>
  );
}

interface SeccionProps {
  /** URL de la sección del menú (por ejemplo, "/la-universidad"). */
  seccion: string;
  titulo: string;
  url: string;
  introduccion?: ReactNode;
  children: ReactNode;
}

/** Página interior de una sección con subpáginas: cabecera + navegación de la sección. */
export function PaginaDeSeccion({ seccion, titulo, url, introduccion, children }: SeccionProps) {
  const s = MENU.find((m) => m.url === seccion);
  if (!s) throw new Error(`Sección desconocida: ${seccion}`);
  const ruta = url === s.url ? [{ titulo: s.titulo, url: s.url }] : [s, { titulo, url }];
  const enlaces = s.hijos.some((h) => h.url === s.url)
    ? s.hijos.filter((h) => !h.url.includes("#"))
    : [{ titulo: "Presentación", url: s.url }, ...s.hijos.filter((h) => !h.url.includes("#"))];
  return (
    <>
      <CabeceraPagina titulo={titulo} ruta={ruta} introduccion={introduccion} />
      <ConNavegacion nav={<NavSeccion titulo={s.titulo} enlaces={enlaces} />}>{children}</ConNavegacion>
    </>
  );
}
