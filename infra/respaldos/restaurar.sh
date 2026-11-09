#!/bin/sh
# Restaura una copia de la base de datos.
#
#   DATABASE_URL=postgres://... ./restaurar.sh respaldos/base-20261107-0700.dump
#
# ¡Reemplaza el contenido de esa base de datos! Úsalo primero contra una base de prueba
# (ver probar-restauracion.sh) y solo después contra la de producción.
set -eu
: "${DATABASE_URL:?Falta DATABASE_URL}"
ARCHIVO=${1:?Indica el archivo .dump a restaurar}

pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error \
  --dbname="$DATABASE_URL" "$ARCHIVO"
echo "Restauración terminada desde $ARCHIVO"
