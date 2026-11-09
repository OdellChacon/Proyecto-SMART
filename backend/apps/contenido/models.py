"""Contenido del sitio público (sección 9 del documento de construcción).

Todo lo que cambia con el tiempo vive aquí y se edita desde el panel; el diseño,
el menú y las direcciones URL son fijos y están en el frontend.

Los textos largos son texto plano: un párrafo por bloque separado con una línea
en blanco. Así el personal no puede romper el diseño pegando HTML.
Carrera y AsignaturaPensum están pensadas para que control de estudios las reutilice.
"""

from django.conf import settings
from django.core.validators import FileExtensionValidator, MinValueValidator
from django.db import models
from django.utils import timezone

SOLO_PDF = [FileExtensionValidator(["pdf"])]
DOCUMENTOS = [FileExtensionValidator(["pdf", "doc", "docx", "xls", "xlsx", "odt", "ods"])]
AYUDA_PARRAFOS = "Separa los párrafos con una línea en blanco."
AYUDA_LINEAS = "Escribe un elemento por línea."
AYUDA_FOTO = "Qué muestra la foto, para personas que usan lector de pantalla."


class Estado(models.TextChoices):
    """Flujo de publicación (sección 11): borrador → en revisión → publicado, o devuelto."""

    BORRADOR = "borrador", "Borrador"
    REVISION = "revision", "En revisión"
    PUBLICADA = "publicada", "Publicado"
    DEVUELTA = "devuelta", "Devuelto con comentarios"


class PublicadosQuerySet(models.QuerySet):
    def publicados(self):
        return self.filter(estado=Estado.PUBLICADA)


class Publicable(models.Model):
    """Contenido que pasa por el flujo de publicación del panel."""

    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.BORRADOR)
    comentario_revision = models.TextField(
        "comentarios de la revisión", blank=True,
        help_text="Qué hay que corregir. Lo escribe quien aprueba al devolver el contenido.",
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="+", editable=False, verbose_name="creado por",
    )
    revisado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="+", editable=False, verbose_name="revisado por",
    )
    revisado_en = models.DateTimeField("revisado el", null=True, blank=True, editable=False)

    objects = PublicadosQuerySet.as_manager()

    class Meta:
        abstract = True


