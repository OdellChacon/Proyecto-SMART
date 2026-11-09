import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";

import { BuscadorRapido } from "~/components/layout/BuscadorRapido";
import { Icono } from "~/components/ui/Icono";
import { Marca } from "~/components/ui/Marca";
import { useBloquearDesplazamiento, useClicFuera, useEscape } from "~/lib/hooks";
import { ACCESOS_SISTEMAS, MENU, seccionDe, type Seccion } from "~/lib/mapa";
import type { Sitio } from "~/lib/tipos";

/** Barra de accesos + encabezado con el menú principal (igual en todo el sitio). */
export function EncabezadoSitio({ sitio }: { sitio: Sitio }) {
  const { pathname, hash } = useLocation();
  const activa = seccionDe(pathname);
  const [abierto, setAbierto] = useState(false);
  const idMenu = useId();
  const boton = useRef<HTMLButtonElement>(null);

  // Al navegar se cierra el menú del teléfono.
  useEffect(() => setAbierto(false), [pathname, hash]);
  useBloquearDesplazamiento(abierto);
  useEscape(() => {
    setAbierto(false);
    boton.current?.focus();
  }, abierto);

  return (
    <header className="relative z-30 bg-superficie">
      {/* Barra de accesos a los sistemas */}
      <div className="bg-marca text-sobre-marca">
        <div className="mx-auto flex max-w-7xl items-center justify-end px-2 sm:px-6">
          <nav aria-label="Sistemas académicos" className="flex items-center">
            {ACCESOS_SISTEMAS.map((a) => (
              <Link
                key={a.url}
                to={a.url}
                prefetch="intent"
                className="inline-flex min-h-11 items-center px-2 text-sm whitespace-nowrap text-sobre-marca no-underline hover:underline sm:px-3"
              >
                {a.titulo}
              </Link>
            ))}
            <Link
              to="/ingresar"
              prefetch="intent"
              className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold whitespace-nowrap text-sobre-marca no-underline hover:underline sm:px-3"
            >
              <Icono nombre="usuario" tamano={18} />
              Ingresar
            </Link>
          </nav>
        </div>
      </div>

      <div className="border-b border-borde bg-superficie">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Marca nombre={sitio.nombre} subtitulo={sitio.lema} />

          <div className="hidden lg:block">
            <BuscadorRapido />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/buscar"
              className="inline-flex min-h-12 min-w-12 flex-col items-center justify-center rounded-md px-2 text-xs font-semibold text-marca-medio no-underline transition-colors hover:bg-marca-sutil"
            >
              <Icono nombre="buscar" />
              Buscar
            </Link>
            <button
              ref={boton}
              type="button"
              aria-expanded={abierto}
              aria-controls={idMenu}
              onClick={() => setAbierto((v) => !v)}
              className="inline-flex min-h-12 min-w-12 flex-col items-center justify-center rounded-md px-2 text-xs font-semibold text-marca-medio transition-colors hover:bg-marca-sutil"
            >
              <Icono nombre={abierto ? "cerrar" : "menu"} />
              {abierto ? "Cerrar" : "Menú"}
            </button>
          </div>
        </div>

        {/* Menú principal de escritorio, con las páginas de cada sección en un desplegable */}
        <nav aria-label="Principal" className="hidden border-t border-borde lg:block">
          <ul className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
            {MENU.map((s) => (
              <ElementoMenu key={s.url} seccion={s} actual={activa?.url === s.url} />
            ))}
          </ul>
        </nav>
      </div>

      {/* Menú del teléfono: buscador, secciones y sus páginas */}
      <div
        aria-hidden
        onClick={() => setAbierto(false)}
        className={`fixed inset-0 top-0 -z-10 bg-marca/40 transition-opacity duration-200 lg:hidden ${
          abierto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <nav
        id={idMenu}
        aria-label="Principal"
        inert={!abierto}
        className={`absolute inset-x-0 top-full max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain border-b border-borde bg-superficie shadow-lg transition duration-200 ease-out lg:hidden ${
          abierto ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col px-4 py-4 sm:px-6">
          <BuscadorRapido variante="menu" />
          <ul className="mt-3 flex flex-col">
            <li>
              <Link to="/" className="flex min-h-14 items-center text-lg font-semibold text-texto no-underline">
                Inicio
              </Link>
            </li>
            {MENU.map((s) => (
              <SeccionMovil key={s.url} seccion={s} actual={activa?.url === s.url} />
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}

/** Una sección del menú de escritorio: enlace + botón que abre sus páginas. */
function ElementoMenu({ seccion: s, actual }: { seccion: Seccion; actual: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const elemento = useRef<HTMLLIElement>(null);
  const flecha = useRef<HTMLButtonElement>(null);
  const espera = useRef<number>(undefined);
  const { pathname, hash } = useLocation();

  const cerrar = useCallback(() => setAbierto(false), []);
  useEffect(cerrar, [pathname, hash, cerrar]);
  useClicFuera(elemento, cerrar, abierto);
  useEscape(() => {
    setAbierto(false);
    flecha.current?.focus();
  }, abierto);
  useEffect(() => () => window.clearTimeout(espera.current), []);

  // Con el ratón se abre al detenerse un instante encima y se cierra al salir.
  const programar = (valor: boolean, ms: number) => {
    window.clearTimeout(espera.current);
    espera.current = window.setTimeout(() => setAbierto(valor), ms);
  };

  return (
    <li
      ref={elemento}
      className="relative flex items-center"
      onPointerEnter={(e) => e.pointerType === "mouse" && programar(true, 120)}
      onPointerLeave={(e) => e.pointerType === "mouse" && programar(false, 180)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false);
      }}
    >
      <NavLink
        to={s.url}
        prefetch="intent"
        aria-current={actual ? "page" : undefined}
        className={`relative inline-flex min-h-14 items-center pr-1 pl-4 text-base font-semibold no-underline transition-colors hover:text-marca-medio ${
          actual
            ? "text-marca after:absolute after:inset-x-4 after:bottom-0 after:h-1 after:rounded-t-sm after:bg-acento"
            : "text-texto"
        }`}
      >
        {s.titulo}
      </NavLink>
      <button
        ref={flecha}
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={`Páginas de ${s.titulo}`}
        onClick={() => setAbierto((v) => !v)}
        className="mr-1 inline-flex size-8 items-center justify-center rounded-md text-texto-secundario transition-colors hover:bg-marca-sutil hover:text-marca-medio"
      >
        <Icono nombre="chevron-abajo" tamano={18} className={`transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
      </button>

      <div
        id={id}
        className={`absolute top-full left-0 z-40 w-80 pt-2 transition duration-150 ease-out ${
          abierto ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-lg border border-borde bg-superficie shadow-lg">
          <p className="border-b border-borde bg-sutil px-5 py-3 text-sm text-texto-secundario">{s.descripcion}</p>
          <ul className="flex flex-col p-2">
            {s.hijos.map((h) => (
              <li key={h.url}>
                <Link
                  to={h.url}
                  prefetch="intent"
                  className="group flex min-h-11 items-center justify-between gap-3 rounded-md px-3 font-semibold text-texto no-underline transition-colors hover:bg-marca-sutil hover:text-marca"
                >
                  {h.titulo}
                  <Icono
                    nombre="flecha-derecha"
                    tamano={18}
                    className="-translate-x-1 text-marca-medio opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

/** Una sección en el menú del teléfono: se despliega para ver sus páginas. */
function SeccionMovil({ seccion: s, actual }: { seccion: Seccion; actual: boolean }) {
  const [abierta, setAbierta] = useState(actual);
  const id = useId();
  return (
    <li className="border-t border-borde">
      <div className="flex items-center">
        <Link
          to={s.url}
          aria-current={actual ? "page" : undefined}
          className={`flex min-h-14 flex-1 items-center text-lg font-semibold no-underline ${actual ? "text-marca" : "text-texto"}`}
        >
          {s.titulo}
        </Link>
        <button
          type="button"
          aria-expanded={abierta}
          aria-controls={id}
          aria-label={`Páginas de ${s.titulo}`}
          onClick={() => setAbierta((v) => !v)}
          className="inline-flex size-12 items-center justify-center rounded-md text-marca-medio transition-colors hover:bg-marca-sutil"
        >
          <Icono nombre="chevron-abajo" className={`transition-transform duration-200 ${abierta ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div
        id={id}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${abierta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <ul className="flex flex-col overflow-hidden pl-4" inert={!abierta}>
          {s.hijos.map((h) => (
            <li key={h.url}>
              <Link to={h.url} className="flex min-h-11 items-center text-base text-enlace no-underline hover:underline">
                {h.titulo}
              </Link>
            </li>
          ))}
          <li aria-hidden className="h-2" />
        </ul>
      </div>
    </li>
  );
}
