import { Link } from "react-router";

import { CabeceraPagina } from "~/components/sitio/Pagina";
import { Boton, EnlaceBoton } from "~/components/ui/Boton";
import { Campo } from "~/components/ui/Campo";
import { AreaTexto, Selector } from "~/components/ui/CampoLargo";
import { Casilla } from "~/components/ui/Casilla";
import { Icono } from "~/components/ui/Icono";
import { Mensaje } from "~/components/ui/Mensaje";
import { Turnstile } from "~/components/ui/Turnstile";
import { obtener } from "~/lib/contenido.server";
import { metaDePagina } from "~/lib/meta";
import type { CarreraTarjeta } from "~/lib/tipos";
import { useEnvio } from "~/lib/useEnvio";
import { validarCorreo, validarObligatorio, type Errores } from "~/lib/validacion";

import type { Route } from "./+types/solicitar-informacion";

export async function loader({ request }: Route.LoaderArgs) {
  const carreras = await obtener<CarreraTarjeta[]>("carreras/");
  const pedida = new URL(request.url).searchParams.get("carrera") ?? "";
  return { carreras, inicial: carreras.some((c) => c.slug === pedida) ? pedida : "" };
}

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Solicitar información", "Pide información sobre la carrera que te interesa.");

const CAMPOS = ["nombre", "correo", "telefono", "carrera", "mensaje", "acepta_privacidad"] as const;
type Clave = (typeof CAMPOS)[number];
type Datos = Record<Exclude<Clave, "acepta_privacidad">, string> & { acepta_privacidad: boolean };

function validar(d: Datos): Errores<Clave> {
  return {
    nombre: validarObligatorio(d.nombre, "Escribe tu nombre."),
    correo: validarCorreo(d.correo),
    telefono:
      d.telefono && !/^[0-9+()\-\s]{7,30}$/.test(d.telefono)
        ? "Escribe solo números, espacios y los signos + ( ) -."
        : undefined,
    acepta_privacidad: d.acepta_privacidad ? undefined : "Debes aceptar el aviso de privacidad.",
  };
}

export default function SolicitarInformacion({ loaderData }: Route.ComponentProps) {
  const { carreras, inicial } = loaderData;
  const f = useEnvio<Clave, Datos>({
    inicial: { nombre: "", correo: "", telefono: "", carrera: inicial, mensaje: "", acepta_privacidad: false },
    campos: CAMPOS,
    ruta: "/api/v1/solicitudes-informacion/",
    validar,
  });

  return (
    <>
      <CabeceraPagina
        titulo="Solicitar información"
        ruta={[
          { titulo: "Admisión", url: "/admision" },
          { titulo: "Solicitar información", url: "/admision/solicitar-informacion" },
        ]}
        introduccion="Déjanos tus datos y te escribimos con la información de la carrera que te interesa."
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_22rem] lg:gap-14 lg:py-14">
        <div className="max-w-2xl">
          {f.listo ? (
            <div className="flex flex-col gap-6">
              <Mensaje ref={f.refListo} tipo="exito" titulo="¡Listo! Recibimos tu solicitud">
                <p>{f.listo}</p>
              </Mensaje>
              <div className="flex flex-wrap gap-3">
                <EnlaceBoton to="/carreras" estilo="secundario">Ver las carreras</EnlaceBoton>
                <Boton estilo="texto" onClick={f.otraVez}>Enviar otra solicitud</Boton>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={f.enviar} className="flex flex-col gap-6">
              {f.errorGeneral && (
                <Mensaje ref={f.refError} tipo="error" titulo="No pudimos enviar tu solicitud">
                  <p>{f.errorGeneral}</p>
                </Mensaje>
              )}
              <Campo
                etiqueta="Nombre y apellido"
                obligatorio
                name="nombre"
                autoComplete="name"
                value={f.datos.nombre}
                onChange={f.cambiar("nombre")}
                error={f.errores.nombre}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <Campo
                  etiqueta="Correo electrónico"
                  obligatorio
                  type="email"
                  name="correo"
                  autoComplete="email"
                  inputMode="email"
                  value={f.datos.correo}
                  onChange={f.cambiar("correo")}
                  error={f.errores.correo}
                />
                <Campo
                  etiqueta="Teléfono (opcional)"
                  ayuda="Si prefieres que te llamemos."
                  type="tel"
                  name="telefono"
                  autoComplete="tel"
                  inputMode="tel"
                  value={f.datos.telefono}
                  onChange={f.cambiar("telefono")}
                  error={f.errores.telefono}
                />
              </div>
              <Selector
                etiqueta="Carrera que te interesa"
                name="carrera"
                vacio="Todavía no lo sé"
                opciones={carreras.map((c) => ({ valor: c.slug, texto: c.nombre }))}
                value={f.datos.carrera}
                onChange={f.cambiar("carrera")}
                error={f.errores.carrera}
              />
              <AreaTexto
                etiqueta="¿Qué te gustaría saber?"
                name="mensaje"
                maxLength={2000}
                value={f.datos.mensaje}
                onChange={f.cambiar("mensaje")}
                error={f.errores.mensaje}
              />
              <Casilla
                checked={f.datos.acepta_privacidad}
                onChange={f.cambiar("acepta_privacidad")}
                error={f.errores.acepta_privacidad}
              >
                Acepto el <Link to="/privacidad">aviso de privacidad</Link> y que usen mis datos solo
                para responder esta solicitud.
              </Casilla>
              <Turnstile onToken={f.setToken} reinicio={f.reinicio} />
              <div>
                <Boton type="submit" icono="flecha-derecha" cargando={f.enviando}>
                  Enviar solicitud
                </Boton>
              </div>
            </form>
          )}
        </div>
        <aside className="flex flex-col gap-4 self-start rounded-lg bg-sutil p-6">
          <h2 className="text-xl">¿Qué pasa después?</h2>
          <ul className="flex flex-col gap-4">
            {[
              ["correo", "Te escribimos al correo que indiques con la información de la carrera."],
              ["calendario", "Te contamos las fechas del proceso de admisión."],
              ["ubicacion", "Si quieres, te invitamos a conocer la sede."],
            ].map(([icono, texto]) => (
              <li key={texto} className="flex gap-3">
                <Icono nombre={icono as "correo"} className="mt-0.5 text-marca-medio" />
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
