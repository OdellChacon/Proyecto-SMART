"""Panel de contenido: pensado para personal no técnico.

Solo se edita contenido. El menú, el diseño y las direcciones de las secciones
no están aquí a propósito, para que nadie rompa el sitio por accidente.
Noticias, eventos, avisos y documentos pasan por el flujo de publicación (flujo.py).
"""

from django import forms
from django.contrib import admin, messages
from django.db import models as dj
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html

from . import flujo
from . import models as m
from .models import Estado

COLOR_ESTADO = {
    Estado.BORRADOR: ("#5B5750", "#EFECE6"),
    Estado.REVISION: ("#8A5A00", "#FDF3E1"),
    Estado.PUBLICADA: ("#1E6B3A", "#E7F3EC"),
    Estado.DEVUELTA: ("#B3261E", "#FBEAE9"),
}


@admin.register(m.DatosGenerales)
class DatosGeneralesAdmin(admin.ModelAdmin):
    # Si escriben «facebook.com/...» sin esquema, se completa con https://.
    formfield_overrides = {dj.URLField: {"assume_scheme": "https"}}
    fieldsets = [
        ("Institución", {"fields": ["nombre", "siglas", "lema", "frase_portada",
                                    "foto_portada", "foto_portada_descripcion", "cifras",
                                    "es_demostracion"]}),
        ("Contacto", {"fields": ["direccion", "telefonos", "correos", "horario",
                                 "mapa_enlace", "mapa_insertado"]}),
        ("Redes sociales", {"fields": ["facebook", "instagram", "x", "youtube", "tiktok"]}),
        ("La Universidad", {"fields": ["historia", "mision", "vision", "valores", "sede",
                                       "organigrama", "organigrama_descripcion",
                                       "datos_legales"]}),
        ("Admisión y privacidad", {"fields": ["requisitos_admision", "publicar_costos",
                                              "costos_nota", "aviso_privacidad"]}),
        ("Flujo de publicación", {
            "description": "Marca los tipos de contenido que un aprobador debe revisar antes "
            "de que aparezcan en el sitio. Sin marcar, los editores publican directamente.",
            "fields": ["aprobar_noticias", "aprobar_eventos", "aprobar_avisos",
                       "aprobar_documentos"],
        }),
    ]

    def has_add_permission(self, request):
        return not m.DatosGenerales.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        # Registro único: se entra directo a editarlo.
        obj = m.DatosGenerales.cargar()
        return redirect(reverse("admin:contenido_datosgenerales_change", args=[obj.pk]))


# --- Flujo de publicación ----------------------------------------------------

@admin.display(description="estado", ordering="estado")
def estado_con_color(obj):
    color, fondo = COLOR_ESTADO[obj.estado]
    return format_html(
        '<span style="padding:2px 10px;border-radius:999px;font-weight:600;color:{};'
        'background:{}">{}</span>', color, fondo, obj.get_estado_display(),
    )


