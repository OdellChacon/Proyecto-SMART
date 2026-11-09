/**
 * Lectura de la API desde el servidor web (render en servidor).
 *
 * Los loaders corren en Node, así que llaman a Django directamente por su URL
 * interna, sin pasar por el navegador ni por el proxy de Vite.
 */
import { data } from "react-router";

// Render entrega la dirección interna como «host:puerto»; se completa con http://.
const CRUDO = process.env.API_INTERNA_URL || "http://127.0.0.1:8077";
const BASE = (/^https?:\/\//.test(CRUDO) ? CRUDO : `http://${CRUDO}`).replace(/\/$/, "");
const ESPERA_MAXIMA_MS = 15000;

export async function obtener<T>(ruta: string): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}/api/v1/${ruta.replace(/^\//, "")}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(ESPERA_MAXIMA_MS),
    });
  } catch {
    throw data({ mensaje: "No pudimos cargar el contenido." }, { status: 503 });
  }
  if (respuesta.status === 404) throw data(null, { status: 404 });
  if (!respuesta.ok) throw data({ mensaje: "No pudimos cargar el contenido." }, { status: 503 });
  return (await respuesta.json()) as T;
}

/** Igual que obtener(), pero devuelve el valor por defecto si la API falla. */
export async function obtenerOpcional<T>(ruta: string, porDefecto: T): Promise<T> {
  try {
    return await obtener<T>(ruta);
  } catch {
    return porDefecto;
  }
}
