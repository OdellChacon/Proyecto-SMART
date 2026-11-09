"""Carga contenido de EJEMPLO para presentar el sitio antes de tener el oficial.

    python manage.py cargar_contenido_ejemplo            # crea lo que falte
    python manage.py cargar_contenido_ejemplo --reiniciar  # borra el contenido y lo vuelve a crear

Nada de esto es información de la universidad: los datos propios de la institución
(nombre, dirección, títulos, duración, autoridades, pensum) quedan como «Por confirmar»
o marcados como ejemplo, y el sitio muestra una franja de «demostración» hasta que
se desmarque en Datos generales.
"""

import io
import json
import pathlib
from datetime import datetime, time, timedelta

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

from apps.contenido import models as m

POR_CONFIRMAR = "Por confirmar"
MARCA = (15, 42, 71)


def _fuente(tamano):
    try:
        return ImageFont.load_default(size=tamano)
    except TypeError:  # Pillow antiguo
        return ImageFont.load_default()


def pdf_de_ejemplo(titulo: str) -> ContentFile:
    """PDF de una página que dice claramente que es un documento de ejemplo."""
    img = Image.new("RGB", (1240, 1754), "white")  # A4 a 150 ppp
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 1240, 160], fill=MARCA)
    d.text((80, 55), "Nombre de la Universidad", fill="white", font=_fuente(44))
    d.text((80, 260), titulo, fill=(28, 27, 25), font=_fuente(52))
    d.text((80, 360), "DOCUMENTO DE EJEMPLO", fill=(181, 70, 42), font=_fuente(40))
    d.text((80, 440), "Se reemplaza por el documento oficial que entregue la universidad.",
           fill=(91, 87, 80), font=_fuente(32))
    salida = io.BytesIO()
    img.save(salida, "PDF", resolution=150)
    return ContentFile(salida.getvalue())


DATOS_GENERALES = {
    "nombre": "Nombre de la Universidad",
    "siglas": "",
    "lema": "Lema institucional (por confirmar)",
    "frase_portada": "Formación universitaria cercana, de calidad y comprometida con su comunidad.",
    "es_demostracion": True,
    # Datos del documento de construcción (sección 2): la universidad arranca con unos 60
    # estudiantes y 3 carreras. Nada más: las cifras nunca se inventan.
    "cifras": "3: carreras: Administración, Informática y Enfermería\n"
    "60: estudiantes, aproximadamente, en la primera cohorte",
    "direccion": "Dirección de la sede (por confirmar)",
    "telefonos": "+58 000-000 00 00 (por confirmar)",
    "correos": "informacion@universidad.edu.ve (ejemplo)\nadmision@universidad.edu.ve (ejemplo)",
    "horario": "Lunes a viernes: 8:00 a. m. a 4:00 p. m. (por confirmar)",
    "historia": (
        "Texto de ejemplo. Aquí va la reseña histórica de la universidad: cuándo y cómo nació, "
        "quiénes impulsaron el proyecto y qué necesidad de la región vino a atender.\n\n"
        "También puede contar los hitos principales: la autorización para funcionar, el inicio "
        "de las primeras carreras y la apertura de la sede."
    ),
    "mision": (
        "Texto de ejemplo. Formar profesionales competentes, éticos y comprometidos con el "
        "desarrollo de su comunidad, mediante una educación cercana y de calidad."
    ),
    "vision": (
        "Texto de ejemplo. Ser una institución reconocida en la región por la calidad de sus "
        "egresados y por su aporte al desarrollo social y económico del país."
    ),
    "valores": (
        "Excelencia: buscamos hacer bien cada tarea, desde el aula hasta la gestión.\n"
        "Compromiso: respondemos a las necesidades de nuestros estudiantes y de la comunidad.\n"
        "Ética: actuamos con honestidad, respeto y responsabilidad.\n"
        "Inclusión: abrimos nuestras puertas a todas las personas, sin distinción.\n"
        "Servicio: ponemos el conocimiento al servicio de los demás."
    ),
    "sede": (
        "Texto de ejemplo. Aquí se describe la sede: dónde está, cómo llegar y qué espacios "
        "tiene (aulas, biblioteca, laboratorio de computación, sala de simulación de "
        "enfermería, áreas comunes).\n\n"
        "Conviene acompañar este texto con fotos reales en la galería."
    ),
    "organigrama_descripcion": (
        "Consejo Universitario (ejemplo)\nRectorado\nVicerrectorado Académico\n"
        "Vicerrectorado Administrativo\nSecretaría General\nCoordinaciones de carrera"
    ),
    "datos_legales": (
        f"Documento de creación o autorización: {POR_CONFIRMAR}\n"
        f"RIF: {POR_CONFIRMAR}\n"
        f"Gaceta Oficial: {POR_CONFIRMAR}"
    ),
    "requisitos_admision": (
        "Título de bachiller (original y copia)\n"
        "Notas certificadas de bachillerato (original y copia)\n"
        "Cédula de identidad vigente (copia)\n"
        "Partida de nacimiento (copia)\n"
        "Dos fotos tipo carnet\n"
        "Lista de ejemplo: la universidad confirma los requisitos reales"
    ),
    "publicar_costos": True,
    "costos_nota": "Montos por confirmar con la universidad. Sección de ejemplo: la universidad "
    "decide si publica sus costos.",
    "aviso_privacidad": (
        "Texto de ejemplo, pendiente de redacción por la universidad.\n\n"
        "Los datos que escribes en los formularios de este sitio (nombre, correo, teléfono y "
        "mensaje) se usan solo para responder tu consulta y no se comparten con terceros.\n\n"
        "Puedes pedir que se corrijan o eliminen escribiendo al correo de contacto de la "
        "universidad."
    ),
}

