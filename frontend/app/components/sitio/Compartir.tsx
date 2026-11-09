import { useEffect, useState } from "react";

import { Icono } from "~/components/ui/Icono";

type Estado = "listo" | "copiado" | "error";

/**
 * Compartir una página: en el teléfono abre el menú de compartir del sistema;
 * en la computadora copia el enlace.
 */
export function Compartir({ titulo, texto }: { titulo: string; texto?: string }) {
  const [estado, setEstado] = useState<Estado>("listo");
  const [puedeCompartir, setPuedeCompartir] = useState(false);

  // Solo en el navegador: así el HTML del servidor y el del cliente coinciden.
  useEffect(() => setPuedeCompartir(typeof navigator.share === "function"), []);

  useEffect(() => {
    if (estado === "listo") return;
    const t = window.setTimeout(() => setEstado("listo"), 2500);
    return () => window.clearTimeout(t);
  }, [estado]);

  async function compartir() {
    const url = window.location.href;
    if (puedeCompartir) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
      } catch {
        // La persona canceló: no es un error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setEstado("copiado");
    } catch {
      setEstado("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={compartir}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border-2 border-marca-medio bg-superficie px-4 font-semibold text-marca-medio transition-colors hover:bg-marca-sutil active:scale-[0.98]"
      >
        <Icono nombre={estado === "copiado" ? "check" : puedeCompartir ? "compartir" : "enlace"} tamano={20} />
        {puedeCompartir ? "Compartir" : estado === "copiado" ? "Enlace copiado" : "Copiar enlace"}
      </button>
      <span role="status" className="text-sm text-texto-secundario">
        {estado === "copiado" && "Ya puedes pegarlo donde quieras."}
        {estado === "error" && "No se pudo copiar. Copia la dirección desde la barra del navegador."}
      </span>
    </div>
  );
}
