#!/bin/sh
set -o errexit -o nounset -o pipefail

[ "${DEBUG:-false}" == true ] && set -x

check_database_connection() {
  case "${DB_DRIVER}" in
    mysql)
      prog="mysqladmin -h ${DB_HOST} -u ${DB_USERNAME} ${DB_PASSWORD:+-p$DB_PASSWORD} -P ${DB_PORT} status"
      ;;
    pgsql)
      prog="/usr/bin/pg_isready"
      prog="${prog} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USERNAME} -d ${DB_DATABASE} -t 1"
      ;;
    sqlite)
      prog="touch /var/www/html/database/database.sqlite"
  esac
  timeout=60
  while ! ${prog} >/dev/null 2>&1
  do
    timeout=$(( timeout - 1 ))
    if [[ "$timeout" -eq 0 ]]; then
      echo
      echo "Could not connect to database server! Aborting..."
      exit 1
    fi
    echo -n "."
    sleep 1
  done
  echo
}

checkdbinitmysql() {
    table=sessions
    if [[ "$(mysql -N -s -h "${DB_HOST}" -u "${DB_USERNAME}" "${DB_PASSWORD:+-p$DB_PASSWORD}" "${DB_DATABASE}" -P "${DB_PORT}" -e \
        "select count(*) from information_schema.tables where \
            table_schema='${DB_DATABASE}' and table_name='${DB_PREFIX}${table}';")" -eq 1 ]]; then
        echo "Table ${DB_PREFIX}${table} exists! ..."
    else
        echo "Table ${DB_PREFIX}${table} does not exist! ..."
        init_db
    fi

}

checkdbinitpsql() {
    table=sessions
    export PGPASSWORD=${DB_PASSWORD}
    if [[ "$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d "${DB_DATABASE}" -c "SELECT to_regclass('${DB_PREFIX}${table}');" | grep -c "${DB_PREFIX}${table}")" -eq 1 ]]; then
        echo "Table ${DB_PREFIX}${table} exists! ..."
    else
        echo "Table ${DB_PREFIX}${table} does not exist! ..."
        init_db
    fi

}

check_configured() {
  case "${DB_DRIVER}" in
    mysql)
      checkdbinitmysql
      ;;
    pgsql)
      checkdbinitpsql
      ;;
  esac
}

initialize_system() {
  echo "Initializing Cachet container ..."
  env_file="/var/www/html/.env"

  while IFS= read -r var; do
    # Extract key and value from the environment variable
    key=$(echo "$var" | cut -d= -f1)
    value=$(echo "$var" | cut -d= -f2- | sed 's/[]\/&]/\\&/g')

    # Search for the key in the .env file with optional leading "#" and trailing spaces around "="
    if grep -E -q "^\s*#?\s*$key\s*=.*"  "$env_file"; then
      # Replace the line with the desired format (remove "#" and set the value)
      sed -E "s/^\s*#?\s*$key\s*=.*/${key} = $value/" -i "$env_file"
    fi
  done < <(env)

  rm -rf bootstrap/cache/*
}

init_db() {
  echo "Initializing Cachet database ..."
  php artisan key:generate --no-interaction
}

migrate_db() {
  force=""
  if [[ "${FORCE_MIGRATION:-false}" == true ]]; then
    force="--force"
  fi
  php artisan migrate ${force} --no-interaction
}

start_system() {
  initialize_system
  migrate_db
  php artisan config:cache
  php artisan vendor:publish --tag=livewire:assets
  php artisan filament:assets
  echo "Starting Cachet! ..."
  /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
}

start_system

exit 0