class FlujoAdmin(admin.ModelAdmin):
    """Aplica los permisos y el flujo borrador → revisión → publicado de la sección 11."""

    list_filter = ["estado"]
    actions = ["enviar_a_revision", "aprobar_y_publicar"]
    campos_flujo = ["estado", "comentario_revision", "creado_por", "revisado_por", "revisado_en"]

    def get_fieldsets(self, request, obj=None):
        principales = [c for c in self.get_fields(request, obj) if c not in self.campos_flujo]
        flujo_desc = (
            "Como editor, al guardar cambios en un contenido que necesita aprobación, este "
            "vuelve a revisión y sale del sitio hasta que un aprobador lo publique."
            if not flujo.es_aprobador(request.user) and flujo.requiere_aprobacion(self.model)
            else ""
        )
        return [
            (None, {"fields": principales}),
            ("Publicación", {"fields": self.campos_flujo, "description": flujo_desc}),
        ]

    def get_readonly_fields(self, request, obj=None):
        fijos = [*super().get_readonly_fields(request, obj), "creado_por", "revisado_por",
                 "revisado_en"]
        if not flujo.es_aprobador(request.user):
            fijos.append("comentario_revision")
        return fijos

    def formfield_for_choice_field(self, db_field, request, **kwargs):
        if db_field.name == "estado":
            permitidos = flujo.estados_permitidos(request.user, self.model)
            kwargs["choices"] = [(v, t) for v, t in Estado.choices if v in permitidos]
        return super().formfield_for_choice_field(db_field, request, **kwargs)

    def get_form(self, request, obj=None, **kwargs):
        Base = super().get_form(request, obj, **kwargs)
        modelo = self.model

        class FormularioConFlujo(Base):
            def clean(self):
                datos = super().clean()
                estado = datos.get("estado")
                if estado and estado not in flujo.estados_permitidos(request.user, modelo):
                    self.add_error("estado", "No puedes elegir este estado.")
                comentario = datos.get("comentario_revision", "")
                if estado == Estado.DEVUELTA and not comentario.strip():
                    raise forms.ValidationError(
                        "Para devolver el contenido escribe en «comentarios de la revisión» "
                        "qué hay que corregir."
                    )
                return datos

        return FormularioConFlujo

    def save_model(self, request, obj, form, change):
        anterior = (
            type(obj).objects.filter(pk=obj.pk).values_list("estado", flat=True).first()
            if obj.pk else None
        )
        if not obj.creado_por_id:
            obj.creado_por = request.user
        if obj.estado != anterior and obj.estado in (Estado.PUBLICADA, Estado.DEVUELTA):
            obj.revisado_por = request.user
            obj.revisado_en = timezone.now()
        if obj.estado == Estado.PUBLICADA:
            obj.comentario_revision = ""
        super().save_model(request, obj, form, change)
        self._avisar(request, obj, anterior)

    def _avisar(self, request, obj, anterior):
        if obj.estado == anterior:
            return
        if obj.estado == Estado.REVISION:
            flujo.avisar_revision(obj, request.user)
            self.message_user(request, "Se avisó por correo a los aprobadores para que lo revisen.")
        elif obj.estado in (Estado.PUBLICADA, Estado.DEVUELTA):
            flujo.avisar_resultado(obj, request.user)

    # Acciones de la lista
    @admin.action(description="Enviar a revisión")
    def enviar_a_revision(self, request, queryset):
        n = 0
        for obj in queryset.filter(estado__in=[Estado.BORRADOR, Estado.DEVUELTA]):
            obj.estado = Estado.REVISION
            obj.save(update_fields=["estado"])
            flujo.avisar_revision(obj, request.user)
            n += 1
        self.message_user(request, f"{n} enviado(s) a revisión.")

    @admin.action(description="Aprobar y publicar")
    def aprobar_y_publicar(self, request, queryset):
        if not flujo.es_aprobador(request.user):
            self.message_user(request, "Solo un aprobador puede publicar.", messages.ERROR)
            return
        n = 0
        for obj in queryset.exclude(estado=Estado.PUBLICADA):
            obj.estado = Estado.PUBLICADA
            obj.comentario_revision = ""
            obj.revisado_por = request.user
            obj.revisado_en = timezone.now()
            obj.save(update_fields=["estado", "comentario_revision", "revisado_por",
                                    "revisado_en"])
            flujo.avisar_resultado(obj, request.user)
            n += 1
        self.message_user(request, f"{n} publicado(s).")

    def get_actions(self, request):
        acciones = super().get_actions(request)
        if not flujo.es_aprobador(request.user):
            acciones.pop("aprobar_y_publicar", None)
            acciones.pop("delete_selected", None)  # el editor borra uno a uno, solo sus borradores
        return acciones

    def has_delete_permission(self, request, obj=None):
        if not super().has_delete_permission(request, obj):
            return False
        if obj is None or flujo.es_aprobador(request.user):
            return True
        return obj.creado_por_id == request.user.pk and obj.estado in (
            Estado.BORRADOR, Estado.DEVUELTA
        )


# --- Contenido -----------------------------------------------------------------

class AsignaturaInline(admin.TabularInline):
    model = m.AsignaturaPensum
    extra = 1
    fields = ["semestre", "codigo", "nombre", "unidades_credito", "orden"]


