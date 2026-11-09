"""Imágenes en varias medidas (miniatura, mediana, grande) y en WebP.

Requisito del documento: «imágenes con varias medidas» y «WebP o AVIF con tamaños
adaptados». El personal sube una sola foto; aquí se generan las variantes la primera
vez que alguien las pide y quedan guardadas junto al original (en el disco local o en
R2/S3, según el almacenamiento configurado).
"""

import io
import logging
from pathlib import PurePosixPath

from django.core.cache import cache
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image, ImageOps

log = logging.getLogger("apps.contenido")

MEDIDAS = {"miniatura": 480, "mediana": 960, "grande": 1600}
CALIDAD_WEBP = 78


def _ruta_variante(nombre: str, ancho: int) -> str:
    ruta = PurePosixPath(nombre)
    return str(PurePosixPath("variantes") / ruta.parent / f"{ruta.stem}-{ancho}.webp")


def _generar(nombre: str) -> dict:
    """Crea las variantes que falten y devuelve rutas y medidas del original."""
    with default_storage.open(nombre, "rb") as f:
        original = ImageOps.exif_transpose(Image.open(f))
        original.load()
    if original.mode not in ("RGB", "RGBA"):
        original = original.convert("RGBA" if "A" in original.getbands() else "RGB")
    ancho, alto = original.size

    rutas = {}
    for medida, maximo in MEDIDAS.items():
        destino = _ruta_variante(nombre, maximo)
        if not default_storage.exists(destino):
            copia = original.copy()
            copia.thumbnail((maximo, maximo * 4))  # nunca se agranda
            salida = io.BytesIO()
            copia.save(salida, "WEBP", quality=CALIDAD_WEBP, method=6)
            default_storage.save(destino, ContentFile(salida.getvalue()))
        rutas[medida] = destino
    return {"rutas": rutas, "ancho": ancho, "alto": alto}


def variantes(campo) -> dict | None:
    """Datos de una imagen para la API: URL del original, de cada medida y proporciones.

    {"url": ..., "miniatura": ..., "mediana": ..., "grande": ..., "ancho": 1600, "alto": 1067}
    """
    if not campo:
        return None
    clave = f"imagen-variantes:{campo.name}"
    datos = cache.get(clave)
    if datos is None:
        try:
            datos = _generar(campo.name)
        except Exception:  # noqa: BLE001 — una imagen dañada no debe romper la página
            log.exception("No se pudieron generar las variantes de %s", campo.name)
            return {"url": campo.url, **dict.fromkeys(MEDIDAS, campo.url), "ancho": None,
                    "alto": None}
        cache.set(clave, datos, 60 * 60 * 24)
    return {
        "url": campo.url,
        **{m: default_storage.url(r) for m, r in datos["rutas"].items()},
        "ancho": datos["ancho"],
        "alto": datos["alto"],
    }
