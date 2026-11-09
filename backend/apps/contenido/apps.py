from django.apps import AppConfig
from django.db.models.signals import post_migrate


class ContenidoConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.contenido"
    verbose_name = "Contenido del sitio"

    def ready(self):
        from . import signals
        from .flujo import asegurar_grupos

        signals.conectar()

        # Los permisos se crean después de migrar; recién ahí se pueden asignar a los grupos.
        post_migrate.connect(asegurar_grupos, sender=self, dispatch_uid="contenido_grupos")
