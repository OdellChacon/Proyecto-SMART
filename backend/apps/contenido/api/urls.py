from django.urls import path

from . import views as v

urlpatterns = [
    path("sitio/", v.SitioView.as_view(), name="sitio"),
    path("carreras/", v.CarrerasView.as_view(), name="carreras"),
    path("carreras/<slug:slug>/", v.CarreraView.as_view(), name="carrera"),
    path("noticias/", v.NoticiasView.as_view(), name="noticias"),
    path("noticias/<slug:slug>/", v.NoticiaView.as_view(), name="noticia"),
    path("eventos/", v.EventosView.as_view(), name="eventos"),
    path("avisos/", v.AvisosView.as_view(), name="avisos"),
    path("autoridades/", v.AutoridadesView.as_view(), name="autoridades"),
    path("documentos/", v.DocumentosView.as_view(), name="documentos"),
    path("documentos/categorias/", v.CategoriasDocumentoView.as_view(), name="categorias"),
    path("galeria/", v.GaleriaView.as_view(), name="galeria"),
    path("galeria/<int:pk>/", v.AlbumView.as_view(), name="album"),
    path("admision/", v.AdmisionView.as_view(), name="admision"),
    path("buscar/", v.BuscarView.as_view(), name="buscar"),
]
