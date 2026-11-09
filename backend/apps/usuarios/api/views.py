"""Endpoints de cuenta: registro, verificación de correo, ingreso, salida y contraseña.

Autenticación por sesión de Django (cookie httpOnly) con protección CSRF en
todas las escrituras, incluidas las de visitantes anónimos (login CSRF).
Las respuestas de recuperación y reenvío son siempre iguales para no revelar
qué correos están registrados.
"""

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Group
from django.db import connection, transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from .. import correos, roles, tokens
from ..models import Usuario
from . import serializers as s
from .errores import ErrorDeApi, respuesta, respuesta_bloqueo

MSG_ENLACE_INVALIDO = "El enlace no es válido o ya venció. Pide uno nuevo."


@method_decorator(csrf_protect, name="dispatch")
class VistaPublica(APIView):
    """Endpoint abierto a visitantes, pero protegido contra CSRF."""

    permission_classes = [AllowAny]


class SaludView(APIView):
    """Comprobación para el monitoreo de disponibilidad."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(responses={200: dict})
    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return respuesta("Servicio disponible.", "ok")


@method_decorator(ensure_csrf_cookie, name="dispatch")
class SesionView(APIView):
    """Estado de la sesión actual. También entrega la cookie CSRF al frontend."""

    permission_classes = [AllowAny]

    @extend_schema(responses={200: dict})
    def get(self, request):
        usuario = request.user if request.user.is_authenticated else None
        return respuesta(
            "Sesión activa." if usuario else "Sin sesión.",
            "ok",
            autenticado=bool(usuario),
            usuario=s.UsuarioSerializer(usuario).data if usuario else None,
        )


class RegistroView(VistaPublica):
    throttle_scope = "registro"

    @extend_schema(request=s.RegistroSerializer, responses={201: dict})
    def post(self, request):
        ser = s.RegistroSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        datos = ser.validated_data

        existente = Usuario.objects.filter(email__iexact=datos["email"]).first()
        if existente:
            correos.enviar_aviso_cuenta_existente(existente)
        else:
            with transaction.atomic():
                usuario = Usuario.objects.create_user(
                    email=datos["email"],
                    password=datos["password"],
                    nombres=datos["nombres"],
                    apellidos=datos["apellidos"],
                )
                grupo, _ = Group.objects.get_or_create(name=roles.ROL_POR_DEFECTO)
                usuario.groups.add(grupo)
            correos.enviar_verificacion(usuario)

        # Misma respuesta exista o no la cuenta.
        return respuesta(
            "Te enviamos un correo para confirmar tu cuenta. Revisa también la carpeta de spam.",
            "verificacion_enviada",
            http=status.HTTP_201_CREATED,
            email=datos["email"],
        )


class VerificarCorreoView(VistaPublica):
    @extend_schema(request=s.EnlaceSerializer, responses={200: dict})
    def post(self, request):
        ser = s.EnlaceSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        usuario = tokens.usuario_desde_uid(ser.validated_data["uid"])
        if usuario and usuario.correo_verificado:
            return respuesta("Tu correo ya estaba confirmado. Ya puedes ingresar.", "ya_verificado")
        if not usuario or not tokens.verificacion_correo.check_token(
            usuario, ser.validated_data["token"]
        ):
            raise ErrorDeApi(MSG_ENLACE_INVALIDO, "enlace_invalido")
        usuario.marcar_correo_verificado()
        return respuesta("¡Listo! Confirmamos tu correo. Ya puedes ingresar.", "verificado")


class ReenviarVerificacionView(VistaPublica):
    throttle_scope = "correo"

    @extend_schema(request=s.CorreoSerializer, responses={200: dict})
    def post(self, request):
        ser = s.CorreoSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        usuario = Usuario.objects.filter(
            email__iexact=ser.validated_data["email"], is_active=True, correo_verificado=False
        ).first()
        if usuario:
            correos.enviar_verificacion(usuario)
        return respuesta(
            "Si hay una cuenta pendiente con ese correo, te enviamos un enlace nuevo.",
            "verificacion_enviada",
        )


class IngresoView(VistaPublica):
    throttle_scope = "ingreso"

    @extend_schema(request=s.IngresoSerializer, responses={200: dict})
    def post(self, request):
        ser = s.IngresoSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        datos = ser.validated_data
        django_request = request._request  # django-axes necesita la petición original

        usuario = authenticate(django_request, email=datos["email"], password=datos["password"])
        if usuario is None:
            if getattr(django_request, "axes_locked_out", False):
                return respuesta_bloqueo(django_request)
            raise ErrorDeApi("Correo o contraseña incorrectos.", "credenciales_invalidas")
        if not usuario.correo_verificado:
            raise ErrorDeApi(
                "Antes de ingresar, confirma tu correo con el enlace que te enviamos.",
                "correo_no_verificado",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        login(django_request, usuario)
        if not datos["recordar"]:
            django_request.session.set_expiry(0)  # se cierra al cerrar el navegador
        return respuesta(
            f"Hola, {usuario.nombres}.", "ingreso", usuario=s.UsuarioSerializer(usuario).data
        )


class SalidaView(VistaPublica):
    @extend_schema(request=None, responses={200: dict})
    def post(self, request):
        logout(request._request)
        return respuesta("Cerraste tu sesión.", "salida")


class RecuperarContrasenaView(VistaPublica):
    throttle_scope = "correo"

    @extend_schema(request=s.CorreoSerializer, responses={200: dict})
    def post(self, request):
        ser = s.CorreoSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        usuario = Usuario.objects.filter(
            email__iexact=ser.validated_data["email"], is_active=True
        ).first()
        if usuario and usuario.has_usable_password():
            correos.enviar_restablecimiento(usuario)
        return respuesta(
            "Si el correo está registrado, te enviamos un enlace para crear una contraseña nueva.",
            "recuperacion_enviada",
        )


class ValidarEnlaceRestablecerView(VistaPublica):
    """Permite al frontend avisar de un enlace vencido antes de pedir la contraseña."""

    @extend_schema(request=s.EnlaceSerializer, responses={200: dict})
    def post(self, request):
        ser = s.EnlaceSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        usuario = tokens.usuario_desde_uid(ser.validated_data["uid"])
        if not usuario or not tokens.restablecer_contrasena.check_token(
            usuario, ser.validated_data["token"]
        ):
            raise ErrorDeApi(MSG_ENLACE_INVALIDO, "enlace_invalido")
        return respuesta("Enlace válido.", "enlace_valido", email=usuario.email)


class RestablecerContrasenaView(VistaPublica):
    @extend_schema(request=s.RestablecerSerializer, responses={200: dict})
    def post(self, request):
        ser = s.RestablecerSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        usuario = tokens.usuario_desde_uid(ser.validated_data["uid"])
        if not usuario or not tokens.restablecer_contrasena.check_token(
            usuario, ser.validated_data["token"]
        ):
            raise ErrorDeApi(MSG_ENLACE_INVALIDO, "enlace_invalido")
        ser.validar_para(usuario)
        usuario.set_password(ser.validated_data["password"])
        # Quien abrió el enlace demostró que controla el correo.
        if not usuario.correo_verificado:
            usuario.marcar_correo_verificado()
        usuario.save(update_fields=["password"])
        return respuesta("Tu contraseña cambió. Ya puedes ingresar con la nueva.", "restablecida")
