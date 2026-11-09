import { useEffect, useRef } from "react";

/** Lleva el foco al elemento cuando `valor` cambia a algo verdadero (mensajes de estado). */
export function useFocoAlAparecer<T extends HTMLElement>(valor: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (valor) ref.current?.focus();
  }, [valor]);
  return ref;
}

/** Enfoca el primer campo inválido tras validar, para que el teclado llegue directo al error. */
export function enfocarPrimerError() {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}
