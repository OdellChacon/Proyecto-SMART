"""Formato único de errores para toda la API.

Toda respuesta de error tiene la misma forma, para que el frontend la maneje
en un solo lugar:

    {"detail": "Mensaje para la persona", "codigo": "identificador", "errores": {"campo": ["..."]}}
"""

import math

from django.http import JsonResponse
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler


class ErrorDeApi(exceptions.APIException):
    """Error con código propio, para que el frontend reaccione a casos concretos."""

    def __init__(self, detail, codigo, status_code=status.HTTP_400_BAD_REQUEST):
        self.status_code = status_code
        self.codigo = codigo
        super().__init__(detail=detail, code=codigo)


def _cuerpo(detail, codigo, errores=None):
    return {"detail": detail, "codigo": codigo, "errores": errores or {}}


def manejador_de_errores(exc, context):
    respuesta = exception_handler(exc, context)
    if respuesta is None:
        return None  # error no controlado: Django responde 500 y queda en el log

    if isinstance(exc, ErrorDeApi):
        respuesta.data = _cuerpo(str(exc.detail), exc.codigo)
    elif isinstance(exc, exceptions.ValidationError):
        datos = exc.detail if isinstance(exc.detail, dict) else {"non_field_errors": exc.detail}
        errores = {campo: [str(m) for m in (msgs if isinstance(msgs, list) else [msgs])]
                   for campo, msgs in datos.items()}
        generales = errores.pop("non_field_errors", None)
        detalle = generales[0] if generales else "Revisa los campos marcados."
        respuesta.data = _cuerpo(detalle, "validacion", errores)
    elif isinstance(exc, exceptions.Throttled):
        minutos = max(1, math.ceil((exc.wait or 60) / 60))
        respuesta.data = _cuerpo(
            f"Hiciste demasiados intentos. Espera {minutos} minuto{'s' if minutos > 1 else ''} "
            "y vuelve a probar.",
            "demasiados_intentos",
        )
    elif isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
        respuesta.data = _cuerpo("Necesitas ingresar para continuar.", "no_autenticado")
    elif isinstance(exc, exceptions.PermissionDenied):
        detalle = str(exc.detail)
        if "CSRF" in detalle:
            detalle = "La página caducó. Recárgala y vuelve a intentarlo."
            respuesta.data = _cuerpo(detalle, "csrf")
        else:
            respuesta.data = _cuerpo("No tienes permiso para hacer esto.", "sin_permiso")
    else:
        respuesta.data = _cuerpo(str(getattr(exc, "detail", "Ocurrió un error.")), "error")
    return respuesta


def respuesta_bloqueo(request, *args, **kwargs):
    """Respuesta de django-axes cuando una cuenta queda bloqueada por intentos fallidos."""
    return JsonResponse(
        _cuerpo(
            "Por seguridad bloqueamos el ingreso durante 15 minutos tras varios intentos "
            "fallidos. Si olvidaste tu contraseña, puedes recuperarla.",
            "cuenta_bloqueada",
        ),
        status=status.HTTP_429_TOO_MANY_REQUESTS,
    )


def fallo_csrf(request, reason=""):
    """Vista de Django para CSRF_FAILURE_VIEW: misma forma que el resto de errores."""
    return JsonResponse(
        _cuerpo("La página caducó. Recárgala y vuelve a intentarlo.", "csrf"),
        status=status.HTTP_403_FORBIDDEN,
    )


def respuesta(detail, codigo="ok", http=status.HTTP_200_OK, **extra):
    return Response({"detail": detail, "codigo": codigo, **extra}, status=http)
