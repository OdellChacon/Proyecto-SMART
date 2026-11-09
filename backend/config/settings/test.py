from .base import *  # noqa: F403

DEBUG = False
SECRET_KEY = "clave-solo-para-pruebas"  # noqa: S105
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]  # pruebas rápidas
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

# Formularios: destinatario fijo y sin antispam.
CORREOS_AVISO_FORMULARIOS = ["admision@prueba.test"]
TURNSTILE_SECRET_KEY = ""
