from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from ..models import Usuario, normalizar_correo

MSG_CONFIRMACION = "Las contraseñas no coinciden."


def _validar_contrasena(password, usuario):
    try:
        password_validation.validate_password(password, user=usuario)
    except DjangoValidationError as e:
        raise serializers.ValidationError({"password": list(e.messages)}) from e


class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.CharField(source="get_full_name", read_only=True)
    roles = serializers.ListField(child=serializers.CharField(), read_only=True)

    class Meta:
        model = Usuario
        fields = ["id", "email", "nombres", "apellidos", "nombre_completo", "roles",
                  "correo_verificado", "is_staff"]
        read_only_fields = fields


class RegistroSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=150, trim_whitespace=True)
    apellidos = serializers.CharField(max_length=150, trim_whitespace=True)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)
    password_confirmacion = serializers.CharField(write_only=True, trim_whitespace=False)
    acepta_privacidad = serializers.BooleanField()

    def validate_email(self, valor):
        return normalizar_correo(valor)

    def validate_acepta_privacidad(self, valor):
        if not valor:
            raise serializers.ValidationError("Debes aceptar el aviso de privacidad.")
        return valor

    def validate(self, datos):
        if datos["password"] != datos["password_confirmacion"]:
            raise serializers.ValidationError({"password_confirmacion": [MSG_CONFIRMACION]})
        candidato = Usuario(email=datos["email"], nombres=datos["nombres"],
                            apellidos=datos["apellidos"])
        _validar_contrasena(datos["password"], candidato)
        return datos


class IngresoSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(trim_whitespace=False, max_length=128)
    recordar = serializers.BooleanField(default=False)

    def validate_email(self, valor):
        return normalizar_correo(valor)


class CorreoSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)

    def validate_email(self, valor):
        return normalizar_correo(valor)


class EnlaceSerializer(serializers.Serializer):
    uid = serializers.CharField(max_length=64)
    token = serializers.CharField(max_length=128)


class RestablecerSerializer(EnlaceSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)
    password_confirmacion = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, datos):
        if datos["password"] != datos["password_confirmacion"]:
            raise serializers.ValidationError({"password_confirmacion": [MSG_CONFIRMACION]})
        return datos

    def validar_para(self, usuario):
        _validar_contrasena(self.validated_data["password"], usuario)
