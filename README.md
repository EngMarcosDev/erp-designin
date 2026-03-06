# Abacaxita ERP

Repositorio do projeto Abacaxita com backend e frontend orquestrados via Docker.

## Estrutura

- `backend/`
- `frontend/`
- `docker-compose.yml`
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `.env.example`

## Rodar com Docker

```bash
cp .env.example .env
docker compose up --build
```

## Variaveis principais

- `DATABASE_URL`
- `VITE_API_URL`
- `VITE_ADMIN_EMAILS`