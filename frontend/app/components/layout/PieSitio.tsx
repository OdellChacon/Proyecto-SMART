import { Link } from "react-router";

import { Icono } from "~/components/ui/Icono";
import { Marca } from "~/components/ui/Marca";
import { correoLimpio, telefonoParaEnlace } from "~/lib/formato";
import { ACCESOS_SISTEMAS, MENU } from "~/lib/mapa";
import type { Sitio } from "~/lib/tipos";

/** Enlace claro sobre azul: subrayado terracota fino que aparece al pasar el puntero. */
const enlace =
  "text-sobre-marca-suave no-underline transition-colors hover:text-sobre-marca hover:underline decoration-acento-claro underline-offset-4";
const titulo = "mb-3 font-sans text-xs font-bold tracking-widest text-sobre-marca-suave/70 uppercase";

/**
 * Pie compacto: una franja con marca, contacto y enlaces, y una línea final con
 * derechos y enlaces legales. Las subsecciones ya están en el menú y en cada página.
 */
export function PieSitio({ sitio }: { sitio: Sitio }) {
  const ano = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t-2 border-acento bg-marca text-sm text-sobre-marca [&_:focus-visible]:outline-sobre-marca">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-10">
        <div className="flex flex-col gap-3">
          <Marca claro nombre={sitio.nombre} subtitulo={sitio.lema} />
          {sitio.direccion && (
            <p className="flex gap-2">
              <Icono nombre="ubicacion" className="mt-0.5 shrink-0 text-acento-claro" tamano={16} />
              <Link to="/contacto#ubicacion" prefetch="intent" className={enlace}>
                {sitio.direccion}
              </Link>
            </p>
          )}
        </div>

        <div>
          <h2 className={titulo}>Contacto</h2>
          <ul className="flex flex-col gap-1.5">
            {sitio.telefonos.map((t) => (
              <li key={t} className="flex gap-2">
                <Icono nombre="telefono" tamano={16} className="mt-0.5 shrink-0 text-acento-claro" />
                <a href={`tel:${telefonoParaEnlace(t)}`} className={enlace}>
                  {t}
                </a>
              </li>
            ))}
            {sitio.correos.map((c) => (
              <li key={c} className="flex min-w-0 gap-2">
                <Icono nombre="correo" tamano={16} className="mt-0.5 shrink-0 text-acento-claro" />
                <a href={`mailto:${correoLimpio(c)}`} className={`${enlace} min-w-0 break-words`}>
                  {c}
                </a>
              </li>
            ))}
            {sitio.horario.map((h) => (
              <li key={h} className="flex gap-2 text-sobre-marca-suave">
                <Icono nombre="reloj" tamano={16} className="mt-0.5 shrink-0 text-acento-claro" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Secciones del sitio">
          <h2 className={titulo}>El sitio</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {MENU.map((s) => (
              <li key={s.url}>
                <Link prefetch="intent" to={s.url} className={enlace}>
                  {s.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-6">
          <nav aria-label="Accesos a los sistemas">
            <h2 className={titulo}>Accesos</h2>
            <ul className="flex flex-col gap-1.5">
              {ACCESOS_SISTEMAS.map((a) => (
                <li key={a.url}>
                  <Link prefetch="intent" to={a.url} className={enlace}>
                    {a.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {sitio.perfil_redes.length > 0 && (
            <div>
              <h2 className={titulo}>Redes</h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                {sitio.perfil_redes.map((r) => (
                  <li key={r.red}>
                    <a href={r.url} className={enlace} rel="noopener noreferrer" target="_blank">
                      {r.nombre}
                      <span className="sr-only"> (se abre en otra pestaña)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-sobre-marca-suave sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {ano} {sitio.nombre}
          </p>
          <nav aria-label="Enlaces legales">
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              <li>
                <Link prefetch="intent" to="/privacidad" className={enlace}>
                  Aviso de privacidad
                </Link>
              </li>
              <li>
                <Link prefetch="intent" to="/normativa/documentos-legales" className={enlace}>
                  Documentos legales
                </Link>
              </li>
              <li>
                <Link prefetch="intent" to="/normativa" className={enlace}>
                  Normativa
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
