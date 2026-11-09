import { useState, type FormEvent } from "react";

import { ApiError, api } from "./api";
import { enfocarPrimerError, useFocoAlAparecer } from "./useFoco";
import { erroresDelServidor, hayErrores, type Errores } from "./validacion";

/**
 * Lógica común de los formularios públicos (contacto y solicitud de información):
 * valida en el navegador, envía, muestra los errores del servidor campo por campo
 * y lleva el foco al primer error o al mensaje final.
 */
export function useEnvio<K extends string, D extends Record<K, unknown>>({
  inicial,
  campos,
  ruta,
  validar,
}: {
  inicial: D;
  campos: readonly K[];
  ruta: string;
  validar: (d: D) => Errores<K>;
}) {
  const [datos, setDatos] = useState<D>(inicial);
  const [errores, setErrores] = useState<Errores<K>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [reinicio, setReinicio] = useState(0);
  const refError = useFocoAlAparecer<HTMLDivElement>(errorGeneral);
  const refListo = useFocoAlAparecer<HTMLDivElement>(listo);

  const cambiar =
    (campo: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const valor =
        e.target instanceof HTMLInputElement && e.target.type === "checkbox"
          ? e.target.checked
          : e.target.value;
      setDatos((d) => ({ ...d, [campo]: valor }));
    };

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const encontrados = validar(datos);
    setErrores(encontrados);
    setErrorGeneral(null);
    if (hayErrores(encontrados)) return enfocarPrimerError();

    setEnviando(true);
    try {
      const r = await api.post<{ detail: string }>(ruta, { ...datos, turnstile: token });
      setListo(r.detail);
    } catch (err) {
      if (err instanceof ApiError && err.codigo === "validacion") {
        setErrores(erroresDelServidor(err.errores, campos));
        enfocarPrimerError();
      } else {
        setErrorGeneral(err instanceof Error ? err.message : "Inténtalo de nuevo.");
      }
      setReinicio((n) => n + 1);
    } finally {
      setEnviando(false);
    }
  }

  function otraVez() {
    setDatos(inicial);
    setErrores({});
    setListo(null);
    setReinicio((n) => n + 1);
  }

  return {
    datos, errores, errorGeneral, enviando, listo, refError, refListo, reinicio,
    cambiar, enviar, otraVez, setToken,
  };
}
