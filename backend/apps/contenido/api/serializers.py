from itertools import groupby

from django.utils import timezone

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers

from .. import imagenes
from .. import models as m


@extend_schema_field(OpenApiTypes.URI)
class UrlArchivo(serializers.Field):
    """URL relativa del archivo (/media/...) o null. El servidor web y la CDN la sirven."""

    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, value):
        return value.url if value else None

    def get_attribute(self, instance):
        valor = super().get_attribute(instance)
        return valor or None


@extend_schema_field(inline_serializer("Imagen", {
    "url": serializers.CharField(), "miniatura": serializers.CharField(),
    "mediana": serializers.CharField(), "grande": serializers.CharField(),
    "ancho": serializers.IntegerField(allow_null=True),
    "alto": serializers.IntegerField(allow_null=True),
}))
class Imagen(serializers.Field):
    """Imagen con sus medidas: {url, miniatura, mediana, grande, ancho, alto} o null."""

    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def get_attribute(self, instance):
        return super().get_attribute(instance) or None

    def to_representation(self, value):
        return imagenes.variantes(value)


def lineas(texto: str) -> list[str]:
    return [linea.strip() for linea in (texto or "").splitlines() if linea.strip()]


@extend_schema_field(serializers.ListField(child=serializers.CharField()))
class Lineas(serializers.Field):
    """Texto de «un elemento por línea» como lista."""

    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, value):
        return lineas(value)


class DatosGeneralesSerializer(serializers.ModelSerializer):
    telefonos = Lineas()
    correos = Lineas()
    horario = Lineas()
    perfil_redes = serializers.SerializerMethodField()
    valores = serializers.SerializerMethodField()
    cifras = serializers.SerializerMethodField()
    fotos_seccion = serializers.SerializerMethodField()
    fotos_banda = serializers.SerializerMethodField()
    organigrama = UrlArchivo()
    foto_portada = Imagen()
    organigrama_descripcion = Lineas()
    datos_legales = Lineas()

    class Meta:
        model = m.DatosGenerales
        fields = [
            "nombre", "siglas", "lema", "frase_portada", "es_demostracion",
            "foto_portada", "foto_portada_descripcion", "cifras", "fotos_seccion", "fotos_banda",
            "direccion", "telefonos", "correos", "horario", "mapa_enlace", "mapa_insertado",
            "perfil_redes", "historia", "mision", "vision", "valores", "sede",
            "organigrama", "organigrama_descripcion", "datos_legales", "aviso_privacidad",
            "actualizado_en",
        ]

    def get_perfil_redes(self, obj) -> list[dict[str, str]]:
        redes = [
            ("facebook", "Facebook"), ("instagram", "Instagram"), ("x", "X"),
            ("youtube", "YouTube"), ("tiktok", "TikTok"),
        ]
        return [{"red": clave, "nombre": nombre, "url": getattr(obj, clave)}
                for clave, nombre in redes if getattr(obj, clave)]

    def get_cifras(self, obj) -> list[dict[str, str]]:
        salida = []
        for linea in lineas(obj.cifras):
            valor, _, etiqueta = linea.partition(":")
            if etiqueta.strip():
                salida.append({"valor": valor.strip(), "etiqueta": etiqueta.strip()})
        return salida

    def get_fotos_seccion(self, obj) -> dict:
        return {
            f.seccion: {"imagen": imagenes.variantes(f.imagen), "descripcion": f.descripcion}
            for f in m.FotoSeccion.objects.all()
        }

    def get_fotos_banda(self, obj) -> list[dict]:
        """Fotos de los álbumes publicados para las bandas de fotos de las páginas interiores."""
        fotos = (
            m.Foto.objects.filter(album__publicado=True)
            .select_related("album")
            .order_by("-album__fecha", "album_id", "orden", "id")[:16]
        )
        return FotoSerializer(fotos, many=True).data

    def get_valores(self, obj) -> list[dict[str, str]]:
        salida = []
        for linea in lineas(obj.valores):
            nombre, _, descripcion = linea.partition(":")
            salida.append({"nombre": nombre.strip(), "descripcion": descripcion.strip()})
        return salida


class CarreraTarjetaSerializer(serializers.ModelSerializer):
    imagen = Imagen()

    class Meta:
        model = m.Carrera
        fields = ["nombre", "slug", "titulo_otorgado", "duracion", "modalidad", "turno", "resumen",
                  "imagen", "imagen_descripcion"]


class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = m.AsignaturaPensum
        fields = ["codigo", "nombre", "unidades_credito"]


