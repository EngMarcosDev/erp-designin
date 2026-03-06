# Abacaxita ERP

Repositorio do projeto Abacaxita com backend e frontend orquestrados via Docker.

## Estrutura

- `backend/`
- `frontend/`
- `headshop-backend/`
- `headshop-frontend/`
- `docker-compose.yml`
- `docker-compose.hostinger.yml`
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `Dockerfile.erp-frontend`
- `.env.example`
- `.env.hostinger.example`

## Rodar com Docker

```bash
cp .env.example .env
docker compose up --build
```

## Variaveis principais

- `DATABASE_URL`
- `VITE_API_URL`
- `VITE_ADMIN_EMAILS`

## Deploy Hostinger

Use o compose de producao:

```bash
docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml up -d --build
```
