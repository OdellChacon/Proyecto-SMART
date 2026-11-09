"""Antispam con Cloudflare Turnstile (sin captchas molestos).

Sin TURNSTILE_SECRET_KEY (desarrollo y pruebas) la verificación se omite.
"""

import json
import logging
import urllib.parse
import urllib.request

from django.conf import settings

log = logging.getLogger("apps.formularios")
URL_VERIFICACION = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def activo() -> bool:
    return bool(settings.TURNSTILE_SECRET_KEY)


def verificar(token: str, ip: str | None) -> bool:
    if not activo():
        return True
    if not token:
        return False
    datos = {"secret": settings.TURNSTILE_SECRET_KEY, "response": token}
    if ip:
        datos["remoteip"] = ip
    peticion = urllib.request.Request(
        URL_VERIFICACION, data=urllib.parse.urlencode(datos).encode(), method="POST"
    )
    try:
        with urllib.request.urlopen(peticion, timeout=5) as r:  # noqa: S310 — URL fija
            return bool(json.load(r).get("success"))
    except Exception:  # noqa: BLE001
        # Si Cloudflare no responde, se rechaza el envío y la persona puede reintentar.
        log.exception("No se pudo verificar Turnstile")
        return False
