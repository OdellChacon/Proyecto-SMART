"""Sitio público: API de contenido, buscador y formularios."""

from datetime import timedelta

import pytest
from django.core import mail
from django.utils import timezone

from apps.contenido import models as m
from apps.formularios.models import MensajeContacto, SolicitudInformacion

pytestmark = pytest.mark.django_db
P = m.Estado.PUBLICADA


@pytest.fixture
def carrera():
    c = m.Carrera.objects.create(nombre="Enfermería", slug="enfermeria", resumen="Salud")
    m.AsignaturaPensum.objects.create(carrera=c, semestre=2, codigo="E-201", nombre="Farmacología",
                                      unidades_credito=3)
    m.AsignaturaPensum.objects.create(carrera=c, semestre=1, codigo="E-101", nombre="Anatomía",
                                      unidades_credito=4)
    m.AsignaturaPensum.objects.create(carrera=c, semestre=1, codigo="E-102", nombre="Química",
                                      unidades_credito=3)
    return c


def noticia(slug, **extra):
    datos = {"titulo": slug, "slug": slug, "resumen": "r", "cuerpo": "c",
             "estado": m.Noticia.Estado.PUBLICADA, "fecha": timezone.now() - timedelta(hours=1)}
    return m.Noticia.objects.create(**{**datos, **extra})


# --- Contenido ---------------------------------------------------------------

def test_datos_generales_es_registro_unico(api):
    m.DatosGenerales.objects.create(nombre="Uno", telefonos="0414\n\n0212 ", valores="Ética: ser")
    m.DatosGenerales.objects.create(nombre="Dos")
    assert m.DatosGenerales.objects.count() == 1
    r = api.get("/api/v1/sitio/")
    assert r.status_code == 200
    assert r.data["nombre"] == "Dos"
    assert r["Cache-Control"].startswith("public")


def test_lineas_y_valores_se_entregan_como_listas(api):
    m.DatosGenerales.objects.create(nombre="U", telefonos="0414\n\n 0212 ",
                                    valores="Ética: actuar bien\nServicio")
    d = api.get("/api/v1/sitio/").data
    assert d["telefonos"] == ["0414", "0212"]
    assert d["valores"] == [{"nombre": "Ética", "descripcion": "actuar bien"},
                            {"nombre": "Servicio", "descripcion": ""}]


def test_carrera_trae_pensum_agrupado_por_semestre(api, carrera):
    r = api.get("/api/v1/carreras/enfermeria/")
    assert r.status_code == 200
    pensum = r.data["pensum"]
    assert [s["semestre"] for s in pensum] == [1, 2]
    assert [a["codigo"] for a in pensum[0]["asignaturas"]] == ["E-101", "E-102"]
    assert pensum[0]["total_uc"] == 7


def test_carrera_no_publicada_no_existe(api, carrera):
    carrera.publicada = False
    carrera.save()
    assert api.get("/api/v1/carreras/enfermeria/").status_code == 404
    assert api.get("/api/v1/carreras/").data == []


def test_noticias_solo_publicadas_y_con_fecha_cumplida(api):
    noticia("visible")
    noticia("borrador", estado=m.Noticia.Estado.BORRADOR)
    noticia("programada", fecha=timezone.now() + timedelta(days=1))
    r = api.get("/api/v1/noticias/")
    assert [n["slug"] for n in r.data["results"]] == ["visible"]
    assert api.get("/api/v1/noticias/programada/").status_code == 404


def test_noticias_paginadas_mas_recientes_primero(api):
    for i in range(11):
        noticia(f"n{i}", fecha=timezone.now() - timedelta(days=i))
    r = api.get("/api/v1/noticias/")
    assert r.data["count"] == 11
    assert len(r.data["results"]) == 9
    assert r.data["results"][0]["slug"] == "n0"
    assert len(api.get("/api/v1/noticias/?page=2").data["results"]) == 2


def test_eventos_desde_una_fecha_incluye_los_en_curso(api):
    ahora = timezone.now()
    m.Evento.objects.create(nombre="pasado", inicio=ahora - timedelta(days=5), estado=P)
    m.Evento.objects.create(nombre="en curso", inicio=ahora - timedelta(days=2),
                            fin=ahora + timedelta(days=2), estado=P)
    m.Evento.objects.create(nombre="futuro", inicio=ahora + timedelta(days=3), estado=P)
    nombres = [e["nombre"] for e in api.get("/api/v1/eventos/").data]
    assert nombres == ["en curso", "futuro"]
    assert api.get("/api/v1/eventos/?desde=mañana").data["codigo"] == "fecha_invalida"


