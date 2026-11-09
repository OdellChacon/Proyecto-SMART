"""Cuentas de demostración del panel, para presentar el flujo de publicación y capacitar.

    python manage.py crear_usuarios_demo

Crea (o actualiza) tres cuentas con la clave de DEMO_CLAVE_PANEL (variable de entorno,
nunca en el repositorio):

    admin@ejemplo.test       administrador técnico (superusuario)
    aprobador@ejemplo.test   Aprobador de contenido
    editor@ejemplo.test      Editor de contenido

Solo para desarrollo y demostraciones: se niega a correr con DEBUG desactivado.
"""

from django.conf import settings
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError

from apps.contenido import flujo
from apps.usuarios.models import Usuario

CUENTAS = [
    ("admin@ejemplo.test", "Administración", "Técnica", None, True),
    ("aprobador@ejemplo.test", "Aprobadora", "De Prueba", flujo.GRUPO_APROBADOR, False),
    ("editor@ejemplo.test", "Editor", "De Prueba", flujo.GRUPO_EDITOR, False),
]


class Command(BaseCommand):
    help = "Crea las cuentas de demostración del panel (solo desarrollo)."

    def handle(self, *args, **opciones):
        if not settings.DEBUG:
            raise CommandError("Solo se puede usar en desarrollo (DEBUG activado).")
        clave = getattr(settings, "DEMO_CLAVE_PANEL", "")
        if len(clave) < 12:
            raise CommandError("Define DEMO_CLAVE_PANEL en .env (al menos 12 caracteres).")

        for email, nombres, apellidos, grupo, superusuario in CUENTAS:
            u, _ = Usuario.objects.get_or_create(email=email, defaults={
                "nombres": nombres, "apellidos": apellidos,
            })
            u.is_staff = True
            u.is_superuser = superusuario
            u.correo_verificado = True
            u.set_password(clave)
            u.save()
            if grupo:
                u.groups.add(Group.objects.get(name=grupo))
            self.stdout.write(f"  {email}" + (f" · {grupo}" if grupo else " · superusuario"))
        self.stdout.write(self.style.SUCCESS("Cuentas listas. La clave es DEMO_CLAVE_PANEL."))
