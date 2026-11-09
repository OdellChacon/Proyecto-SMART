from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.usuarios.api.views import SaludView

admin.site.site_header = "Panel del sitio"
admin.site.site_title = "Panel"
admin.site.index_title = "Administración"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/salud/", SaludView.as_view(), name="salud"),
    path("api/v1/auth/", include("apps.usuarios.api.urls")),
    path("api/v1/", include("apps.contenido.api.urls")),
    path("api/v1/", include("apps.formularios.api.urls")),
]

if settings.DEBUG:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
        *static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT),
    ]
elif settings.SERVIR_MEDIA_DESDE_DISCO:
    # Producción sin R2 (demostración en Render con disco persistente): Django entrega las
    # fotos y PDF. Con R2 configurado salen del bucket y esta ruta no existe.
    urlpatterns += [
        re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    ]
