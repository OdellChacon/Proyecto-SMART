import { useEffect, useRef } from "react";

/**
 * Antispam de Cloudflare Turnstile (sin acertijos para la persona).
 * Solo se activa si VITE_TURNSTILE_SITE_KEY tiene valor; en desarrollo no se muestra.
 */
const CLAVE = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileGlobal {
  render: (el: HTMLElement, opciones: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal;
  }
}

export const turnstileActivo = Boolean(CLAVE);

let cargando: Promise<void> | null = null;
function cargarScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  cargando ??= new Promise((resolver, rechazar) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolver();
    s.onerror = () => rechazar(new Error("No cargó Turnstile"));
    document.head.appendChild(s);
  });
  return cargando;
}

export function Turnstile({ onToken, reinicio }: { onToken: (t: string) => void; reinicio: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    if (!CLAVE || !ref.current) return;
    let activo = true;
    cargarScript()
      .then(() => {
        if (!activo || !ref.current || !window.turnstile) return;
        widget.current = window.turnstile.render(ref.current, {
          sitekey: CLAVE,
          language: "es",
          callback: onToken,
          "expired-callback": () => onToken(""),
        });
      })
      .catch(() => onToken(""));
    return () => {
      activo = false;
      if (widget.current) window.turnstile?.remove(widget.current);
    };
  }, []);

  // Tras un envío (bueno o malo) se pide un token nuevo: cada uno sirve una vez.
  useEffect(() => {
    if (reinicio && widget.current) window.turnstile?.reset(widget.current);
  }, [reinicio]);

  if (!CLAVE) return null;
  return <div ref={ref} className="min-h-16" />;
}