@admin.register(m.Carrera)
class CarreraAdmin(admin.ModelAdmin):
    list_display = ["nombre", "titulo_otorgado", "duracion", "modalidad", "publicada", "orden"]
    list_editable = ["publicada", "orden"]
    prepopulated_fields = {"slug": ["nombre"]}
    inlines = [AsignaturaInline]
    fieldsets = [
        (None, {"fields": ["nombre", "slug", "publicada", "orden"]}),
        ("Ficha rápida", {"fields": ["titulo_otorgado", "duracion", "modalidad", "turno",
                                     "resumen", "imagen", "imagen_descripcion"]}),
        ("Página de la carrera", {"fields": ["presentacion", "perfil_egresado",
                                             "campo_laboral", "propio_titulo", "propio"]}),
        ("Pensum y fotos", {"fields": ["pensum_pdf", "pensum_es_ejemplo", "album"]}),
    ]


@admin.register(m.Noticia)
class NoticiaAdmin(FlujoAdmin):
    list_display = ["titulo", "fecha", estado_con_color, "visible"]
    search_fields = ["titulo", "resumen"]
    prepopulated_fields = {"slug": ["titulo"]}
    date_hierarchy = "fecha"
    fields = ["titulo", "slug", "resumen", "cuerpo", "imagen", "imagen_descripcion", "fecha",
              *FlujoAdmin.campos_flujo]

    @admin.display(boolean=True, description="¿se ve en el sitio?")
    def visible(self, obj):
        return obj.estado == Estado.PUBLICADA and obj.fecha <= timezone.now()


@admin.register(m.Evento)
class EventoAdmin(FlujoAdmin):
    list_display = ["nombre", "inicio", "lugar", estado_con_color]
    search_fields = ["nombre"]
    date_hierarchy = "inicio"
    fields = ["nombre", "inicio", "fin", "lugar", "descripcion", *FlujoAdmin.campos_flujo]


@admin.register(m.Aviso)
class AvisoAdmin(FlujoAdmin):
    list_display = ["texto", "vence_en", "en_portada", estado_con_color, "vigente"]
    list_filter = ["estado", "en_portada"]
    fields = ["texto", "enlace", "vence_en", "en_portada", *FlujoAdmin.campos_flujo]

    @admin.display(boolean=True)
    def vigente(self, obj):
        return obj.vence_en >= timezone.localdate()


@admin.register(m.Autoridad)
class AutoridadAdmin(admin.ModelAdmin):
    list_display = ["cargo", "nombre", "orden"]
    list_editable = ["orden"]


@admin.register(m.CategoriaDocumento)
class CategoriaDocumentoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "orden"]
    list_editable = ["orden"]
    prepopulated_fields = {"slug": ["nombre"]}


@admin.register(m.Documento)
class DocumentoAdmin(FlujoAdmin):
    list_display = ["nombre", "categoria", "publicado_en", estado_con_color]
    list_filter = ["estado", "categoria"]
    search_fields = ["nombre"]
    fields = ["nombre", "categoria", "descripcion", "archivo", "publicado_en",
              *FlujoAdmin.campos_flujo]


class FotoInline(admin.TabularInline):
    model = m.Foto
    extra = 3


@admin.register(m.Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ["titulo", "fecha", "publicado"]
    inlines = [FotoInline]


@admin.register(m.PasoAdmision)
class PasoAdmisionAdmin(admin.ModelAdmin):
    list_display = ["titulo", "orden"]
    list_editable = ["orden"]


@admin.register(m.PreguntaFrecuente)
class PreguntaFrecuenteAdmin(admin.ModelAdmin):
    list_display = ["pregunta", "orden"]
    list_editable = ["orden"]


@admin.register(m.FechaAdmision)
class FechaAdmisionAdmin(admin.ModelAdmin):
    list_display = ["titulo", "inicio", "fin"]
    date_hierarchy = "inicio"


@admin.register(m.CostoAdmision)
class CostoAdmisionAdmin(admin.ModelAdmin):
    list_display = ["concepto", "monto", "orden"]
    list_editable = ["orden"]


@admin.register(m.FotoSeccion)
class FotoSeccionAdmin(admin.ModelAdmin):
    list_display = ["seccion", "descripcion"]
