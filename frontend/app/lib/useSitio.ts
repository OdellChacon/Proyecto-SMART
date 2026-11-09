import { useRouteLoaderData } from "react-router";

import type { Sitio } from "./tipos";

/** Datos generales del sitio (los carga el layout público una sola vez). */
export function useSitio(): Sitio {
  const datos = useRouteLoaderData("routes/_sitio") as { sitio: Sitio } | undefined;
  if (!datos) throw new Error("useSitio() solo funciona dentro del layout del sitio");
  return datos.sitio;
}
