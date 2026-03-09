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

Tudo que o Hostinger precisa está em `docker-compose.hostinger.yml` e `.env.hostinger.example`. Copie o exemplo para `.env.hostinger`, preencha os segredos (Postgres, MercadoPago, URLs públicos etc.) e siga o passo a passo oficial detalhado em `docs/Hostinger-Deploy.md`.

```bash
cp .env.hostinger.example .env.hostinger
docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml up -d --build
```

O deploy também funciona como parte de um fluxo de releases (build das imagens + push para o servidor). Use os scripts/documentação em `docs/Hostinger-Deploy.md` para checar saúde dos serviços, reconfigurar portas/volumes e automatizar a atualização remota via GitHub Actions ou um `deploy.sh`.
