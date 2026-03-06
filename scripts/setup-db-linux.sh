#!/usr/bin/env bash
set -euo pipefail

# setup-db-linux.sh
# Creates role and DB and applies migration on ports 5432 (ERP) and 5433 (Headshop)
# Requires psql client

PG_SUPER_USER=postgres
ERP_PORT=5432
HEADSHOP_PORT=5433
DB_USER=abacaxita
DB_PASS=${DB_PASS:-change_me}
DB_NAME=abacaxita_erp
MIGRATION=backend/sql/20260212_erp_novidades.sql

command -v psql >/dev/null 2>&1 || { echo "psql não encontrado. Instale o cliente PostgreSQL." >&2; exit 1; }

SQL_CREATE_ROLE="DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS'; END IF; END $$;"
psql -U $PG_SUPER_USER -c "$SQL_CREATE_ROLE"

SQL_CREATE_DB="DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN CREATE DATABASE $DB_NAME OWNER $DB_USER; END IF; END $$;"
psql -U $PG_SUPER_USER -p $ERP_PORT -c "$SQL_CREATE_DB"
psql -U $PG_SUPER_USER -p $HEADSHOP_PORT -c "$SQL_CREATE_DB"

echo "Aplicando migração no ERP (porta $ERP_PORT)"
psql "postgresql://$DB_USER:$DB_PASS@127.0.0.1:$ERP_PORT/$DB_NAME" -f $MIGRATION

echo "Aplicando migração no Headshop (porta $HEADSHOP_PORT)"
psql "postgresql://$DB_USER:$DB_PASS@127.0.0.1:$HEADSHOP_PORT/$DB_NAME" -f $MIGRATION

echo "Pronto. Admin seed (se aplicado): adm.abacaxita@gmail.com / change_me"
