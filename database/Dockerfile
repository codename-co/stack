FROM postgis/postgis:12-2.5-alpine

ENV POSTGRES_DB swag
ENV POSTGRES_USER swag
ENV POSTGRES_PASSWORD password
ENV POSTGRES_INITDB_ARGS "--locale=fr_FR.utf8"
ENV JWT_SECRET secret

# EXPOSE application port
EXPOSE 5432

# Copy sql
COPY initdb/ /docker-entrypoint-initdb.d/
