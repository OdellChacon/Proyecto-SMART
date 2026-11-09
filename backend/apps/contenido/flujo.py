"""Flujo de publicación del panel (sección 11 del documento de construcción).

Roles (grupos de Django; los asigna el administrador técnico en Panel › Usuarios):

| Acción                         | Admin. técnico | Aprobador | Editor                       |
|--------------------------------|----------------|-----------|------------------------------|
| Crear y editar contenido       | Sí             | Sí        | Sí                           |
| Publicar sin revisión          | Sí             | Sí        | Solo donde no hay aprobación |
| Aprobar o devolver contenido   | Sí             | Sí        | No                           |
| Borrar contenido               | Sí             | Sí        | Solo sus borradores          |
| Gestionar usuarios             | Sí             | No        | No                           |
| Editar datos generales         | Sí             | Sí        | No                           |

Qué tipos de contenido necesitan aprobación lo decide la universidad en Datos generales.
"""

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.mail import EmailMessage
from django.db.models import Q

from .models import DatosGenerales, Estado

log = logging.getLogger("apps.contenido")

GRUPO_EDITOR = "Editor de contenido"
GRUPO_APROBADOR = "Aprobador de contenido"

# Modelo con flujo → campo de Datos generales que dice si necesita aprobación.
CAMPO_APROBACION = {
    "noticia": "aprobar_noticias",
    "evento": "aprobar_eventos",
    "aviso": "aprobar_avisos",
    "documento": "aprobar_documentos",
}

# Contenido que el editor puede crear y editar.
MODELOS_EDITOR = [
    ("contenido", "noticia"), ("contenido", "evento"), ("contenido", "aviso"),
    ("contenido", "documento"), ("contenido", "autoridad"), ("contenido", "carrera"),
    ("contenido", "asignaturapensum"), ("contenido", "album"), ("contenido", "foto"),
    ("contenido", "pasoadmision"), ("contenido", "preguntafrecuente"),
    ("contenido", "fechaadmision"), ("contenido", "costoadmision"),
    ("contenido", "fotoseccion"),
    ("formularios", "solicitudinformacion"), ("formularios", "mensajecontacto"),
]
# El aprobador además gestiona las categorías de documentos y los datos generales.
MODELOS_SOLO_APROBADOR = [("contenido", "categoriadocumento"), ("contenido", "datosgenerales")]
ACCIONES = ["add", "change", "delete", "view"]


def _permisos(modelos):
    filtro = Q()
    for app, modelo in modelos:
        filtro |= Q(content_type__app_label=app, content_type__model=modelo)
    return Permission.objects.filter(filtro, codename__regex=r"^(add|change|delete|view)_")


def asegurar_grupos(**kwargs):
    """Crea o actualiza los grupos del panel. Se ejecuta después de cada migrate."""
    editor, _ = Group.objects.get_or_create(name=GRUPO_EDITOR)
    editor.permissions.set(_permisos(MODELOS_EDITOR))
    aprobador, _ = Group.objects.get_or_create(name=GRUPO_APROBADOR)
    aprobador.permissions.set(_permisos(MODELOS_EDITOR + MODELOS_SOLO_APROBADOR))


def es_aprobador(usuario) -> bool:
    return bool(
        usuario.is_active
        and (usuario.is_superuser or usuario.groups.filter(name=GRUPO_APROBADOR).exists())
    )


def requiere_aprobacion(modelo) -> bool:
    campo = CAMPO_APROBACION.get(modelo._meta.model_name)
    return bool(campo and getattr(DatosGenerales.cargar(), campo))


def estados_permitidos(usuario, modelo) -> list[str]:
    """Estados que esta persona puede elegir para este tipo de contenido."""
    if es_aprobador(usuario):
        return [e.value for e in Estado]
    if requiere_aprobacion(modelo):
        return [Estado.BORRADOR, Estado.REVISION]
    return [Estado.BORRADOR, Estado.REVISION, Estado.PUBLICADA]


# --- Avisos por correo ------------------------------------------------------

def _enviar(destinatarios, asunto, cuerpo):
    destinatarios = sorted({d for d in destinatarios if d})
    if not destinatarios:
        return
    try:
        EmailMessage(
            subject=f"{asunto} · {settings.NOMBRE_INSTITUCION}", body=cuerpo,
            from_email=settings.DEFAULT_FROM_EMAIL, to=destinatarios,
        ).send(fail_silently=False)
    except Exception:  # noqa: BLE001 — el cambio de estado ya quedó guardado
        log.exception("No se pudo enviar el aviso del flujo de publicación: %s", asunto)


def _enlace(obj):
    meta = obj._meta
    return f"{settings.FRONTEND_URL}/admin/{meta.app_label}/{meta.model_name}/{obj.pk}/change/"


def aprobadores():
    usuarios = get_user_model().objects.filter(is_active=True, is_staff=True)
    return usuarios.filter(Q(is_superuser=True) | Q(groups__name=GRUPO_APROBADOR)).distinct()


def avisar_revision(obj, autor):
    tipo = obj._meta.verbose_name
    _enviar(
        [u.email for u in aprobadores() if u.pk != autor.pk],
        f"Pendiente de revisión: {obj}",
        f"{autor.get_full_name()} envió a revisión este contenido ({tipo}):\n\n"
        f"«{obj}»\n\nRevísalo y publícalo o devuélvelo con comentarios:\n{_enlace(obj)}\n",
    )


def avisar_resultado(obj, revisor):
    autor = obj.creado_por
    if not autor or autor.pk == revisor.pk:
        return
    if obj.estado == Estado.PUBLICADA:
        asunto, texto = f"Publicado: {obj}", "ya está publicado en el sitio."
    else:
        asunto = f"Devuelto con comentarios: {obj}"
        texto = f"necesita cambios antes de publicarse:\n\n{obj.comentario_revision}"
    _enviar(
        [autor.email], asunto,
        f"Hola, {autor.nombres}:\n\n«{obj}» {texto}\n\nPuedes verlo aquí:\n{_enlace(obj)}\n",
    )
