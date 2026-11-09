from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import AdminUserCreationForm, UserChangeForm

from .models import Usuario


class CrearUsuarioForm(AdminUserCreationForm):
    class Meta:
        model = Usuario
        fields = ("email", "nombres", "apellidos")


class EditarUsuarioForm(UserChangeForm):
    class Meta:
        model = Usuario
        fields = "__all__"


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    add_form = CrearUsuarioForm
    form = EditarUsuarioForm
    model = Usuario

    list_display = ("email", "nombres", "apellidos", "lista_roles", "correo_verificado",
                    "is_active", "is_staff")
    list_filter = ("groups", "correo_verificado", "is_active", "is_staff")
    search_fields = ("email", "nombres", "apellidos")
    ordering = ("apellidos", "nombres")
    readonly_fields = ("creado_en", "last_login", "correo_verificado_en")
    filter_horizontal = ("groups", "user_permissions")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Datos personales", {"fields": ("nombres", "apellidos")}),
        ("Roles", {
            "fields": ("groups",),
            "description": (
                "Comunidad: Estudiante, Docente o Administrativo. Panel: Editor de contenido o "
                "Aprobador de contenido (además marca «Acceso al panel»). Una persona puede "
                "tener varios."
            ),
        }),
        ("Estado", {"fields": ("is_active", "correo_verificado", "correo_verificado_en")}),
        ("Acceso al panel", {
            "classes": ("collapse",),
            "fields": ("is_staff", "is_superuser", "user_permissions"),
        }),
        ("Fechas", {"fields": ("last_login", "creado_en")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nombres", "apellidos", "usable_password", "password1",
                       "password2"),
        }),
    )

    @admin.display(description="roles")
    def lista_roles(self, obj):
        return ", ".join(obj.roles) or "—"
