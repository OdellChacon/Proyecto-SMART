"""API pública de solo lectura del sitio (sección 10 del documento de construcción).

Todo GET es público y se puede guardar en caché unos minutos.
"""

from datetime import datetime, time

from django.db.models import Count, Prefetch, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.usuarios.api.errores import ErrorDeApi

from .. import models as m
from . import serializers as s

CACHE_PUBLICA = cache_control(public=True, max_age=120)


@method_decorator(CACHE_PUBLICA, name="dispatch")
class Publica(APIView):
    """Lectura abierta: sin sesión ni CSRF."""

    permission_classes = [AllowAny]
    authentication_classes = []


class PublicaLista(Publica, generics.ListAPIView):
    pass


class PublicaDetalle(Publica, generics.RetrieveAPIView):
    pass


class PaginaDeNoticias(PageNumberPagination):
    page_size = 9
    max_page_size = 30
    page_size_query_param = "tamano"


class SitioView(Publica):
    @extend_schema(responses=s.DatosGeneralesSerializer)
    def get(self, request):
        return Response(s.DatosGeneralesSerializer(m.DatosGenerales.cargar()).data)


class CarrerasView(PublicaLista):
    serializer_class = s.CarreraTarjetaSerializer
    queryset = m.Carrera.objects.filter(publicada=True)
    pagination_class = None


class CarreraView(PublicaDetalle):
    serializer_class = s.CarreraSerializer
    queryset = m.Carrera.objects.filter(publicada=True).prefetch_related("asignaturas")
    lookup_field = "slug"


class NoticiasView(PublicaLista):
    serializer_class = s.NoticiaTarjetaSerializer
    pagination_class = PaginaDeNoticias

    def get_queryset(self):
        return m.Noticia.objects.publicadas()


class NoticiaView(PublicaDetalle):
    serializer_class = s.NoticiaSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return m.Noticia.objects.publicadas()


@extend_schema(parameters=[
    OpenApiParameter("desde", str, description="Fecha AAAA-MM-DD. Por defecto, hoy."),
    OpenApiParameter("hasta", str, description="Fecha AAAA-MM-DD (incluida). Opcional."),
])
class EventosView(PublicaLista):
    serializer_class = s.EventoSerializer
    pagination_class = None

    def get_queryset(self):
        texto_desde = self.request.query_params.get("desde")
        texto_hasta = self.request.query_params.get("hasta")
        desde = parse_date(texto_desde) if texto_desde else timezone.localdate()
        hasta = parse_date(texto_hasta) if texto_hasta else None
        if desde is None or (texto_hasta and hasta is None):
            raise ErrorDeApi("La fecha debe tener el formato AAAA-MM-DD.", "fecha_invalida")
        if hasta and (hasta < desde or (hasta - desde).days > 400):
            raise ErrorDeApi("El rango de fechas no es válido.", "fecha_invalida")
        inicio_del_dia = timezone.make_aware(datetime.combine(desde, time.min))
        # Incluye los que empezaron antes pero siguen en curso.
        eventos = m.Evento.objects.publicados().filter(
            Q(inicio__gte=inicio_del_dia) | Q(fin__gte=inicio_del_dia)
        )
        if hasta:
            eventos = eventos.filter(
                inicio__lt=timezone.make_aware(datetime.combine(hasta, time.max))
            )
        return eventos


@extend_schema(parameters=[OpenApiParameter("portada", bool)])
class AvisosView(PublicaLista):
    serializer_class = s.AvisoSerializer
    pagination_class = None

    def get_queryset(self):
        avisos = m.Aviso.objects.publicados().filter(vence_en__gte=timezone.localdate())
        if self.request.query_params.get("portada") == "true":
            avisos = avisos.filter(en_portada=True)
        return avisos


class AutoridadesView(PublicaLista):
    serializer_class = s.AutoridadSerializer
    queryset = m.Autoridad.objects.all()
    pagination_class = None


class CategoriasDocumentoView(PublicaLista):
    serializer_class = s.CategoriaDocumentoSerializer
    pagination_class = None

    def get_queryset(self):
        return m.CategoriaDocumento.objects.annotate(
            total=Count("documentos", filter=Q(documentos__estado=m.Estado.PUBLICADA))
        ).order_by("orden", "nombre")  # con annotate, Django no aplica Meta.ordering


@extend_schema(parameters=[OpenApiParameter("categoria", str)])
class DocumentosView(PublicaLista):
    serializer_class = s.DocumentoSerializer
    pagination_class = None

    def get_queryset(self):
        documentos = m.Documento.objects.publicados().select_related("categoria")
        categoria = self.request.query_params.get("categoria")
        if categoria:
            get_object_or_404(m.CategoriaDocumento, slug=categoria)
            documentos = documentos.filter(categoria__slug=categoria)
        return documentos


