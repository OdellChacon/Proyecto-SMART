import re

import pytest
from django.core import mail
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.usuarios import roles
from apps.usuarios.models import Usuario

CLAVE = "Clave-Segura-2026"


@pytest.fixture(autouse=True)
def _limpiar_cache():
    # Los límites por IP viven en caché: cada prueba empieza de cero.
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def datos_registro():
    return {
        "nombres": "María",
        "apellidos": "Pérez",
        "email": "Maria.Perez@Correo.com",
        "password": CLAVE,
        "password_confirmacion": CLAVE,
        "acepta_privacidad": True,
    }


@pytest.fixture
def usuario_verificado(db):
    u = Usuario.objects.create_user(
        email="ana@correo.com", password=CLAVE, nombres="Ana", apellidos="Gómez",
        correo_verificado=True,
    )
    from django.contrib.auth.models import Group

    u.groups.add(Group.objects.get(name=roles.ESTUDIANTE))
    return u


def enlace_del_correo(ruta: str):
    """Devuelve (uid, token) del último correo que contenga la ruta indicada."""
    for mensaje in reversed(mail.outbox):
        m = re.search(rf"/{ruta}/([^/\s]+)/([^/\s]+)", mensaje.body)
        if m:
            return m.group(1), m.group(2)
    raise AssertionError(f"No hay ningún correo con /{ruta}/")
