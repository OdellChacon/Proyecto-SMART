"""Formularios públicos: solicitud de información y contacto.

Cada envío se guarda primero (se ve en el panel aunque falle el correo) y luego
se avisa por correo al personal. Antispam con Turnstile y límite por IP.
"""

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import status

from apps.usuarios.api.errores import ErrorDeApi, respuesta
from apps.usuarios.api.views import VistaPublica

from .. import correos, turnstile
from . import serializers as s


class Formulario(VistaPublica):
    throttle_scope = "formularios"
    serializer_class = None
    asunto = ""
    plantilla = ""
    clave_contexto = ""
    ruta_panel = ""
    mensaje_ok = ""

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        ip = request.META.get("REMOTE_ADDR")
        if not turnstile.verificar(serializer.validated_data.get("turnstile", ""), ip):
            raise ErrorDeApi(
                "No pudimos confirmar que no eres un robot. Recarga la página e inténtalo de "
                "nuevo.", "antispam",
            )
        obj = serializer.save()
        correos.avisar(
            self.asunto, self.plantilla,
            {self.clave_contexto: obj, "panel": f"{settings.FRONTEND_URL}{self.ruta_panel}"},
            responder_a=obj.correo,
        )
        return respuesta(self.mensaje_ok, "enviado", http=status.HTTP_201_CREATED)


class SolicitudInformacionView(Formulario):
    serializer_class = s.SolicitudInformacionSerializer
    asunto = "Nueva solicitud de información"
    plantilla = "aviso_solicitud"
    clave_contexto = "s"
    ruta_panel = "/admin/formularios/solicitudinformacion/"
    mensaje_ok = "Recibimos tu solicitud. Te escribiremos al correo que indicaste."

    @extend_schema(request=s.SolicitudInformacionSerializer, responses={201: dict})
    def post(self, request):
        return super().post(request)


class ContactoView(Formulario):
    serializer_class = s.MensajeContactoSerializer
    asunto = "Nuevo mensaje de contacto"
    plantilla = "aviso_contacto"
    clave_contexto = "m"
    ruta_panel = "/admin/formularios/mensajecontacto/"
    mensaje_ok = "Recibimos tu mensaje. Te responderemos lo antes posible."

    @extend_schema(request=s.MensajeContactoSerializer, responses={201: dict})
    def post(self, request):
        return super().post(request)
