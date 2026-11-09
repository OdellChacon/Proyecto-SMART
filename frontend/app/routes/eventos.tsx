import { Link } from "react-router";

import { PaginaDeSeccion, Parrafos } from "~/components/sitio/Pagina";
import { Icono } from "~/components/ui/Icono";
import { TARJETA } from "~/components/ui/Tarjeta";
import { obtener } from "~/lib/contenido.server";
import { claveDia, dia, diaSemana, hora, mesCorto, mesYAno } from "~/lib/formato";
import { metaDePagina } from "~/lib/meta";
import type { Evento } from "~/lib/tipos";

import type { Route } from "./+types/eventos";

const dos = (n: number) => String(n).padStart(2, "0");

/** Mes pedido en ?mes=AAAA-MM; si falta o no es válido, el mes actual (hora de Caracas). */
function mesPedido(url: URL) {
  const hoy = claveDia(new Date());
  const texto = url.searchParams.get("mes") ?? "";
  const valido = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(texto);
  const [ano, mes] = valido
    ? [Number(valido[1]), Number(valido[2])]
    : [Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7))];
  return { ano, mes, hoy };
}

export async function loader({ request }: Route.LoaderArgs) {
  const { ano, mes, hoy } = mesPedido(new URL(request.url));
  const diasDelMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const desde = `${ano}-${dos(mes)}-01`;
  const hasta = `${ano}-${dos(mes)}-${dos(diasDelMes)}`;
  const eventos = await obtener<Evento[]>(`eventos/?desde=${desde}&hasta=${hasta}`);
  return { eventos, ano, mes, hoy };
}

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Eventos y calendario", "Calendario de eventos y actividades de la universidad.");

const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/** Celdas del mes empezando en lunes; null = hueco antes del día 1 o después del último. */
function celdas(ano: number, mes: number) {
  const primero = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay(); // 0 = domingo
  const huecos = (primero + 6) % 7;
  const total = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const lista: (string | null)[] = Array(huecos).fill(null);
  for (let d = 1; d <= total; d++) lista.push(`${ano}-${dos(mes)}-${dos(d)}`);
  while (lista.length % 7) lista.push(null);
  return lista;
}

function mesVecino(ano: number, mes: number, paso: number) {
  const d = new Date(Date.UTC(ano, mes - 1 + paso, 1));
  return `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}`;
}

