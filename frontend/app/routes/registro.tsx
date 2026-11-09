import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";

import { Encabezado } from "~/components/Encabezado";
import { Boton, EnlaceBoton } from "~/components/ui/Boton";
import { Campo } from "~/components/ui/Campo";
import { Casilla } from "~/components/ui/Casilla";
import { Mensaje } from "~/components/ui/Mensaje";
import { ApiError } from "~/lib/api";
import { auth, type DatosRegistro } from "~/lib/auth";
import { enfocarPrimerError, useFocoAlAparecer } from "~/lib/useFoco";
import {
  LONGITUD_MINIMA_CONTRASENA,
  erroresDelServidor,
  hayErrores,
  validarConfirmacion,
  validarContrasenaNueva,
  validarCorreo,
  validarObligatorio,
  type Errores,
} from "~/lib/validacion";

import type { Route } from "./+types/registro";

export const meta: Route.MetaFunction = () => [
  { title: "Crear cuenta · Nombre de la Universidad" },
];

const CAMPOS = [
  "nombres",
  "apellidos",
  "email",
  "password",
  "password_confirmacion",
  "acepta_privacidad",
] as const;
type CampoRegistro = (typeof CAMPOS)[number];

const VACIO: DatosRegistro = {
  nombres: "",
  apellidos: "",
  email: "",
  password: "",
  password_confirmacion: "",
  acepta_privacidad: false,
};

const ESPERA_REENVIO = 60;

export default function Registro() {
  const [datos, setDatos] = useState<DatosRegistro>(VACIO);
  const [errores, setErrores] = useState<Errores<CampoRegistro>>({});
  const [errorGeneral, setErrorGeneral] = useState<{ titulo: string; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviadoA, setEnviadoA] = useState<string | null>(null);
  const refError = useFocoAlAparecer<HTMLDivElement>(errorGeneral);
  const refListo = useFocoAlAparecer<HTMLDivElement>(enviadoA);

  const cambiar =
    (campo: keyof DatosRegistro) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setDatos((d) => ({
        ...d,
        [campo]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
      }));

  function validar(): Errores<CampoRegistro> {
    return {
      nombres: validarObligatorio(datos.nombres, "Escribe tus nombres."),
      apellidos: validarObligatorio(datos.apellidos, "Escribe tus apellidos."),
      email: validarCorreo(datos.email),
      password: validarContrasenaNueva(datos.password),
      password_confirmacion: validarConfirmacion(datos.password_confirmacion, datos.password),
      acepta_privacidad: datos.acepta_privacidad
        ? undefined
        : "Debes aceptar el aviso de privacidad.",
    };
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const encontrados = validar();
    setErrores(encontrados);
    setErrorGeneral(null);
    if (hayErrores(encontrados)) return enfocarPrimerError();

    setEnviando(true);
    try {
      const r = await auth.registro(datos);
      setEnviadoA(r.email);
    } catch (err) {
      if (err instanceof ApiError && err.codigo === "validacion") {
        setErrores(erroresDelServidor(err.errores, CAMPOS));
        enfocarPrimerError();
      } else {
        setErrorGeneral({
          titulo: "No pudimos crear tu cuenta",
          texto: err instanceof Error ? err.message : "Inténtalo de nuevo.",
        });
      }
    } finally {
      setEnviando(false);
    }
  }

  if (enviadoA) return <RevisaTuCorreo email={enviadoA} refListo={refListo} />;

  return (
    <>
      <Encabezado titulo="Crear una cuenta">
        Con tu cuenta podrás acceder a los servicios de la universidad.
      </Encabezado>

      {errorGeneral && (
        <div className="mb-6">
          <Mensaje ref={refError} tipo="error" titulo={errorGeneral.titulo}>
            <p>{errorGeneral.texto}</p>
          </Mensaje>
        </div>
      )}

      <form noValidate onSubmit={enviar} className="flex flex-col gap-6">
        <p className="text-sm text-texto-secundario">Todos los campos son obligatorios.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <Campo
            etiqueta="Nombres"
            name="nombres"
            autoComplete="given-name"
            value={datos.nombres}
            onChange={cambiar("nombres")}
            error={errores.nombres}
          />
          <Campo
            etiqueta="Apellidos"
            name="apellidos"
            autoComplete="family-name"
            value={datos.apellidos}
            onChange={cambiar("apellidos")}
            error={errores.apellidos}
          />
        </div>
        <Campo
          etiqueta="Correo electrónico"
          ayuda="Te enviaremos un enlace para confirmarlo."
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={datos.email}
          onChange={cambiar("email")}
          error={errores.email}
        />
        <Campo
          etiqueta="Contraseña"
          ayuda={`Mínimo ${LONGITUD_MINIMA_CONTRASENA} caracteres. Evita tu nombre, fechas o palabras comunes.`}
          type="password"
          name="password"
          autoComplete="new-password"
          value={datos.password}
          onChange={cambiar("password")}
          error={errores.password}
        />
        <Campo
          etiqueta="Repite la contraseña"
          type="password"
          name="password_confirmacion"
          autoComplete="new-password"
          value={datos.password_confirmacion}
          onChange={cambiar("password_confirmacion")}
          error={errores.password_confirmacion}
        />
        <Casilla
          checked={datos.acepta_privacidad}
          onChange={cambiar("acepta_privacidad")}
          error={errores.acepta_privacidad}
        >
          Acepto el <a href="/privacidad">aviso de privacidad</a> y que usen mis datos solo para
          gestionar mi cuenta.
        </Casilla>
        <Boton type="submit" icono="flecha-derecha" anchoCompleto cargando={enviando}>
          Crear cuenta
        </Boton>
      </form>

      <p className="mt-8 border-t border-borde pt-6 text-center">
        ¿Ya tienes cuenta? <Link to="/ingresar" className="font-semibold">Ingresar</Link>
      </p>
    </>
  );
}

