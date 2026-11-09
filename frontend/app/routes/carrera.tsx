import { useState } from "react";

import { CabeceraPagina, Lista, Parrafos, Pendiente, TituloBloque } from "~/components/sitio/Pagina";
import { EnlaceBoton } from "~/components/ui/Boton";
import { Foto } from "~/components/ui/Foto";
import { Icono } from "~/components/ui/Icono";
import { obtener } from "~/lib/contenido.server";
import { metaDePagina } from "~/lib/meta";
import type { Carrera, Semestre } from "~/lib/tipos";

import type { Route } from "./+types/carrera";

export async function loader({ params }: Route.LoaderArgs) {
  return { carrera: await obtener<Carrera>(`carreras/${encodeURIComponent(params.slug)}/`) };
}

export const meta: Route.MetaFunction = ({ matches, data }) =>
  metaDePagina(matches, data?.carrera.nombre ?? "Carrera", data?.carrera.resumen);

const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function TablaSemestre({ s, abierto, alternar }: { s: Semestre; abierto: boolean; alternar: () => void }) {
  const id = `sem-${s.semestre}`;
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-lg border border-borde bg-superficie">
      <h3 id={id} className="font-sans text-base">
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={`${id}-tabla`}
          onClick={alternar}
          className={`flex min-h-14 w-full items-center gap-4 px-5 py-3 text-left transition-colors ${
            abierto ? "bg-marca-sutil text-marca" : "text-texto hover:bg-sutil"
          }`}
        >
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-marca font-serif text-sm font-semibold text-sobre-marca">
            {ROMANOS[s.semestre - 1] ?? s.semestre}
          </span>
          <span className="flex-1 font-bold">Semestre {ROMANOS[s.semestre - 1] ?? s.semestre}</span>
          <span className="hidden text-sm font-normal text-texto-secundario sm:inline">
            {s.asignaturas.length} asignaturas · {s.total_uc} UC
          </span>
          <Icono nombre="chevron-abajo" className={`shrink-0 text-marca-medio transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
        </button>
      </h3>
      <div
        id={`${id}-tabla`}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${abierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden" inert={!abierto}>
          <table className="w-full border-t border-borde text-left">
            <caption className="sr-only">
              Asignaturas del semestre {s.semestre}
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Asignatura</th>
                <th scope="col">Unidades de crédito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {s.asignaturas.map((a) => (
                <tr key={a.codigo} className="transition-colors hover:bg-sutil">
                  <td className="hidden w-28 py-3 pl-5 align-top text-sm text-texto-secundario sm:table-cell">
                    {a.codigo}
                  </td>
                  <td className="px-5 py-3 sm:pl-2">{a.nombre}</td>
                  <td className="w-20 py-3 pr-5 text-right align-top text-sm whitespace-nowrap text-texto-secundario">
                    {a.unidades_credito} UC
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-borde bg-sutil text-sm font-semibold">
                <td className="hidden sm:table-cell" />
                <td className="px-5 py-3 sm:pl-2">Total del semestre</td>
                <td className="py-3 pr-5 text-right whitespace-nowrap">{s.total_uc} UC</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}

/** Pensum plegable: el primer semestre abierto y botones para abrir o cerrar todos. */
function Pensum({ semestres, totalUc }: { semestres: Semestre[]; totalUc: number }) {
  const [abiertos, setAbiertos] = useState<Set<number>>(() => new Set(semestres.slice(0, 1).map((s) => s.semestre)));
  const todos = abiertos.size === semestres.length;
  const asignaturas = semestres.reduce((t, s) => t + s.asignaturas.length, 0);
  const alternar = (n: number) =>
    setAbiertos((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(n)) nuevo.delete(n);
      else nuevo.add(n);
      return nuevo;
    });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-texto-secundario">
          {semestres.length} semestres · {asignaturas} asignaturas · {totalUc} UC
        </p>
        <button
          type="button"
          onClick={() => setAbiertos(todos ? new Set() : new Set(semestres.map((s) => s.semestre)))}
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 font-semibold text-enlace transition-colors hover:bg-marca-sutil"
        >
          <Icono nombre="chevron-abajo" tamano={20} className={`transition-transform ${todos ? "rotate-180" : ""}`} />
          {todos ? "Cerrar todos" : "Abrir todos"}
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {semestres.map((s) => (
          <TablaSemestre key={s.semestre} s={s} abierto={abiertos.has(s.semestre)} alternar={() => alternar(s.semestre)} />
        ))}
      </div>
      <p className="mt-4 text-sm text-texto-secundario">UC: unidades de crédito.</p>
    </>
  );
}

export default function CarreraPagina({ loaderData }: Route.ComponentProps) {
  const { carrera: c } = loaderData;
  const ficha = [
    ["Título", c.titulo_otorgado],
    ["Duración", c.duracion],
    ["Modalidad", c.modalidad],
    ["Turno", c.turno],
  ].filter(([, v]) => v);
  const totalUc = c.pensum.reduce((t, s) => t + s.total_uc, 0);
  const solicitar = `/admision/solicitar-informacion?carrera=${c.slug}`;

  return (
    <>
      <CabeceraPagina
        titulo={c.nombre}
        ruta={[
          { titulo: "Carreras", url: "/carreras" },
          { titulo: c.nombre, url: `/carreras/${c.slug}` },
        ]}
        sobretitulo="Carrera"
        introduccion={c.titulo_otorgado ? `Título que otorga: ${c.titulo_otorgado}` : undefined}
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_22rem] lg:gap-14 lg:py-14">
        {/* Ficha rápida: en el teléfono va primero, justo después del título */}
        <aside className="lg:order-2">
          <div className="flex flex-col gap-6 rounded-lg border border-borde bg-superficie p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-xl">Ficha rápida</h2>
            <dl className="flex flex-col divide-y divide-borde">
              {ficha.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3">
                  <dt className="text-texto-secundario">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-col gap-3">
              <p className="font-serif text-lg font-semibold">¿Te interesa?</p>
              <EnlaceBoton to={solicitar} anchoCompleto icono="flecha-derecha">
                Solicitar información
              </EnlaceBoton>
              {c.pensum_pdf && (
                <a
                  href={c.pensum_pdf}
                  download
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md border-2 border-marca-medio px-7 font-semibold text-marca-medio no-underline hover:bg-marca-sutil"
                >
                  <Icono nombre="descargar" tamano={22} />
                  Descargar pensum (PDF)
                </a>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-14 lg:order-1">
          {c.imagen && (
            <Foto
              imagen={c.imagen}
              alt={c.imagen_descripcion}
              sizes="(min-width: 1024px) 60vw, 100vw"
              prioritaria
              className="aspect-[21/9] w-full rounded-lg object-cover"
            />
          )}
          <section aria-labelledby="t-presentacion">
            <TituloBloque id="t-presentacion">Presentación</TituloBloque>
            {c.presentacion ? <Parrafos texto={c.presentacion} /> : <Pendiente>Pendiente de publicar.</Pendiente>}
          </section>

          <div className="grid gap-10 md:grid-cols-2">
            <section aria-labelledby="t-perfil">
              <TituloBloque id="t-perfil">Perfil del egresado</TituloBloque>
              {c.perfil_egresado.length ? <Lista elementos={c.perfil_egresado} /> : <Pendiente>Pendiente de publicar.</Pendiente>}
            </section>
            <section aria-labelledby="t-campo">
              <TituloBloque id="t-campo">Campo laboral</TituloBloque>
              {c.campo_laboral.length ? <Lista elementos={c.campo_laboral} /> : <Pendiente>Pendiente de publicar.</Pendiente>}
            </section>
          </div>

          <section aria-labelledby="t-pensum">
            <TituloBloque id="t-pensum">Pensum por semestre</TituloBloque>
            {c.pensum_es_ejemplo && (
              <p className="mb-6 flex items-start gap-2 rounded-md bg-aviso-sutil px-4 py-3 text-aviso">
                <Icono nombre="aviso" className="mt-0.5" tamano={20} />
                Pensum de ejemplo: se reemplaza por el aprobado oficialmente.
              </p>
            )}
            {c.pensum.length > 0 ? (
              <Pensum semestres={c.pensum} totalUc={totalUc} />
            ) : (
              <Pendiente>El pensum por semestre está pendiente de publicar.</Pendiente>
            )}
          </section>

          {(c.propio_titulo || c.propio) && (
            <section aria-labelledby="t-propio" className="rounded-lg bg-sutil p-6 lg:p-8">
              <TituloBloque id="t-propio">{c.propio_titulo || "Lo propio de la carrera"}</TituloBloque>
              <Parrafos texto={c.propio} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
