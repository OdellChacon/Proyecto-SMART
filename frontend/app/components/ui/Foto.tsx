import type { ImgHTMLAttributes } from "react";

import type { Imagen } from "~/lib/tipos";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "alt"> {
  imagen: Imagen;
  /** Texto alternativo. Vacío si la foto es decorativa (el texto ya la describe). */
  alt: string;
  /** Ancho que ocupa en pantalla, para que el navegador elija la medida justa. */
  sizes: string;
  /** La foto principal de la página se carga de inmediato; el resto, al acercarse. */
  prioritaria?: boolean;
}

/**
 * Foto con las tres medidas WebP que genera el backend. En un teléfono con 4G lento
 * se descarga la miniatura en lugar de la foto grande (requisito de rendimiento).
 */
export function Foto({ imagen, alt, sizes, prioritaria, className, ...resto }: Props) {
  const srcSet = [
    `${imagen.miniatura} 480w`,
    `${imagen.mediana} 960w`,
    `${imagen.grande} 1600w`,
  ].join(", ");
  return (
    <img
      src={imagen.mediana}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={imagen.ancho ?? undefined}
      height={imagen.alto ?? undefined}
      loading={prioritaria ? "eager" : "lazy"}
      fetchPriority={prioritaria ? "high" : undefined}
      decoding="async"
      className={className}
      {...resto}
    />
  );
}
