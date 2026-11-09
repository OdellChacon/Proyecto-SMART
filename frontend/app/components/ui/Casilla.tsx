import { useId, type InputHTMLAttributes, type ReactNode } from "react";

import { Icono } from "./Icono";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> {
  children: ReactNode;
  error?: string;
}

export function Casilla({ children, error, className, ...resto }: Props) {
  const id = useId();
  const idError = `${id}-error`;
  return (
    <div className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
          className={[
            "mt-0.5 size-6 shrink-0 cursor-pointer rounded-sm accent-marca",
            error && "outline-2 outline-error",
          ]
            .filter(Boolean)
            .join(" ")}
          {...resto}
        />
        <label htmlFor={id} className="cursor-pointer text-base text-texto">
          {children}
        </label>
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
