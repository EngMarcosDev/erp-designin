<#
  setup-db-windows.ps1
  - Cria role/DB e aplica migração nas portas 5432 (ERP) e 5433 (Headshop)
  - Requer psql/psql.exe disponível no PATH (cliente psql)
  Uso: Execute em PowerShell como administrador:
    .\scripts\setup-db-windows.ps1
#>

$pgSuperUser = "postgres"
$erpPort = 5432
$headshopPort = 5433
$dbUser = "abacaxita"
$dbPass = if ($env:DB_PASS) { $env:DB_PASS } else { "change_me" }
$dbName = "abacaxita_erp"
$migration = "backend/sql/20260212_erp_novidades.sql"

function Run-PSQL($conn, $sql) {
  $cmd = "psql `"$conn`" -c `"$sql`""
  Write-Host "Executando: $cmd"
  & psql $conn -c $sql
}

Write-Host "Verificando disponibilidade do psql..."
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Error "Cliente psql não encontrado no PATH. Instale o cliente PostgreSQL ou adicione psql ao PATH."
  exit 1
}

# Conexão local usando superuser
$superConn = "-U $pgSuperUser"

Write-Host "Criando role e DB (se não existirem) nas duas instâncias..."

$sqlCreateRole = "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$dbUser') THEN CREATE ROLE $dbUser WITH LOGIN PASSWORD '$dbPass'; END IF; END \$\$;"
Run-PSQL $superConn $sqlCreateRole

$sqlCreateDb = "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$dbName') THEN CREATE DATABASE $dbName OWNER $dbUser; END IF; END \$\$;"
# Cria no ERP (5432)
Run-PSQL "-U $pgSuperUser -p $erpPort" $sqlCreateDb
# Cria no Headshop (5433)
Run-PSQL "-U $pgSuperUser -p $headshopPort" $sqlCreateDb

Write-Host "Aplicando migração no ERP (porta $erpPort)"
& psql "postgresql://$dbUser:$dbPass@127.0.0.1:$erpPort/$dbName" -f $migration

Write-Host "Aplicando migração no Headshop (porta $headshopPort)"
& psql "postgresql://$dbUser:$dbPass@127.0.0.1:$headshopPort/$dbName" -f $migration

Write-Host "Pronto. Admin seed (se aplicado) sera: adm.abacaxita@gmail.com / change_me"
