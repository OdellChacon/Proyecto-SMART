import type { Sitio } from "./tipos";

type Coincidencia = { id: string; data?: unknown } | undefined;

/** Datos generales del sitio, leídos del loader del layout público. */
export function sitioDe(matches: readonly Coincidencia[]): Sitio | undefined {
  const capa = matches.find((m) => m?.id === "routes/_sitio");
  return (capa?.data as { sitio?: Sitio } | undefined)?.sitio;
}

/** Título y descripción de cada página: «Página · Nombre de la universidad». */
export function metaDePagina(
  matches: readonly Coincidencia[],
  titulo: string | null,
  descripcion?: string,
) {
  const nombre = sitioDe(matches)?.nombre ?? "Universidad";
  const completo = titulo ? `${titulo} · ${nombre}` : nombre;
  return [
    { title: completo },
    { property: "og:title", content: completo },
    { property: "og:site_name", content: nombre },
    { property: "og:locale", content: "es_VE" },
    ...(descripcion
      ? [
          { name: "description", content: descripcion },
          { property: "og:description", content: descripcion },
        ]
      : []),
  ];
}
