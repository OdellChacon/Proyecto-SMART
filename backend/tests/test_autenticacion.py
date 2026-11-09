import pytest
from django.core import mail

from apps.usuarios import roles
from apps.usuarios.models import Usuario

from .conftest import CLAVE, enlace_del_correo

pytestmark = pytest.mark.django_db

URL = "/api/v1/auth/"


def post(api, ruta, datos=None):
    return api.post(f"{URL}{ruta}/", datos or {}, format="json")


# --- Registro --------------------------------------------------------------


def test_registro_crea_estudiante_sin_verificar_y_envia_correo(api, datos_registro):
    r = post(api, "registro", datos_registro)

    assert r.status_code == 201
    assert r.data["codigo"] == "verificacion_enviada"
    u = Usuario.objects.get()
    assert u.email == "maria.perez@correo.com"  # correo normalizado
    assert u.correo_verificado is False
    assert u.roles == [roles.ESTUDIANTE]
    assert u.check_password(CLAVE)
    assert len(mail.outbox) == 1
    assert "/verificar-correo/" in mail.outbox[0].body


def test_registro_con_correo_existente_responde_igual_y_avisa_por_correo(
    api, datos_registro, usuario_verificado
):
    datos_registro["email"] = "ANA@correo.com"
    r = post(api, "registro", datos_registro)

    assert r.status_code == 201
    assert r.data["codigo"] == "verificacion_enviada"
    assert Usuario.objects.count() == 1
    assert "Ya tienes una cuenta" in mail.outbox[0].subject


@pytest.mark.parametrize(
    ("cambio", "campo"),
    [
        ({"password_confirmacion": "Otra-Clave-2026"}, "password_confirmacion"),
        ({"password": "12345678", "password_confirmacion": "12345678"}, "password"),
        ({"acepta_privacidad": False}, "acepta_privacidad"),
        ({"email": "no-es-un-correo"}, "email"),
        ({"nombres": ""}, "nombres"),
    ],
)
def test_registro_valida_en_servidor(api, datos_registro, cambio, campo):
    r = post(api, "registro", {**datos_registro, **cambio})

    assert r.status_code == 400
    assert r.data["codigo"] == "validacion"
    assert campo in r.data["errores"]
    assert Usuario.objects.count() == 0


# --- Verificación de correo ------------------------------------------------


def test_no_puede_ingresar_sin_verificar_y_si_despues_de_verificar(api, datos_registro):
    post(api, "registro", datos_registro)
    credenciales = {"email": datos_registro["email"], "password": CLAVE}

    r = post(api, "ingreso", credenciales)
    assert r.status_code == 403
    assert r.data["codigo"] == "correo_no_verificado"

    uid, token = enlace_del_correo("verificar-correo")
    r = post(api, "verificar-correo", {"uid": uid, "token": token})
    assert r.status_code == 200
    assert r.data["codigo"] == "verificado"

    # El mismo enlace, usado otra vez, no falla: avisa que ya estaba confirmado.
    r = post(api, "verificar-correo", {"uid": uid, "token": token})
    assert r.data["codigo"] == "ya_verificado"

    r = post(api, "ingreso", credenciales)
    assert r.status_code == 200


def test_enlace_de_verificacion_alterado_es_rechazado(api, datos_registro):
    post(api, "registro", datos_registro)
    uid, _ = enlace_del_correo("verificar-correo")

    r = post(api, "verificar-correo", {"uid": uid, "token": "token-falso"})
    assert r.status_code == 400
    assert r.data["codigo"] == "enlace_invalido"
    assert Usuario.objects.get().correo_verificado is False


def test_reenviar_verificacion_no_revela_si_el_correo_existe(api, datos_registro):
    post(api, "registro", datos_registro)
    mail.outbox.clear()

    existe = post(api, "reenviar-verificacion", {"email": datos_registro["email"]})
    no_existe = post(api, "reenviar-verificacion", {"email": "nadie@correo.com"})

    assert existe.status_code == no_existe.status_code == 200
    assert existe.data["detail"] == no_existe.data["detail"]
    assert len(mail.outbox) == 1


# --- Ingreso y sesión ------------------------------------------------------


def test_ingreso_correcto_abre_sesion_con_roles(api, usuario_verificado):
    r = post(api, "ingreso", {"email": "ANA@correo.com", "password": CLAVE, "recordar": True})

    assert r.status_code == 200
    assert r.data["usuario"]["roles"] == [roles.ESTUDIANTE]
    sesion = api.get(f"{URL}sesion/")
    assert sesion.data["autenticado"] is True
    assert sesion.data["usuario"]["email"] == "ana@correo.com"


