# Imagen del respaldo diario (Render Cron Job): pg_dump 17 + AWS CLI para R2.
FROM postgres:17-alpine
RUN apk add --no-cache aws-cli coreutils
COPY infra/respaldos/respaldar.sh /usr/local/bin/respaldar
RUN chmod +x /usr/local/bin/respaldar
ENV DIR_RESPALDOS=/tmp/respaldos
ENTRYPOINT ["respaldar"]
