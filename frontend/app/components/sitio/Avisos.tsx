import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { Icono } from "~/components/ui/Icono";
import { esExterno, fecha } from "~/lib/formato";
import type { Aviso } from "~/lib/tipos";

const CLAVE = "avisos-ocultos";

/** Cuánto le queda al aviso, dicho como lo diría una persona. */
function vencimiento(a: Aviso): { texto: string; urgente: boolean } {
  const d = a.dias_restantes;
  if (d <= 0) return { texto: "Último día", urgente: true };
  if (d === 1) return { texto: "Vence mañana", urgente: true };
  if (d <= 7) return { texto: `Quedan ${d} días`, urgente: true };
  return { texto: `Hasta el ${fecha(a.vence_en)}`, urgente: false };
}

function Vencimiento({ aviso }: { aviso: Aviso }) {
  const v = vencimiento(aviso);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm whitespace-nowrap ${
        v.urgente ? "bg-acento font-semibold text-sobre-marca" : "bg-superficie text-texto-secundario ring-1 ring-borde"
      }`}
    >
      <Icono nombre="reloj" tamano={16} />
      <time dateTime={aviso.vence_en} title={`Vigente hasta el ${fecha(aviso.vence_en)}`}>
        {v.texto}
      </time>
    </span>
  );
}

/** Enlace del aviso (interno con prefetch, externo en la misma pestaña) o texto plano. */
function TextoAviso({ aviso, className }: { aviso: Aviso; className: string }) {
  if (!aviso.enlace) return <p className={className}>{aviso.texto}</p>;
  const clase = `${className} text-texto no-underline decoration-acento decoration-2 underline-offset-4 hover:underline after:absolute after:inset-0 after:content-['']`;
  return esExterno(aviso.enlace) ? (
    <a href={aviso.enlace} className={clase}>
      {aviso.texto}
    </a>
  ) : (
    <Link to={aviso.enlace} prefetch="intent" className={clase}>
      {aviso.texto}
    </Link>
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
 * Avisos de la portada: cada uno con su vencimiento y un botón para ocultarlo.
 * Lo ocultado se recuerda en este navegador; los avisos que ya vencieron se olvidan solos.
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
      className="border-b border-borde bg-acento-sutil focus:outline-none"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6">
        <h2 id="titulo-avisos" className="sr-only">
          Avisos importantes
        </h2>

        {visibles.length > 0 && (
          <ul className="flex flex-col gap-3">
            {visibles.map((a) => {
              const fuera = saliendo.includes(a.id);
              return (
                <li
                  key={a.id}
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
                    fuera ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                  }`}
                  inert={fuera}
                >
                  <div className="overflow-hidden">
                    <article className="group relative flex items-start gap-4 rounded-lg border border-acento/25 border-l-4 border-l-acento bg-superficie py-4 pr-14 pl-4 shadow-sm transition-shadow focus-within:shadow-md hover:shadow-md sm:items-center sm:pl-5">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-acento-sutil text-acento-hover"
                      >
                        <Icono nombre="aviso" tamano={20} />
                      </span>

                      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <p className="text-xs font-bold tracking-widest text-acento-hover uppercase">Aviso</p>
                          <TextoAviso aviso={a} className="text-lg leading-snug font-semibold" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Vencimiento aviso={a} />
                          {a.enlace && (
                            <span
                              aria-hidden
                              className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-enlace"
                            >
                              Ver más
                              <Icono
                                nombre={esExterno(a.enlace) ? "externo" : "flecha-derecha"}
                                tamano={18}
                                className="transition-transform group-hover:translate-x-0.5"
                              />
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => ocultar(a)}
                        aria-label={`Ocultar el aviso: ${a.texto}`}
                        title="Ocultar este aviso"
                        className="absolute top-3 right-3 z-10 inline-flex size-10 items-center justify-center rounded-md text-texto-secundario transition-colors hover:bg-acento-sutil hover:text-acento-hover sm:top-1/2 sm:-translate-y-1/2"
                      >
                        <Icono nombre="cerrar" tamano={20} />
                      </button>
                    </article>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {cuantosOcultos > 0 && (
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${visibles.length ? "" : "py-1"}`}>
            <span className="text-texto-secundario">
              {cuantosOcultos === 1 ? "Ocultaste 1 aviso." : `Ocultaste ${cuantosOcultos} avisos.`}
            </span>
            <button
              ref={restaurar}
              type="button"
              onClick={mostrarTodos}
              className="min-h-11 font-semibold text-enlace underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {cuantosOcultos === 1 ? "Mostrarlo de nuevo" : "Mostrarlos de nuevo"}
            </button>
            <Link to="/noticias#avisos" prefetch="intent" className="min-h-11 content-center font-semibold text-enlace">
              Ver todos los avisos
            </Link>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
    </section>
  );
}

/** Lista completa de avisos vigentes (página de noticias): sin ocultar, con su vencimiento. */
export function ListaAvisos({ avisos }: { avisos: Aviso[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {avisos.map((a) => (
        <li key={a.id}>
          <article className="group relative flex items-start gap-4 rounded-lg border border-acento/25 border-l-4 border-l-acento bg-superficie px-5 py-4 shadow-sm transition-shadow focus-within:shadow-md hover:shadow-md">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-acento-sutil text-acento-hover"
            >
              <Icono nombre="aviso" tamano={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <TextoAviso aviso={a} className="text-lg leading-snug font-semibold" />
              <div className="flex flex-wrap items-center gap-3">
                <Vencimiento aviso={a} />
                {a.enlace && (
                  <span aria-hidden className="inline-flex items-center gap-1 font-semibold text-enlace">
                    Ver más
                    <Icono
                      nombre={esExterno(a.enlace) ? "externo" : "flecha-derecha"}
                      tamano={18}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                )}
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
