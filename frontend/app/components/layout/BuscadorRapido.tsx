import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Form, useNavigate } from "react-router";

import { Icono, type NombreIcono } from "~/components/ui/Icono";
import { api } from "~/lib/api";
import { useClicFuera, useRetrasado } from "~/lib/hooks";
import type { ResultadosBusqueda } from "~/lib/tipos";

interface Opcion {
  grupo: string;
  icono: NombreIcono;
  titulo: string;
  url: string;
  detalle?: string;
}

const POR_GRUPO = 3;

function aOpciones(r: ResultadosBusqueda): Opcion[] {
  return [
    ...r.paginas.slice(0, POR_GRUPO).map((p) => ({ grupo: "Páginas", icono: "flecha-derecha" as const, titulo: p.titulo, url: p.url })),
    ...r.carreras.slice(0, POR_GRUPO).map((c) => ({ grupo: "Carreras", icono: "birrete" as const, titulo: c.nombre, url: `/carreras/${c.slug}` })),
    ...r.noticias.slice(0, POR_GRUPO).map((n) => ({ grupo: "Noticias", icono: "calendario" as const, titulo: n.titulo, url: `/noticias/${n.slug}` })),
    ...r.documentos.slice(0, POR_GRUPO).map((d) => ({ grupo: "Documentos", icono: "documento" as const, titulo: d.nombre, url: `/normativa/${d.categoria}`, detalle: d.formato ?? undefined })),
  ];
}

/** Letra sin acento y en minúscula, conservando la longitud del texto. */
const base = (texto: string) =>
  Array.from(texto, (c) => c.normalize("NFD")[0]?.toLowerCase() ?? c).join("");

/** Resalta la parte del título que coincide con lo escrito (sin distinguir acentos). */
function Resaltado({ texto, termino }: { texto: string; termino: string }) {
  const i = base(texto).indexOf(base(termino));
  if (!termino || i < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <mark className="rounded-sm bg-acento-sutil text-inherit">{texto.slice(i, i + termino.length)}</mark>
      {texto.slice(i + termino.length)}
    </>
  );
}

type Estado =
  | { tipo: "vacio" }
  | { tipo: "cargando" }
  | { tipo: "listo"; opciones: Opcion[]; termino: string }
  | { tipo: "error" };

/**
 * Buscador con sugerencias mientras se escribe (patrón «combobox» de WAI-ARIA).
 * Sin JavaScript sigue funcionando como formulario normal hacia /buscar.
 */
