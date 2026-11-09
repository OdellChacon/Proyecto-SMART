import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

import { Icono, type NombreIcono } from "./Icono";

type Estilo = "primario" | "secundario" | "texto";
type Tamano = "grande" | "mediano";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold no-underline " +
  "transition-[color,background-color,border-color,scale] duration-150 enabled:active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const ESTILOS: Record<Estilo, string> = {
  primario: "bg-acento text-sobre-marca hover:bg-acento-hover",
  secundario:
    "border-2 border-marca-medio bg-superficie text-marca-medio hover:bg-marca-sutil",
  texto: "text-enlace hover:underline",
};

const TAMANOS: Record<Estilo, Record<Tamano, string>> = {
  primario: { grande: "min-h-14 px-7 text-base", mediano: "min-h-11 px-5 text-sm" },
  secundario: { grande: "min-h-14 px-7 text-base", mediano: "min-h-11 px-5 text-sm" },
  texto: { grande: "min-h-12 px-1 text-base", mediano: "min-h-11 px-1 text-sm" },
};

interface Comunes {
  estilo?: Estilo;
  tamano?: Tamano;
  icono?: NombreIcono;
  iconoAntes?: boolean;
  anchoCompleto?: boolean;
  children: ReactNode;
}

function clases({ estilo = "primario", tamano = "grande", anchoCompleto }: Comunes, extra?: string) {
  return [BASE, ESTILOS[estilo], TAMANOS[estilo][tamano], anchoCompleto && "w-full", extra]
    .filter(Boolean)
    .join(" ");
}

function Contenido({ icono, iconoAntes, children, cargando }: Comunes & { cargando?: boolean }) {
  return (
    <>
      {cargando && (
        <span
          className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      )}
      {icono && iconoAntes && !cargando && <Icono nombre={icono} tamano={22} />}
      <span>{children}</span>
      {icono && !iconoAntes && !cargando && <Icono nombre={icono} tamano={22} />}
    </>
  );
}

type PropsBoton = Comunes &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { cargando?: boolean };

export function Boton({
  estilo,
  tamano,
  icono,
  iconoAntes,
  anchoCompleto,
  cargando,
  children,
  className,
  disabled,
  type = "button",
  ...resto
}: PropsBoton) {
  return (
    <button
      type={type}
      className={clases({ estilo, tamano, anchoCompleto, children }, className)}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      <Contenido icono={icono} iconoAntes={iconoAntes} cargando={cargando}>
        {children}
      </Contenido>
    </button>
  );
}

type PropsEnlace = Comunes & Omit<LinkProps, "children">;

export function EnlaceBoton({
  estilo,
  tamano,
  icono,
  iconoAntes,
  anchoCompleto,
  children,
  className,
  ...resto
}: PropsEnlace) {
  return (
    <Link
      prefetch="intent"
      className={clases({ estilo, tamano, anchoCompleto, children }, `active:scale-[0.98] ${className ?? ""}`)}
      {...resto}
    >
      <Contenido icono={icono} iconoAntes={iconoAntes}>
        {children}
      </Contenido>
    </Link>
  );
}