def _albumes():
    return (
        m.Album.objects.filter(publicado=True)
        .annotate(total_fotos=Count("fotos"))
        .prefetch_related(Prefetch("fotos", queryset=m.Foto.objects.order_by("orden", "id")))
        .order_by("-fecha", "-id")
    )


class GaleriaView(PublicaLista):
    serializer_class = s.AlbumTarjetaSerializer
    pagination_class = None

    def get_queryset(self):
        return _albumes()


class AlbumView(PublicaDetalle):
    serializer_class = s.AlbumSerializer

    def get_queryset(self):
        return _albumes()


class AdmisionView(Publica):
    """Requisitos, pasos y preguntas frecuentes de la página de Admisión."""

    @extend_schema(responses=dict)
    def get(self, request):
        datos = m.DatosGenerales.cargar()
        costos = m.CostoAdmision.objects.all() if datos.publicar_costos else []
        return Response({
            "requisitos": s.lineas(datos.requisitos_admision),
            "fechas": s.FechaAdmisionSerializer(
                m.FechaAdmision.objects.filter(
                    Q(fin__gte=timezone.localdate())
                    | Q(fin__isnull=True, inicio__gte=timezone.localdate())
                ),
                many=True,
            ).data,
            "costos": s.CostoAdmisionSerializer(costos, many=True).data,
            "costos_nota": datos.costos_nota if datos.publicar_costos else "",
            "pasos": s.PasoAdmisionSerializer(m.PasoAdmision.objects.all(), many=True).data,
            "preguntas": s.PreguntaFrecuenteSerializer(
                m.PreguntaFrecuente.objects.all(), many=True
            ).data,
        })


# Páginas fijas del mapa del sitio: también aparecen en el buscador.
PAGINAS_FIJAS = [
    ("La Universidad", "/la-universidad", "universidad institución quiénes somos"),
    ("Historia", "/la-universidad/historia", "historia reseña fundación"),
    ("Misión, visión y valores", "/la-universidad/mision-vision-valores",
     "misión visión valores"),
    ("Autoridades", "/la-universidad/autoridades", "autoridades rector rectora directivos"),
    ("Organigrama", "/la-universidad/organigrama", "organigrama estructura"),
    ("Sede e instalaciones", "/la-universidad/sede", "sede instalaciones aulas laboratorio"),
    ("Carreras", "/carreras", "carreras oferta académica estudiar pensum"),
    ("Admisión", "/admision", "admisión inscripción requisitos documentos ingresar"),
    ("Preguntas frecuentes", "/admision#preguntas", "preguntas frecuentes dudas"),
    ("Solicitar información", "/admision/solicitar-informacion",
     "solicitar información aspirante"),
    ("Noticias", "/noticias", "noticias novedades avisos"),
    ("Eventos y calendario", "/eventos", "eventos calendario actividades"),
    ("Galería de fotos", "/galeria", "galería fotos imágenes"),
    ("Normativa", "/normativa", "normativa reglamentos documentos legales formatos"),
    ("Contacto", "/contacto", "contacto teléfono correo dirección ubicación mapa horario"),
    ("Aviso de privacidad", "/privacidad", "privacidad datos personales"),
]


def _sin_acentos(texto: str) -> str:
    import unicodedata

    return "".join(
        c for c in unicodedata.normalize("NFD", texto.lower()) if unicodedata.category(c) != "Mn"
    )


@extend_schema(parameters=[OpenApiParameter("q", str, required=True)], responses=dict)
class BuscarView(Publica):
    """Busca en carreras, noticias, documentos y páginas, sin distinguir acentos."""

    LIMITE = 10

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()[:100]
        if len(q) < 2:
            raise ErrorDeApi("Escribe al menos 2 letras para buscar.", "busqueda_corta")

        def contiene(*campos):
            filtro = Q()
            for campo in campos:
                filtro |= Q(**{f"{campo}__unaccent__icontains": q})
            return filtro

        carreras = m.Carrera.objects.filter(publicada=True).filter(
            contiene("nombre", "resumen", "presentacion", "titulo_otorgado")
        )[: self.LIMITE]
        noticias = m.Noticia.objects.publicadas().filter(
            contiene("titulo", "resumen", "cuerpo")
        )[: self.LIMITE]
        documentos = m.Documento.objects.publicados().filter(
            contiene("nombre", "descripcion")
        ).select_related("categoria")[: self.LIMITE]

        termino = _sin_acentos(q)
        paginas = [
            {"titulo": titulo, "url": url}
            for titulo, url, claves in PAGINAS_FIJAS
            if termino in _sin_acentos(f"{titulo} {claves}")
        ]

        return Response({
            "q": q,
            "carreras": s.CarreraTarjetaSerializer(carreras, many=True).data,
            "noticias": s.NoticiaTarjetaSerializer(noticias, many=True).data,
            "documentos": s.DocumentoSerializer(documentos, many=True).data,
            "paginas": paginas,
        })