function RevisaTuCorreo({
  email,
  refListo,
}: {
  email: string;
  refListo: React.RefObject<HTMLDivElement | null>;
}) {
  const [espera, setEspera] = useState(ESPERA_REENVIO);
  const [estado, setEstado] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [reenviando, setReenviando] = useState(false);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function reenviar() {
    setReenviando(true);
    try {
      const r = await auth.reenviarVerificacion(email);
      setEstado({ tipo: "exito", texto: r.detail });
      setEspera(ESPERA_REENVIO);
    } catch (err) {
      setEstado({ tipo: "error", texto: err instanceof Error ? err.message : "Inténtalo de nuevo." });
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Mensaje ref={refListo} tipo="exito" titulo="Revisa tu correo">
        <p>
          Enviamos un enlace a <strong className="break-all">{email}</strong>. Ábrelo para activar
          tu cuenta.
        </p>
      </Mensaje>
      <ol className="flex list-decimal flex-col gap-2 pl-6 text-base">
        <li>Busca un correo de “Nombre de la Universidad”.</li>
        <li>Si no aparece en unos minutos, revisa la carpeta de spam o correo no deseado.</li>
        <li>Toca “Confirmar mi correo”. El enlace vence en 24 horas.</li>
      </ol>
      {estado && <p className={estado.tipo === "error" ? "text-error" : "text-exito"}>{estado.texto}</p>}
      <div className="flex flex-col gap-3">
        <Boton
          estilo="secundario"
          anchoCompleto
          disabled={espera > 0}
          cargando={reenviando}
          onClick={reenviar}
        >
          {espera > 0 ? `Reenviar el correo (en ${espera} s)` : "Reenviar el correo"}
        </Boton>
        <EnlaceBoton to="/ingresar" estilo="texto" icono="flecha-derecha">
          Ir a ingresar
        </EnlaceBoton>
      </div>
    </div>
  );
}