CARRERAS = [
    {
        "nombre": "Administración",
        "slug": "administracion",
        "resumen": "Gestión de empresas y organizaciones: finanzas, personal, mercadeo y "
        "emprendimiento.",
        "presentacion": (
            "La carrera de Administración prepara profesionales capaces de planificar, organizar "
            "y dirigir empresas e instituciones, públicas o privadas.\n\n"
            "Es para quien disfruta organizar, tomar decisiones y trabajar con personas, y para "
            "quien sueña con tener su propio negocio."
        ),
        "perfil_egresado": (
            "Planifica y controla el presupuesto de una organización\n"
            "Dirige equipos de trabajo y procesos de selección de personal\n"
            "Diseña planes de mercadeo y ventas\n"
            "Formula y evalúa proyectos de emprendimiento"
        ),
        "campo_laboral": (
            "Empresas privadas de cualquier sector\nInstituciones públicas\nBanca y seguros\n"
            "Emprendimiento propio\nConsultoría"
        ),
        "propio_titulo": "Pasantías y convenios empresariales",
        "propio": "Texto de ejemplo. Aquí se listan las empresas con convenio de pasantías y "
        "las actividades de emprendimiento, si existen.",
        "pensum": [
            ["Introducción a la Administración", "Matemática I", "Contabilidad I",
             "Lenguaje y Comunicación"],
            ["Teoría Administrativa", "Matemática II", "Contabilidad II", "Economía General"],
            ["Administración de Personal", "Estadística I", "Costos", "Derecho Mercantil"],
        ],
    },
    {
        "nombre": "Informática",
        "slug": "informatica",
        "resumen": "Programación, bases de datos, redes y desarrollo de sistemas para "
        "resolver problemas reales.",
        "presentacion": (
            "La carrera de Informática forma profesionales que diseñan, construyen y mantienen "
            "sistemas de información, aplicaciones y redes.\n\n"
            "Es para quien siente curiosidad por cómo funcionan las cosas y le gusta resolver "
            "problemas con lógica y creatividad."
        ),
        "perfil_egresado": (
            "Desarrolla aplicaciones web y móviles\nDiseña y administra bases de datos\n"
            "Instala y mantiene redes de computadoras\n"
            "Analiza procesos y propone soluciones con tecnología"
        ),
        "campo_laboral": (
            "Empresas de desarrollo de software\nDepartamentos de tecnología de cualquier "
            "organización\nSoporte técnico y redes\nTrabajo independiente y remoto"
        ),
        "propio_titulo": "Laboratorio y proyectos de estudiantes",
        "propio": "Texto de ejemplo. Aquí se describe el laboratorio de computación y se "
        "muestran proyectos hechos por estudiantes.",
        "pensum": [
            ["Introducción a la Informática", "Matemática I", "Algoritmos y Programación I",
             "Lenguaje y Comunicación"],
            ["Matemática II", "Algoritmos y Programación II", "Lógica Computacional",
             "Inglés Técnico"],
            ["Estructuras de Datos", "Bases de Datos I", "Arquitectura del Computador",
             "Estadística"],
        ],
    },
    {
        "nombre": "Enfermería",
        "slug": "enfermeria",
        "resumen": "Cuidado integral de la salud de personas, familias y comunidades.",
        "presentacion": (
            "La carrera de Enfermería forma profesionales para el cuidado de la salud en "
            "hospitales, ambulatorios y comunidades.\n\n"
            "Es para quien tiene vocación de servicio, calma ante la presión y deseo de ayudar "
            "a los demás."
        ),
        "perfil_egresado": (
            "Brinda cuidados de enfermería a pacientes de todas las edades\n"
            "Participa en programas de prevención y promoción de la salud\n"
            "Administra tratamientos según indicación médica\n"
            "Educa a pacientes y familias sobre el cuidado de la salud"
        ),
        "campo_laboral": (
            "Hospitales y clínicas\nAmbulatorios y centros de salud comunitarios\n"
            "Atención domiciliaria\nSalud ocupacional en empresas"
        ),
        "propio_titulo": "Prácticas clínicas y convenios",
        "propio": "Texto de ejemplo. Aquí se listan los centros de salud con convenio para las "
        "prácticas clínicas, la sala de simulación y los requisitos de salud para la "
        "admisión, si aplican.",
        "pensum": [
            ["Anatomía y Fisiología I", "Fundamentos de Enfermería", "Química General",
             "Lenguaje y Comunicación"],
            ["Anatomía y Fisiología II", "Microbiología", "Enfermería Básica",
             "Psicología General"],
            ["Farmacología", "Enfermería Médico-Quirúrgica I", "Nutrición", "Salud Pública"],
        ],
    },
]

