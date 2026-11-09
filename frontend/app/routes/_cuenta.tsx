import { Link, Outlet } from "react-router";

import { Icono } from "~/components/ui/Icono";
import { Marca } from "~/components/ui/Marca";

/** Diseño compartido de ingreso, registro y recuperación de contraseña. */
export default function DisenoCuenta() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden flex-col justify-between gap-12 bg-marca p-12 text-sobre-marca lg:flex xl:p-16">
        <Marca claro />
        <div className="flex max-w-md flex-col gap-6">
          <h2 className="text-3xl text-sobre-marca">
            Un solo acceso para toda la comunidad universitaria
          </h2>
          <p className="text-lg text-sobre-marca-suave">
            Estudiantes, docentes y personal administrativo ingresan con la misma cuenta.
          </p>
          <ul className="flex flex-col gap-4">
            {[
              ["usuario", "Estudiantes"],
              ["libro", "Docentes"],
              ["candado", "Personal administrativo"],
            ].map(([icono, texto]) => (
              <li key={texto} className="flex items-center gap-3 text-base">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-marca-medio">
                  <Icono nombre={icono as "usuario"} tamano={20} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-sobre-marca-suave">
          Control de estudios y Aula virtual estarán disponibles en las próximas fases.
        </p>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-borde px-5 py-3 lg:justify-end lg:border-none lg:px-12 lg:pt-8">
          <span className="lg:hidden">
            <Marca compacto />
          </span>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold">
            <Icono nombre="flecha-izquierda" tamano={20} />
            Volver al sitio
          </Link>
        </header>
        <main
          id="contenido"
          className="flex flex-1 justify-center px-5 py-10 lg:items-center lg:px-12"
        >
          <div className="w-full max-w-[30rem]">
            <Outlet />
          </div>
        </main>
        <footer className="px-5 pb-6 text-center text-sm text-texto-secundario lg:px-12">
          © {new Date().getFullYear()} Nombre de la Universidad ·{" "}
          <a href="/privacidad">Aviso de privacidad</a>
        </footer>
      </div>
    </div>
  );
}
