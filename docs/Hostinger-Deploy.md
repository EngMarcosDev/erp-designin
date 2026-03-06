# Deploy no Hostinger (Containers)

Este projeto agora contempla o stack completo:

- `erp-backend` (Node.js)
- `erp-frontend` (Vite build + Nginx)
- `headshop-backend` (Fastify + Prisma)
- `headshop-frontend` (Vite build + Nginx)
- `postgres`

## 1) Preparar variaveis

Na raiz:

```bash
cp .env.hostinger.example .env.hostinger
```

Edite `.env.hostinger` com suas credenciais reais.
Mantenha `HEADSHOP_DB_SCHEMA=headshop` para isolar tabelas do HeadShop e ERP no mesmo banco.

## 2) Subir stack completo

```bash
docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml up -d --build
```

## 3) Verificar status

```bash
docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml ps
docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml logs -f
```

## 4) Portas publicadas

- HeadShop frontend: `HEADSHOP_FRONTEND_PORT` (padrao `8080`)
- ERP frontend: `ERP_FRONTEND_PORT` (padrao `8081`)

Os backends ficam internos na rede Docker e sao acessados via proxy Nginx dos frontends.

## 5) Atualizacao

```bash
git pull
docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml up -d --build
```
