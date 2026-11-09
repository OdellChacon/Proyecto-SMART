import { CabeceraPagina, Lista, Parrafos, Pendiente, TituloBloque } from "~/components/sitio/Pagina";
import { EnlaceBoton } from "~/components/ui/Boton";
import { Icono } from "~/components/ui/Icono";
import { TARJETA } from "~/components/ui/Tarjeta";
import { obtener } from "~/lib/contenido.server";
import { fecha } from "~/lib/formato";
import { metaDePagina } from "~/lib/meta";
import type { Admision } from "~/lib/tipos";

import type { Route } from "./+types/admision";

export async function loader() {
  return { admision: await obtener<Admision>("admision/") };
}

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Admisión", "Requisitos, proceso de inscripción y preguntas frecuentes.");

const INDICE = [
  { id: "fechas", titulo: "Fechas importantes" },
  { id: "requisitos", titulo: "Requisitos y documentos" },
  { id: "proceso", titulo: "Proceso de inscripción" },
  { id: "costos", titulo: "Costos" },
  { id: "preguntas", titulo: "Preguntas frecuentes" },
];

export default function AdmisionPagina({ loaderData }: Route.ComponentProps) {
  const { requisitos, pasos, preguntas, fechas, costos, costos_nota } = loaderData.admision;
  const indice = INDICE.filter(
    (i) => (i.id !== "fechas" || fechas.length) && (i.id !== "costos" || costos.length),
  );
  return (
    <>
      <CabeceraPagina
        titulo="Admisión"
        ruta={[{ titulo: "Admisión", url: "/admision" }]}
        introduccion="Todo lo que necesitas para inscribirte: los documentos, los pasos y las respuestas a las dudas más comunes."
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <EnlaceBoton to="/admision/solicitar-informacion" icono="flecha-derecha">
            Solicitar información
          </EnlaceBoton>
        </div>
      </CabeceraPagina>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[16rem_1fr] lg:gap-14 lg:py-14">
        <nav aria-label="En esta página" className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-3 text-xs font-bold tracking-widest text-texto-secundario uppercase">
            En esta página
          </p>
          <ul className="flex flex-col gap-1">
            {indice.map((i) => (
              <li key={i.id}>
                <a href={`#${i.id}`} className="flex min-h-11 items-center font-semibold no-underline hover:underline">
                  {i.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-16">
          {fechas.length > 0 && (
            <section aria-labelledby="fechas">
              <TituloBloque id="fechas">Fechas importantes</TituloBloque>
              <ol className="grid gap-4 sm:grid-cols-2">
                {fechas.map((f) => (
                  <li key={f.titulo} className={`${TARJETA} flex gap-4 p-5`}>
                    <Icono nombre="calendario" className="mt-1 text-acento" />
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold">{f.titulo}</p>
                      <p className="text-texto-secundario">
                        {f.fin ? `Del ${fecha(f.inicio)} al ${fecha(f.fin)}` : fecha(f.inicio)}
                      </p>
                      {f.descripcion && <p className="text-sm text-texto-secundario">{f.descripcion}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section aria-labelledby="requisitos">
            <TituloBloque id="requisitos">Requisitos y documentos</TituloBloque>
            {requisitos.length ? (
              <div className={`${TARJETA} p-6 lg:p-8`}>
                <Lista elementos={requisitos} />
              </div>
            ) : (
              <Pendiente>Los requisitos están pendientes de publicar.</Pendiente>
            )}
            <p className="mt-4 text-texto-secundario">
              Los formatos que debes llenar están en{" "}
              <a href="/normativa/formatos">Normativa › Formatos descargables</a>.
            </p>
          </section>

          <section aria-labelledby="proceso">
            <TituloBloque id="proceso">Proceso de inscripción</TituloBloque>
            {pasos.length ? (
              <ol className="flex flex-col">
                {pasos.map((p, i) => (
                  <li key={p.titulo} className="relative flex gap-5 pb-8 last:pb-0">
                    {i < pasos.length - 1 && (
                      <span aria-hidden className="absolute top-12 bottom-0 left-6 w-0.5 bg-borde" />
                    )}
                    <span className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-marca font-serif text-xl font-semibold text-sobre-marca">
                      {i + 1}
                    </span>
                    <div className="flex flex-col gap-2 pt-2">
                      <h3 className="text-xl">{p.titulo}</h3>
                      <Parrafos texto={p.descripcion} className="text-texto-secundario" />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <Pendiente>El proceso de inscripción está pendiente de publicar.</Pendiente>
            )}
          </section>

          {costos.length > 0 && (
            <section aria-labelledby="costos">
              <TituloBloque id="costos">Costos</TituloBloque>
              <div className="overflow-hidden rounded-lg border border-borde">
                <table className="w-full text-left">
                  <thead className="bg-marca-sutil text-sm text-marca">
                    <tr>
                      <th scope="col" className="px-5 py-3">Concepto</th>
                      <th scope="col" className="px-5 py-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borde">
                    {costos.map((c) => (
                      <tr key={c.concepto}>
                        <td className="px-5 py-4">
                          <p className="font-semibold">{c.concepto}</p>
                          {c.nota && <p className="text-sm text-texto-secundario">{c.nota}</p>}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold whitespace-nowrap">{c.monto}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {costos_nota && <p className="mt-4 text-texto-secundario">{costos_nota}</p>}
            </section>
          )}

          <section aria-labelledby="preguntas">
            <TituloBloque id="preguntas">Preguntas frecuentes</TituloBloque>
            {preguntas.length ? (
              <div className="flex flex-col divide-y divide-borde rounded-lg border border-borde">
                {preguntas.map((p) => (
                  <details key={p.pregunta} className="group">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-lg font-semibold hover:bg-sutil [&::-webkit-details-marker]:hidden">
                      {p.pregunta}
                      <Icono nombre="chevron-abajo" className="text-marca-medio transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-6 pb-6">
                      <Parrafos texto={p.respuesta} className="text-texto-secundario" />
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <Pendiente>Las preguntas frecuentes están pendientes de publicar.</Pendiente>
            )}
          </section>

          <section aria-labelledby="t-ayuda" className="flex flex-col items-start gap-4 rounded-lg bg-marca p-8 text-sobre-marca">
            <h2 id="t-ayuda" className="text-2xl text-sobre-marca">¿Te quedó alguna duda?</h2>
            <p className="text-sobre-marca-suave">Escríbenos y te respondemos al correo que nos indiques.</p>
            <EnlaceBoton to="/admision/solicitar-informacion" icono="flecha-derecha">
              Solicitar información
            </EnlaceBoton>
          </section>
        </div>
      </div>
    </>
  );
}
