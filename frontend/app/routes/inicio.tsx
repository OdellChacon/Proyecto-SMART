import { Link } from "react-router";

import { FotoPendiente, TarjetaCarrera, TarjetaNoticia } from "~/components/sitio/Tarjetas";
import { EnlaceBoton } from "~/components/ui/Boton";
import { Foto } from "~/components/ui/Foto";
import { AvisosPortada } from "~/components/sitio/Avisos";
import { Icono } from "~/components/ui/Icono";
import { obtener, obtenerOpcional } from "~/lib/contenido.server";
import { dia, hora, mesCorto } from "~/lib/formato";
import { metaDePagina, sitioDe } from "~/lib/meta";
import type { Admision, Aviso, CarreraTarjeta, Evento, NoticiaTarjeta, Pagina } from "~/lib/tipos";

import type { Route } from "./+types/inicio";

export async function loader() {
  const [carreras, noticias, avisos, admision, eventos] = await Promise.all([
    obtener<CarreraTarjeta[]>("carreras/"),
    obtenerOpcional<Pagina<NoticiaTarjeta>>("noticias/?tamano=3", {
      count: 0, next: null, previous: null, results: [],
    }),
    obtenerOpcional<Aviso[]>("avisos/?portada=true", []),
    obtenerOpcional<Admision>("admision/", {
      requisitos: [], pasos: [], preguntas: [], fechas: [], costos: [], costos_nota: "",
    }),
    obtenerOpcional<Evento[]>("eventos/", []),
  ]);
  return { carreras, noticias: noticias.results, avisos, pasos: admision.pasos, eventos: eventos.slice(0, 3) };
}

export const meta: Route.MetaFunction = ({ matches }) => {
  const sitio = sitioDe(matches);
  const base = metaDePagina(
    matches,
    null,
    sitio?.frase_portada || "Sitio web institucional: carreras, admisión y noticias.",
  );
  if (!sitio) return base;
  // Datos estructurados de organización educativa (requisito de SEO del documento).
  return [
    ...base,
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "CollegeOrUniversity",
        name: sitio.nombre,
        ...(sitio.siglas && { alternateName: sitio.siglas }),
        ...(sitio.direccion && { address: sitio.direccion }),
        ...(sitio.telefonos[0] && { telephone: sitio.telefonos[0] }),
        sameAs: sitio.perfil_redes.map((r) => r.url),
      },
    },
  ];
};

export default function Inicio({ loaderData, matches }: Route.ComponentProps) {
  const { carreras, noticias, avisos, pasos, eventos } = loaderData;
  const sitio = sitioDe(matches);

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

      {/* Carreras */}
      <section aria-labelledby="titulo-carreras" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-widest text-acento uppercase">Oferta académica</p>
            <h2 id="titulo-carreras" className="text-[2rem] leading-10 lg:text-3xl">
              Nuestras carreras
            </h2>
          </div>
          <Link to="/carreras" className="font-semibold">
            Ver todas las carreras
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {carreras.map((c) => (
            <TarjetaCarrera key={c.slug} carrera={c} />
          ))}
        </div>
      </section>

      {/* ¿Cómo ingresar? */}
      {pasos.length > 0 && (
        <section aria-labelledby="titulo-ingresar" className="bg-sutil">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex max-w-2xl flex-col gap-4">
                <p className="text-xs font-bold tracking-widest text-acento uppercase">Admisión</p>
                <h2 id="titulo-ingresar" className="text-[2rem] leading-10 lg:text-3xl">
                  ¿Cómo ingresar?
                </h2>
                <p className="text-lg text-texto-secundario">
                  Tres pasos para empezar tu carrera con nosotros. Si tienes dudas, te orientamos.
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
            <ol className="grid gap-5 md:grid-cols-3">
              {pasos.slice(0, 3).map((p, i) => (
                <li key={p.titulo} className="flex flex-col gap-3 rounded-lg bg-superficie p-6 shadow-sm lg:p-8">
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-marca font-serif text-xl font-semibold text-sobre-marca">
                    {i + 1}
                  </span>
                  <h3 className="text-xl">{p.titulo}</h3>
                  <p className="text-texto-secundario">{p.descripcion}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Noticias y eventos */}
      <section aria-labelledby="titulo-noticias" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-widest text-acento uppercase">Actualidad</p>
            <h2 id="titulo-noticias" className="text-[2rem] leading-10 lg:text-3xl">
              Noticias y eventos
            </h2>
          </div>
          <Link to="/noticias" className="font-semibold">
            Ver todas las noticias
          </Link>
        </div>
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          {noticias.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {noticias.map((n, i) => (
                <TarjetaNoticia key={n.slug} noticia={n} destacada={i === 0} />
              ))}
            </div>
          ) : (
            <p className="text-texto-secundario">Pronto publicaremos nuestras primeras noticias.</p>
          )}
          <aside aria-labelledby="titulo-eventos" className="flex flex-col gap-4">
            <h3 id="titulo-eventos" className="text-xl">Próximos eventos</h3>
            {eventos.length > 0 ? (
              <ul className="flex flex-col divide-y divide-borde rounded-lg border border-borde">
                {eventos.map((e) => (
                  <li key={e.id} className="flex gap-4 p-5">
                    <span className="flex w-14 shrink-0 flex-col items-center rounded-md bg-marca-sutil py-2 text-marca">
                      <span className="font-serif text-2xl leading-7 font-semibold">{dia(e.inicio)}</span>
                      <span className="text-xs font-bold uppercase">{mesCorto(e.inicio)}</span>
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold">{e.nombre}</p>
                      <p className="text-sm text-texto-secundario">
                        {hora(e.inicio)}
                        {e.lugar && ` · ${e.lugar}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-texto-secundario">No hay eventos programados por ahora.</p>
            )}
            <Link to="/eventos" className="font-semibold">
              Ver el calendario
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