FOTOS = pathlib.Path(__file__).resolve().parents[2] / "fotos_ejemplo"
DESCRIPCIONES = json.loads((FOTOS / "descripciones.json").read_text(encoding="utf-8"))


def foto(nombre: str) -> tuple[ContentFile, str]:
    """Foto de dominio público de referencia (ver fotos_ejemplo/CREDITOS.md)."""
    return ContentFile((FOTOS / f"{nombre}.webp").read_bytes()), DESCRIPCIONES[nombre]


NOTICIAS = [
    ("Presentamos el nuevo sitio web de la universidad", "nuevo-sitio-web", 1, "noticia-sitio-web",
     "Desde hoy, aspirantes, estudiantes y familias encuentran en un solo lugar las carreras, "
     "el proceso de admisión y las noticias de la institución."),
    ("Abierto el proceso de admisión", "abierto-proceso-de-admision", 4, "noticia-admision",
     "Noticia de ejemplo. Conoce los requisitos y pide información sobre la carrera que te "
     "interesa."),
    ("Jornada de puertas abiertas", "jornada-de-puertas-abiertas", 9, "noticia-puertas-abiertas",
     "Noticia de ejemplo. Visita la sede, conoce a los docentes y resuelve tus dudas sobre "
     "las carreras."),
    ("Bienvenida a los nuevos estudiantes", "bienvenida-nuevos-estudiantes", 15,
     "noticia-bienvenida",
     "Noticia de ejemplo. Damos la bienvenida a la primera cohorte de estudiantes de "
     "Administración, Informática y Enfermería."),
    ("Prácticas clínicas para Enfermería", "practicas-clinicas-enfermeria", 22,
     "noticia-practicas",
     "Noticia de ejemplo. Los estudiantes de Enfermería realizarán sus prácticas en centros de "
     "salud con convenio."),
]

