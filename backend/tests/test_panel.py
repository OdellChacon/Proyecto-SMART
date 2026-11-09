"""Panel: roles Editor y Aprobador, flujo de publicación e imágenes en varias medidas."""

import io

import pytest
from django.contrib.auth.models import Group
from django.core import mail
from django.core.files.base import ContentFile
from django.test import Client
from django.utils import timezone
from PIL import Image

from apps.contenido import flujo
from apps.contenido import models as m
from apps.contenido.models import Estado
from apps.usuarios.models import Usuario

pytestmark = pytest.mark.django_db
CLAVE = "Clave-Segura-2026"
URL_NOTICIAS = "/admin/contenido/noticia/"


def persona(email, grupo=None, **extra):
    u = Usuario.objects.create_user(email=email, password=CLAVE, nombres=email.split("@")[0],
                                    apellidos="Prueba", is_staff=True, correo_verificado=True,
                                    **extra)
    if grupo:
        u.groups.add(Group.objects.get(name=grupo))
    return u


@pytest.fixture
def editor():
    return persona("editor@prueba.test", flujo.GRUPO_EDITOR)


@pytest.fixture
def aprobador():
    return persona("aprobador@prueba.test", flujo.GRUPO_APROBADOR)


def cliente(usuario):
    c = Client()
    c.force_login(usuario)
    return c


def datos_noticia(**extra):
    ahora = timezone.localtime()
    return {
        "titulo": "Nueva noticia", "slug": "nueva-noticia", "resumen": "Resumen",
        "cuerpo": "Cuerpo", "imagen_descripcion": "", "fecha_0": ahora.strftime("%d/%m/%Y"),
        "fecha_1": ahora.strftime("%H:%M:%S"), "estado": "borrador", **extra,
    }


def test_grupos_del_panel_existen_con_permisos():
    editor = Group.objects.get(name=flujo.GRUPO_EDITOR)
    aprobador = Group.objects.get(name=flujo.GRUPO_APROBADOR)
    assert editor.permissions.filter(codename="add_noticia").exists()
    assert not editor.permissions.filter(codename="change_datosgenerales").exists()
    assert aprobador.permissions.filter(codename="change_datosgenerales").exists()
    # Nadie de contenido gestiona usuarios.
    assert not aprobador.permissions.filter(codename__endswith="_usuario").exists()


def test_editor_no_puede_publicar_si_se_exige_aprobacion(editor):
    m.DatosGenerales.objects.create(nombre="U", aprobar_noticias=True)
    c = cliente(editor)
    r = c.post(f"{URL_NOTICIAS}add/", datos_noticia(estado="publicada"))
    assert r.status_code == 200  # el formulario vuelve con error
    assert not m.Noticia.objects.exists()


def test_editor_publica_directo_donde_no_se_exige(editor):
    m.DatosGenerales.objects.create(nombre="U", aprobar_noticias=False)
    r = cliente(editor).post(f"{URL_NOTICIAS}add/", datos_noticia(estado="publicada"))
    assert r.status_code == 302
    n = m.Noticia.objects.get()
    assert n.estado == Estado.PUBLICADA
    assert n.creado_por == editor


def test_enviar_a_revision_avisa_a_los_aprobadores(editor, aprobador):
    m.DatosGenerales.objects.create(nombre="U", aprobar_noticias=True)
    r = cliente(editor).post(f"{URL_NOTICIAS}add/", datos_noticia(estado="revision"))
    assert r.status_code == 302
    assert m.Noticia.objects.get().estado == Estado.REVISION
    assert mail.outbox[0].to == ["aprobador@prueba.test"]
    assert "Pendiente de revisión" in mail.outbox[0].subject


def test_aprobador_devuelve_con_comentario_y_avisa_al_autor(editor, aprobador):
    m.DatosGenerales.objects.create(nombre="U")
    n = m.Noticia.objects.create(titulo="T", slug="t", resumen="r", cuerpo="c",
                                 estado=Estado.REVISION, creado_por=editor)
    c = cliente(aprobador)
    url = f"{URL_NOTICIAS}{n.pk}/change/"
    sin_comentario = c.post(url, datos_noticia(titulo="T", slug="t", estado="devuelta"))
    assert sin_comentario.status_code == 200
    n.refresh_from_db()
    assert n.estado == Estado.REVISION

    r = c.post(url, datos_noticia(titulo="T", slug="t", estado="devuelta",
                                  comentario_revision="Falta la foto."))
    assert r.status_code == 302
    n.refresh_from_db()
    assert (n.estado, n.revisado_por) == (Estado.DEVUELTA, aprobador)
    assert mail.outbox[-1].to == ["editor@prueba.test"]
    assert "Falta la foto." in mail.outbox[-1].body


