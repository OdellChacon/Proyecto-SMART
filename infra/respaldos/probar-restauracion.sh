#!/bin/sh
# Prueba de restauración (requisito no funcional «Respaldo»): respalda la base local,
# la restaura en una base nueva y compara cuántas filas tiene cada tabla.
#
#   sh infra/respaldos/probar-restauracion.sh
#
# Usa el contenedor «db» de docker-compose; no toca la base de desarrollo.
set -eu
cd "$(dirname "$0")/../.."
USUARIO=${POSTGRES_USER:-plataforma}
BASE=${POSTGRES_DB:-plataforma}
PRUEBA="${BASE}_prueba_restauracion"
DC="docker compose exec -T db"

contar() {
  $DC psql -U "$USUARIO" -d "$1" -At -c "
    SELECT string_agg(t || '=' || n, ' ' ORDER BY t) FROM (
      SELECT relname AS t, n_live_tup AS n FROM pg_stat_user_tables
    ) s;" > /dev/null
  # n_live_tup es aproximado: se cuenta de verdad tabla por tabla.
  for tabla in $($DC psql -U "$USUARIO" -d "$1" -At -c \
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1"); do
    printf '%s=%s\n' "$tabla" "$($DC psql -U "$USUARIO" -d "$1" -At -c "SELECT count(*) FROM \"$tabla\"")"
  done
}

echo "1/4 Respaldando «$BASE»…"
$DC pg_dump -U "$USUARIO" --format=custom --no-owner --no-privileges -d "$BASE" > /tmp/prueba.dump
echo "    $(wc -c < /tmp/prueba.dump) bytes"

echo "2/4 Creando la base de prueba «$PRUEBA»…"
$DC dropdb -U "$USUARIO" --if-exists "$PRUEBA"
$DC createdb -U "$USUARIO" "$PRUEBA"

echo "3/4 Restaurando…"
$DC pg_restore -U "$USUARIO" --no-owner --no-privileges --exit-on-error -d "$PRUEBA" < /tmp/prueba.dump

echo "4/4 Comparando filas por tabla…"
contar "$BASE" > /tmp/origen.txt
contar "$PRUEBA" > /tmp/restaurada.txt
$DC dropdb -U "$USUARIO" "$PRUEBA"
if diff /tmp/origen.txt /tmp/restaurada.txt > /dev/null; then
  echo "OK: $(wc -l < /tmp/origen.txt) tablas restauradas con las mismas filas."
else
  echo "ERROR: la restauración no coincide:"; diff /tmp/origen.txt /tmp/restaurada.txt; exit 1
fi