class DatosGenerales(models.Model):
    """Registro único con los datos de la institución que se muestran en todo el sitio."""

    nombre = models.CharField("nombre oficial", max_length=200)
    siglas = models.CharField(max_length=30, blank=True)
    lema = models.CharField(max_length=200, blank=True)
    frase_portada = models.CharField(
        "frase de la portada", max_length=200, blank=True,
        help_text="Una sola línea bajo el nombre, en la imagen principal.",
    )
    cifras = models.TextField(
        blank=True,
        help_text="Datos que se muestran grandes en la portada, uno por línea con el formato "
        "«número: qué es». Ej.: «3: carreras». Solo datos reales y verificables.",
    )
    es_demostracion = models.BooleanField(
        "mostrar aviso de demostración", default=False,
        help_text="Muestra una franja avisando que los textos son de ejemplo. "
        "Desmárcalo cuando el contenido oficial esté cargado.",
    )
    foto_portada = models.ImageField(
        "foto de la portada", upload_to="institucion/", blank=True,
        help_text="Foto real de la sede, horizontal y de al menos 1600 px de ancho.",
    )
    foto_portada_descripcion = models.CharField(
        "descripción de la foto de la portada", max_length=200, blank=True, help_text=AYUDA_FOTO
    )

    # Contacto
    direccion = models.TextField("dirección", blank=True)
    telefonos = models.TextField("teléfonos", blank=True, help_text=AYUDA_LINEAS)
    correos = models.TextField(blank=True, help_text=AYUDA_LINEAS)
    horario = models.TextField("horario de atención", blank=True, help_text=AYUDA_LINEAS)
    mapa_enlace = models.URLField(
        "enlace al mapa", blank=True, help_text="Enlace de Google Maps para «Cómo llegar»."
    )
    mapa_insertado = models.URLField(
        "mapa insertado", blank=True,
        help_text="Dirección «Insertar un mapa» de Google Maps (empieza por "
        "https://www.google.com/maps/embed).",
    )
    facebook = models.URLField(blank=True)
    instagram = models.URLField(blank=True)
    x = models.URLField("X (Twitter)", blank=True)
    youtube = models.URLField("YouTube", blank=True)
    tiktok = models.URLField("TikTok", blank=True)

    # La Universidad
    historia = models.TextField("reseña histórica", blank=True, help_text=AYUDA_PARRAFOS)
    mision = models.TextField("misión", blank=True)
    vision = models.TextField("visión", blank=True)
    valores = models.TextField(
        blank=True, help_text="Un valor por línea con el formato «Nombre: descripción»."
    )
    sede = models.TextField("sede e instalaciones", blank=True, help_text=AYUDA_PARRAFOS)
    organigrama = models.ImageField("organigrama (imagen)", upload_to="institucion/", blank=True)
    organigrama_descripcion = models.TextField(
        "organigrama en texto", blank=True,
        help_text="Describe la estructura para quien no puede ver la imagen. " + AYUDA_LINEAS,
    )
    datos_legales = models.TextField(
        "datos legales", blank=True,
        help_text="Documento de creación o autorización, RIF y lo que pida el ministerio. "
        + AYUDA_LINEAS,
    )

    # Admisión y privacidad
    requisitos_admision = models.TextField(
        "requisitos de admisión", blank=True, help_text=AYUDA_LINEAS
    )
    aviso_privacidad = models.TextField("aviso de privacidad", blank=True, help_text=AYUDA_PARRAFOS)
    publicar_costos = models.BooleanField(
        "publicar costos en Admisión", default=False,
        help_text="Muestra la tabla de costos en la página de Admisión.",
    )
    costos_nota = models.TextField(
        "nota sobre los costos", blank=True,
        help_text="Ej.: moneda, forma de pago o fecha de vigencia de los montos.",
    )

    # Flujo de publicación: qué tipos de contenido necesitan aprobación antes de publicarse.
    aprobar_noticias = models.BooleanField("las noticias necesitan aprobación", default=True)
    aprobar_eventos = models.BooleanField("los eventos necesitan aprobación", default=False)
    aprobar_avisos = models.BooleanField("los avisos necesitan aprobación", default=False)
    aprobar_documentos = models.BooleanField("los documentos necesitan aprobación", default=True)

    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "datos generales"
        verbose_name_plural = "datos generales"

    def __str__(self):
        return self.nombre or "Datos generales"

    def save(self, *args, **kwargs):
        # Registro único: cualquier guardado reemplaza el registro 1.
        self.pk = 1
        if type(self).objects.filter(pk=1).exists():
            kwargs["force_insert"] = False
            self._state.adding = False
        super().save(*args, **kwargs)

    @classmethod
    def cargar(cls) -> "DatosGenerales":
        obj, _ = cls.objects.get_or_create(pk=1, defaults={"nombre": "Nombre de la Universidad"})
        return obj


class Carrera(models.Model):
    nombre = models.CharField(max_length=120)
    slug = models.SlugField(
        "dirección", unique=True, help_text="Parte final de la URL: /carreras/<dirección>. "
        "No la cambies una vez publicada.",
    )
    titulo_otorgado = models.CharField("título que otorga", max_length=200, blank=True)
    duracion = models.CharField("duración", max_length=80, blank=True, help_text="Ej.: 4 años")
    modalidad = models.CharField(max_length=80, blank=True, help_text="Ej.: Presencial")
    turno = models.CharField(max_length=80, blank=True, help_text="Ej.: Mañana")
    resumen = models.CharField(
        max_length=240, blank=True, help_text="Una o dos frases para la tarjeta de la portada."
    )
    imagen = models.ImageField(upload_to="carreras/", blank=True)
    imagen_descripcion = models.CharField(
        "descripción de la imagen", max_length=200, blank=True, help_text=AYUDA_FOTO
    )
    presentacion = models.TextField("presentación", blank=True, help_text=AYUDA_PARRAFOS)
    perfil_egresado = models.TextField("perfil del egresado", blank=True, help_text=AYUDA_LINEAS)
    campo_laboral = models.TextField("campo laboral", blank=True, help_text=AYUDA_LINEAS)
    propio_titulo = models.CharField(
        "título de «lo propio de la carrera»", max_length=120, blank=True,
        help_text="Ej.: Prácticas clínicas y convenios",
    )
    propio = models.TextField("lo propio de la carrera", blank=True, help_text=AYUDA_PARRAFOS)
    pensum_pdf = models.FileField(
        "pensum en PDF", upload_to="pensum/", blank=True, validators=SOLO_PDF
    )
    album = models.ForeignKey(
        "Album", on_delete=models.SET_NULL, null=True, blank=True, related_name="carreras",
        verbose_name="álbum de la carrera",
        help_text="Sus fotos aparecen en la página de la carrera (laboratorios, prácticas).",
    )
    pensum_es_ejemplo = models.BooleanField(
        "el pensum es de ejemplo", default=False,
        help_text="Avisa en la página que el pensum no es el aprobado.",
    )
    orden = models.PositiveSmallIntegerField(default=0)
    publicada = models.BooleanField(default=True)

    class Meta:
        ordering = ["orden", "nombre"]

    def __str__(self):
        return self.nombre


