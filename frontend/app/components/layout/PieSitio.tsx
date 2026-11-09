import { Link } from "react-router";

import { Icono } from "~/components/ui/Icono";
import { Marca } from "~/components/ui/Marca";
import { correoLimpio, telefonoParaEnlace } from "~/lib/formato";
import { MENU } from "~/lib/mapa";
import type { Sitio } from "~/lib/tipos";

const enlace = "text-sobre-marca no-underline hover:underline";

/** El pie repite contacto, redes, aviso de privacidad y enlaces legales. */
export function PieSitio({ sitio }: { sitio: Sitio }) {
  const ano = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-marca text-sobre-marca">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Marca claro nombre={sitio.nombre} subtitulo={sitio.lema} />
          {sitio.direccion && (
            <p className="flex gap-2 text-sobre-marca-suave">
              <Icono nombre="ubicacion" className="mt-1" tamano={20} />
              <span>{sitio.direccion}</span>
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-sans text-sm font-bold tracking-widest text-sobre-marca-suave uppercase">
            Contacto
          </h2>
          <ul className="flex flex-col gap-2">
            {sitio.telefonos.map((t) => (
              <li key={t}>
                <a href={`tel:${telefonoParaEnlace(t)}`} className={enlace}>
                  {t}
                </a>
              </li>
            ))}
            {sitio.correos.map((c) => (
              <li key={c} className="break-words">
                <a href={`mailto:${correoLimpio(c)}`} className={enlace}>
                  {c}
                </a>
              </li>
            ))}
            {sitio.horario.map((h) => (
              <li key={h} className="text-sobre-marca-suave">
                {h}
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Secciones del sitio">
          <h2 className="mb-4 font-sans text-sm font-bold tracking-widest text-sobre-marca-suave uppercase">
            El sitio
          </h2>
          <ul className="flex flex-col gap-2">
            {MENU.map((s) => (
              <li key={s.url}>
                <Link prefetch="intent" to={s.url} className={enlace}>
                  {s.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-8">
          {sitio.perfil_redes.length > 0 && (
            <div>
              <h2 className="mb-4 font-sans text-sm font-bold tracking-widest text-sobre-marca-suave uppercase">
                Redes
              </h2>
              <ul className="flex flex-col gap-2">
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
          <nav aria-label="Enlaces legales">
            <h2 className="mb-4 font-sans text-sm font-bold tracking-widest text-sobre-marca-suave uppercase">
              Legal
            </h2>
            <ul className="flex flex-col gap-2">
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
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm text-sobre-marca-suave sm:px-6">
          © {ano} {sitio.nombre}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
