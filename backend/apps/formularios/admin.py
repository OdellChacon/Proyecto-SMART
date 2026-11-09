from django.contrib import admin

from .models import MensajeContacto, SolicitudInformacion


@admin.action(description="Marcar como atendidos")
def marcar_atendidos(modeladmin, request, queryset):
    campo = "atendida" if queryset.model is SolicitudInformacion else "atendido"
    queryset.update(**{campo: True})


class SoloLectura(admin.ModelAdmin):
    """Lo que envió el visitante no se edita; solo se marca como atendido."""

    actions = [marcar_atendidos]

    def has_add_permission(self, request):
        return False

    def get_readonly_fields(self, request, obj=None):
        editables = {"atendida", "atendido"}
        return [f.name for f in self.model._meta.fields if f.name not in editables]


@admin.register(SolicitudInformacion)
class SolicitudInformacionAdmin(SoloLectura):
    list_display = ["nombre", "correo", "telefono", "carrera", "creada_en", "atendida"]
    list_filter = ["atendida", "carrera"]
    search_fields = ["nombre", "correo"]


@admin.register(MensajeContacto)
class MensajeContactoAdmin(SoloLectura):
    list_display = ["nombre", "correo", "asunto", "creado_en", "atendido"]
    list_filter = ["atendido"]
    search_fields = ["nombre", "correo", "asunto"]
