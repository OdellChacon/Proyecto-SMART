from django.urls import path

from . import views

app_name = "auth"

urlpatterns = [
    path("sesion/", views.SesionView.as_view(), name="sesion"),
    path("registro/", views.RegistroView.as_view(), name="registro"),
    path("verificar-correo/", views.VerificarCorreoView.as_view(), name="verificar-correo"),
    path(
        "reenviar-verificacion/",
        views.ReenviarVerificacionView.as_view(),
        name="reenviar-verificacion",
    ),
    path("ingreso/", views.IngresoView.as_view(), name="ingreso"),
    path("salida/", views.SalidaView.as_view(), name="salida"),
    path(
        "recuperar-contrasena/",
        views.RecuperarContrasenaView.as_view(),
        name="recuperar-contrasena",
    ),
    path(
        "restablecer-contrasena/validar/",
        views.ValidarEnlaceRestablecerView.as_view(),
        name="validar-enlace",
    ),
    path(
        "restablecer-contrasena/",
        views.RestablecerContrasenaView.as_view(),
        name="restablecer-contrasena",
    ),
]