# Una noticia en revisión: no se ve en el sitio, pero muestra el flujo en el panel.
NOTICIAS += [
    ("Así es el laboratorio de computación", "laboratorio-de-computacion", 28,
     "laboratorio-computacion",
     "Noticia de ejemplo. Un recorrido por el espacio donde los estudiantes de Informática "
     "programan, arman redes y prueban sus proyectos."),
    ("Charla de orientación vocacional para bachilleres", "charla-orientacion-vocacional", 35,
     "auditorio",
     "Noticia de ejemplo. Docentes de las tres carreras respondieron las dudas de estudiantes de "
     "quinto año y sus familias."),
    ("Jornada de estudio en la biblioteca", "jornada-de-estudio-biblioteca", 41, "vida-biblioteca",
     "Noticia de ejemplo. La biblioteca amplía su horario en semana de evaluaciones."),
]

# Foto de cabecera de cada sección (editable en Panel › Fotos de sección).
FOTOS_SECCION = {
    "universidad": "estudiante-cuaderno",
    "carreras": "laboratorio-computacion",
    "admision": "vida-clase",
    "noticias": "auditorio",
    "normativa": "aula-vacia",
    "contacto": "sede-campus",
    "buscar": "laboratorio-equipos",
}

FOTOS_CARRERA = {
    "administracion": ["vida-estudio", "noticia-sitio-web", "sede-sala-estudio", "vida-clase"],
    "informatica": ["laboratorio-computacion", "estudiante-electronica", "laboratorio-equipos",
                    "vida-portatil"],
    "enfermeria": ["clase-enfermeria", "enfermeria-practica", "estudiantes-microscopio",
                   "noticia-practicas"],
}

NOTICIA_EN_REVISION = (
    "Convenio con centros de salud de la región", "convenio-centros-de-salud",
    "Noticia de ejemplo en revisión: un aprobador debe publicarla o devolverla.",
)

# (días desde hoy, hora, duración en horas, nombre, lugar)
EVENTOS = [
    (3, 10, 2, "Charla: ¿qué carrera elegir? (ejemplo)", "Auditorio"),
    (7, 9, 3, "Jornada de puertas abiertas (ejemplo)", "Sede principal"),
    (12, 14, 2, "Taller de introducción a la programación (ejemplo)", "Laboratorio de computación"),
    (18, 9, 4, "Feria de emprendimiento (ejemplo)", "Áreas comunes"),
    (21, 10, 2, "Charla de orientación vocacional (ejemplo)", "Auditorio"),
    (26, 8, 3, "Jornada de salud comunitaria (ejemplo)", "Sede principal"),
    (34, 9, 2, "Entrega de documentos de admisión (ejemplo)", "Control de estudios"),
    (40, 8, 4, "Inicio de clases (ejemplo)", "Sede principal"),
]

# (días desde hoy de inicio, días de duración o None, título, descripción)
FECHAS_ADMISION = [
    (0, 30, "Solicitudes de información y orientación (ejemplo)",
     "Escríbenos o visítanos para conocer las carreras."),
    (14, 20, "Recepción de documentos (ejemplo)", "Trae los requisitos a la sede."),
    (34, None, "Publicación de admitidos (ejemplo)", "En la sección de Avisos."),
    (40, None, "Inicio de clases (ejemplo)", ""),
]

COSTOS = [
    ("Inscripción", POR_CONFIRMAR, "Pago único al formalizar la inscripción."),
    ("Matrícula por semestre", POR_CONFIRMAR, ""),
    ("Constancia de estudios", POR_CONFIRMAR, ""),
]

