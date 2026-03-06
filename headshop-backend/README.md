# Abacaxita Headshop Backend

Backend Fastify + TypeScript + Prisma (PostgreSQL).

## Setup
1. Edite `.env` com a URL do PostgreSQL e um `JWT_SECRET` forte.
2. Gere e aplique schema:
   - `npm run db:generate`
   - `npm run db:push`
3. (Opcional) Popular dados:
   - `npm run db:seed`

## Dev
- `npm run dev`

## Endpoints publicos
- `GET /api/health`
- `GET /api/products/featured`
- `GET /api/products/popular`
- `GET /api/products?color=&material=&category=`
- `GET /api/categories/:slug/products`
- `POST /api/newsletter`
- `POST /api/orders`

## Endpoints admin
- `POST /api/auth/login`
- `POST /api/auth/users`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/admin/products/:id/images`
- `POST /api/admin/categories`
- `DELETE /api/admin/categories/:id`
- `GET /api/admin/reports/top-products`

## Observacoes
- Admin seed padrao: `adm.abacaxita@gmail.com` / `change_me`.
- O frontend usa `/api` como base.
- Porta padrao do backend: `3333`.