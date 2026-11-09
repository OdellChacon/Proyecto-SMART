/**
 * Mapa del sitio (sección 4 del documento). Es fijo: no se edita desde el panel.
 * Lo usan el menú, el pie, la navegación de cada sección y el sitemap.xml.
 */
export interface Enlace {
  titulo: string;
  url: string;
}

export interface Seccion extends Enlace {
  descripcion: string;
  hijos: Enlace[];
}

export const MENU: Seccion[] = [
  {
    titulo: "La Universidad",
    url: "/la-universidad",
    descripcion: "Quiénes somos, nuestra historia y nuestras autoridades.",
    hijos: [
      { titulo: "Historia", url: "/la-universidad/historia" },
      { titulo: "Misión, visión y valores", url: "/la-universidad/mision-vision-valores" },
      { titulo: "Autoridades", url: "/la-universidad/autoridades" },
      { titulo: "Organigrama", url: "/la-universidad/organigrama" },
      { titulo: "Sede e instalaciones", url: "/la-universidad/sede" },
    ],
  },
  {
    titulo: "Carreras",
    url: "/carreras",
    descripcion: "Administración, Informática y Enfermería.",
    hijos: [
      { titulo: "Administración", url: "/carreras/administracion" },
      { titulo: "Informática", url: "/carreras/informatica" },
      { titulo: "Enfermería", url: "/carreras/enfermeria" },
    ],
  },
  {
    titulo: "Admisión",
    url: "/admision",
    descripcion: "Requisitos, proceso de inscripción y preguntas frecuentes.",
    hijos: [
      { titulo: "Requisitos y documentos", url: "/admision#requisitos" },
      { titulo: "Proceso de inscripción", url: "/admision#proceso" },
      { titulo: "Fechas y costos", url: "/admision#fechas" },
      { titulo: "Preguntas frecuentes", url: "/admision#preguntas" },
      { titulo: "Solicitar información", url: "/admision/solicitar-informacion" },
    ],
  },
  {
    titulo: "Noticias",
    url: "/noticias",
    descripcion: "Noticias, eventos, avisos y galería de fotos.",
    hijos: [
      { titulo: "Noticias", url: "/noticias" },
      { titulo: "Eventos y calendario", url: "/eventos" },
      { titulo: "Avisos", url: "/noticias#avisos" },
      { titulo: "Galería de fotos", url: "/galeria" },
    ],
  },
  {
    titulo: "Normativa",
    url: "/normativa",
    descripcion: "Reglamentos, documentos legales y formatos descargables.",
    hijos: [
      { titulo: "Reglamentos", url: "/normativa/reglamentos" },
      { titulo: "Documentos legales", url: "/normativa/documentos-legales" },
      { titulo: "Formatos descargables", url: "/normativa/formatos" },
    ],
  },
  {
    titulo: "Contacto",
    url: "/contacto",
    descripcion: "Formulario, ubicación, horarios y teléfonos.",
    hijos: [
      { titulo: "Formulario de contacto", url: "/contacto#formulario" },
      { titulo: "Ubicación y mapa", url: "/contacto#ubicacion" },
      { titulo: "Horarios y teléfonos", url: "/contacto#horarios" },
    ],
  },
];

/** Sección del menú a la que pertenece una ruta (para marcarla como activa). */
export function seccionDe(ruta: string): Seccion | undefined {
  if (ruta.startsWith("/eventos") || ruta.startsWith("/galeria")) {
    return MENU.find((s) => s.url === "/noticias");
  }
  return MENU.find((s) => ruta === s.url || ruta.startsWith(`${s.url}/`));
}

export const ACCESOS_SISTEMAS: Enlace[] = [
  { titulo: "Control de estudios", url: "/control-de-estudios" },
  { titulo: "Aula virtual", url: "/aula-virtual" },
];
