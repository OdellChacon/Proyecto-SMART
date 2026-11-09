import { useEffect, useState, type CSSProperties } from "react";
import { useNavigation } from "react-router";

type Fase = "quieta" | "cargando" | "terminando";

const ESTILO: Record<Fase, CSSProperties> = {
  quieta: { transform: "scaleX(0)", transition: "none" },
  // Avanza rápido al principio y cada vez más lento: nunca llega al final por sí sola.
  cargando: { transform: "scaleX(0.85)", transition: "transform 8s cubic-bezier(0.1, 0.7, 0.2, 1)" },
  terminando: { transform: "scaleX(1)", transition: "transform 200ms ease-out" },
};

/**
 * Barra fina arriba de la pantalla mientras se carga otra página.
 * Solo aparece si la carga tarda más de 150 ms, para no parpadear en las rápidas.
 */
export function BarraProgreso() {
  const navegacion = useNavigation();
  const ocupado = navegacion.state !== "idle";
  const [fase, setFase] = useState<Fase>("quieta");

  useEffect(() => {
    if (ocupado) {
      const t = window.setTimeout(() => setFase("cargando"), 150);
      return () => window.clearTimeout(t);
    }
    setFase((f) => (f === "quieta" ? f : "terminando"));
    const t = window.setTimeout(() => setFase("quieta"), 450);
    return () => window.clearTimeout(t);
  }, [ocupado]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-1 transition-opacity duration-300 ${
        fase === "cargando" ? "opacity-100" : fase === "terminando" ? "opacity-0 delay-200" : "opacity-0"
      }`}
    >
      <div className="h-full origin-left bg-acento" style={ESTILO[fase]} />
    </div>
  );
}
