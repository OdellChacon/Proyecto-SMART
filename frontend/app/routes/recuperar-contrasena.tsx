import { useState, type FormEvent } from "react";
import { Link } from "react-router";

import { Encabezado } from "~/components/Encabezado";
import { Boton } from "~/components/ui/Boton";
import { Campo } from "~/components/ui/Campo";
import { Mensaje } from "~/components/ui/Mensaje";
import { auth } from "~/lib/auth";
import { enfocarPrimerError, useFocoAlAparecer } from "~/lib/useFoco";
import { validarCorreo } from "~/lib/validacion";

import type { Route } from "./+types/recuperar-contrasena";

export const meta: Route.MetaFunction = () => [
  { title: "Recuperar contraseña · Nombre de la Universidad" },
];

export default function RecuperarContrasena() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [enviado, setEnviado] = useState<string | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const refMensaje = useFocoAlAparecer<HTMLDivElement>(enviado ?? fallo);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const err = validarCorreo(email);
    setError(err);
    setFallo(null);
    if (err) return enfocarPrimerError();
    setEnviando(true);
    try {
      setEnviado((await auth.recuperarContrasena(email)).detail);
    } catch (e) {
      setFallo(e instanceof Error ? e.message : "Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-6">
        <Encabezado titulo="Revisa tu correo" />
        <Mensaje ref={refMensaje} tipo="exito" titulo="Solicitud recibida">
          <p>{enviado}</p>
        </Mensaje>
        <p className="text-texto-secundario">
          Si no te llega en unos minutos, revisa la carpeta de spam. El enlace vence en 24 horas.
        </p>
        <Link to="/ingresar" className="font-semibold">
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <>
      <Encabezado titulo="Recuperar contraseña">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
      </Encabezado>
      {fallo && (
        <div className="mb-6">
          <Mensaje ref={refMensaje} tipo="error" titulo="No pudimos enviar el enlace">
            <p>{fallo}</p>
          </Mensaje>
        </div>
      )}
      <form noValidate onSubmit={enviar} className="flex flex-col gap-6">
        <Campo
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
        <Boton type="submit" icono="correo" anchoCompleto cargando={enviando}>
          Enviar enlace
        </Boton>
      </form>
      <p className="mt-8 border-t border-borde pt-6 text-center">
        ¿La recordaste? <Link to="/ingresar" className="font-semibold">Ingresar</Link>
      </p>
    </>
  );
}