export function BuscadorRapido({ variante = "encabezado" }: { variante?: "encabezado" | "menu" }) {
  const id = useId();
  const idLista = `${id}-lista`;
  const navigate = useNavigate();
  const contenedor = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const [estado, setEstado] = useState<Estado>({ tipo: "vacio" });
  const termino = useRetrasado(texto.trim(), 220);

  useEffect(() => {
    if (termino.length < 2) {
      setEstado({ tipo: "vacio" });
      return;
    }
    let vigente = true;
    setEstado({ tipo: "cargando" });
    api
      .get<ResultadosBusqueda>(`/api/v1/buscar/?q=${encodeURIComponent(termino)}`)
      .then((r) => vigente && setEstado({ tipo: "listo", opciones: aOpciones(r), termino }))
      .catch(() => vigente && setEstado({ tipo: "error" }));
    setActiva(-1);
    return () => {
      vigente = false;
    };
  }, [termino]);

  useClicFuera(contenedor, () => setAbierto(false), abierto);

  const opciones = estado.tipo === "listo" ? estado.opciones : [];
  const verTodo = `/buscar?q=${encodeURIComponent(texto.trim())}`;
  // La última opción siempre es «Ver todos los resultados».
  const total = opciones.length + 1;
  const visible = abierto && texto.trim().length >= 2;

  function ir(url: string) {
    setAbierto(false);
    setTexto("");
    entrada.current?.blur();
    navigate(url);
  }

  function alTeclear(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAbierto(true);
      setActiva((i) => (i + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAbierto(true);
      setActiva((i) => (i <= 0 ? total - 1 : i - 1));
    } else if (e.key === "Enter" && visible && activa >= 0) {
      e.preventDefault();
      ir(activa < opciones.length ? opciones[activa]!.url : verTodo);
    } else if (e.key === "Escape") {
      if (visible) {
        e.preventDefault();
        setAbierto(false);
      } else {
        setTexto("");
      }
    }
  }

  const enMenu = variante === "menu";
  const idOpcion = (i: number) => `${id}-op-${i}`;
  let grupoAnterior = "";

  return (
    <div ref={contenedor} className={`relative ${enMenu ? "w-full" : ""}`}>
      <Form method="get" action="/buscar" role="search" className="flex items-center" onSubmit={() => setAbierto(false)}>
        <label htmlFor={`${id}-q`} className="sr-only">
          Buscar en el sitio
        </label>
        <input
          ref={entrada}
          id={`${id}-q`}
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Buscar en el sitio"
          role="combobox"
          aria-expanded={visible}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={visible && activa >= 0 ? idOpcion(activa) : undefined}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alTeclear}
          className={`h-12 rounded-l-md border-[1.5px] border-r-0 border-borde-campo bg-superficie px-4 text-base transition-[width,border-color] focus:border-foco ${
            enMenu ? "min-w-0 flex-1" : "w-64 focus:w-80 xl:w-72 xl:focus:w-96"
          }`}
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center gap-2 rounded-r-md bg-marca-medio px-4 font-semibold text-sobre-marca transition-colors hover:bg-marca active:bg-marca"
        >
          <Icono nombre="buscar" tamano={20} />
          Buscar
        </button>
      </Form>

      <div
        className={`absolute top-full right-0 z-40 mt-2 overflow-hidden rounded-lg border border-borde bg-superficie shadow-lg transition duration-150 ${
          enMenu ? "left-0" : "w-[min(28rem,calc(100vw-2rem))]"
        } ${visible ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}
      >
        <ul id={idLista} role="listbox" aria-label="Sugerencias" className="max-h-[min(28rem,60dvh)] overflow-y-auto py-2">
          {opciones.map((o, i) => {
            const nuevoGrupo = o.grupo !== grupoAnterior;
            grupoAnterior = o.grupo;
            return (
              <Fragment key={o.url + o.titulo}>
              {nuevoGrupo && (
                <li role="presentation" className="px-4 pt-3 pb-1 text-xs font-bold tracking-wider text-texto-secundario uppercase">
                  {o.grupo}
                </li>
              )}
              <li
                id={idOpcion(i)}
                role="option"
                aria-selected={activa === i}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => ir(o.url)}
                onPointerEnter={() => setActiva(i)}
                className={`mx-2 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 ${activa === i ? "bg-marca-sutil text-marca" : "text-texto"}`}
              >
                <Icono nombre={o.icono} tamano={18} className="shrink-0 text-marca-medio" />
                <span className="min-w-0 flex-1 truncate">
                  <Resaltado texto={o.titulo} termino={estado.tipo === "listo" ? estado.termino : ""} />
                </span>
                {o.detalle && <span className="shrink-0 text-sm text-texto-secundario">{o.detalle}</span>}
              </li>
              </Fragment>
            );
          })}

          {estado.tipo === "cargando" && opciones.length === 0 && (
            <li role="presentation" className="flex items-center gap-3 px-5 py-3 text-texto-secundario">
              <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-marca-medio border-r-transparent" />
              Buscando…
            </li>
          )}
          {estado.tipo === "listo" && opciones.length === 0 && (
            <li role="presentation" className="px-5 py-3 text-texto-secundario">
              Sin sugerencias para «{estado.termino}».
            </li>
          )}
          {estado.tipo === "error" && (
            <li role="presentation" className="px-5 py-3 text-texto-secundario">
              No pudimos traer sugerencias. Pulsa Buscar para ver los resultados.
            </li>
          )}

          <li
            id={idOpcion(opciones.length)}
            role="option"
            aria-selected={activa === opciones.length}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => ir(verTodo)}
            onPointerEnter={() => setActiva(opciones.length)}
            className={`mx-2 mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-md border-t border-borde px-3 py-3 font-semibold ${
              activa === opciones.length ? "bg-marca-sutil text-marca" : "text-enlace"
            }`}
          >
            Ver todos los resultados para «{texto.trim()}»
            <Icono nombre="flecha-derecha" tamano={18} />
          </li>
        </ul>
      </div>
      <p className="sr-only" aria-live="polite">
        {visible && estado.tipo === "listo" ? `${opciones.length} sugerencias.` : ""}
      </p>
    </div>
  );
}
