from .base import *  # noqa: F403
from .base import env

DEBUG = True

# runserver abre un hilo por petición: con conexiones persistentes cada hilo deja la suya
# abierta y PostgreSQL se queda sin cupos («too many clients»). En producción (gunicorn) sí
# conviene reutilizarlas.
DATABASES["default"]["CONN_MAX_AGE"] = 0  # noqa: F405

# Cuentas de demostración del panel (crear_usuarios_demo).
DEMO_CLAVE_PANEL = env("DEMO_CLAVE_PANEL", default="")