def test_accion_aprobar_solo_para_aprobadores(editor, aprobador):
    m.DatosGenerales.objects.create(nombre="U")
    n = m.Noticia.objects.create(titulo="T", slug="t", resumen="r", cuerpo="c",
                                 estado=Estado.REVISION, creado_por=editor)
    datos = {"action": "aprobar_y_publicar", "_selected_action": [n.pk]}
    cliente(editor).post(URL_NOTICIAS, datos)
    n.refresh_from_db()
    assert n.estado == Estado.REVISION

    cliente(aprobador).post(URL_NOTICIAS, datos)
    n.refresh_from_db()
    assert n.estado == Estado.PUBLICADA


def test_editor_solo_borra_sus_borradores(editor):
    m.DatosGenerales.objects.create(nombre="U")
    otro = persona("otro@prueba.test", flujo.GRUPO_EDITOR)
    mio = m.Noticia.objects.create(titulo="A", slug="a", resumen="r", cuerpo="c",
                                   creado_por=editor)
    ajeno = m.Noticia.objects.create(titulo="B", slug="b", resumen="r", cuerpo="c",
                                     creado_por=otro)
    publicado = m.Noticia.objects.create(titulo="C", slug="c", resumen="r", cuerpo="c",
                                         creado_por=editor, estado=Estado.PUBLICADA)
    c = cliente(editor)
    assert c.get(f"{URL_NOTICIAS}{mio.pk}/delete/").status_code == 200
    assert c.get(f"{URL_NOTICIAS}{ajeno.pk}/delete/").status_code == 403
    assert c.get(f"{URL_NOTICIAS}{publicado.pk}/delete/").status_code == 403


def test_editor_no_edita_datos_generales_ni_usuarios(editor, aprobador):
    m.DatosGenerales.objects.create(nombre="U")
    c = cliente(editor)
    assert c.get("/admin/contenido/datosgenerales/1/change/").status_code == 403
    assert c.get("/admin/usuarios/usuario/").status_code == 403
    assert cliente(aprobador).get("/admin/contenido/datosgenerales/1/change/").status_code == 200
    assert cliente(aprobador).get("/admin/usuarios/usuario/").status_code == 403


def test_inicio_del_panel_muestra_pendientes(aprobador):
    m.DatosGenerales.objects.create(nombre="U")
    m.Noticia.objects.create(titulo="T", slug="t", resumen="r", cuerpo="c",
                             estado=Estado.REVISION)
    html = cliente(aprobador).get("/admin/").content.decode()
    assert "Flujo de publicación" in html and "1 espera tu revisión" in html


def test_contenido_en_revision_no_se_ve_en_el_sitio(api):
    hoy = timezone.localdate()
    m.Aviso.objects.create(texto="publicado", vence_en=hoy, estado=Estado.PUBLICADA)
    m.Aviso.objects.create(texto="en revisión", vence_en=hoy, estado=Estado.REVISION)
    assert [a["texto"] for a in api.get("/api/v1/avisos/").data] == ["publicado"]


def test_imagenes_en_varias_medidas_webp(api, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    salida = io.BytesIO()
    Image.new("RGB", (2400, 1600), "navy").save(salida, "JPEG")
    c = m.Carrera.objects.create(nombre="Informática", slug="informatica")
    c.imagen.save("foto.jpg", ContentFile(salida.getvalue()))

    img = api.get("/api/v1/carreras/").data[0]["imagen"]
    assert (img["ancho"], img["alto"]) == (2400, 1600)
    for medida, ancho in [("miniatura", 480), ("mediana", 960), ("grande", 1600)]:
        assert img[medida].endswith(f"-{ancho}.webp")
        archivo = tmp_path / img[medida].removeprefix("/media/")
        with Image.open(archivo) as variante:
            assert variante.format == "WEBP" and variante.width == ancho


def test_admision_trae_fechas_vigentes_y_costos_solo_si_se_publican(api):
    hoy = timezone.localdate()
    datos = m.DatosGenerales.objects.create(nombre="U", publicar_costos=False)
    m.FechaAdmision.objects.create(titulo="Pasada", inicio=hoy.replace(year=hoy.year - 1))
    m.FechaAdmision.objects.create(titulo="Próxima", inicio=hoy)
    m.CostoAdmision.objects.create(concepto="Inscripción", monto="10 USD")
    r = api.get("/api/v1/admision/").data
    assert [f["titulo"] for f in r["fechas"]] == ["Próxima"]
    assert r["costos"] == []
    datos.publicar_costos = True
    datos.save()
    assert api.get("/api/v1/admision/").data["costos"][0]["monto"] == "10 USD"


def test_eventos_por_mes(api):
    inicio = timezone.make_aware(timezone.datetime(2030, 3, 10, 9))
    m.Evento.objects.create(nombre="marzo", inicio=inicio, estado=Estado.PUBLICADA)
    m.Evento.objects.create(nombre="abril", inicio=inicio.replace(month=4),
                            estado=Estado.PUBLICADA)
    r = api.get("/api/v1/eventos/?desde=2030-03-01&hasta=2030-03-31")
    assert [e["nombre"] for e in r.data] == ["marzo"]
    assert api.get("/api/v1/eventos/?desde=2030-03-01&hasta=2029-01-01").status_code == 400
