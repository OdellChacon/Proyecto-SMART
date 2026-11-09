import type { CSSProperties } from "react";
import { Link } from "react-router";

import { FilaCarrera, FilaNoticia, FotoPendiente, NoticiaPrincipal } from "~/components/sitio/Tarjetas";
import { EnlaceBoton } from "~/components/ui/Boton";
import { Foto } from "~/components/ui/Foto";
import { AvisosPortada } from "~/components/sitio/Avisos";
import { Icono } from "~/components/ui/Icono";
import { FLECHA, FOCO_INTERNO } from "~/components/ui/Tarjeta";
import { obtener, obtenerOpcional } from "~/lib/contenido.server";
import { dia, diaSemana, hora, mesCorto } from "~/lib/formato";
import { metaDePagina, sitioDe } from "~/lib/meta";
import type { Admision, Aviso, CarreraTarjeta, Evento, NoticiaTarjeta, Pagina } from "~/lib/tipos";

import type { Route } from "./+types/inicio";

export async function loader() {
  const [carreras, noticias, avisos, admision, eventos] = await Promise.all([
    obtener<CarreraTarjeta[]>("carreras/"),
    obtenerOpcional<Pagina<NoticiaTarjeta>>("noticias/?tamano=4", {
      count: 0, next: null, previous: null, results: [],
    }),
    obtenerOpcional<Aviso[]>("avisos/?portada=true", []),
    obtenerOpcional<Admision>("admision/", {
      requisitos: [], pasos: [], preguntas: [], fechas: [], costos: [], costos_nota: "",
    }),
    obtenerOpcional<Evento[]>("eventos/", []),
  ]);
  // Fechas de admisión que todavía no terminaron (con la fecha de la universidad), hasta cuatro.
  const hoy = diaCaracas(new Date());
  const fechas = admision.fechas.filter((f) => (f.fin ?? f.inicio) >= hoy).slice(0, 4);
  // Próximos eventos con los días que faltan, calculados aquí para que servidor y navegador coincidan.
  const proximos = eventos
    .map((e) => ({ ...e, dias: (Date.parse(diaCaracas(e.inicio)) - Date.parse(hoy)) / 86_400_000 }))
    .filter((e) => e.dias >= 0)
    .slice(0, 4);
  return { carreras, noticias: noticias.results, avisos, pasos: admision.pasos, fechas, eventos: proximos };
}

/** AAAA-MM-DD de una fecha, con el calendario de Caracas. */
function diaCaracas(valor: string | Date) {
  return new Date(valor).toLocaleDateString("en-CA", { timeZone: "America/Caracas" });
}

/** «Hoy», «Mañana» o «En 5 días» cuando falta menos de una semana. */
function cuanto(dias: number) {
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return dias < 7 ? `En ${dias} días` : null;
}

