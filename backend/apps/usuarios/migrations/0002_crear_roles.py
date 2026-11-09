"""Crea los grupos que representan los roles de la plataforma.

Los nombres se copian aquí (y no se importan de roles.py) para que la migración
siga funcionando igual aunque ese archivo cambie en el futuro.
"""

from django.db import migrations

ROLES = ("Estudiante", "Docente", "Administrativo")


def crear_roles(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    for nombre in ROLES:
        Group.objects.get_or_create(name=nombre)


def eliminar_roles(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name__in=ROLES).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("usuarios", "0001_initial"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [migrations.RunPython(crear_roles, eliminar_roles)]
