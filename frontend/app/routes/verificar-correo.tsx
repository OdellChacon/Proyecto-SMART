import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams } from "react-router";

import { Encabezado } from "~/components/Encabezado";
import { Boton, EnlaceBoton } from "~/components/ui/Boton";
import { Campo } from "~/components/ui/Campo";
import { Mensaje } from "~/components/ui/Mensaje";
import { auth } from "~/lib/auth";
import { useFocoAlAparecer } from "~/lib/useFoco";
import { validarCorreo } from "~/lib/validacion";

import type { Route } from "./+types/verificar-correo";

export const meta: Route.MetaFunction = () => [
  { title: "Confirmar correo · Nombre de la Universidad" },
  { name: "robots", content: "noindex" },
];

type Estado =
  | { fase: "verificando" }
  | { fase: "listo"; texto: string }
  | { fase: "invalido"; texto: string };

export default function VerificarCorreo() {
  const { uid = "", token = "" } = useParams();
  const [estado, setEstado] = useState<Estado>({ fase: "verificando" });
  const hecho = useRef(false);
  const refMensaje = useFocoAlAparecer<HTMLDivElement>(estado.fase !== "verificando");

  useEffect(() => {
    if (hecho.current) return; // evita la doble llamada del modo estricto en desarrollo
    hecho.current = true;
    auth
      .verificarCorreo(uid, token)
      .then((r) => setEstado({ fase: "listo", texto: r.detail }))
      .catch((e: Error) => setEstado({ fase: "invalido", texto: e.message }));
  }, [uid, token]);

  if (estado.fase === "verificando") {
    return (
      <div role="status" className="flex items-center gap-3 text-lg">
        <span className="size-6 animate-spin rounded-full border-2 border-marca-medio border-r-transparent" />
        Confirmando tu correo…
      </div>
    );
  }

  if (estado.fase === "listo") {
    return (
      <div className="flex flex-col gap-6">
        <Encabezado titulo="Correo confirmado" />
        <Mensaje ref={refMensaje} tipo="exito" titulo="Tu cuenta está activa">
          <p>{estado.texto}</p>
        </Mensaje>
        <EnlaceBoton to="/ingresar" icono="flecha-derecha" anchoCompleto>
          Ingresar
        </EnlaceBoton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Encabezado titulo="No pudimos confirmar tu correo" />
      <Mensaje ref={refMensaje} tipo="error" titulo="Enlace no válido">
        <p>{estado.texto}</p>
      </Mensaje>
      <PedirEnlaceNuevo />
    </div>
  );
}

function PedirEnlaceNuevo() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [hecho, setHecho] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const err = validarCorreo(email);
    setError(err);
    if (err) return;
    setEnviando(true);
    try {
      setHecho((await auth.reenviarVerificacion(email)).detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (hecho) return <p className="text-exito">{hecho}</p>;
  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
      <Campo
        etiqueta="Escribe tu correo y te enviamos un enlace nuevo"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
      />
      <Boton type="submit" estilo="secundario" anchoCompleto cargando={enviando}>
        Enviar enlace nuevo
      </Boton>
    </form>
  );
}
