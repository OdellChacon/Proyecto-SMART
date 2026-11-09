from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone

from . import roles


def normalizar_correo(email: str) -> str:
    return (email or "").strip().lower()


class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def _crear(self, email, password, **extra):
        if not email:
            raise ValueError("El correo electrónico es obligatorio.")
        usuario = self.model(email=normalizar_correo(email), **extra)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._crear(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        # El superusuario se crea desde la terminal: su correo se da por verificado.
        extra.setdefault("correo_verificado", True)
        extra.setdefault("correo_verificado_en", timezone.now())
        if not extra["is_staff"] or not extra["is_superuser"]:
            raise ValueError("El superusuario debe tener is_staff e is_superuser.")
        return self._crear(email, password, **extra)

    def get_by_natural_key(self, email):
        return self.get(email__iexact=normalizar_correo(email))


class Usuario(AbstractBaseUser, PermissionsMixin):
    """Persona con acceso a la plataforma. El correo es su identificador."""

    email = models.EmailField("correo electrónico", unique=True)
    nombres = models.CharField("nombres", max_length=150)
    apellidos = models.CharField("apellidos", max_length=150)
    correo_verificado = models.BooleanField("correo verificado", default=False)
    correo_verificado_en = models.DateTimeField("verificado el", null=True, blank=True)
    is_active = models.BooleanField(
        "activo",
        default=True,
        help_text="Desmárcalo para impedir el ingreso sin borrar la cuenta.",
    )
    is_staff = models.BooleanField(
        "acceso al panel",
        default=False,
        help_text="Permite entrar al panel de administración.",
    )
    creado_en = models.DateTimeField("creado el", default=timezone.now)

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["nombres", "apellidos"]

    class Meta:
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"
        ordering = ["apellidos", "nombres"]
        constraints = [
            models.UniqueConstraint(Lower("email"), name="usuario_email_unico_sin_mayusculas"),
        ]

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"

    def save(self, *args, **kwargs):
        self.email = normalizar_correo(self.email)
        super().save(*args, **kwargs)

    def get_full_name(self):
        return f"{self.nombres} {self.apellidos}".strip()

    def get_short_name(self):
        return self.nombres

    @property
    def roles(self) -> list[str]:
        nombres = set(self.groups.values_list("name", flat=True))
        return [r for r in roles.ROLES if r in nombres]

    def marcar_correo_verificado(self):
        self.correo_verificado = True
        self.correo_verificado_en = timezone.now()
        self.save(update_fields=["correo_verificado", "correo_verificado_en"])
