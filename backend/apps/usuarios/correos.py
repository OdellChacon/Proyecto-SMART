"""Correos transaccionales de la cuenta.

Si el servidor de correo falla, se registra el error y no se rompe la petición:
la persona puede pedir que se reenvíe el enlace.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from . import tokens
from .models import Usuario

log = logging.getLogger("apps.usuarios")


def _enviar(usuario: Usuario, asunto: str, plantilla: str, contexto: dict) -> bool:
    contexto = {
        "usuario": usuario,
        "institucion": settings.NOMBRE_INSTITUCION,
        "sitio": settings.FRONTEND_URL,
        **contexto,
    }
    texto = render_to_string(f"correos/{plantilla}.txt", contexto)
    html = render_to_string(f"correos/{plantilla}.html", contexto)
    mensaje = EmailMultiAlternatives(
        subject=f"{asunto} · {settings.NOMBRE_INSTITUCION}",
        body=texto,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[usuario.email],
    )
    mensaje.attach_alternative(html, "text/html")
    try:
        mensaje.send(fail_silently=False)
        return True
    except Exception:  # noqa: BLE001 — cualquier fallo de SMTP se registra y se informa aparte
        log.exception("No se pudo enviar el correo '%s' a usuario %s", plantilla, usuario.pk)
        return False


def enviar_verificacion(usuario: Usuario) -> bool:
    enlace = (
        f"{settings.FRONTEND_URL}/verificar-correo/"
        f"{tokens.uid_de(usuario)}/{tokens.verificacion_correo.make_token(usuario)}"
    )
    return _enviar(usuario, "Confirma tu correo", "verificar_correo", {"enlace": enlace})


def enviar_restablecimiento(usuario: Usuario) -> bool:
    enlace = (
        f"{settings.FRONTEND_URL}/restablecer-contrasena/"
        f"{tokens.uid_de(usuario)}/{tokens.restablecer_contrasena.make_token(usuario)}"
    )
    return _enviar(
        usuario, "Restablece tu contraseña", "restablecer_contrasena", {"enlace": enlace}
    )


def enviar_aviso_cuenta_existente(usuario: Usuario) -> bool:
    """Alguien intentó registrarse con un correo que ya tiene cuenta.

    En lugar de decirlo en pantalla (eso revelaría qué correos están registrados),
    se avisa por correo al dueño de la cuenta.
    """
    enlace = f"{settings.FRONTEND_URL}/recuperar-contrasena"
    return _enviar(usuario, "Ya tienes una cuenta", "cuenta_existente", {"enlace": enlace})
