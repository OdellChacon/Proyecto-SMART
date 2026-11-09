/**
 * Cliente de la API de Django.
 *
 * - La sesión viaja en una cookie httpOnly: el frontend no guarda tokens.
 * - Toda escritura envía la cabecera X-CSRFToken con el valor de la cookie csrftoken.
 * - Cualquier error se convierte en ApiError con el formato único del backend.
 */

export type ErroresDeCampo = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly errores: ErroresDeCampo;

  constructor(status: number, codigo: string, detail: string, errores: ErroresDeCampo = {}) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
    this.errores = errores;
  }
}

const MENSAJE_RED =
  "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const MENSAJE_GENERICO = "Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.";

function leerCookie(nombre: string): string | null {
  if (typeof document === "undefined") return null;
  const par = document.cookie.split("; ").find((c) => c.startsWith(`${nombre}=`));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function aErrores(valor: unknown): ErroresDeCampo {
  if (!esObjeto(valor)) return {};
  const salida: ErroresDeCampo = {};
  for (const [campo, mensajes] of Object.entries(valor)) {
    if (Array.isArray(mensajes)) salida[campo] = mensajes.map(String);
  }
  return salida;
}

async function solicitud<T>(metodo: "GET" | "POST", ruta: string, cuerpo?: unknown): Promise<T> {
  if (metodo !== "GET" && !leerCookie("csrftoken")) {
    // La primera escritura de la visita: pedimos la cookie CSRF.
    await solicitud("GET", "/api/v1/auth/sesion/");
  }

  const cabeceras: Record<string, string> = { Accept: "application/json" };
  if (metodo !== "GET") {
    cabeceras["Content-Type"] = "application/json";
    cabeceras["X-CSRFToken"] = leerCookie("csrftoken") ?? "";
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      credentials: "same-origin",
      headers: cabeceras,
      body: metodo === "GET" ? undefined : JSON.stringify(cuerpo ?? {}),
    });
  } catch {
    throw new ApiError(0, "red", MENSAJE_RED);
  }

  let datos: unknown = null;
  try {
    datos = await respuesta.json();
  } catch {
    // Respuesta vacía o no JSON (por ejemplo, un 502 del proxy).
  }

  if (!respuesta.ok) {
    const d = esObjeto(datos) ? datos : {};
    throw new ApiError(
      respuesta.status,
      typeof d.codigo === "string" ? d.codigo : "error",
      typeof d.detail === "string" ? d.detail : MENSAJE_GENERICO,
      aErrores(d.errores),
    );
  }
  return datos as T;
}

export const api = {
  get: <T>(ruta: string) => solicitud<T>("GET", ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => solicitud<T>("POST", ruta, cuerpo),
};
