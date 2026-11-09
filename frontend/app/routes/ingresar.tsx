import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { Encabezado } from "~/components/Encabezado";
import { Boton } from "~/components/ui/Boton";
import { Campo } from "~/components/ui/Campo";
import { Casilla } from "~/components/ui/Casilla";
import { Mensaje } from "~/components/ui/Mensaje";
import { ApiError } from "~/lib/api";
import { auth, destinoSeguro } from "~/lib/auth";
import { enfocarPrimerError, useFocoAlAparecer } from "~/lib/useFoco";
import {
  erroresDelServidor,
  hayErrores,
  validarCorreo,
  type Errores,
} from "~/lib/validacion";

import type { Route } from "./+types/ingresar";

export const meta: Route.MetaFunction = () => [{ title: "Ingresar · Nombre de la Universidad" }];

const CAMPOS = ["email", "password"] as const;
type CampoIngreso = (typeof CAMPOS)[number];

interface Aviso {
  tipo: "error" | "info" | "exito";
  titulo: string;
  texto: string;
  codigo?: string;
}

const TITULOS: Record<string, string> = {
  credenciales_invalidas: "No pudimos ingresar",
  correo_no_verificado: "Confirma tu correo",
  cuenta_bloqueada: "Ingreso bloqueado por unos minutos",
  demasiados_intentos: "Demasiados intentos",
  red: "Sin conexión",
  csrf: "La página caducó",
};

const AVISOS_DE_LLEGADA: Record<string, Aviso> = {
  restablecida: {
    tipo: "exito",
    titulo: "Contraseña actualizada",
    texto: "Ya puedes ingresar con tu contraseña nueva.",
  },
  salida: { tipo: "info", titulo: "Cerraste tu sesión", texto: "Vuelve cuando quieras." },
  verificado: {
    tipo: "exito",
    titulo: "Correo confirmado",
    texto: "Tu cuenta está activa. Ya puedes ingresar.",
  },
};

export default function Ingresar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destino = destinoSeguro(params.get("siguiente"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [errores, setErrores] = useState<Errores<CampoIngreso>>({});
  const [aviso, setAviso] = useState<Aviso | null>(
    () => AVISOS_DE_LLEGADA[params.get("estado") ?? ""] ?? null,
  );
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const refAviso = useFocoAlAparecer<HTMLDivElement>(aviso);

  // Si ya hay sesión, no tiene sentido mostrar el formulario.
  useEffect(() => {
    auth
      .sesion()
      .then((s) => s.autenticado && navigate(destino, { replace: true }))
      .catch(() => undefined);
  }, [destino, navigate]);

  function validar(): Errores<CampoIngreso> {
    return {
      email: validarCorreo(email),
      password: password ? undefined : "Escribe tu contraseña.",
    };
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const encontrados = validar();
    setErrores(encontrados);
    setAviso(null);
    if (hayErrores(encontrados)) return enfocarPrimerError();

    setEnviando(true);
    try {
      await auth.ingreso(email, password, recordar);
      navigate(destino, { replace: true });
    } catch (err) {
      const error = err instanceof ApiError ? err : new ApiError(0, "error", "Ocurrió un error.");
      if (error.codigo === "validacion") setErrores(erroresDelServidor(error.errores, CAMPOS));
      setAviso({
        tipo: error.codigo === "correo_no_verificado" ? "info" : "error",
        titulo: TITULOS[error.codigo] ?? "No pudimos ingresar",
        texto: error.message,
        codigo: error.codigo,
      });
    } finally {
      setEnviando(false);
    }
  }

  async function reenviarVerificacion() {
    setReenviando(true);
    try {
      const r = await auth.reenviarVerificacion(email);
      setAviso({ tipo: "exito", titulo: "Enlace enviado", texto: r.detail });
    } catch (err) {
      setAviso({
        tipo: "error",
        titulo: "No pudimos reenviar el enlace",
        texto: err instanceof Error ? err.message : "Inténtalo de nuevo.",
      });
    } finally {
      setReenviando(false);
    }
  }

  return (
    <>
      <Encabezado titulo="Ingresar">Usa el correo y la contraseña de tu cuenta.</Encabezado>

      {aviso && (
        <div className="mb-6">
          <Mensaje ref={refAviso} tipo={aviso.tipo} titulo={aviso.titulo}>
            <p>{aviso.texto}</p>
            {aviso.codigo === "correo_no_verificado" && (
              <Boton
                estilo="secundario"
                tamano="mediano"
                className="mt-3"
                cargando={reenviando}
                onClick={reenviarVerificacion}
              >
                Reenviar enlace de confirmación
              </Boton>
            )}
            {aviso.codigo === "cuenta_bloqueada" && (
              <p className="mt-2">
                <Link to="/recuperar-contrasena">Recuperar mi contraseña</Link>
              </p>
            )}
          </Mensaje>
        </div>
      )}

      <form noValidate onSubmit={enviar} className="flex flex-col gap-6">
        <Campo
          etiqueta="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errores.email}
        />
        <div className="flex flex-col gap-2">
          <Campo
            etiqueta="Contraseña"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errores.password}
          />
          <Link to="/recuperar-contrasena" className="self-start text-sm font-semibold">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Casilla checked={recordar} onChange={(e) => setRecordar(e.target.checked)}>
          Mantener la sesión iniciada en este equipo
        </Casilla>
        <Boton type="submit" icono="flecha-derecha" anchoCompleto cargando={enviando}>
          Ingresar
        </Boton>
      </form>

      <p className="mt-8 border-t border-borde pt-6 text-center">
        ¿No tienes cuenta? <Link to="/registro" className="font-semibold">Crear una cuenta</Link>
      </p>
    </>
  );
}
