import { useId, useMemo, useState } from "react";

import { Icono } from "~/components/ui/Icono";
import { fecha, tamanoArchivo } from "~/lib/formato";
import type { Documento } from "~/lib/tipos";

/** Lista de documentos con descarga: dice formato y peso antes de descargar. */
export function ListaDocumentos({ documentos }: { documentos: Documento[] }) {
  return (
    <ul className="flex flex-col divide-y divide-borde rounded-lg border border-borde">
      {documentos.map((d) => {
        const detalle = [d.formato, tamanoArchivo(d.tamano)].filter(Boolean).join(", ");
        return (
          <li key={d.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div className="flex items-start gap-4">
              <Icono nombre="documento" className="mt-1 text-marca-medio" tamano={28} />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{d.nombre}</p>
                {d.descripcion && <p className="text-texto-secundario">{d.descripcion}</p>}
                <p className="text-sm text-texto-secundario">
                  Publicado el {fecha(d.publicado_en)}
                  {detalle && ` · ${detalle}`}
                </p>
              </div>
            </div>
            {d.archivo ? (
              <a
                href={d.archivo}
                download
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md border-2 border-marca-medio px-5 font-semibold text-marca-medio no-underline hover:bg-marca-sutil"
              >
                <Icono nombre="descargar" tamano={20} />
                Descargar
                <span className="sr-only">
                  {d.nombre} {detalle && `(${detalle})`}
                </span>
              </a>
            ) : (
              <span className="text-sm text-texto-secundario">Archivo pendiente</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Orden = "recientes" | "nombre";

/** Lista de documentos con filtro por nombre, formato y orden, sin recargar la página. */
export function DocumentosFiltrables({ documentos }: { documentos: Documento[] }) {
  const [texto, setTexto] = useState("");
  const [formato, setFormato] = useState<string | null>(null);
  const [orden, setOrden] = useState<Orden>("recientes");
  const idFiltro = useId();

  const formatos = useMemo(
    () => [...new Set(documentos.map((d) => d.formato).filter((f): f is string => Boolean(f)))].sort(),
    [documentos],
  );

  const visibles = useMemo(() => {
    const termino = sinAcentos(texto.trim());
    const lista = documentos.filter(
      (d) =>
        (!formato || d.formato === formato) &&
        (!termino || sinAcentos(`${d.nombre} ${d.descripcion}`).includes(termino)),
    );
    return orden === "nombre"
      ? [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      : [...lista].sort((a, b) => b.publicado_en.localeCompare(a.publicado_en));
  }, [documentos, texto, formato, orden]);

  // Con pocos documentos el filtro estorba más de lo que ayuda.
  if (documentos.length < 4) return <ListaDocumentos documentos={documentos} />;

  const filtrando = Boolean(texto.trim() || formato);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-borde bg-sutil p-4 sm:flex-row sm:items-end lg:p-5">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor={`${idFiltro}-q`} className="text-sm font-semibold">
            Filtrar por nombre
          </label>
          <div className="relative">
            <Icono nombre="buscar" tamano={20} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-texto-secundario" />
            <input
              id={`${idFiltro}-q`}
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Por ejemplo: evaluación"
              className="h-12 w-full rounded-md border-[1.5px] border-borde-campo bg-superficie pr-4 pl-10 text-base focus:border-foco"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idFiltro}-orden`} className="text-sm font-semibold">
            Ordenar
          </label>
          <select
            id={`${idFiltro}-orden`}
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            className="h-12 rounded-md border-[1.5px] border-borde-campo bg-superficie px-3 text-base focus:border-foco"
          >
            <option value="recientes">Más recientes primero</option>
            <option value="nombre">Por nombre (A–Z)</option>
          </select>
        </div>
      </div>

      {formatos.length > 1 && (
        <div role="group" aria-label="Filtrar por formato" className="flex flex-wrap gap-2">
          {[null, ...formatos].map((f) => {
            const activo = formato === f;
            return (
              <button
                key={f ?? "todos"}
                type="button"
                aria-pressed={activo}
                onClick={() => setFormato(f)}
                className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors ${
                  activo
                    ? "border-marca bg-marca text-sobre-marca"
                    : "border-borde bg-superficie text-texto hover:bg-marca-sutil"
                }`}
              >
                {f ?? "Todos"}
              </button>
            );
          })}
        </div>
      )}

      <p aria-live="polite" className="text-sm text-texto-secundario">
        {filtrando
          ? `${visibles.length} de ${documentos.length} documentos`
          : `${documentos.length} documentos`}
      </p>

      {visibles.length ? (
        <ListaDocumentos documentos={visibles} />
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-borde-fuerte px-6 py-8">
          <p className="font-semibold">Ningún documento coincide con el filtro.</p>
          <button
            type="button"
            onClick={() => {
              setTexto("");
              setFormato(null);
            }}
            className="font-semibold text-enlace underline underline-offset-4"
          >
            Quitar el filtro
          </button>
        </div>
      )}
    </div>
  );
}
