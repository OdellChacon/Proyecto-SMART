import { useEffect, useState } from "react";

import { Icono } from "~/components/ui/Icono";
import { useMovimientoReducido } from "~/lib/hooks";

/** Botón flotante para volver al principio en páginas largas (aparece al bajar bastante). */
export function VolverArriba() {
  const [visible, setVisible] = useState(false);
  const reducido = useMovimientoReducido();

  useEffect(() => {
    let pendiente = false;
    const revisar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > window.innerHeight * 1.5);
        pendiente = false;
      });
    };
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: reducido ? "auto" : "smooth" });
        document.getElementById("contenido")?.focus({ preventScroll: true });
      }}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed right-4 bottom-4 z-20 inline-flex min-h-12 items-center gap-2 rounded-full border border-borde bg-superficie px-4 font-semibold text-marca-medio shadow-lg transition duration-200 hover:bg-marca-sutil active:scale-95 sm:right-6 sm:bottom-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <Icono nombre="flecha-arriba" tamano={20} />
      <span className="hidden sm:inline">Volver arriba</span>
      <span className="sr-only sm:hidden">Volver arriba</span>
    </button>
  );
}