def test_sin_recordar_la_sesion_termina_al_cerrar_el_navegador(api, usuario_verificado):
    post(api, "ingreso", {"email": "ana@correo.com", "password": CLAVE, "recordar": False})

    assert api.session.get_expire_at_browser_close() is True


def test_credenciales_incorrectas_dan_mensaje_generico(api, usuario_verificado):
    mal_clave = post(api, "ingreso", {"email": "ana@correo.com", "password": "otra"})
    no_existe = post(api, "ingreso", {"email": "nadie@correo.com", "password": "otra"})

    assert mal_clave.status_code == no_existe.status_code == 400
    assert mal_clave.data["detail"] == no_existe.data["detail"]
    assert mal_clave.data["detail"] == "Correo o contraseña incorrectos."


def test_bloqueo_tras_cinco_intentos_fallidos(api, usuario_verificado):
    for _ in range(5):
        post(api, "ingreso", {"email": "ana@correo.com", "password": "incorrecta"})

    # Ni siquiera la contraseña correcta entra mientras dure el bloqueo.
    r = post(api, "ingreso", {"email": "ana@correo.com", "password": CLAVE})
    assert r.status_code == 429
    assert r.json()["codigo"] == "cuenta_bloqueada"


def test_cuenta_desactivada_no_puede_ingresar(api, usuario_verificado):
    usuario_verificado.is_active = False
    usuario_verificado.save()

    r = post(api, "ingreso", {"email": "ana@correo.com", "password": CLAVE})
    assert r.status_code == 400


def test_salida_cierra_la_sesion(api, usuario_verificado):
    post(api, "ingreso", {"email": "ana@correo.com", "password": CLAVE})
    r = post(api, "salida")

    assert r.status_code == 200
    assert api.get(f"{URL}sesion/").data["autenticado"] is False


def test_escrituras_exigen_token_csrf(usuario_verificado):
    from rest_framework.test import APIClient

    cliente = APIClient(enforce_csrf_checks=True)
    r = cliente.post(f"{URL}ingreso/", {"email": "ana@correo.com", "password": CLAVE},
                     format="json")
    assert r.status_code == 403
    assert r.json()["codigo"] == "csrf"

    # Con la cookie y la cabecera, entra.
    cliente.get(f"{URL}sesion/")
    token = cliente.cookies["csrftoken"].value
    r = cliente.post(f"{URL}ingreso/", {"email": "ana@correo.com", "password": CLAVE},
                     format="json", HTTP_X_CSRFTOKEN=token)
    assert r.status_code == 200


def test_limite_de_registros_por_ip(api, datos_registro):
    for i in range(5):
        post(api, "registro", {**datos_registro, "email": f"persona{i}@correo.com"})

    r = post(api, "registro", {**datos_registro, "email": "otra@correo.com"})
    assert r.status_code == 429
    assert r.data["codigo"] == "demasiados_intentos"


# --- Recuperación de contraseña --------------------------------------------


def test_recuperar_no_revela_si_el_correo_existe(api, usuario_verificado):
    existe = post(api, "recuperar-contrasena", {"email": "ana@correo.com"})
    no_existe = post(api, "recuperar-contrasena", {"email": "nadie@correo.com"})

    assert existe.status_code == no_existe.status_code == 200
    assert existe.data["detail"] == no_existe.data["detail"]
    assert len(mail.outbox) == 1


def test_restablecer_contrasena_con_enlace_de_un_solo_uso(api, usuario_verificado):
    post(api, "recuperar-contrasena", {"email": "ana@correo.com"})
    uid, token = enlace_del_correo("restablecer-contrasena")
    nueva = "Nueva-Clave-Segura-1"

    validar = post(api, "restablecer-contrasena/validar", {"uid": uid, "token": token})
    assert validar.status_code == 200
    r = post(api, "restablecer-contrasena",
             {"uid": uid, "token": token, "password": nueva, "password_confirmacion": nueva})
    assert r.status_code == 200

    usuario_verificado.refresh_from_db()
    assert usuario_verificado.check_password(nueva)

    # El enlace ya no sirve una segunda vez.
    r = post(api, "restablecer-contrasena",
             {"uid": uid, "token": token, "password": nueva, "password_confirmacion": nueva})
    assert r.status_code == 400
    assert r.data["codigo"] == "enlace_invalido"


def test_restablecer_rechaza_contrasena_debil(api, usuario_verificado):
    post(api, "recuperar-contrasena", {"email": "ana@correo.com"})
    uid, token = enlace_del_correo("restablecer-contrasena")

    r = post(api, "restablecer-contrasena",
             {"uid": uid, "token": token, "password": "abc", "password_confirmacion": "abc"})
    assert r.status_code == 400
    assert "password" in r.data["errores"]


def test_salud(api):
    r = api.get("/api/v1/salud/")
    assert r.status_code == 200
