# Backend (didatico)

Servidor simples em Node (sem dependencias) para demonstrar CRUD basico.

## Rodar

```bash
node server.cjs
```

Variavel esperada:

- `DATABASE_URL=postgresql://usuario:senha@host:porta/database`

## Migracao SQL (PostgreSQL)

Script preparado para evolucao do banco com as novidades do ERP:

- `backend/sql/20260212_erp_novidades.sql`

Exemplo de execucao:

```bash
psql "$DATABASE_URL" -f backend/sql/20260212_erp_novidades.sql
```

## Rotas (exemplo)
- GET /products
- POST /products
- PUT /products/:id
- DELETE /products/:id
- GET /orders
- POST /orders
- GET /reports/stock

## Observacao
Este backend e didatico. Persistencia em arquivo JSON.