class AsignaturaPensum(models.Model):
    carrera = models.ForeignKey(Carrera, on_delete=models.CASCADE, related_name="asignaturas")
    semestre = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    codigo = models.CharField("código", max_length=20)
    nombre = models.CharField(max_length=160)
    unidades_credito = models.PositiveSmallIntegerField("unidades de crédito", default=0)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "asignatura del pensum"
        verbose_name_plural = "pensum"
        ordering = ["semestre", "orden", "codigo"]
        constraints = [
            models.UniqueConstraint(fields=["carrera", "codigo"], name="asignatura_codigo_unico"),
        ]

    def __str__(self):
        return f"{self.codigo} · {self.nombre}"


class NoticiaQuerySet(PublicadosQuerySet):
    def publicadas(self):
        """Publicadas y con fecha ya cumplida (una fecha futura = publicación programada)."""
        return self.publicados().filter(fecha__lte=timezone.now())


class Noticia(Publicable):
    Estado = Estado

    titulo = models.CharField("título", max_length=200)
    slug = models.SlugField("dirección", max_length=200, unique=True)
    fecha = models.DateTimeField(
        "fecha de publicación", default=timezone.now,
        help_text="Si pones una fecha futura, la noticia aparece sola ese día.",
    )
    imagen = models.ImageField(upload_to="noticias/", blank=True)
    imagen_descripcion = models.CharField(
        "descripción de la imagen", max_length=200, blank=True,
        help_text=AYUDA_FOTO,
    )
    resumen = models.CharField(max_length=300)
    cuerpo = models.TextField(help_text=AYUDA_PARRAFOS)
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)

    objects = NoticiaQuerySet.as_manager()

    class Meta:
        ordering = ["-fecha"]

    def __str__(self):
        return self.titulo


class Evento(Publicable):
    nombre = models.CharField(max_length=200)
    inicio = models.DateTimeField()
    fin = models.DateTimeField(null=True, blank=True)
    lugar = models.CharField(max_length=200, blank=True)
    descripcion = models.TextField("descripción", blank=True, help_text=AYUDA_PARRAFOS)

    class Meta:
        ordering = ["inicio"]

    def __str__(self):
        return self.nombre


