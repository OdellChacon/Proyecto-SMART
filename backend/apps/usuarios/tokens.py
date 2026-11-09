"""Enlaces firmados de un solo uso para verificar el correo y restablecer la contraseña.

Usan el generador de Django (HMAC con SECRET_KEY y caducidad PASSWORD_RESET_TIMEOUT):
no se guarda nada en la base de datos y el enlace deja de servir en cuanto cambia
el estado que lo originó (correo ya verificado o contraseña ya cambiada).
"""

from django.contrib.auth.tokens import PasswordResetTokenGenerator, default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from .models import Usuario


class VerificacionCorreoTokenGenerator(PasswordResetTokenGenerator):
    key_salt = "apps.usuarios.tokens.VerificacionCorreo"

    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{user.email}{user.correo_verificado}{timestamp}"


verificacion_correo = VerificacionCorreoTokenGenerator()
restablecer_contrasena = default_token_generator


def uid_de(usuario: Usuario) -> str:
    return urlsafe_base64_encode(force_bytes(usuario.pk))


def usuario_desde_uid(uid: str) -> Usuario | None:
    try:
        pk = force_str(urlsafe_base64_decode(uid))
        return Usuario.objects.get(pk=pk)
    except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
        return None
