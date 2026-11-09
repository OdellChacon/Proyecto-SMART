from django.db import models


class SolicitudInformacion(models.Model):
    """Un aspirante pide información sobre una carrera."""

    nombre = models.CharField(max_length=160)
    correo = models.EmailField()
    telefono = models.CharField("teléfono", max_length=30, blank=True)
    carrera = models.ForeignKey(
        "contenido.Carrera", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="solicitudes",
    )
    mensaje = models.TextField(blank=True)
    creada_en = models.DateTimeField("recibida", auto_now_add=True)
    atendida = models.BooleanField(default=False)

    class Meta:
        verbose_name = "solicitud de información"
        verbose_name_plural = "solicitudes de información"
        ordering = ["atendida", "-creada_en"]

    def __str__(self):
        return f"{self.nombre} · {self.carrera or 'Sin carrera'}"


class MensajeContacto(models.Model):
    nombre = models.CharField(max_length=160)
    correo = models.EmailField()
    asunto = models.CharField(max_length=160)
    mensaje = models.TextField()
    creado_en = models.DateTimeField("recibido", auto_now_add=True)
    atendido = models.BooleanField(default=False)

    class Meta:
        verbose_name = "mensaje de contacto"
        verbose_name_plural = "mensajes de contacto"
        ordering = ["atendido", "-creado_en"]

    def __str__(self):
        return f"{self.nombre}: {self.asunto}"
