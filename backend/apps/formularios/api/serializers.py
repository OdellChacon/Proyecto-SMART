from rest_framework import serializers

from apps.contenido.models import Carrera

from ..models import MensajeContacto, SolicitudInformacion

MSG_PRIVACIDAD = "Debes aceptar el aviso de privacidad para enviar el formulario."


class Antispam(serializers.Serializer):
    turnstile = serializers.CharField(required=False, allow_blank=True, write_only=True)
    acepta_privacidad = serializers.BooleanField(write_only=True)

    def validate_acepta_privacidad(self, valor):
        if not valor:
            raise serializers.ValidationError(MSG_PRIVACIDAD)
        return valor


class SolicitudInformacionSerializer(Antispam, serializers.ModelSerializer):
    carrera = serializers.SlugRelatedField(
        slug_field="slug", queryset=Carrera.objects.filter(publicada=True),
        required=False, allow_null=True,
        error_messages={"does_not_exist": "Elige una carrera de la lista."},
    )
    nombre = serializers.CharField(max_length=160, trim_whitespace=True)
    telefono = serializers.RegexField(
        r"^[0-9+()\-\s]{7,30}$", required=False, allow_blank=True,
        error_messages={"invalid": "Escribe solo números, espacios y los signos + ( ) -."},
    )
    mensaje = serializers.CharField(max_length=2000, required=False, allow_blank=True)

    class Meta:
        model = SolicitudInformacion
        fields = ["nombre", "correo", "telefono", "carrera", "mensaje", "turnstile",
                  "acepta_privacidad"]
        extra_kwargs = {"correo": {"error_messages": {"invalid": "Escribe un correo válido."}}}

    def create(self, datos):
        datos.pop("turnstile", None)
        datos.pop("acepta_privacidad", None)
        return super().create(datos)


class MensajeContactoSerializer(Antispam, serializers.ModelSerializer):
    nombre = serializers.CharField(max_length=160)
    asunto = serializers.CharField(max_length=160)
    mensaje = serializers.CharField(min_length=10, max_length=4000, error_messages={
        "min_length": "Cuéntanos un poco más (al menos 10 caracteres).",
    })

    class Meta:
        model = MensajeContacto
        fields = ["nombre", "correo", "asunto", "mensaje", "turnstile", "acepta_privacidad"]
        extra_kwargs = {"correo": {"error_messages": {"invalid": "Escribe un correo válido."}}}

    def create(self, datos):
        datos.pop("turnstile", None)
        datos.pop("acepta_privacidad", None)
        return super().create(datos)