def test_avisos_vencidos_no_se_muestran(api):
    hoy = timezone.localdate()
    m.Aviso.objects.create(texto="hoy vence", vence_en=hoy, estado=P)
    m.Aviso.objects.create(texto="vencido", vence_en=hoy - timedelta(days=1), estado=P)
    m.Aviso.objects.create(texto="fuera de portada", vence_en=hoy, en_portada=False, estado=P)
    assert [a["texto"] for a in api.get("/api/v1/avisos/?portada=true").data] == ["hoy vence"]
    assert len(api.get("/api/v1/avisos/").data) == 2


def test_avisos_dicen_cuantos_dias_quedan(api):
    hoy = timezone.localdate()
    m.Aviso.objects.create(texto="hoy", vence_en=hoy, estado=P)
    m.Aviso.objects.create(texto="semana", vence_en=hoy + timedelta(days=7), estado=P)
    dias = {a["texto"]: a["dias_restantes"] for a in api.get("/api/v1/avisos/").data}
    assert dias == {"hoy": 0, "semana": 7}


def test_documentos_por_categoria(api):
    reg = m.CategoriaDocumento.objects.create(nombre="Reglamentos", slug="reglamentos", orden=0)
    fmt = m.CategoriaDocumento.objects.create(nombre="Formatos", slug="formatos", orden=1)
    m.Documento.objects.create(nombre="Evaluación", categoria=reg, estado=P)
    m.Documento.objects.create(nombre="Oculto", categoria=reg, estado="borrador")
    m.Documento.objects.create(nombre="Planilla", categoria=fmt, estado=P)
    r = api.get("/api/v1/documentos/?categoria=reglamentos")
    assert [d["nombre"] for d in r.data] == ["Evaluación"]
    assert api.get("/api/v1/documentos/?categoria=no-existe").status_code == 404
    categorias = api.get("/api/v1/documentos/categorias/").data
    assert [(c["slug"], c["total"]) for c in categorias] == [("reglamentos", 1), ("formatos", 1)]


def test_buscador_no_distingue_acentos(api, carrera):
    noticia("admision-abierta", titulo="Abierta la admisión")
    r = api.get("/api/v1/buscar/?q=admision")
    assert [n["slug"] for n in r.data["noticias"]] == ["admision-abierta"]
    assert any(p["url"] == "/admision" for p in r.data["paginas"])
    assert [c["slug"] for c in api.get("/api/v1/buscar/?q=ENFERMERIA").data["carreras"]] == [
        "enfermeria"
    ]
    assert api.get("/api/v1/buscar/?q=a").data["codigo"] == "busqueda_corta"


# --- Formularios -------------------------------------------------------------

def test_solicitud_de_informacion_se_guarda_y_avisa(api, carrera):
    r = api.post("/api/v1/solicitudes-informacion/", {
        "nombre": "Luis", "correo": "luis@correo.com", "telefono": "+58 414-000 0000",
        "carrera": "enfermeria", "mensaje": "¿Cuándo empiezan?", "acepta_privacidad": True,
    }, format="json")
    assert r.status_code == 201, r.data
    s = SolicitudInformacion.objects.get()
    assert s.carrera == carrera
    assert len(mail.outbox) == 1
    aviso = mail.outbox[0]
    assert aviso.to == ["admision@prueba.test"]
    assert aviso.reply_to == ["luis@correo.com"]
    assert "Enfermería" in aviso.body and "¿Cuándo empiezan?" in aviso.body


@pytest.mark.parametrize("cambio, campo", [
    ({"acepta_privacidad": False}, "acepta_privacidad"),
    ({"correo": "no-es-correo"}, "correo"),
    ({"carrera": "medicina"}, "carrera"),
    ({"telefono": "llámame"}, "telefono"),
    ({"nombre": ""}, "nombre"),
])
def test_solicitud_valida_en_el_servidor(api, carrera, cambio, campo):
    datos = {"nombre": "Luis", "correo": "luis@correo.com", "acepta_privacidad": True, **cambio}
    r = api.post("/api/v1/solicitudes-informacion/", datos, format="json")
    assert r.status_code == 400
    assert campo in r.data["errores"]
    assert not SolicitudInformacion.objects.exists()