class CarreraSerializer(serializers.ModelSerializer):
    perfil_egresado = Lineas()
    campo_laboral = Lineas()
    pensum_pdf = UrlArchivo()
    pensum = serializers.SerializerMethodField()
    imagen = Imagen()
    fotos = serializers.SerializerMethodField()

    class Meta:
        model = m.Carrera
        fields = [
            "nombre", "slug", "titulo_otorgado", "duracion", "modalidad", "turno", "resumen",
            "imagen", "imagen_descripcion",
            "presentacion", "perfil_egresado", "campo_laboral", "propio_titulo", "propio",
            "pensum_pdf", "pensum_es_ejemplo", "pensum", "fotos",
        ]

    def get_fotos(self, obj) -> list[dict]:
        """Fotos del álbum de la carrera (si tiene uno publicado)."""
        if not obj.album or not obj.album.publicado:
            return []
        return FotoSerializer(obj.album.fotos.order_by("orden", "id"), many=True).data

    def get_pensum(self, obj) -> list[dict]:
        """Pensum agrupado por semestre, con el total de unidades de crédito."""
        semestres = []
        for semestre, grupo in groupby(obj.asignaturas.all(), key=lambda a: a.semestre):
            asignaturas = list(grupo)
            semestres.append({
                "semestre": semestre,
                "asignaturas": AsignaturaSerializer(asignaturas, many=True).data,
                "total_uc": sum(a.unidades_credito for a in asignaturas),
            })
        return semestres


class NoticiaTarjetaSerializer(serializers.ModelSerializer):
    imagen = Imagen()

    class Meta:
        model = m.Noticia
        fields = ["titulo", "slug", "fecha", "imagen", "imagen_descripcion", "resumen"]


class NoticiaSerializer(NoticiaTarjetaSerializer):
    class Meta(NoticiaTarjetaSerializer.Meta):
        fields = [*NoticiaTarjetaSerializer.Meta.fields, "cuerpo", "actualizada_en"]


class EventoSerializer(serializers.ModelSerializer):
    class Meta:
        model = m.Evento
        fields = ["id", "nombre", "inicio", "fin", "lugar", "descripcion"]


class AvisoSerializer(serializers.ModelSerializer):
    dias_restantes = serializers.SerializerMethodField(
        help_text="Días que faltan para que venza (0 = hoy es el último día)."
    )

    class Meta:
        model = m.Aviso
        fields = ["id", "texto", "enlace", "vence_en", "dias_restantes"]

    def get_dias_restantes(self, obj) -> int:
        # Con la fecha del servidor (zona de la universidad), igual que el filtro de vigencia.
        return (obj.vence_en - timezone.localdate()).days


class AutoridadSerializer(serializers.ModelSerializer):
    foto = Imagen()

    class Meta:
        model = m.Autoridad
        fields = ["id", "nombre", "cargo", "foto", "resena"]


class CategoriaDocumentoSerializer(serializers.ModelSerializer):
    total = serializers.IntegerField(read_only=True)

    class Meta:
        model = m.CategoriaDocumento
        fields = ["nombre", "slug", "descripcion", "total"]


class DocumentoSerializer(serializers.ModelSerializer):
    archivo = UrlArchivo()
    categoria = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    formato = serializers.SerializerMethodField()
    tamano = serializers.SerializerMethodField()

    class Meta:
        model = m.Documento
        fields = ["id", "nombre", "categoria", "descripcion", "publicado_en", "archivo",
                  "formato", "tamano"]

    def get_formato(self, obj) -> str | None:
        if not obj.archivo:
            return None
        return obj.archivo.name.rsplit(".", 1)[-1].upper()

    def get_tamano(self, obj) -> int | None:
        """Tamaño en bytes, para que la persona sepa cuánto va a descargar."""
        if not obj.archivo:
            return None
        try:
            return obj.archivo.size
        except OSError:
            return None


class FotoSerializer(serializers.ModelSerializer):
    imagen = Imagen()

    class Meta:
        model = m.Foto
        fields = ["id", "imagen", "descripcion"]


class AlbumTarjetaSerializer(serializers.ModelSerializer):
    portada = serializers.SerializerMethodField()
    total_fotos = serializers.IntegerField(read_only=True)

    class Meta:
        model = m.Album
        fields = ["id", "titulo", "fecha", "descripcion", "portada", "total_fotos"]

    def get_portada(self, obj) -> dict | None:
        foto = next(iter(obj.fotos.all()), None)
        return FotoSerializer(foto).data if foto else None


class AlbumSerializer(AlbumTarjetaSerializer):
    fotos = FotoSerializer(many=True, read_only=True)

    class Meta(AlbumTarjetaSerializer.Meta):
        fields = [*AlbumTarjetaSerializer.Meta.fields, "fotos"]


class PasoAdmisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = m.PasoAdmision
        fields = ["titulo", "descripcion"]


class PreguntaFrecuenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = m.PreguntaFrecuente
        fields = ["pregunta", "respuesta"]


class FechaAdmisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = m.FechaAdmision
        fields = ["titulo", "inicio", "fin", "descripcion"]


class CostoAdmisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = m.CostoAdmision
        fields = ["concepto", "monto", "nota"]
