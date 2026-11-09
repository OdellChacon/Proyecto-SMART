"""Aviso por correo al personal cuando llega un formulario.

Si el correo falla, el envío queda guardado igual y se ve en el panel.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string

log = logging.getLogger("apps.formularios")


def avisar(asunto: str, plantilla: str, contexto: dict, responder_a: str) -> bool:
    destinatarios = settings.CORREOS_AVISO_FORMULARIOS
    if not destinatarios:
        log.warning("CORREOS_AVISO_FORMULARIOS está vacío: no se envió el aviso '%s'", asunto)
        return False
    cuerpo = render_to_string(
        f"correos/{plantilla}.txt",
        {**contexto, "institucion": settings.NOMBRE_INSTITUCION, "sitio": settings.FRONTEND_URL},
    )
    mensaje = EmailMessage(
        subject=f"{asunto} · {settings.NOMBRE_INSTITUCION}",
        body=cuerpo,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=destinatarios,
        reply_to=[responder_a],  # «Responder» le escribe directo a quien envió el formulario
    )
    try:
        mensaje.send(fail_silently=False)
        return True
    except Exception:  # noqa: BLE001
        log.exception("No se pudo enviar el aviso '%s'", asunto)
        return False
