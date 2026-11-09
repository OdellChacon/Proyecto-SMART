from django.urls import path

from . import views as v

urlpatterns = [
    path("solicitudes-informacion/", v.SolicitudInformacionView.as_view(),
         name="solicitud-informacion"),
    path("contacto/", v.ContactoView.as_view(), name="contacto"),
]