export default function Eventos({ loaderData }: Route.ComponentProps) {
  const { eventos, ano, mes, hoy } = loaderData;
  const titulo = mesYAno(`${ano}-${dos(mes)}-15`);
  const porDia = new Map<string, Evento[]>();
  for (const e of eventos) {
    const clave = claveDia(e.inicio);
    porDia.set(clave, [...(porDia.get(clave) ?? []), e]);
  }
  const anterior = mesVecino(ano, mes, -1);
  const siguiente = mesVecino(ano, mes, 1);
  const esMesActual = hoy.slice(0, 7) === `${ano}-${dos(mes)}`;

  return (
    <PaginaDeSeccion
      seccion="/noticias"
      titulo="Eventos y calendario"
      url="/eventos"
      introduccion="Actividades abiertas a estudiantes, aspirantes y a la comunidad."
    >
      <div className="flex flex-col gap-10">
        {/* Navegación entre meses */}
        <nav aria-label="Cambiar de mes" className="flex items-center justify-between gap-3">
          <Link to={`?mes=${anterior}`} preventScrollReset className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-md border border-borde px-3 font-semibold no-underline hover:bg-sutil sm:px-4">
            <Icono nombre="flecha-izquierda" tamano={20} />
            <span className="sr-only sm:not-sr-only">{mesYAno(`${anterior}-15`)}</span>
          </Link>
          <h2 className="flex-1 text-center text-xl sm:text-2xl" aria-live="polite">{titulo}</h2>
          <Link to={`?mes=${siguiente}`} preventScrollReset className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-md border border-borde px-3 font-semibold no-underline hover:bg-sutil sm:px-4">
            <span className="sr-only sm:not-sr-only">{mesYAno(`${siguiente}-15`)}</span>
            <Icono nombre="flecha-derecha" tamano={20} />
          </Link>
        </nav>

        {/* Cuadrícula del mes (los lectores de pantalla usan la lista de abajo) */}
        <div aria-hidden className="overflow-hidden rounded-lg border border-borde">
          <div className="grid grid-cols-7 bg-marca text-center text-xs font-bold tracking-wide text-sobre-marca uppercase">
            {DIAS.map((d) => (
              <span key={d} className="py-2">
                <span className="sm:hidden">{d.slice(0, 1)}</span>
                <span className="hidden sm:inline">{d.slice(0, 3)}</span>
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-borde">
            {celdas(ano, mes).map((clave, i) => {
              if (!clave) return <span key={`v${i}`} className="min-h-14 bg-sutil sm:min-h-24" />;
              const delDia = porDia.get(clave) ?? [];
              const esHoy = clave === hoy;
              return (
                <div key={clave} className={`flex min-h-14 flex-col gap-1 p-1.5 sm:min-h-24 sm:p-2 ${delDia.length ? "bg-marca-sutil" : "bg-superficie"}`}>
                  <span
                    className={`inline-flex size-7 items-center justify-center self-end rounded-full text-sm sm:self-start ${
                      esHoy ? "bg-acento font-bold text-sobre-marca" : delDia.length ? "font-bold text-marca" : "text-texto-secundario"
                    }`}
                  >
                    {Number(clave.slice(8))}
                  </span>
                  {delDia.map((e) => (
                    <a
                      key={e.id}
                      href={`#evento-${e.id}`}
                      tabIndex={-1}
                      className="hidden rounded-sm bg-marca-medio px-1.5 py-1 text-xs leading-4 text-sobre-marca no-underline hover:bg-marca md:block"
                      title={`${hora(e.inicio)} · ${e.nombre}`}
                    >
                      <span className="block text-sobre-marca-suave">{hora(e.inicio)}</span>
                      <span className="line-clamp-2 font-semibold">{e.nombre}</span>
                    </a>
                  ))}
                  {delDia.length > 0 && (
                    <span className="mx-auto mt-auto size-2 rounded-full bg-marca-medio md:hidden" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista del mes */}
        <section aria-labelledby="t-lista">
          <h2 id="t-lista" className="mb-5 text-2xl">
            {eventos.length ? `Eventos de ${titulo.toLowerCase()}` : `Sin eventos en ${titulo.toLowerCase()}`}
          </h2>
          {eventos.length === 0 ? (
            <p className="text-texto-secundario">
              {esMesActual ? "No hay más eventos programados este mes." : "No hay eventos publicados para este mes."}{" "}
              Prueba con el <Link to={`?mes=${siguiente}`} preventScrollReset>mes siguiente</Link>.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {eventos.map((e) => (
                <li key={e.id} id={`evento-${e.id}`} className={`${TARJETA} flex scroll-mt-6 gap-5 p-5 target:border-acento target:ring-2 target:ring-acento/30 lg:p-6`}>
                  <span className="flex w-16 shrink-0 flex-col items-center self-start border-r border-borde pr-5 text-marca">
                    <span className="font-serif text-3xl leading-8 font-semibold tabular-nums">{dia(e.inicio)}</span>
                    <span className="text-xs font-bold tracking-wider text-acento uppercase">{mesCorto(e.inicio)}</span>
                  </span>
                  <div className="flex min-w-0 flex-col gap-2">
                    <h3 className="text-xl">{e.nombre}</h3>
                    <p className="flex flex-wrap gap-x-5 gap-y-1 text-texto-secundario">
                      <span className="inline-flex items-center gap-1.5">
                        <Icono nombre="reloj" tamano={18} />
                        <span className="capitalize">{`${diaSemana(e.inicio)}, ${hora(e.inicio)}`}</span>
                        {e.fin && ` a ${hora(e.fin)}`}
                      </span>
                      {e.lugar && (
                        <span className="inline-flex items-center gap-1.5">
                          <Icono nombre="ubicacion" tamano={18} />
                          {e.lugar}
                        </span>
                      )}
                    </p>
                    {e.descripcion && <Parrafos texto={e.descripcion} className="text-base leading-7" />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PaginaDeSeccion>
  );
}
