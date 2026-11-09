import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { Icono } from "~/components/ui/Icono";
import { FOCO_INTERNO } from "~/components/ui/Tarjeta";
import { dia, esExterno, fecha, mesCorto } from "~/lib/formato";
import type { Aviso } from "~/lib/tipos";

const CLAVE = "avisos-ocultos";

/** Cuánto le queda al aviso, dicho en pocas palabras. Urgente = vence en una semana o menos. */
function vencimiento(a: Aviso): { texto: string; urgente: boolean } {
  const d = a.dias_restantes;
  if (d <= 0) return { texto: "Último día", urgente: true };
  if (d === 1) return { texto: "Vence mañana", urgente: true };
  if (d <= 7) return { texto: `Quedan ${d} días`, urgente: true };
  return { texto: `Hasta el ${dia(a.vence_en)} ${mesCorto(a.vence_en)}`, urgente: false };
}

/**
 * Una fila de aviso: punto, texto y vencimiento. Sin cajas ni colores de fondo;
 * solo el punto y la fecha se vuelven terracota cuando queda poco tiempo.
 */
function FilaAviso({ aviso, alOcultar }: { aviso: Aviso; alOcultar?: () => void }) {
  const v = vencimiento(aviso);
  const externo = aviso.enlace ? esExterno(aviso.enlace) : false;
  // El enlace cubre toda la fila (pseudo-elemento) para que sea fácil de tocar.
  const claseEnlace =
    "text-texto no-underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none";

  return (
    <div className={`group relative flex items-start gap-4 rounded-sm py-4 sm:items-center ${FOCO_INTERNO}`}>
      <span
        aria-hidden
        className={`mt-2 size-2 shrink-0 rounded-full sm:mt-0 ${
          v.urgente ? "bg-acento ring-4 ring-acento/15" : "bg-texto-secundario/40"
        }`}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
        <p className="min-w-0 flex-1 leading-snug font-medium text-pretty">
          {aviso.enlace ? (
            externo ? (
              <a href={aviso.enlace} className={claseEnlace}>
                {aviso.texto}
              </a>
            ) : (
              <Link to={aviso.enlace} prefetch="intent" className={claseEnlace}>
                {aviso.texto}
              </Link>
            )
          ) : (
            aviso.texto
          )}
        </p>
        <time
          dateTime={aviso.vence_en}
          title={`Vigente hasta el ${fecha(aviso.vence_en)}`}
          className={`shrink-0 text-sm tabular-nums ${v.urgente ? "font-semibold text-acento-hover" : "text-texto-secundario"}`}
        >
          {v.texto}
        </time>
      </div>

      {aviso.enlace && (
        <Icono
          nombre={externo ? "externo" : "flecha-derecha"}
          tamano={18}
          className="mt-0.5 hidden shrink-0 text-texto-secundario transition group-focus-within:translate-x-0.5 group-focus-within:text-acento-hover group-hover:translate-x-0.5 group-hover:text-acento-hover sm:mt-0 sm:block"
        />
      )}

      {alOcultar && (
        <button
          type="button"
          onClick={alOcultar}
          aria-label={`Ocultar el aviso: ${aviso.texto}`}
          title="Ocultar"
          className="relative z-10 -my-2 -mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-texto-secundario transition hover:bg-sutil hover:text-texto sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <Icono nombre="cerrar" tamano={18} />
        </button>
      )}

      {/* Subrayado fino que aparece al pasar el puntero o enfocar el enlace. */}
      {aviso.enlace && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-acento transition-transform duration-300 ease-out group-focus-within:scale-x-100 group-hover:scale-x-100 motion-reduce:transition-none"
        />
      )}
    </div>
  );
}

function leerOcultos(): number[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(CLAVE) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : [];
  } catch {
    return [];
  }
}

function guardarOcultos(ids: number[]) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(ids));
  } catch {
    // Navegación privada o almacenamiento bloqueado: se oculta solo en esta visita.
  }
}

/**
 * Avisos de la portada: una lista sobria bajo la portada, cada aviso con su vencimiento
 * y la opción de ocultarlo. Lo ocultado se recuerda en este navegador; los avisos que
 * ya vencieron se olvidan solos.
 */
