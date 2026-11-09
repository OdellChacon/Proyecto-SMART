from .base import *  # noqa: F403
from .base import env

DEBUG = False

# HTTPS obligatorio y cabeceras de seguridad (verificar con Mozilla Observatory).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

# Si el frontend vive en otro subdominio, compartir la cookie con el dominio padre.
SESSION_COOKIE_DOMAIN = env("DJANGO_COOKIE_DOMAIN", default=None)
CSRF_COOKIE_DOMAIN = env("DJANGO_COOKIE_DOMAIN", default=None)

# Estáticos del panel (/static/) servidos por el propio Django con WhiteNoise.
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405

# Archivos que sube el personal (PDF, fotos): Cloudflare R2 o cualquier S3.
# Sin R2_BUCKET se guardan en el disco (solo sirve si el disco es persistente).
_bucket = env("R2_BUCKET", default="")
STORAGES = {
    "default": (
        {
            "BACKEND": "storages.backends.s3.S3Storage",
            "OPTIONS": {
                "bucket_name": _bucket,
                "endpoint_url": env("R2_ENDPOINT"),  # https://<cuenta>.r2.cloudflarestorage.com
                "access_key": env("R2_ACCESS_KEY_ID"),
                "secret_key": env("R2_SECRET_ACCESS_KEY"),
                "region_name": "auto",
                # Dominio público del bucket (ej.: archivos.universidad.edu.ve): URLs sin firma.
                "custom_domain": env("R2_DOMINIO_PUBLICO", default=None),
                "querystring_auth": False,
                "file_overwrite": False,
                "object_parameters": {"CacheControl": "public, max-age=31536000"},
            },
        }
        if _bucket
        else {"BACKEND": "django.core.files.storage.FileSystemStorage"}
    ),
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
# Sin R2 los archivos viven en un disco persistente (DJANGO_MEDIA_ROOT) y los entrega Django.
SERVIR_MEDIA_DESDE_DISCO = not _bucket

# Caché compartida entre procesos de gunicorn (límites por IP, variantes de imágenes).
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "cache_django",
    }
}

LOGGING["root"] = {"handlers": ["console"], "level": "WARNING"}  # noqa: F405
