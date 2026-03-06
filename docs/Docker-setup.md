# Docker setup - Abacaxita ERP

Este documento descreve como iniciar a stack local com Docker Compose para conectar Postgres, backend e frontend.

Arquivos relevantes na raiz:
- `docker-compose.yml` - orquestra os servicos `db`, `backend` e `frontend`.
- `Dockerfile.backend` - imagem do backend (executa `backend/server.cjs`).
- `Dockerfile.frontend` - imagem do frontend (Vite `npm run dev`).
- `.env.example` - variaveis de ambiente de exemplo.

Comandos rapidos (PowerShell, na raiz do repositorio):

```powershell
# build e subir
docker compose up --build -d

# ver logs do backend
docker compose logs -f backend

# parar e remover

docker compose down -v
```

Depois que o banco estiver rodando, aplique a migracao SQL:

```powershell
psql "postgresql://abacaxita:change_me@localhost:5432/abacaxita_erp" -f backend/sql/20260212_erp_novidades.sql
```

Dicas:
- Copie `.env.example` para `.env` e ajuste credenciais antes de subir em qualquer ambiente compartilhado.
- Nunca commite `.env` com segredos reais.