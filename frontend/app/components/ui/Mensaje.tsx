import { forwardRef, type ReactNode } from "react";

import { Icono, type NombreIcono } from "./Icono";

type Tipo = "exito" | "error" | "info" | "aviso";

const ESTILO: Record<Tipo, { caja: string; texto: string; icono: NombreIcono }> = {
  exito: { caja: "bg-exito-sutil border-l-exito", texto: "text-exito", icono: "exito" },
  error: { caja: "bg-error-sutil border-l-error", texto: "text-error", icono: "alerta" },
  info: { caja: "bg-marca-sutil border-l-marca-medio", texto: "text-marca-medio", icono: "info" },
  aviso: { caja: "bg-aviso-sutil border-l-aviso", texto: "text-aviso", icono: "aviso" },
};

interface Props {
  tipo: Tipo;
  titulo: string;
  children?: ReactNode;
  /** Si se pasa, el mensaje muestra un botón para cerrarlo. */
  alCerrar?: () => void;
}

/**
 * Mensaje de estado. Recibe el foco al aparecer (tabIndex -1) para que los
 * lectores de pantalla lo anuncien y la persona vea qué pasó.
 */
export const Mensaje = forwardRef<HTMLDivElement, Props>(function Mensaje(
  { tipo, titulo, children, alCerrar },
  ref,
) {
  const e = ESTILO[tipo];
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={tipo === "error" ? "alert" : "status"}
      className={`relative flex animate-aparecer items-start gap-4 rounded-r-md border-l-2 px-5 py-4 scroll-mt-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-foco sm:px-6 sm:py-5 ${e.caja} ${
        alCerrar ? "pr-14" : ""
      }`}
    >
      <Icono nombre={e.icono} tamano={22} className={`mt-px shrink-0 ${e.texto}`} />
      <div className="flex min-w-0 flex-col gap-1">
        <p className={`font-semibold ${e.texto}`}>{titulo}</p>
        {children && <div className="text-base text-texto">{children}</div>}
      </div>
      {alCerrar && (
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar el mensaje"
          className={`absolute top-2.5 right-2.5 inline-flex size-10 items-center justify-center rounded-md transition-colors hover:bg-superficie/70 ${e.texto}`}
        >
          <Icono nombre="cerrar" tamano={20} />
        </button>
      )}
    </div>
  );
});
