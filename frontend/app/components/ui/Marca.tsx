import { Link } from "react-router";

interface Props {
  claro?: boolean;
  compacto?: boolean;
  nombre?: string;
  subtitulo?: string;
}

/**
 * Marca provisional: el ícono del proyecto + el nombre de la institución.
 * Se reemplaza por el logo oficial cuando la universidad lo entregue.
 */
export function Marca({ claro, compacto, nombre = "Nombre de la Universidad", subtitulo }: Props) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-3 no-underline ${claro ? "text-sobre-marca" : "text-texto"}`}
    >
      <img
        src="/favicon.svg"
        alt=""
        width={compacto ? 40 : 48}
        height={compacto ? 40 : 48}
        className={claro ? "rounded-md ring-1 ring-white/30" : "rounded-md"}
      />
      <span className="flex flex-col leading-tight">
        <span
          className={`font-serif font-semibold ${compacto ? "text-base" : "text-lg sm:text-xl"}`}
        >
          {nombre}
        </span>
        {!compacto && subtitulo && (
          <span className={`hidden text-sm sm:block ${claro ? "text-sobre-marca-suave" : "text-texto-secundario"}`}>
            {subtitulo}
          </span>
        )}
      </span>
      <span className="sr-only">, ir al inicio</span>
    </Link>
  );
}
