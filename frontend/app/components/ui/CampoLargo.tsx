import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { Icono } from "./Icono";

interface Base {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  obligatorio?: boolean;
}

function Envoltura({
  id,
  etiqueta,
  ayuda,
  error,
  obligatorio,
  className,
  children,
}: Base & { id: string; className?: string; children: ReactNode }) {
  return (
    <div className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className="text-sm font-semibold text-texto">
        {etiqueta}
        {obligatorio ? (
          <span className="font-normal text-texto-secundario"> (obligatorio)</span>
        ) : (
          <span className="font-normal text-texto-secundario"> (opcional)</span>
        )}
      </label>
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-sm text-texto-secundario">
          {ayuda}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-2 text-sm text-error">
          <Icono nombre="alerta" tamano={20} className="mt-0.5" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

const borde = (error?: string) =>
  error ? "border-2 border-error" : "border-[1.5px] border-borde-campo focus:border-foco";

function describe(id: string, ayuda?: string, error?: string) {
  return [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

type PropsArea = Base & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

/** Área de texto con el mismo comportamiento accesible que Campo. */
export function AreaTexto({ etiqueta, ayuda, error, obligatorio, className, ...resto }: PropsArea) {
  const id = useId();
  return (
    <Envoltura {...{ id, etiqueta, ayuda, error, obligatorio, className }}>
      <textarea
        id={id}
        rows={5}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(id, ayuda, error)}
        aria-required={obligatorio || undefined}
        className={`min-h-36 w-full field-sizing-content rounded-md bg-superficie px-4 py-3 text-base text-texto transition-colors ${borde(error)}`}
        {...resto}
      />
      {/* Contador de caracteres cuando hay un límite: se anuncia solo cerca del final. */}
      {resto.maxLength != null && typeof resto.value === "string" && (
        <p
          className={`-mt-1 self-end text-sm tabular-nums ${
            resto.value.length > resto.maxLength * 0.9 ? "font-semibold text-aviso" : "text-texto-secundario"
          }`}
          aria-live={resto.value.length > resto.maxLength * 0.9 ? "polite" : "off"}
        >
          {resto.value.length.toLocaleString("es")} / {resto.maxLength.toLocaleString("es")}
        </p>
      )}
    </Envoltura>
  );
}

type PropsSelector = Base &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
    opciones: { valor: string; texto: string }[];
    vacio?: string;
  };

/** Lista desplegable nativa: la más fácil de usar en el teléfono. */
export function Selector({
  etiqueta,
  ayuda,
  error,
  obligatorio,
  className,
  opciones,
  vacio = "Elige una opción",
  ...resto
}: PropsSelector) {
  const id = useId();
  return (
    <Envoltura {...{ id, etiqueta, ayuda, error, obligatorio, className }}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describe(id, ayuda, error)}
          aria-required={obligatorio || undefined}
          className={`min-h-14 w-full appearance-none rounded-md bg-superficie pr-12 pl-4 text-base text-texto ${borde(error)}`}
          {...resto}
        >
          <option value="">{vacio}</option>
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
        <Icono
          nombre="chevron-abajo"
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-texto-secundario"
        />
      </div>
    </Envoltura>
  );
}