const PALABRAS = ["", "Un", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez"];

/** «Tres pasos», «Un paso», «12 carreras». */
function enPalabras(n: number, singular: string, plural: string) {
  return `${PALABRAS[n] ?? n} ${n === 1 ? singular : plural}`;
}

/** «7 nov – 7 dic» o «11 dic» si es un solo día. */
function rango(inicio: string, fin: string | null) {
  const corto = (v: string) => `${dia(v)} ${mesCorto(v)}`;
  return fin && fin !== inicio ? `${corto(inicio)} – ${corto(fin)}` : corto(inicio);
}

// Los datos estructurados (CollegeOrUniversity) van en la capa del sitio, no aquí: un <script>
// que entra y sale del <head> al navegar choca con extensiones del navegador que tocan el DOM.
export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(
    matches,
    null,
    sitioDe(matches)?.frase_portada || "Sitio web institucional: carreras, admisión y noticias.",
  );

export default function Inicio({ loaderData, matches }: Route.ComponentProps) {
  const { carreras, noticias, avisos, pasos, fechas, eventos } = loaderData;
  const sitio = sitioDe(matches);
  const [principal, ...resto] = noticias;

  return (
    <>
      {/* Imagen principal con una sola acción (sin carrusel automático) */}
      <section aria-labelledby="titulo-portada" className="relative isolate overflow-hidden bg-marca">
        {sitio?.foto_portada ? (
          <Foto
            imagen={sitio.foto_portada}
            alt={sitio.foto_portada_descripcion}
            // En el teléfono la foto va casi cubierta por el degradado: basta la medida chica.
            sizes="(max-width: 767px) 50vw, 100vw"
            prioritaria
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
        ) : (
          <FotoPendiente
            texto="Aquí va una foto real de la sede"
            className="absolute inset-0 -z-20 items-end justify-end pb-6 opacity-90 [&>span]:hidden sm:[&>span]:flex"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-marca via-marca/80 to-marca/40 md:bg-gradient-to-r md:from-marca md:via-marca/80 md:to-marca/20" />
        <div className="mx-auto flex min-h-[30rem] max-w-7xl flex-col justify-center gap-6 px-4 py-16 sm:px-6 lg:min-h-[34rem]">
          {sitio?.siglas && (
            <p className="text-sm font-bold tracking-widest text-sobre-marca-suave uppercase">
              {sitio.siglas}
            </p>
          )}
          <h1
            id="titulo-portada"
            className="max-w-3xl text-[2.5rem] leading-[3rem] text-sobre-marca lg:text-[3.75rem] lg:leading-[4.25rem]"
          >
            {sitio?.nombre}
          </h1>
          {sitio?.frase_portada && (
            <p className="max-w-2xl text-xl text-sobre-marca-suave lg:text-2xl lg:leading-9">
              {sitio.frase_portada}
            </p>
          )}
          <div className="pt-2">
            <EnlaceBoton to="/carreras" icono="flecha-derecha">
              Conoce nuestras carreras
            </EnlaceBoton>
          </div>
        </div>
      </section>

      {/* Avisos vigentes */}
      <AvisosPortada avisos={avisos} />

      {/* Carreras: índice editorial (presentación fija a la izquierda, carreras a la derecha) */}
      <section aria-labelledby="titulo-carreras" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
            <p className="text-xs font-bold tracking-widest text-acento uppercase">Oferta académica</p>
            <h2 id="titulo-carreras" className="text-[2rem] leading-10 lg:text-[2.5rem] lg:leading-[3rem]">
              Nuestras carreras
            </h2>
            <p className="text-lg text-texto-secundario">
              {carreras.length > 0 && `${enPalabras(carreras.length, "carrera", "carreras")}. `}
              Conoce el plan de estudios, el título y la modalidad de cada una.
            </p>
            <Link
              to="/carreras"
              prefetch="intent"
              className="group mt-2 inline-flex items-center gap-2 self-start font-semibold"
            >
              Ver todas las carreras
              <Icono nombre="flecha-derecha" tamano={18} className={FLECHA} />
            </Link>
          </div>
          <ol className="flex flex-col divide-y divide-borde border-y border-borde">
            {carreras.map((c, i) => (
              <li key={c.slug}>
                <FilaCarrera carrera={c} numero={i + 1} />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ¿Cómo ingresar? Pasos unidos por una línea y, debajo, el calendario de admisión */}
      {pasos.length > 0 && (
        <section aria-labelledby="titulo-ingresar" className="bg-sutil">
          <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:gap-16 lg:py-24">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex max-w-2xl flex-col gap-4">
                <p className="text-xs font-bold tracking-widest text-acento uppercase">Admisión</p>
                <h2 id="titulo-ingresar" className="text-[2rem] leading-10 lg:text-[2.5rem] lg:leading-[3rem]">
                  ¿Cómo ingresar?
                </h2>
                <p className="text-lg text-texto-secundario">
                  {enPalabras(pasos.length, "paso", "pasos")} para empezar tu carrera con nosotros. Si
                  tienes dudas, te orientamos.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <EnlaceBoton to="/admision/solicitar-informacion" icono="flecha-derecha">
                  Solicitar información
                </EnlaceBoton>
                <EnlaceBoton to="/admision" estilo="secundario">
                  Ver requisitos
                </EnlaceBoton>
              </div>
            </div>

            <ol
              className="grid gap-10 md:grid-cols-[repeat(var(--pasos),minmax(0,1fr))] md:gap-8"
              style={{ "--pasos": pasos.length } as CSSProperties}
            >
              {pasos.map((p, i) => (
                <li key={p.titulo} className="relative flex gap-5 md:flex-col md:gap-6">
                  {/* Línea que une este paso con el siguiente (vertical en el teléfono, horizontal después) */}
                  {i < pasos.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-14 -bottom-8 left-[1.4375rem] w-px bg-borde-fuerte md:top-[1.4375rem] md:right-[-1.5rem] md:bottom-auto md:left-14 md:h-px md:w-auto"
                    />
                  )}
                  <span
                    aria-hidden
                    className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-acento bg-sutil font-serif text-lg font-semibold text-acento tabular-nums"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-2 pt-2 md:pt-0 md:pr-6">
                    <h3 className="text-xl">
                      <span className="sr-only">Paso {i + 1}: </span>
                      {p.titulo}
                    </h3>
                    <p className="text-texto-secundario">{p.descripcion}</p>
                  </div>
                </li>
              ))}
            </ol>

            {fechas.length > 0 && (
              <div className="flex flex-col gap-5 border-t border-borde-fuerte/60 pt-10">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-xl">
                    <Icono nombre="calendario" tamano={20} className="text-acento" />
                    Calendario de admisión
                  </h3>
                  <Link to="/admision#fechas" prefetch="intent" className="group inline-flex items-center gap-2 text-sm font-semibold">
                    Todas las fechas
                    <Icono nombre="flecha-derecha" tamano={16} className={FLECHA} />
                  </Link>
                </div>
                <ul className="grid gap-px overflow-hidden rounded-lg border border-borde bg-borde sm:grid-cols-2 lg:grid-cols-4">
                  {fechas.map((f, i) => (
                    <li key={f.titulo} className="flex flex-col gap-1.5 bg-superficie p-5">
                      <p className="flex items-center gap-2 font-serif text-lg font-semibold text-marca tabular-nums">
                        {i === 0 && <span aria-hidden className="size-2 rounded-full bg-acento ring-4 ring-acento/15" />}
                        {rango(f.inicio, f.fin)}
                      </p>
                      <p className="text-sm text-texto-secundario">{f.titulo}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Noticias (una principal y las demás en filas) y, debajo, la agenda de próximos eventos */}
      <section aria-labelledby="titulo-noticias" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 lg:mb-14">
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold tracking-widest text-acento uppercase">Actualidad</p>
            <h2 id="titulo-noticias" className="text-[2rem] leading-10 lg:text-[2.5rem] lg:leading-[3rem]">
              Noticias y eventos
            </h2>
          </div>
          <Link to="/noticias" prefetch="intent" className="group inline-flex items-center gap-2 font-semibold">
            Todas las noticias
            <Icono nombre="flecha-derecha" tamano={18} className={FLECHA} />
          </Link>
        </div>

        {principal ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-14">
            <NoticiaPrincipal noticia={principal} />
            {resto.length > 0 && (
              <ul className="flex flex-col divide-y divide-borde border-y border-borde lg:self-start">
                {resto.map((n) => (
                  <li key={n.slug}>
                    <FilaNoticia noticia={n} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-texto-secundario">Pronto publicaremos nuestras primeras noticias.</p>
        )}

        <div className="mt-16 flex flex-col gap-8 lg:mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 id="titulo-eventos" className="flex items-center gap-2.5 text-2xl">
              <Icono nombre="calendario" tamano={22} className="text-acento" />
              Próximos eventos
            </h3>
            <Link to="/eventos" prefetch="intent" className="group inline-flex items-center gap-2 font-semibold">
              Ver el calendario
              <Icono nombre="flecha-derecha" tamano={18} className={FLECHA} />
            </Link>
          </div>
          {eventos.length > 0 ? (
            <ol aria-labelledby="titulo-eventos" className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              {eventos.map((e) => {
                const pronto = cuanto(e.dias);
                return (
                  <li
                    key={e.id}
                    className={`group relative flex flex-col gap-4 rounded-sm border-t-2 border-marca pt-5 pb-6 transition-colors duration-300 hover:border-acento ${FOCO_INTERNO}`}
                  >
                    <div className="flex items-end gap-3">
                      <span className="font-serif text-5xl leading-none font-semibold text-marca tabular-nums">
                        {dia(e.inicio)}
                      </span>
                      <span className="flex flex-col pb-0.5 text-sm leading-tight">
                        <span className="font-bold tracking-wider text-acento uppercase">{mesCorto(e.inicio)}</span>
                        <span className="text-texto-secundario capitalize">{diaSemana(e.inicio)}</span>
                      </span>
                      {pronto && (
                        <span className="ml-auto inline-flex items-center gap-1.5 self-start text-xs font-bold text-acento-hover">
                          <span aria-hidden className="size-1.5 rounded-full bg-acento" />
                          {pronto}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg leading-snug">
                      <Link
                        to={`/eventos?mes=${diaCaracas(e.inicio).slice(0, 7)}#evento-${e.id}`}
                        className="text-texto no-underline transition-colors after:absolute after:inset-0 group-hover:text-marca-medio focus-visible:outline-none"
                      >
                        {e.nombre}
                      </Link>
                    </h4>
                    <p className="mt-auto flex flex-col gap-1 text-sm text-texto-secundario">
                      <span className="inline-flex items-center gap-1.5">
                        <Icono nombre="reloj" tamano={16} />
                        {hora(e.inicio)}
                        {e.fin && ` a ${hora(e.fin)}`}
                      </span>
                      {e.lugar && (
                        <span className="inline-flex items-center gap-1.5">
                          <Icono nombre="ubicacion" tamano={16} />
                          {e.lugar}
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="border-t-2 border-borde pt-5 text-texto-secundario">
              No hay eventos programados por ahora.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
