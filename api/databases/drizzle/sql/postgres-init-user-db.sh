#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER $DB_USER PASSWORD '$DB_USER_PASSWORD';
  CREATE DATABASE $DB_NAME;
  GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

  -- Switch to the created database to create schema
  \c $DB_NAME

  -- Create base schema and grant privileges
  CREATE SCHEMA IF NOT EXISTS base;
  GRANT ALL PRIVILEGES ON SCHEMA base TO $DB_USER;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA base TO $DB_USER;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA base TO $DB_USER;

  -- Grant default privileges for future objects in the schema
  ALTER DEFAULT PRIVILEGES IN SCHEMA base GRANT ALL ON TABLES TO $DB_USER;
  ALTER DEFAULT PRIVILEGES IN SCHEMA base GRANT ALL ON SEQUENCES TO $DB_USER;
EOSQL

for script in $(/usr/bin/find /datamodel -type f -iname '*.sql' | sort); do
  echo "Running $script";
  POSTGRES_PASSWORD="$DB_USER_PASSWORD" psql -U "$DB_USER" -d "$DB_NAME" -w -f "$script"
done
