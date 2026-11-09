import { useState } from "react";
import { redirect, useNavigate } from "react-router";

import { Boton } from "~/components/ui/Boton";
import { Icono, type NombreIcono } from "~/components/ui/Icono";
import { Marca } from "~/components/ui/Marca";
import { FLECHA, LineaAcento, TARJETA, TARJETA_ENLACE } from "~/components/ui/Tarjeta";
import { auth, type Usuario } from "~/lib/auth";

import type { Route } from "./+types/cuenta";

export const meta: Route.MetaFunction = () => [
  { title: "Mi cuenta · Nombre de la Universidad" },
  { name: "robots", content: "noindex" },
];

// La sesión vive en una cookie del navegador: los datos se piden desde el cliente.
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const sesion = await auth.sesion();
  if (!sesion.autenticado || !sesion.usuario) {
    const ruta = new URL(request.url).pathname;
    throw redirect(`/ingresar?siguiente=${encodeURIComponent(ruta)}`);
  }
  return { usuario: sesion.usuario };
}

export function HydrateFallback() {
  return (
    <div role="status" className="flex min-h-dvh items-center justify-center gap-3 text-lg">
      <span className="size-6 animate-spin rounded-full border-2 border-marca-medio border-r-transparent" />
      Cargando tu cuenta…
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <main id="contenido" className="mx-auto flex max-w-xl flex-col gap-4 px-5 py-16">
      <h1 className="text-2xl">No pudimos cargar tu cuenta</h1>
      <p className="text-texto-secundario">
        Revisa tu conexión y recarga la página. Si el problema sigue, vuelve a ingresar.
      </p>
      <a href="/ingresar">Ir a ingresar</a>
    </main>
  );
}

export default function Cuenta({ loaderData }: Route.ComponentProps) {
  const { usuario } = loaderData;
  return (
    <div className="flex min-h-dvh flex-col bg-sutil">
      <BarraSuperior usuario={usuario} />
      <main id="contenido" className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-10 lg:py-16">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl lg:text-3xl">Hola, {usuario.nombres}</h1>
          <ul className="flex flex-wrap gap-2" aria-label="Tus roles">
            {usuario.roles.length ? (
              usuario.roles.map((rol) => (
                <li key={rol} className="rounded-full bg-marca px-4 py-1.5 text-sm font-semibold text-sobre-marca">
                  {rol}
                </li>
              ))
            ) : (
              <li className="rounded-full border border-borde-fuerte px-4 py-1.5 text-sm">
                Sin rol asignado
              </li>
            )}
          </ul>
        </div>

        <section aria-labelledby="titulo-accesos" className="flex flex-col gap-4">
          <h2 id="titulo-accesos" className="text-xl">
            Tus accesos
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Acceso icono="candado" titulo="Control de estudios" texto="Inscripciones, notas y constancias." />
            <Acceso icono="libro" titulo="Aula virtual" texto="Clases, materiales y entregas." />
            {usuario.is_staff && (
              <Acceso
                icono="usuario"
                titulo="Panel de administración"
                texto="Usuarios, roles y contenido del sitio."
                href="/admin/"
              />
            )}
          </div>
        </section>

        <section aria-labelledby="titulo-datos" className="flex flex-col gap-4">
          <h2 id="titulo-datos" className="text-xl">
            Datos de la cuenta
          </h2>
          <dl className={`${TARJETA} grid gap-6 p-6 sm:grid-cols-2`}>
            <Dato etiqueta="Nombre" valor={usuario.nombre_completo} />
            <Dato etiqueta="Correo electrónico" valor={usuario.email} />
            <Dato
              etiqueta="Estado del correo"
              valor={usuario.correo_verificado ? "Confirmado" : "Pendiente de confirmar"}
            />
          </dl>
        </section>
      </main>
    </div>
  );
}

function BarraSuperior({ usuario }: { usuario: Usuario }) {
  const navigate = useNavigate();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    try {
      await auth.salida();
    } finally {
      navigate("/ingresar?estado=salida", { replace: true });
    }
  }

  return (
    <header className="border-b border-borde bg-superficie">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Marca compacto />
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-texto-secundario sm:inline">{usuario.email}</span>
          <Boton estilo="secundario" tamano="mediano" icono="salir" cargando={saliendo} onClick={salir}>
            Cerrar sesión
          </Boton>
        </div>
      </div>
    </header>
  );
}

function Acceso({
  icono,
  titulo,
  texto,
  href,
}: {
  icono: NombreIcono;
  titulo: string;
  texto: string;
  href?: string;
}) {
  const contenido = (
    <>
      <Icono nombre={icono} tamano={28} className="text-marca-medio" />
      <span className="text-xl font-semibold text-texto">{titulo}</span>
      <span className="text-texto-secundario">{texto}</span>
      {href ? (
        <span className="mt-auto inline-flex items-center gap-1 font-semibold text-enlace">
          Entrar <Icono nombre="flecha-derecha" tamano={20} className={FLECHA} />
        </span>
      ) : (
        <span className="mt-auto self-start text-sm font-semibold text-texto-secundario">
          Próximamente
        </span>
      )}
    </>
  );
  const clases = "flex h-full flex-col gap-3 p-6 no-underline";
  return href ? (
    <a href={href} className={`${TARJETA_ENLACE} ${clases}`}>
      {contenido}
      <LineaAcento />
    </a>
  ) : (
    <div className={`${TARJETA} ${clases}`}>{contenido}</div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-bold tracking-wider text-texto-secundario uppercase">{etiqueta}</dt>
      <dd className="break-all font-semibold">{valor}</dd>
    </div>
  );
}
