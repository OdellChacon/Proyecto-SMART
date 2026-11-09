"""Configuración común a todos los entornos.

Todo valor que cambia entre entornos o es secreto se lee de variables de entorno
(archivo .env en la raíz del monorepo en desarrollo).
"""

from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
REPO_DIR = BASE_DIR.parent

env = environ.Env()
environ.Env.read_env(REPO_DIR / ".env", overwrite=False)

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5180").rstrip("/")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",  # búsqueda sin acentos (unaccent)
    # Terceros
    "rest_framework",
    "drf_spectacular",
    "axes",
    # Propias
    "apps.usuarios",
    "apps.contenido",
    "apps.formularios",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Debe ir al final: bloquea tras varios intentos fallidos de ingreso.
    "axes.middleware.AxesMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB"),
        "USER": env("POSTGRES_USER"),
        "PASSWORD": env("POSTGRES_PASSWORD"),
        "HOST": env("POSTGRES_HOST", default="127.0.0.1"),
        "PORT": env("POSTGRES_PORT", default="5435"),
        "CONN_MAX_AGE": 60,
        # Descarta conexiones caídas (reinicio de la base o conexión inestable).
        "CONN_HEALTH_CHECKS": True,
    }
}
# En Render la base llega como una sola variable DATABASE_URL.
if env("DATABASE_URL", default=""):
    DATABASES["default"] = {
        **env.db("DATABASE_URL"), "CONN_MAX_AGE": 60, "CONN_HEALTH_CHECKS": True,
    }

# --- Usuarios y autenticación ---
AUTH_USER_MODEL = "usuarios.Usuario"

AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 10},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Validez de los enlaces de verificación de correo y de restablecimiento (segundos).
PASSWORD_RESET_TIMEOUT = 60 * 60 * 24  # 24 horas

# Bloqueo por intentos fallidos (requisito no funcional de seguridad).
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=15)
AXES_LOCKOUT_PARAMETERS = [["username", "ip_address"]]
AXES_USERNAME_FORM_FIELD = "email"
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_CALLABLE = "apps.usuarios.api.errores.respuesta_bloqueo"

# Sesión por cookie httpOnly: el frontend nunca ve ni guarda tokens.
SESSION_COOKIE_AGE = 60 * 60 * 24 * 14  # 14 días si marca "Mantener sesión"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
# El frontend necesita leer la cookie CSRF para enviarla en la cabecera X-CSRFToken.
CSRF_COOKIE_HTTPONLY = False
# Responde en JSON (formato de la API) cuando falla la verificación CSRF.
CSRF_FAILURE_VIEW = "apps.usuarios.api.errores.fallo_csrf"

# --- API ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.usuarios.api.errores.manejador_de_errores",
    # Solo actúa en las vistas que declaran throttle_scope.
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.ScopedRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        "ingreso": "10/min",
        "registro": "5/hour",
        "correo": "5/hour",
        "formularios": "10/hour",
    },
    # Proxies delante de Django: necesario para que el límite por IP use la IP real.
    "NUM_PROXIES": env.int("DJANGO_NUM_PROXIES", default=0),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "API · Plataforma universitaria",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# --- Correo ---
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="127.0.0.1")
EMAIL_PORT = env.int("EMAIL_PORT", default=1026)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_TIMEOUT = 10
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="no-responder@localhost")
NOMBRE_INSTITUCION = env("NOMBRE_INSTITUCION", default="Nombre de la Universidad")
# Quién recibe el aviso de cada formulario del sitio (contacto y solicitud de información).
CORREOS_AVISO_FORMULARIOS = env.list("CORREOS_AVISO_FORMULARIOS", default=[])

# --- Antispam (Cloudflare Turnstile). Sin clave secreta, no se verifica. ---
TURNSTILE_SECRET_KEY = env("TURNSTILE_SECRET_KEY", default="")

# --- Internacionalización ---
LANGUAGE_CODE = "es-ve"
TIME_ZONE = "America/Caracas"
USE_I18N = True
USE_TZ = True


STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# Archivos que sube el personal (PDF, fotos). En producción: R2 o S3.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
# PDF de pensum y reglamentos pueden pesar varios MB.
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {
        "apps": {"handlers": ["console"], "level": "INFO"},
    },
}
