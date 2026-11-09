/**
 * Formatos para personas. La zona horaria es fija (Caracas) para que el texto
 * sea idéntico en el servidor y en el navegador.
 */
const ZONA = "America/Caracas";
const IDIOMA = "es-VE";

const FECHA_LARGA = new Intl.DateTimeFormat(IDIOMA, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: ZONA,
});
const HORA = new Intl.DateTimeFormat(IDIOMA, { hour: "numeric", minute: "2-digit", timeZone: ZONA });
const DIA = new Intl.DateTimeFormat(IDIOMA, { day: "numeric", timeZone: ZONA });
const MES_CORTO = new Intl.DateTimeFormat(IDIOMA, { month: "short", timeZone: ZONA });
const MES_ANO = new Intl.DateTimeFormat(IDIOMA, { month: "long", year: "numeric", timeZone: ZONA });
const DIA_SEMANA = new Intl.DateTimeFormat(IDIOMA, { weekday: "long", timeZone: ZONA });

/** Las fechas sin hora (AAAA-MM-DD) se leen como mediodía para no cambiar de día. */
function aFecha(valor: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T12:00:00-04:00`) : new Date(valor);
}

/**
 * Node y cada navegador usan espacios Unicode distintos («9:00 a. m.» con espacio fino o
 * duro). Se normalizan a espacios comunes para que el HTML del servidor y el del
 * navegador coincidan al hidratar.
 */
const normal = (texto: string) => texto.replace(/\s/g, " ");
const con = (f: Intl.DateTimeFormat) => (v: string) => normal(f.format(aFecha(v)));

export const fecha = con(FECHA_LARGA);
export const hora = con(HORA);
export const dia = con(DIA);
export const mesCorto = (v: string) => con(MES_CORTO)(v).replace(".", "");
export const mesYAno = (v: string) => {
  const t = con(MES_ANO)(v);
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const diaSemana = con(DIA_SEMANA);

/** Texto plano del panel → párrafos (separados por una línea en blanco). */
export function parrafos(texto: string | null | undefined): string[] {
  return (texto ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function tamanoArchivo(bytes: number | null): string | null {
  if (bytes == null) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Enlaces del panel: los internos empiezan por «/», el resto se abre como externo. */
export const esExterno = (url: string) => /^https?:\/\//.test(url);

export const telefonoParaEnlace = (t: string) => t.replace(/\(.*?\)/g, "").replace(/[^\d+]/g, "");
export const correoLimpio = (c: string) => c.replace(/\(.*?\)/g, "").trim();

const CLAVE_DIA = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: ZONA,
});

/** Día en Caracas como AAAA-MM-DD (para agrupar eventos en el calendario). */
export const claveDia = (v: string | Date) =>
  CLAVE_DIA.format(typeof v === "string" ? aFecha(v) : v);

const FECHA_CORTA = new Intl.DateTimeFormat(IDIOMA, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: ZONA,
});

/** «6 nov 2026»: para tablas y listas con poco espacio. */
export const fechaCorta = (v: string) => normal(FECHA_CORTA.format(aFecha(v))).replace(".", "");
