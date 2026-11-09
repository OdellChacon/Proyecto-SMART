/**
 * Estilo común de las tarjetas del sitio: borde fino, sin sombra en reposo y una
 * sola señal al pasar el puntero (borde más oscuro, sombra muy suave y la línea
 * terracota que crece desde la izquierda, la misma de los avisos).
 */

/** Contorno de foco cuando el enlace que cubre la tarjeta recibe el foco con el teclado. */
export const FOCO_INTERNO =
  "has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foco has-[:focus-visible]:outline-solid";

/** Tarjeta informativa (no es un enlace). */
export const TARJETA = "rounded-lg border border-borde bg-superficie";

/**
 * Tarjeta que es un enlace o que contiene uno que la cubre entera.
 * Lleva `group` para que los hijos reaccionen al pasar el puntero.
 */
export const TARJETA_ENLACE = `${TARJETA} group relative overflow-hidden transition-[border-color,box-shadow] duration-300 ease-out hover:border-marca-medio/35 hover:shadow-[0_18px_40px_-28px_rgb(15_42_71/0.45)] focus-within:border-marca-medio/35 ${FOCO_INTERNO}`;

/** Etiqueta pequeña en mayúsculas (fecha, cargo, categoría). */
export const ETIQUETA = "text-xs font-bold tracking-widest uppercase";

/** Línea terracota al pie de la tarjeta; va como último hijo de un TARJETA_ENLACE. */
export function LineaAcento() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-acento transition-transform duration-300 ease-out group-focus-within:scale-x-100 group-hover:scale-x-100 motion-reduce:transition-none"
    />
  );
}

/** Flecha que se desplaza un poco al pasar el puntero por la tarjeta. */
export const FLECHA = "shrink-0 text-marca-medio transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none";