class Aviso(Publicable):
    texto = models.CharField(max_length=240)
    enlace = models.CharField(
        max_length=300, blank=True,
        help_text="Página del sitio (ej.: /admision) o dirección completa.",
    )
    vence_en = models.DateField(
        "vence el", help_text="El último día en que se muestra el aviso."
    )
    en_portada = models.BooleanField("mostrar en la portada", default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["vence_en"]

    def __str__(self):
        return self.texto


class Autoridad(models.Model):
    nombre = models.CharField(max_length=160)
    cargo = models.CharField(max_length=160)
    foto = models.ImageField(upload_to="autoridades/", blank=True)
    resena = models.TextField("reseña", blank=True, help_text=AYUDA_PARRAFOS)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name_plural = "autoridades"
        ordering = ["orden", "id"]

    def __str__(self):
        return f"{self.cargo}: {self.nombre}"


class CategoriaDocumento(models.Model):
    nombre = models.CharField(max_length=120)
    slug = models.SlugField("dirección", unique=True)
    descripcion = models.CharField("descripción", max_length=300, blank=True)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "categoría de documentos"
        verbose_name_plural = "categorías de documentos"
        ordering = ["orden", "nombre"]

    def __str__(self):
        return self.nombre


class Documento(Publicable):
    nombre = models.CharField(max_length=200)
    categoria = models.ForeignKey(
        CategoriaDocumento, on_delete=models.PROTECT, related_name="documentos",
        verbose_name="categoría",
    )
    archivo = models.FileField(upload_to="documentos/", validators=DOCUMENTOS, blank=True)
    descripcion = models.CharField("descripción", max_length=300, blank=True)
    publicado_en = models.DateField("fecha", default=timezone.localdate)

    class Meta:
        ordering = ["-publicado_en", "nombre"]

    def __str__(self):
        return self.nombre


class Album(models.Model):
    titulo = models.CharField("título", max_length=160)
    fecha = models.DateField(default=timezone.localdate)
    descripcion = models.CharField("descripción", max_length=300, blank=True)
    publicado = models.BooleanField(default=True)

    class Meta:
        verbose_name = "álbum"
        verbose_name_plural = "galería de fotos"
        ordering = ["-fecha", "-id"]

    def __str__(self):
        return self.titulo


class Foto(models.Model):
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name="fotos")
    imagen = models.ImageField(upload_to="galeria/")
    descripcion = models.CharField(
        "descripción", max_length=200, help_text="Qué muestra la foto (para lectores de pantalla)."
    )
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["orden", "id"]

    def __str__(self):
        return self.descripcion


class PasoAdmision(models.Model):
    titulo = models.CharField("título", max_length=120)
    descripcion = models.TextField("descripción")
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "paso de admisión"
        verbose_name_plural = "pasos de admisión"
        ordering = ["orden", "id"]

    def __str__(self):
        return self.titulo


class PreguntaFrecuente(models.Model):
    pregunta = models.CharField(max_length=240)
    respuesta = models.TextField(help_text=AYUDA_PARRAFOS)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "pregunta frecuente"
        verbose_name_plural = "preguntas frecuentes"
        ordering = ["orden", "id"]

    def __str__(self):
        return self.pregunta


class FechaAdmision(models.Model):
    """Fechas importantes del proceso de admisión (inscripciones, entrega de documentos…)."""

    titulo = models.CharField("qué ocurre", max_length=160)
    inicio = models.DateField()
    fin = models.DateField(null=True, blank=True, help_text="Déjalo vacío si es un solo día.")
    descripcion = models.CharField("descripción", max_length=300, blank=True)

    class Meta:
        verbose_name = "fecha de admisión"
        verbose_name_plural = "fechas de admisión"
        ordering = ["inicio", "id"]

    def __str__(self):
        return self.titulo


class CostoAdmision(models.Model):
    """Costos que la universidad decide publicar (solo se ven si «publicar costos» está activo)."""

    concepto = models.CharField(max_length=160)
    monto = models.CharField(
        max_length=80, help_text="Tal como debe leerse, con su moneda. Ej.: 25 USD"
    )
    nota = models.CharField(max_length=240, blank=True)
    orden = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "costo de admisión"
        verbose_name_plural = "costos de admisión"
        ordering = ["orden", "id"]

    def __str__(self):
        return f"{self.concepto}: {self.monto}"


class FotoSeccion(models.Model):
    """Foto de cabecera de cada sección del sitio (la franja de arriba de cada página)."""

    class Seccion(models.TextChoices):
        UNIVERSIDAD = "universidad", "La Universidad"
        CARRERAS = "carreras", "Carreras"
        ADMISION = "admision", "Admisión"
        NOTICIAS = "noticias", "Noticias y eventos"
        NORMATIVA = "normativa", "Normativa"
        CONTACTO = "contacto", "Contacto"
        BUSCAR = "buscar", "Buscar y otras páginas"

    seccion = models.CharField("sección", max_length=20, choices=Seccion.choices, unique=True)
    imagen = models.ImageField(upload_to="secciones/")
    descripcion = models.CharField(
        "descripción", max_length=200, help_text="Qué muestra la foto (para lectores de pantalla)."
    )

    class Meta:
        verbose_name = "foto de sección"
        verbose_name_plural = "fotos de sección"
        ordering = ["seccion"]

    def __str__(self):
        return self.get_seccion_display()
