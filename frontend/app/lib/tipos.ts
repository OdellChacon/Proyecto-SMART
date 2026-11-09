/** Tipos de la API pública del sitio (/api/v1/). */

/** Imagen con sus medidas en WebP (las genera el backend). */
export interface Imagen {
  url: string;
  miniatura: string;
  mediana: string;
  grande: string;
  ancho: number | null;
  alto: number | null;
}

export type ClaveSeccion =
  | "universidad"
  | "carreras"
  | "admision"
  | "noticias"
  | "normativa"
  | "contacto"
  | "buscar";

export interface Red {
  red: string;
  nombre: string;
  url: string;
}

export interface Valor {
  nombre: string;
  descripcion: string;
}

export interface Sitio {
  nombre: string;
  siglas: string;
  lema: string;
  frase_portada: string;
  es_demostracion: boolean;
  foto_portada: Imagen | null;
  foto_portada_descripcion: string;
  /** Datos grandes de la portada («3 · carreras»). Solo datos reales. */
  cifras: { valor: string; etiqueta: string }[];
  /** Foto de cabecera de cada sección, por clave (universidad, carreras, admision…). */
  fotos_seccion: Partial<Record<ClaveSeccion, { imagen: Imagen; descripcion: string }>>;
  /** Fotos de los álbumes publicados, para las bandas de fotos de las páginas interiores. */
  fotos_banda: Foto[];
  direccion: string;
  telefonos: string[];
  correos: string[];
  horario: string[];
  mapa_enlace: string;
  mapa_insertado: string;
  perfil_redes: Red[];
  historia: string;
  mision: string;
  vision: string;
  valores: Valor[];
  sede: string;
  organigrama: string | null;
  organigrama_descripcion: string[];
  datos_legales: string[];
  aviso_privacidad: string;
  actualizado_en: string;
}

export interface CarreraTarjeta {
  nombre: string;
  slug: string;
  titulo_otorgado: string;
  duracion: string;
  modalidad: string;
  turno: string;
  resumen: string;
  imagen: Imagen | null;
  imagen_descripcion: string;
}

export interface Asignatura {
  codigo: string;
  nombre: string;
  unidades_credito: number;
}

export interface Semestre {
  semestre: number;
  asignaturas: Asignatura[];
  total_uc: number;
}

export interface Carrera extends CarreraTarjeta {
  presentacion: string;
  perfil_egresado: string[];
  campo_laboral: string[];
  propio_titulo: string;
  propio: string;
  pensum_pdf: string | null;
  pensum_es_ejemplo: boolean;
  pensum: Semestre[];
  /** Fotos del álbum de la carrera. */
  fotos: Foto[];
}

export interface NoticiaTarjeta {
  titulo: string;
  slug: string;
  fecha: string;
  imagen: Imagen | null;
  imagen_descripcion: string;
  resumen: string;
}

export interface Noticia extends NoticiaTarjeta {
  cuerpo: string;
  actualizada_en: string;
}

export interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Evento {
  id: number;
  nombre: string;
  inicio: string;
  fin: string | null;
  lugar: string;
  descripcion: string;
}

export interface Aviso {
  id: number;
  texto: string;
  enlace: string;
  vence_en: string;
  /** Días que faltan para que venza (0 = hoy es el último día). */
  dias_restantes: number;
}

export interface Autoridad {
  id: number;
  nombre: string;
  cargo: string;
  foto: Imagen | null;
  resena: string;
}

export interface CategoriaDocumento {
  nombre: string;
  slug: string;
  descripcion: string;
  total: number;
}

export interface Documento {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  publicado_en: string;
  archivo: string | null;
  formato: string | null;
  tamano: number | null;
}

export interface Foto {
  id: number;
  imagen: Imagen;
  descripcion: string;
}

export interface AlbumTarjeta {
  id: number;
  titulo: string;
  fecha: string;
  descripcion: string;
  portada: Foto | null;
  total_fotos: number;
}

export interface Album extends AlbumTarjeta {
  fotos: Foto[];
}

export interface Admision {
  requisitos: string[];
  pasos: { titulo: string; descripcion: string }[];
  preguntas: { pregunta: string; respuesta: string }[];
  fechas: { titulo: string; inicio: string; fin: string | null; descripcion: string }[];
  costos: { concepto: string; monto: string; nota: string }[];
  costos_nota: string;
}

export interface ResultadosBusqueda {
  q: string;
  carreras: CarreraTarjeta[];
  noticias: NoticiaTarjeta[];
  documentos: Documento[];
  paginas: { titulo: string; url: string }[];
}
