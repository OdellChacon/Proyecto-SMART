import { api } from "./api";

const BASE = "/api/v1/auth";

export type Rol = "Estudiante" | "Docente" | "Administrativo";

export interface Usuario {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  roles: Rol[];
  correo_verificado: boolean;
  is_staff: boolean;
}

export interface RespuestaSimple {
  detail: string;
  codigo: string;
}

export interface Sesion extends RespuestaSimple {
  autenticado: boolean;
  usuario: Usuario | null;
}

export interface DatosRegistro {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  password_confirmacion: string;
  acepta_privacidad: boolean;
}

export const auth = {
  sesion: () => api.get<Sesion>(`${BASE}/sesion/`),
  registro: (datos: DatosRegistro) =>
    api.post<RespuestaSimple & { email: string }>(`${BASE}/registro/`, datos),
  verificarCorreo: (uid: string, token: string) =>
    api.post<RespuestaSimple>(`${BASE}/verificar-correo/`, { uid, token }),
  reenviarVerificacion: (email: string) =>
    api.post<RespuestaSimple>(`${BASE}/reenviar-verificacion/`, { email }),
  ingreso: (email: string, password: string, recordar: boolean) =>
    api.post<RespuestaSimple & { usuario: Usuario }>(`${BASE}/ingreso/`, {
      email,
      password,
      recordar,
    }),
  salida: () => api.post<RespuestaSimple>(`${BASE}/salida/`),
  recuperarContrasena: (email: string) =>
    api.post<RespuestaSimple>(`${BASE}/recuperar-contrasena/`, { email }),
  validarEnlace: (uid: string, token: string) =>
    api.post<RespuestaSimple & { email: string }>(`${BASE}/restablecer-contrasena/validar/`, {
      uid,
      token,
    }),
  restablecerContrasena: (
    uid: string,
    token: string,
    password: string,
    password_confirmacion: string,
  ) =>
    api.post<RespuestaSimple>(`${BASE}/restablecer-contrasena/`, {
      uid,
      token,
      password,
      password_confirmacion,
    }),
};

/** Solo acepta rutas internas para evitar redirecciones abiertas (?siguiente=https://...). */
export function destinoSeguro(siguiente: string | null, porDefecto = "/cuenta"): string {
  if (!siguiente) return porDefecto;
  if (!siguiente.startsWith("/") || siguiente.startsWith("//") || siguiente.startsWith("/\\")) {
    return porDefecto;
  }
  return siguiente;
}
