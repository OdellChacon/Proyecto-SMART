import { useEffect, useRef, useState, type RefObject } from "react";

/** Guarda siempre la última versión de una función sin volver a suscribir efectos. */
function useUltima<T>(valor: T) {
  const ref = useRef(valor);
  useEffect(() => {
    ref.current = valor;
  });
  return ref;
}

/** Devuelve `valor` solo cuando deja de cambiar durante `ms` (para no pedir en cada tecla). */
export function useRetrasado<T>(valor: T, ms = 250): T {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const t = window.setTimeout(() => setRetrasado(valor), ms);
    return () => window.clearTimeout(t);
  }, [valor, ms]);
  return retrasado;
}

/** Llama a `alSalir` cuando se pulsa o toca fuera del elemento indicado. */
export function useClicFuera(
  ref: RefObject<HTMLElement | null>,
  alSalir: () => void,
  activo = true,
) {
  const callback = useUltima(alSalir);
  useEffect(() => {
    if (!activo) return;
    const manejar = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) callback.current();
    };
    document.addEventListener("pointerdown", manejar);
    return () => document.removeEventListener("pointerdown", manejar);
  }, [activo, ref, callback]);
}

/** Llama a `alPulsar` con la tecla Escape mientras `activo` sea verdadero. */
export function useEscape(alPulsar: () => void, activo = true) {
  const callback = useUltima(alPulsar);
  useEffect(() => {
    if (!activo) return;
    const manejar = (e: KeyboardEvent) => {
      if (e.key === "Escape") callback.current();
    };
    document.addEventListener("keydown", manejar);
    return () => document.removeEventListener("keydown", manejar);
  }, [activo, callback]);
}

/** Impide desplazar la página de fondo (menú del teléfono abierto). */
export function useBloquearDesplazamiento(activo: boolean) {
  useEffect(() => {
    if (!activo) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [activo]);
}

/** Verdadero cuando la persona pidió reducir el movimiento en su sistema. */
export function useMovimientoReducido() {
  const [reducido, setReducido] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducido(consulta.matches);
    const cambiar = () => setReducido(consulta.matches);
    consulta.addEventListener("change", cambiar);
    return () => consulta.removeEventListener("change", cambiar);
  }, []);
  return reducido;
}