export function AvisosPortada({ avisos }: { avisos: Aviso[] }) {
  // null hasta montar: el servidor siempre dibuja todos los avisos.
  const [ocultos, setOcultos] = useState<number[] | null>(null);
  const [saliendo, setSaliendo] = useState<number[]>([]);
  const [anuncio, setAnuncio] = useState("");
  const restaurar = useRef<HTMLButtonElement>(null);
  const seccion = useRef<HTMLElement>(null);

  useEffect(() => {
    const vigentes = new Set(avisos.map((a) => a.id));
    const ids = leerOcultos().filter((id) => vigentes.has(id));
    guardarOcultos(ids);
    setOcultos(ids);
  }, [avisos]);

  const lista = ocultos ?? [];
  const visibles = avisos.filter((a) => !lista.includes(a.id));
  const cuantosOcultos = avisos.length - visibles.length;

  function ocultar(aviso: Aviso) {
    setSaliendo((s) => [...s, aviso.id]);
    // Primero se pliega y luego se quita, para que el resto de la página no salte de golpe.
    window.setTimeout(() => {
      const ids = [...lista, aviso.id];
      guardarOcultos(ids);
      setOcultos(ids);
      setSaliendo((s) => s.filter((id) => id !== aviso.id));
      setAnuncio("Aviso ocultado.");
      window.setTimeout(() => restaurar.current?.focus(), 0);
    }, 220);
  }

  function mostrarTodos() {
    guardarOcultos([]);
    setOcultos([]);
    setAnuncio(cuantosOcultos === 1 ? "Se muestra de nuevo 1 aviso." : `Se muestran de nuevo ${cuantosOcultos} avisos.`);
    window.setTimeout(() => seccion.current?.focus(), 0);
  }

  if (avisos.length === 0) return null;

  return (
    <section
      ref={seccion}
      tabIndex={-1}
      aria-labelledby="titulo-avisos"
      className="border-b border-borde bg-superficie focus:outline-none"
    >
      <div className="mx-auto grid max-w-7xl gap-x-12 px-4 py-6 sm:px-6 lg:grid-cols-[10rem_1fr] lg:py-8">
        <h2
          id="titulo-avisos"
          className="flex items-center gap-2 text-xs font-bold tracking-widest text-acento uppercase lg:h-14 lg:items-center"
        >
          Avisos
          <span className="font-semibold text-texto-secundario tabular-nums">{visibles.length || ""}</span>
        </h2>

        <div className="flex flex-col">
          {visibles.length > 0 && (
            <ul className="divide-y divide-borde">
              {visibles.map((a) => {
                const fuera = saliendo.includes(a.id);
                return (
                  <li
                    key={a.id}
                    inert={fuera}
                    className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
                      fuera ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <FilaAviso aviso={a} alOcultar={() => ocultar(a)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {cuantosOcultos > 0 && (
            <p
              className={`flex flex-wrap items-center gap-x-4 text-sm text-texto-secundario ${
                visibles.length ? "border-t border-borde pt-2" : "lg:min-h-14"
              }`}
            >
              {cuantosOcultos === 1 ? "1 aviso oculto." : `${cuantosOcultos} avisos ocultos.`}
              <button
                ref={restaurar}
                type="button"
                onClick={mostrarTodos}
                className="min-h-11 font-semibold text-enlace hover:underline"
              >
                Mostrar
              </button>
              <Link to="/noticias#avisos" prefetch="intent" className="min-h-11 content-center font-semibold text-enlace no-underline hover:underline">
                Ver todos
              </Link>
            </p>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
    </section>
  );
}

/** Lista completa de avisos vigentes (página de noticias), con el mismo estilo y sin ocultar. */
export function ListaAvisos({ avisos }: { avisos: Aviso[] }) {
  return (
    <ul className="divide-y divide-borde border-y border-borde">
      {avisos.map((a) => (
        <li key={a.id}>
          <FilaAviso aviso={a} />
        </li>
      ))}
    </ul>
  );
}