def test_contacto_se_guarda_y_avisa(api):
    r = api.post("/api/v1/contacto/", {
        "nombre": "Ana & Co", "correo": "ana@correo.com", "asunto": "Horarios",
        "mensaje": "Quisiera saber el horario de atención.", "acepta_privacidad": True,
    }, format="json")
    assert r.status_code == 201, r.data
    assert MensajeContacto.objects.get().asunto == "Horarios"
    assert "Ana & Co" in mail.outbox[0].body  # texto plano: sin escapar como HTML


def test_formulario_exige_csrf():
    from rest_framework.test import APIClient

    cliente = APIClient(enforce_csrf_checks=True)
    r = cliente.post("/api/v1/contacto/", {"nombre": "x"}, format="json")
    assert r.status_code == 403
    assert r.json()["codigo"] == "csrf"


def test_formulario_rechaza_si_falla_el_antispam(api, settings, monkeypatch):
    from apps.formularios import turnstile

    settings.TURNSTILE_SECRET_KEY = "secreto"
    monkeypatch.setattr(turnstile, "verificar", lambda token, ip: token == "valido")
    datos = {"nombre": "Ana", "correo": "ana@correo.com", "asunto": "Hola",
             "mensaje": "Un mensaje de prueba.", "acepta_privacidad": True}
    r = api.post("/api/v1/contacto/", {**datos, "turnstile": "falso"}, format="json")
    assert r.status_code == 400 and r.data["codigo"] == "antispam"
    assert not MensajeContacto.objects.exists()
    assert api.post("/api/v1/contacto/", {**datos, "turnstile": "valido"},
                    format="json").status_code == 201


def test_formularios_tienen_limite_por_ip(api):
    datos = {"nombre": "Ana", "correo": "ana@correo.com", "asunto": "Hola",
             "mensaje": "Un mensaje de prueba.", "acepta_privacidad": True}
    codigos = [api.post("/api/v1/contacto/", datos, format="json").status_code for _ in range(11)]
    assert codigos[:10] == [201] * 10
    assert codigos[10] == 429


def test_contenido_de_ejemplo_se_carga_y_es_idempotente(settings, tmp_path):
    from django.core.management import call_command

    settings.MEDIA_ROOT = tmp_path
    call_command("cargar_contenido_ejemplo")
    call_command("cargar_contenido_ejemplo")
    assert m.Carrera.objects.count() == 3
    assert m.Noticia.objects.count() == 9
    assert m.Noticia.objects.publicadas().count() == 8
    assert m.DatosGenerales.cargar().foto_portada
    assert m.DatosGenerales.cargar().es_demostracion
    assert all(c.pensum_es_ejemplo for c in m.Carrera.objects.all())


# --- Datos para el diseño: cifras, fotos de sección y álbum de la carrera ----

def _imagen():
    import io

    from django.core.files.base import ContentFile
    from PIL import Image

    salida = io.BytesIO()
    Image.new("RGB", (800, 600), "green").save(salida, "JPEG")
    return ContentFile(salida.getvalue())


def test_sitio_trae_cifras_y_fotos_de_seccion(api, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    m.DatosGenerales.objects.create(nombre="U", cifras="3: carreras\nsin etiqueta\n60: estudiantes")
    fs = m.FotoSeccion(seccion="carreras", descripcion="Laboratorio")
    fs.imagen.save("lab.jpg", _imagen(), save=False)
    fs.save()
    d = api.get("/api/v1/sitio/").data
    assert d["cifras"] == [{"valor": "3", "etiqueta": "carreras"},
                           {"valor": "60", "etiqueta": "estudiantes"}]
    assert d["fotos_seccion"]["carreras"]["descripcion"] == "Laboratorio"
    assert d["fotos_seccion"]["carreras"]["imagen"]["mediana"].endswith("-960.webp")


def test_carrera_muestra_las_fotos_de_su_album(api, settings, tmp_path, carrera):
    settings.MEDIA_ROOT = tmp_path
    album = m.Album.objects.create(titulo="Enfermería")
    f = m.Foto(album=album, descripcion="Práctica", orden=0)
    f.imagen.save("p.jpg", _imagen(), save=False)
    f.save()
    # Las medidas se generan al guardar, no en la primera visita.
    assert list((tmp_path / "variantes" / "galeria").glob("*-480.webp"))
    carrera.album = album
    carrera.save()
    assert [x["descripcion"] for x in api.get("/api/v1/carreras/enfermeria/").data["fotos"]] == [
        "Práctica"
    ]
    album.publicado = False
    album.save()
    assert api.get("/api/v1/carreras/enfermeria/").data["fotos"] == []
