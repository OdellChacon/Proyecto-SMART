import { CabeceraPagina, Parrafos, Pendiente } from "~/components/sitio/Pagina";
import { fecha } from "~/lib/formato";
import { metaDePagina } from "~/lib/meta";
import { useSitio } from "~/lib/useSitio";

import type { Route } from "./+types/privacidad";

export const meta: Route.MetaFunction = ({ matches }) =>
  metaDePagina(matches, "Aviso de privacidad", "Cómo usamos los datos que escribes en los formularios.");

export default function Privacidad() {
  const { aviso_privacidad: texto, actualizado_en } = useSitio();
  return (
    <>
      <CabeceraPagina titulo="Aviso de privacidad" ruta={[{ titulo: "Aviso de privacidad", url: "/privacidad" }]} />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:py-14">
        {texto ? (
          <>
            <Parrafos texto={texto} />
            <p className="text-sm text-texto-secundario">Última actualización: {fecha(actualizado_en)}</p>
          </>
        ) : (
          <Pendiente>El aviso de privacidad está pendiente de redacción por la universidad.</Pendiente>
        )}
      </div>
    </>
  );
}
