import { useId, useState, type InputHTMLAttributes } from "react";

import { Icono } from "./Icono";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  obligatorio?: boolean;
}

/**
 * Campo de formulario: etiqueta siempre visible (nunca solo placeholder),
 * texto de ayuda y error con ícono + texto (no solo color).
 */
export function Campo({ etiqueta, ayuda, error, obligatorio, type = "text", className, ...resto }: Props) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const esContrasena = type === "password";
  const [visible, setVisible] = useState(false);

  const describedBy = [ayuda && idAyuda, error && idError].filter(Boolean).join(" ") || undefined;

  return (
    <div className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className="text-sm font-semibold text-texto">
        {etiqueta}
        {obligatorio && <span className="font-normal text-texto-secundario"> (obligatorio)</span>}
      </label>
      {ayuda && (
        <p id={idAyuda} className="text-sm text-texto-secundario">
          {ayuda}
        </p>
      )}
      <div className="relative">
        <input
          id={id}
          type={esContrasena && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={obligatorio || undefined}
          className={[
            "min-h-14 w-full rounded-md bg-superficie px-4 text-base text-texto",
            "placeholder:text-texto-secundario",
            error
              ? "border-2 border-error"
              : "border-[1.5px] border-borde-campo focus:border-foco",
            esContrasena && "pr-28",
          ]
            .filter(Boolean)
            .join(" ")}
          {...resto}
        />
        {esContrasena && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-controls={id}
            className="absolute inset-y-1 right-1 inline-flex items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-enlace hover:bg-marca-sutil"
          >
            <Icono nombre={visible ? "ojo-cerrado" : "ojo"} tamano={20} />
            {visible ? "Ocultar" : "Mostrar"}
          </button>
        )}
      </div>
      {error && (
        <p id={idError} className="flex items-start gap-2 text-sm text-error">
          <Icono nombre="alerta" tamano={20} className="mt-0.5" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