PASOS = [
    ("Reúne los requisitos", "Prepara los documentos de la lista de requisitos. Si te falta "
     "alguno, pregúntanos: te orientamos."),
    ("Solicita información", "Completa el formulario de solicitud o visítanos en la sede. Te "
     "contamos las fechas y los pasos para tu carrera."),
    ("Formaliza tu inscripción", "Entrega tus documentos en la sede en las fechas indicadas y "
     "recibe tu constancia de inscripción."),
]

PREGUNTAS = [
    ("¿Cuándo abren las inscripciones?", "Las fechas se publican en la página de Admisión y en "
     "Avisos. Respuesta de ejemplo: la universidad confirma el calendario."),
    ("¿Las carreras son presenciales?", "Respuesta de ejemplo. La modalidad de cada carrera "
     "aparece en su ficha, en la sección Carreras."),
    ("¿Necesito estar registrado en el Sistema Nacional de Ingreso?", "Respuesta de ejemplo, "
     "pendiente de confirmar con la universidad."),
    ("¿Dónde pido más información?", "Puedes usar el formulario «Solicitar información», "
     "escribirnos desde Contacto o visitarnos en la sede en el horario de atención."),
]

CATEGORIAS = [
    ("Reglamentos", "reglamentos", "Normas que rigen la vida universitaria.",
     ["Reglamento de evaluación (ejemplo)", "Reglamento estudiantil (ejemplo)"]),
    ("Documentos legales", "documentos-legales", "Autorización de funcionamiento y datos "
     "legales de la institución.", ["Autorización de funcionamiento (ejemplo)"]),
    ("Formatos descargables", "formatos", "Planillas y solicitudes para trámites.",
     ["Planilla de inscripción (ejemplo)", "Solicitud de constancia de estudios (ejemplo)"]),
]

# Sin fotos a propósito: poner la cara de una persona real como si fuera una autoridad
# de la universidad sería engañoso. Se muestran como «Foto pendiente».
AUTORIDADES = ["Rector(a)", "Vicerrector(a) Académico(a)", "Vicerrector(a) Administrativo(a)",
               "Secretario(a) General"]

ALBUMES = [
    ("Nuestra sede (fotos de referencia)",
     "Fotos de referencia de dominio público. Se reemplazan por fotos reales de la sede.",
     ["auditorio", "sede-campus", "sede-aula", "sede-biblioteca", "sede-laboratorio",
      "sede-sala-estudio"]),
    ("Vida estudiantil (fotos de referencia)",
     "Fotos de referencia de dominio público. Se reemplazan por fotos de actividades reales.",
     ["vida-clase", "vida-auditorio", "vida-estudio", "vida-biblioteca", "vida-portatil",
      "vida-lectura"]),
    ("Espacios de estudio (fotos de referencia)",
     "Fotos de referencia de dominio público: aulas, laboratorios y biblioteca.",
     ["laboratorio-equipos", "aula-vacia", "estudiante-electronica",
      "estudiantes-microscopio", "clase-enfermeria", "enfermeria-practica", "estudiantes-campo"]),
]

PUBLICADA = m.Estado.PUBLICADA


