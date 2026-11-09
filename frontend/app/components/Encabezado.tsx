import type { ReactNode } from "react";

/** Título e introducción de cada pantalla de cuenta. */
export function Encabezado({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3">
      <h1 className="text-2xl lg:text-3xl">{titulo}</h1>
      {children && <p className="text-lg text-texto-secundario">{children}</p>}
    </div>
  );
}
