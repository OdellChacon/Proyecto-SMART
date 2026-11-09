import { forwardRef, type ReactNode } from "react";

import { Icono, type NombreIcono } from "./Icono";

type Tipo = "exito" | "error" | "info" | "aviso";

const ESTILO: Record<Tipo, { caja: string; insignia: string; texto: string; icono: NombreIcono }> = {
  exito: { caja: "bg-exito-sutil border-exito/30 border-l-exito", insignia: "bg-exito", texto: "text-exito", icono: "check" },
  error: { caja: "bg-error-sutil border-error/30 border-l-error", insignia: "bg-error", texto: "text-error", icono: "alerta" },
  info: { caja: "bg-marca-sutil border-marca-medio/30 border-l-marca-medio", insignia: "bg-marca-medio", texto: "text-marca-medio", icono: "info" },
  aviso: { caja: "bg-aviso-sutil border-aviso/30 border-l-aviso", insignia: "bg-aviso", texto: "text-aviso", icono: "aviso" },
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
      className={`relative flex animate-aparecer items-start gap-4 rounded-lg border border-l-4 px-5 py-4 scroll-mt-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-foco sm:px-6 sm:py-5 ${e.caja} ${
        alCerrar ? "pr-14" : ""
      }`}
    >
      <span aria-hidden className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sobre-marca ${e.insignia}`}>
        <Icono nombre={e.icono} tamano={18} />
      </span>
      <div className="flex min-w-0 flex-col gap-1 pt-0.5">
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