class Command(BaseCommand):
    help = "Carga contenido de ejemplo (marcado como tal) para presentar el sitio."

    def add_arguments(self, parser):
        parser.add_argument("--reiniciar", action="store_true",
                            help="Borra todo el contenido del sitio antes de cargar el ejemplo.")

    @transaction.atomic
    def handle(self, *args, reiniciar=False, **opciones):
        if reiniciar:
            for modelo in [m.Foto, m.Album, m.Documento, m.CategoriaDocumento, m.Autoridad,
                           m.Aviso, m.Evento, m.Noticia, m.AsignaturaPensum, m.Carrera,
                           m.PasoAdmision, m.PreguntaFrecuente, m.FechaAdmision,
                           m.CostoAdmision, m.FotoSeccion, m.DatosGenerales]:
                modelo.objects.all().delete()

        ahora = timezone.now()
        hoy = timezone.localdate()

        datos, _ = m.DatosGenerales.objects.update_or_create(pk=1, defaults=DATOS_GENERALES)
        if not datos.foto_portada:
            archivo, descripcion = foto("sala-lectura")
            datos.foto_portada_descripcion = f"{descripcion} (foto de referencia)"
            datos.foto_portada.save("portada.webp", archivo)

        for seccion, nombre in FOTOS_SECCION.items():
            if not m.FotoSeccion.objects.filter(seccion=seccion).exists():
                archivo, descripcion = foto(nombre)
                fs = m.FotoSeccion(
                    seccion=seccion, descripcion=f"{descripcion} (foto de referencia)"
                )
                fs.imagen.save(f"{nombre}.webp", archivo, save=False)
                fs.save()

        for orden, datos_carrera in enumerate(CARRERAS):
            datos_carrera = dict(datos_carrera)
            pensum = datos_carrera.pop("pensum")
            carrera, creada = m.Carrera.objects.get_or_create(slug=datos_carrera["slug"], defaults={
                **datos_carrera, "orden": orden, "titulo_otorgado": POR_CONFIRMAR,
                "duracion": POR_CONFIRMAR, "modalidad": POR_CONFIRMAR, "turno": POR_CONFIRMAR,
                "pensum_es_ejemplo": True,
            })
            if not carrera.imagen:
                archivo, descripcion = foto(f"carrera-{carrera.slug}")
                carrera.imagen_descripcion = descripcion
                carrera.imagen.save(f"{carrera.slug}.webp", archivo)
            if creada:
                carrera.pensum_pdf.save(
                    f"pensum-{carrera.slug}-ejemplo.pdf",
                    pdf_de_ejemplo(f"Pensum de {carrera.nombre}"),
                )
                prefijo = carrera.slug[:3].upper()
                for semestre, asignaturas in enumerate(pensum, start=1):
                    for i, nombre in enumerate(asignaturas, start=1):
                        m.AsignaturaPensum.objects.create(
                            carrera=carrera, semestre=semestre, nombre=nombre, orden=i,
                            codigo=f"{prefijo}-{semestre}0{i}",
                            unidades_credito=4 if i <= 2 else 3,
                        )

        cuerpo = (
            "\n\nTexto de ejemplo. Aquí va el cuerpo completo de la noticia, escrito por el "
            "personal de la universidad desde el panel.\n\nCada párrafo se separa con una línea "
            "en blanco, y el sitio se encarga del diseño."
        )
        for titulo, slug, dias, nombre_foto, resumen in NOTICIAS:
            noticia, _ = m.Noticia.objects.get_or_create(slug=slug, defaults={
                "titulo": titulo, "resumen": resumen, "fecha": ahora - timedelta(days=dias),
                "estado": PUBLICADA, "cuerpo": resumen + cuerpo,
            })
            if not noticia.imagen:
                archivo, descripcion = foto(nombre_foto)
                noticia.imagen_descripcion = descripcion
                noticia.imagen.save(f"{slug}.webp", archivo)

        titulo, slug, resumen = NOTICIA_EN_REVISION
        m.Noticia.objects.get_or_create(slug=slug, defaults={
            "titulo": titulo, "resumen": resumen, "cuerpo": resumen + cuerpo,
            "estado": m.Estado.REVISION,
        })

        if not m.Evento.objects.exists():
            for dias, hora, duracion, nombre, lugar in EVENTOS:
                inicio = timezone.make_aware(
                    datetime.combine(hoy + timedelta(days=dias), time(hora))
                )
                m.Evento.objects.create(
                    nombre=nombre, inicio=inicio, fin=inicio + timedelta(hours=duracion),
                    lugar=lugar, estado=PUBLICADA,
                    descripcion="Evento de ejemplo. Aquí va la descripción del evento.",
                )

        if not m.Aviso.objects.exists():
            m.Aviso.objects.create(
                texto="Aviso de ejemplo: el proceso de admisión está abierto.",
                enlace="/admision", vence_en=hoy + timedelta(days=30), en_portada=True,
                estado=PUBLICADA,
            )

        if not m.Autoridad.objects.exists():
            for orden, cargo in enumerate(AUTORIDADES):
                m.Autoridad.objects.create(
                    nombre=f"Nombre {POR_CONFIRMAR.lower()}", cargo=cargo, orden=orden,
                    resena="Reseña de ejemplo: formación y trayectoria de la autoridad.",
                )

        for orden, (nombre, slug, descripcion, documentos) in enumerate(CATEGORIAS):
            categoria, creada = m.CategoriaDocumento.objects.get_or_create(
                slug=slug, defaults={"nombre": nombre, "descripcion": descripcion, "orden": orden}
            )
            if creada:
                for nombre_doc in documentos:
                    doc = m.Documento(nombre=nombre_doc, categoria=categoria, estado=PUBLICADA,
                                      descripcion="Documento de ejemplo.")
                    doc.archivo.save(f"{nombre_doc[:40]}.pdf", pdf_de_ejemplo(nombre_doc),
                                     save=False)
                    doc.save()

        if not m.Album.objects.exists():
            for i, (titulo, descripcion, nombres) in enumerate(ALBUMES):
                album = m.Album.objects.create(
                    titulo=titulo, descripcion=descripcion, fecha=hoy - timedelta(days=i * 10)
                )
                for orden, nombre in enumerate(nombres):
                    archivo, texto = foto(nombre)
                    f = m.Foto(album=album, descripcion=texto, orden=orden)
                    f.imagen.save(f"{nombre}.webp", archivo, save=False)
                    f.save()

        # Un álbum por carrera: sus fotos salen en la página de la carrera y en la galería.
        for slug, nombres in FOTOS_CARRERA.items():
            carrera = m.Carrera.objects.filter(slug=slug).first()
            if carrera and not carrera.album:
                album = m.Album.objects.create(
                    titulo=f"{carrera.nombre} (fotos de referencia)",
                    descripcion="Fotos de referencia de dominio público. Se reemplazan por fotos "
                    "reales de la carrera.", fecha=hoy - timedelta(days=30),
                )
                for orden, nombre in enumerate(nombres):
                    archivo, texto = foto(nombre)
                    f = m.Foto(album=album, descripcion=texto, orden=orden)
                    f.imagen.save(f"{slug}-{nombre}.webp", archivo, save=False)
                    f.save()
                carrera.album = album
                carrera.save(update_fields=["album"])

        if not m.PasoAdmision.objects.exists():
            for orden, (titulo, descripcion) in enumerate(PASOS):
                m.PasoAdmision.objects.create(titulo=titulo, descripcion=descripcion, orden=orden)

        if not m.PreguntaFrecuente.objects.exists():
            for orden, (pregunta, respuesta) in enumerate(PREGUNTAS):
                m.PreguntaFrecuente.objects.create(
                    pregunta=pregunta, respuesta=respuesta, orden=orden
                )

        if not m.FechaAdmision.objects.exists():
            for dias, duracion, titulo, descripcion in FECHAS_ADMISION:
                inicio = hoy + timedelta(days=dias)
                m.FechaAdmision.objects.create(
                    titulo=titulo, inicio=inicio, descripcion=descripcion,
                    fin=inicio + timedelta(days=duracion) if duracion else None,
                )

        if not m.CostoAdmision.objects.exists():
            for orden, (concepto, monto, nota) in enumerate(COSTOS):
                m.CostoAdmision.objects.create(concepto=concepto, monto=monto, nota=nota,
                                               orden=orden)

        self.stdout.write(self.style.SUCCESS(
            "Contenido de ejemplo listo. Recuerda desmarcar «mostrar aviso de demostración» "
            "en Datos generales cuando cargues el contenido oficial."
        ))
