import { Link } from "react-router";

import { CabeceraPagina } from "~/components/sitio/Pagina";
import { FotoPendiente } from "~/components/sitio/Tarjetas";
import { Boton } from "~/components/ui/Boton";
import { Campo } from "~/components/ui/Campo";
import { AreaTexto } from "~/components/ui/CampoLargo";
import { Casilla } from "~/components/ui/Casilla";
import { Icono, type NombreIcono } from "~/components/ui/Icono";
import { Mensaje } from "~/components/ui/Mensaje";
import { Turnstile } from "~/components/ui/Turnstile";
import { TARJETA } from "~/components/ui/Tarjeta";
import { correoLimpio, telefonoParaEnlace } from "~/lib/formato";
import { metaDePagina } from "~/lib/meta";
import { useEnvio } from "~/lib/useEnvio";
import { useSitio } from "~/lib/useSitio";
import { validarCorreo, validarObligatorio, type Errores } from "~/lib/validacion";

import type { Route } from "./+types/contacto";

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Contacto", "Escríbenos, llámanos o visítanos en la sede.");

const CAMPOS = ["nombre", "correo", "asunto", "mensaje", "acepta_privacidad"] as const;
type Clave = (typeof CAMPOS)[number];
type Datos = Record<Exclude<Clave, "acepta_privacidad">, string> & { acepta_privacidad: boolean };

function validar(d: Datos): Errores<Clave> {
  return {
    nombre: validarObligatorio(d.nombre, "Escribe tu nombre."),
    correo: validarCorreo(d.correo),
    asunto: validarObligatorio(d.asunto, "Escribe el asunto de tu mensaje."),
    mensaje: !d.mensaje.trim()
      ? "Escribe tu mensaje."
      : d.mensaje.trim().length < 10
        ? "Cuéntanos un poco más (al menos 10 caracteres)."
        : undefined,
    acepta_privacidad: d.acepta_privacidad ? undefined : "Debes aceptar el aviso de privacidad.",
  };
}

function Dato({ icono, titulo, children }: { icono: NombreIcono; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-marca-sutil text-marca-medio">
        <Icono nombre={icono} tamano={22} />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="font-sans text-base font-bold">{titulo}</h3>
        {children}
      </div>
    </div>
  );
}

export default function Contacto() {
  const sitio = useSitio();
  const f = useEnvio<Clave, Datos>({
    inicial: { nombre: "", correo: "", asunto: "", mensaje: "", acepta_privacidad: false },
    campos: CAMPOS,
    ruta: "/api/v1/contacto/",
    validar,
  });

  return (
    <>
      <CabeceraPagina
        titulo="Contacto"
        ruta={[{ titulo: "Contacto", url: "/contacto" }]}
        introduccion={
          <>
            ¿Quieres estudiar con nosotros? Usa{" "}
            <Link to="/admision/solicitar-informacion">Solicitar información</Link>. Para cualquier
            otra consulta, escríbenos aquí.
          </>
        }
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_24rem] lg:gap-16 lg:py-14">
        <section aria-labelledby="formulario" className="max-w-2xl">
          <h2 id="formulario" className="mb-6 scroll-mt-6 text-2xl">Escríbenos</h2>
          {f.listo ? (
            <div className="flex flex-col gap-6">
              <Mensaje ref={f.refListo} tipo="exito" titulo="Mensaje enviado">
                <p>{f.listo}</p>
              </Mensaje>
              <div>
                <Boton estilo="texto" onClick={f.otraVez}>Enviar otro mensaje</Boton>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={f.enviar} className="flex flex-col gap-6">
              {f.errorGeneral && (
                <Mensaje ref={f.refError} tipo="error" titulo="No pudimos enviar tu mensaje">
                  <p>{f.errorGeneral}</p>
                </Mensaje>
              )}
              <p className="text-sm text-texto-secundario">Todos los campos son obligatorios.</p>
              <div className="grid gap-6 sm:grid-cols-2">
                <Campo etiqueta="Nombre y apellido" name="nombre" autoComplete="name"
                  value={f.datos.nombre} onChange={f.cambiar("nombre")} error={f.errores.nombre} />
                <Campo etiqueta="Correo electrónico" type="email" name="correo" autoComplete="email"
                  inputMode="email" value={f.datos.correo} onChange={f.cambiar("correo")}
                  error={f.errores.correo} />
              </div>
              <Campo etiqueta="Asunto" name="asunto" maxLength={160}
                value={f.datos.asunto} onChange={f.cambiar("asunto")} error={f.errores.asunto} />
              <AreaTexto etiqueta="Mensaje" obligatorio name="mensaje" maxLength={4000}
                value={f.datos.mensaje} onChange={f.cambiar("mensaje")} error={f.errores.mensaje} />
              <Casilla checked={f.datos.acepta_privacidad} onChange={f.cambiar("acepta_privacidad")}
                error={f.errores.acepta_privacidad}>
                Acepto el <Link to="/privacidad">aviso de privacidad</Link> y que usen mis datos solo
                para responder este mensaje.
              </Casilla>
              <Turnstile onToken={f.setToken} reinicio={f.reinicio} />
              <div>
                <Boton type="submit" icono="flecha-derecha" cargando={f.enviando}>
                  Enviar mensaje
                </Boton>
              </div>
            </form>
          )}
        </section>

        <aside className="flex flex-col gap-8">
          <section aria-labelledby="horarios" className={`${TARJETA} flex flex-col gap-6 p-6`}>
            <h2 id="horarios" className="scroll-mt-6 text-xl">Horarios, teléfonos y redes</h2>
            {sitio.horario.length > 0 && (
              <Dato icono="reloj" titulo="Horario de atención">
                {sitio.horario.map((h) => <p key={h}>{h}</p>)}
              </Dato>
            )}
            {sitio.telefonos.length > 0 && (
              <Dato icono="telefono" titulo="Teléfonos">
                {sitio.telefonos.map((t) => (
                  <a key={t} href={`tel:${telefonoParaEnlace(t)}`}>{t}</a>
                ))}
              </Dato>
            )}
            {sitio.correos.length > 0 && (
              <Dato icono="correo" titulo="Correos">
                {sitio.correos.map((c) => (
                  <a key={c} href={`mailto:${correoLimpio(c)}`} className="break-words">{c}</a>
                ))}
              </Dato>
            )}
            {sitio.perfil_redes.length > 0 && (
              <Dato icono="externo" titulo="Redes sociales">
                {sitio.perfil_redes.map((r) => (
                  <a key={r.red} href={r.url} target="_blank" rel="noopener noreferrer">
                    {r.nombre}<span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                ))}
              </Dato>
            )}
          </section>
        </aside>
      </div>

      <section aria-labelledby="ubicacion" className="border-t border-borde bg-sutil">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 id="ubicacion" className="scroll-mt-6 text-2xl">Ubicación</h2>
              {sitio.direccion && <p className="text-lg text-texto-secundario">{sitio.direccion}</p>}
            </div>
            {sitio.mapa_enlace && (
              <a href={sitio.mapa_enlace} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 font-semibold">
                <Icono nombre="ubicacion" /> Cómo llegar (Google Maps)
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            )}
          </div>
          {sitio.mapa_insertado ? (
            <iframe
              title={`Mapa de la sede de ${sitio.nombre}`}
              src={sitio.mapa_insertado}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-96 w-full rounded-lg border border-borde"
            />
          ) : (
            <FotoPendiente texto="El mapa se muestra cuando se cargue la dirección exacta de la sede" className="h-72 w-full rounded-lg" />
          )}
        </div>
      </section>
    </>
  );
}
