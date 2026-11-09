#!/bin/sh
# Copia de seguridad diaria: base de datos + archivos subidos (PDF y fotos).
#
#   DATABASE_URL            conexión a PostgreSQL
#   R2_RESPALDOS_BUCKET     bucket donde se guardan las copias (distinto del de archivos)
#   R2_BUCKET               bucket de archivos del sitio (se copia completo)
#   R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
#   DIAS_A_CONSERVAR        copias más viejas se borran (por defecto 30)
#
# Sin R2_RESPALDOS_BUCKET solo deja el archivo en ./respaldos (útil en local).
set -eu

: "${DATABASE_URL:?Falta DATABASE_URL}"
FECHA=$(date -u +%Y%m%d-%H%M)
DIR=${DIR_RESPALDOS:-./respaldos}
ARCHIVO="$DIR/base-$FECHA.dump"
mkdir -p "$DIR"

echo "Respaldando la base de datos…"
# Formato propio de PostgreSQL: comprimido y restaurable tabla por tabla.
pg_dump --format=custom --no-owner --no-privileges --file="$ARCHIVO" "$DATABASE_URL"
pg_restore --list "$ARCHIVO" > /dev/null  # verifica que el archivo se pueda leer
echo "Listo: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"

if [ -n "${R2_RESPALDOS_BUCKET:-}" ]; then
  export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
  export AWS_DEFAULT_REGION=auto
  S3="aws s3 --endpoint-url $R2_ENDPOINT"

  $S3 cp "$ARCHIVO" "s3://$R2_RESPALDOS_BUCKET/base/$(basename "$ARCHIVO")"
  if [ -n "${R2_BUCKET:-}" ]; then
    echo "Copiando archivos subidos…"
    $S3 sync "s3://$R2_BUCKET" "s3://$R2_RESPALDOS_BUCKET/archivos/$FECHA" --only-show-errors
  fi

  # Borra las copias de base de datos más viejas que DIAS_A_CONSERVAR.
  LIMITE=$(date -u -d "-${DIAS_A_CONSERVAR:-30} days" +%Y%m%d 2>/dev/null || echo "")
  if [ -n "$LIMITE" ]; then
    $S3 ls "s3://$R2_RESPALDOS_BUCKET/base/" | awk '{print $4}' | while read -r nombre; do
      dia=$(echo "$nombre" | sed -n 's/^base-\([0-9]\{8\}\).*/\1/p')
      if [ -n "$dia" ] && [ "$dia" -lt "$LIMITE" ]; then
        $S3 rm "s3://$R2_RESPALDOS_BUCKET/base/$nombre"
      fi
    done
  fi
  echo "Copias subidas a R2."
fi
