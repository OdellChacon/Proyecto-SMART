/**
 * Validación en el navegador: da respuesta inmediata, pero el servidor vuelve a
 * validar todo y tiene la última palabra (Django aplica además sus validadores
 * de contraseñas comunes y de parecido con los datos personales).
 */

export type Errores<K extends string> = Partial<Record<K, string>>;

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const LONGITUD_MINIMA_CONTRASENA = 10;

export function validarCorreo(valor: string): string | undefined {
  if (!valor.trim()) return "Escribe tu correo electrónico.";
  if (!CORREO.test(valor.trim())) return "Escribe un correo válido, por ejemplo: nombre@correo.com";
  return undefined;
}

export function validarObligatorio(valor: string, mensaje: string): string | undefined {
  return valor.trim() ? undefined : mensaje;
}

export function validarContrasenaNueva(valor: string): string | undefined {
  if (!valor) return "Crea una contraseña.";
  if (valor.length < LONGITUD_MINIMA_CONTRASENA) {
    return `Usa al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`;
  }
  if (/^\d+$/.test(valor)) return "No uses solo números.";
  return undefined;
}

export function validarConfirmacion(valor: string, original: string): string | undefined {
  if (!valor) return "Repite la contraseña.";
  return valor === original ? undefined : "Las contraseñas no coinciden.";
}

export function hayErrores<K extends string>(errores: Errores<K>): boolean {
  return Object.values(errores).some(Boolean);
}

/** Toma el primer mensaje de cada campo que devolvió el servidor. */
export function erroresDelServidor<K extends string>(
  errores: Record<string, string[]>,
  campos: readonly K[],
): Errores<K> {
  const salida: Errores<K> = {};
  for (const campo of campos) {
    const mensaje = errores[campo]?.[0];
    if (mensaje) salida[campo] = mensaje;
  }
  return salida;
}
