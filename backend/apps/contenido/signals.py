"""Genera las medidas de cada foto al guardarla en el panel.

Así la primera persona que visita la página no espera a que se generen (con muchas
fotos nuevas, eso podía superar el tiempo de espera del servidor web).
"""

import logging

from django.db.models import ImageField
from django.db.models.signals import post_save

from . import imagenes
from . import models as m

log = logging.getLogger("apps.contenido")

CON_FOTOS = [m.DatosGenerales, m.Carrera, m.Noticia, m.Autoridad, m.Foto, m.FotoSeccion]


def preparar_variantes(sender, instance, **kwargs):
    for campo in sender._meta.fields:
        if isinstance(campo, ImageField):
            archivo = getattr(instance, campo.name)
            if archivo:
                imagenes.variantes(archivo)  # crea y guarda las medidas que falten


def conectar():
    for modelo in CON_FOTOS:
        post_save.connect(
            preparar_variantes, sender=modelo, dispatch_uid=f"variantes-{modelo.__name__}"
        )
