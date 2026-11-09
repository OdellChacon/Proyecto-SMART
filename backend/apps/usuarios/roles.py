"""Roles de la plataforma.

Se implementan como grupos de Django: una persona puede tener más de un rol
(por ejemplo, un docente que además es personal administrativo) y cada grupo
recibe sus permisos desde el panel, sin tocar código.

El "administrador técnico" del documento de construcción es el superusuario.
"""

ESTUDIANTE = "Estudiante"
DOCENTE = "Docente"
ADMINISTRATIVO = "Administrativo"

ROLES = (ESTUDIANTE, DOCENTE, ADMINISTRATIVO)

# Rol que recibe quien se registra por su cuenta desde el sitio.
# Docente y Administrativo solo los asigna un administrador desde el panel.
ROL_POR_DEFECTO = ESTUDIANTE
