from django import template
from django.urls import reverse

from .. import flujo
from .. import models as m
from ..models import Estado

register = template.Library()

CON_FLUJO = [m.Noticia, m.Evento, m.Aviso, m.Documento]


@register.simple_tag
def resumen_flujo(usuario):
    """Para el inicio del panel: qué espera revisión y qué le devolvieron a esta persona."""
    if not usuario.is_authenticated or not usuario.is_staff:
        return None
    aprobador = flujo.es_aprobador(usuario)
    filas = []
    for modelo in CON_FLUJO:
        meta = modelo._meta
        url = reverse(f"admin:{meta.app_label}_{meta.model_name}_changelist")
        pendientes = modelo.objects.filter(estado=Estado.REVISION).count() if aprobador else 0
        devueltos = modelo.objects.filter(estado=Estado.DEVUELTA, creado_por=usuario).count()
        if pendientes or devueltos:
            filas.append({
                "tipo": meta.verbose_name_plural.capitalize(),
                "pendientes": pendientes,
                "url_pendientes": f"{url}?estado__exact={Estado.REVISION}",
                "devueltos": devueltos,
                "url_devueltos": f"{url}?estado__exact={Estado.DEVUELTA}",
            })
    return {"aprobador": aprobador, "filas": filas}
