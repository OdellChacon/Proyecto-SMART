import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";

import { Encabezado } from "~/components/Encabezado";
import { Boton, EnlaceBoton } from "~/components/ui/Boton";
import { Campo } from "~/components/ui/Campo";
import { Mensaje } from "~/components/ui/Mensaje";
import { ApiError } from "~/lib/api";
import { auth } from "~/lib/auth";
import { enfocarPrimerError, useFocoAlAparecer } from "~/lib/useFoco";
import {
  LONGITUD_MINIMA_CONTRASENA,
  erroresDelServidor,
  hayErrores,
  validarConfirmacion,
  validarContrasenaNueva,
  type Errores,
} from "~/lib/validacion";

import type { Route } from "./+types/restablecer-contrasena";

export const meta: Route.MetaFunction = () => [
  { title: "Nueva contraseña · Nombre de la Universidad" },
  { name: "robots", content: "noindex" },
];

const CAMPOS = ["password", "password_confirmacion"] as const;
type CampoClave = (typeof CAMPOS)[number];

export default function RestablecerContrasena() {
  const { uid = "", token = "" } = useParams();
  const navigate = useNavigate();
  const [enlace, setEnlace] = useState<"validando" | "valido" | "invalido">("validando");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<Errores<CampoClave>>({});
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const refFallo = useFocoAlAparecer<HTMLDivElement>(fallo);

  useEffect(() => {
    auth
      .validarEnlace(uid, token)
      .then((r) => {
        setCorreo(r.email);
        setEnlace("valido");
      })
      .catch(() => setEnlace("invalido"));
  }, [uid, token]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const encontrados: Errores<CampoClave> = {
      password: validarContrasenaNueva(password),
      password_confirmacion: validarConfirmacion(confirmacion, password),
    };
    setErrores(encontrados);
    setFallo(null);
    if (hayErrores(encontrados)) return enfocarPrimerError();

    setEnviando(true);
    try {
      await auth.restablecerContrasena(uid, token, password, confirmacion);
      navigate("/ingresar?estado=restablecida", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.codigo === "validacion") {
        setErrores(erroresDelServidor(err.errores, CAMPOS));
        enfocarPrimerError();
      } else if (err instanceof ApiError && err.codigo === "enlace_invalido") {
        setEnlace("invalido");
      } else {
        setFallo(err instanceof Error ? err.message : "Inténtalo de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (enlace === "validando") {
    return (
      <div role="status" className="flex items-center gap-3 text-lg">
        <span className="size-6 animate-spin rounded-full border-2 border-marca-medio border-r-transparent" />
        Revisando el enlace…
      </div>
    );
  }

  if (enlace === "invalido") {
    return (
      <div className="flex flex-col gap-6">
        <Encabezado titulo="El enlace ya no sirve" />
        <Mensaje tipo="error" titulo="Enlace vencido o ya usado">
          <p>
            Por seguridad, cada enlace vence en 24 horas y solo funciona una vez. Pide uno nuevo.
          </p>
        </Mensaje>
        <EnlaceBoton to="/recuperar-contrasena" icono="correo" anchoCompleto>
          Pedir un enlace nuevo
        </EnlaceBoton>
      </div>
    );
  }

  return (
    <>
      <Encabezado titulo="Crea una contraseña nueva">
        Para la cuenta <strong className="break-all text-texto">{correo}</strong>.
      </Encabezado>
      {fallo && (
        <div className="mb-6">
          <Mensaje ref={refFallo} tipo="error" titulo="No pudimos cambiar la contraseña">
            <p>{fallo}</p>
          </Mensaje>
        </div>
      )}
      <form noValidate onSubmit={enviar} className="flex flex-col gap-6">
        {/* Ayuda a los gestores de contraseñas a asociar la clave nueva con la cuenta. */}
        <input type="email" name="email" value={correo} autoComplete="username" readOnly hidden />
        <Campo
          etiqueta="Contraseña nueva"
          ayuda={`Mínimo ${LONGITUD_MINIMA_CONTRASENA} caracteres. Evita tu nombre, fechas o palabras comunes.`}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errores.password}
        />
        <Campo
          etiqueta="Repite la contraseña nueva"
          type="password"
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          error={errores.password_confirmacion}
        />
        <Boton type="submit" anchoCompleto cargando={enviando}>
          Guardar contraseña
        </Boton>
      </form>
    </>
  );
}
