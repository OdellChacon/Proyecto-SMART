import { useEffect, useRef, useState, type ReactNode } from "react";
import { isRouteErrorResponse, Link, Outlet, useLocation, useNavigation, useRouteLoaderData } from "react-router";

import { BarraProgreso } from "~/components/layout/BarraProgreso";
import { EncabezadoSitio } from "~/components/layout/EncabezadoSitio";
import { PieSitio } from "~/components/layout/PieSitio";
import { VolverArriba } from "~/components/layout/VolverArriba";
import { EnlaceBoton } from "~/components/ui/Boton";
import { Icono } from "~/components/ui/Icono";
import { obtener } from "~/lib/contenido.server";
import { MENU } from "~/lib/mapa";
import type { Sitio } from "~/lib/tipos";

import type { Route } from "./+types/_sitio";

/** Capa común del sitio público: encabezado, menú y pie con los datos generales. */
export async function loader() {
  const sitio = await obtener<Sitio>("sitio/");
  return { sitio };
}

// Los datos generales cambian poco: no se vuelven a pedir en cada navegación.
export function shouldRevalidate() {
  return false;
}

/**
 * Datos estructurados de organización educativa (requisito de SEO del documento).
 * Van aquí, en la capa que no cambia al navegar, y no en el <head> de la portada: así llegan
 * en el HTML del servidor y React nunca tiene que insertar ni quitar un <script> en el
 * navegador (algunas extensiones interceptan esas operaciones y rompen la página).
 */
function DatosEstructurados({ sitio }: { sitio: Sitio }) {
  const datos = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: sitio.nombre,
    ...(sitio.siglas && { alternateName: sitio.siglas }),
    ...(sitio.direccion && { address: sitio.direccion }),
    ...(sitio.telefonos[0] && { telephone: sitio.telefonos[0] }),
    sameAs: sitio.perfil_redes.map((r) => r.url),
  };
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      // «<» escapado: un texto del panel no puede cerrar la etiqueta <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}

function Marco({ sitio, children }: { sitio: Sitio; children: ReactNode }) {
  const { pathname } = useLocation();
  // La primera carga llega ya dibujada desde el servidor: solo se anima al navegar dentro del sitio.
  const inicial = useRef(pathname);
  const [navego, setNavego] = useState(false);
  useEffect(() => {
    if (pathname !== inicial.current) setNavego(true);
  }, [pathname]);
  const animar = navego || pathname !== inicial.current;
  const cargando = useNavigation().state === "loading";
  return (
    <div className="flex min-h-dvh flex-col">
      <DatosEstructurados sitio={sitio} />
      <BarraProgreso />
      {sitio.es_demostracion && (
        <div className="bg-aviso-sutil text-aviso">
          <p className="mx-auto flex max-w-7xl items-start gap-2 px-4 py-2 text-sm sm:px-6">
            <Icono nombre="aviso" tamano={18} className="mt-0.5" />
            <span>
              <strong>Versión de demostración.</strong>{" "}
              <span className="sm:hidden">El contenido es de ejemplo.</span>
              <span className="hidden sm:inline">
                Los textos, fotos y documentos son de ejemplo y se reemplazan por el contenido
                oficial de la universidad.
              </span>
            </span>
          </p>
        </div>
      )}
      <EncabezadoSitio sitio={sitio} />
      <main id="contenido" tabIndex={-1} aria-busy={cargando || undefined} className="flex-1 focus:outline-none">
        {/* Cada página entra con un fundido corto (se desactiva con «reducir movimiento»). */}
        <div key={pathname} className={animar ? "animate-aparecer" : undefined}>
          {children}
        </div>
      </main>
      <PieSitio sitio={sitio} />
      <VolverArriba />
    </div>
  );
}

export default function SitioPublico({ loaderData }: Route.ComponentProps) {
  return (
    <Marco sitio={loaderData.sitio}>
      <Outlet />
    </Marco>
  );
}

/**
 * Errores dentro del sitio (una carrera o noticia que no existe, la API caída):
 * se mantienen el menú y el pie para que la persona pueda seguir navegando.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const datos = useRouteLoaderData("routes/_sitio") as { sitio: Sitio } | undefined;
  const noExiste = isRouteErrorResponse(error) && error.status === 404;
  const contenido = (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6 lg:py-24">
      <p className="text-xs font-bold tracking-widest text-acento uppercase">
        {noExiste ? "Error 404" : "Servicio no disponible"}
      </p>
      <h1 className="text-[2.25rem] leading-[2.75rem] lg:text-3xl">
        {noExiste ? "No encontramos esta página" : "No pudimos cargar esta página"}
      </h1>
      <p className="text-lg text-texto-secundario">
        {noExiste
          ? "Puede que la dirección esté mal escrita o que el contenido ya no esté publicado."
          : "Puede ser un problema momentáneo de conexión. Espera unos segundos y vuelve a intentarlo."}
      </p>
      <ul className="flex flex-wrap gap-2">
        {MENU.map((s) => (
          <li key={s.url}>
            <Link
              to={s.url}
              className="inline-flex min-h-11 items-center rounded-full border border-borde px-4 font-semibold no-underline hover:bg-marca-sutil"
            >
              {s.titulo}
            </Link>
          </li>
        ))}
      </ul>
      <EnlaceBoton to="/" estilo="secundario" icono="flecha-izquierda" iconoAntes className="self-start">
        Volver al inicio
      </EnlaceBoton>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="overflow-x-auto rounded-md bg-sutil p-4 text-sm">{error.stack}</pre>
      )}
    </div>
  );
  // Si falló el propio layout (API caída), no hay datos para el menú: se muestra solo el mensaje.
  return datos ? <Marco sitio={datos.sitio}>{contenido}</Marco> : <main id="contenido">{contenido}</main>;
}
