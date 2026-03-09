# Deploy no Hostinger (Containers)

O `docker-compose.hostinger.yml` já contém os cinco serviços que precisam rodar na VPS Hostinger:

- `postgres` com dados persistidos em `postgres_data`
- `db-bootstrap` para aplicar o SQL de migração inicial
- `erp-backend` e `headshop-backend` (Node/Prisma)
- `erp-frontend` e `headshop-frontend` (builds do Vite publicados via Nginx)

Todos os serviços vivem na mesma rede Docker (`abacaxita`) e os frontends expõem apenas os pontos públicos (`HEADSHOP_FRONTEND_PORT` e `ERP_FRONTEND_PORT`).

## 1) Pré-requisitos do servidor

1. Atualize o Ubuntu e instale o Docker Compose plugin:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y ca-certificates curl gnupg lsb-release
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
   echo \
   "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
   | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
   sudo systemctl enable docker
   sudo groupadd -f docker && sudo usermod -aG docker $USER
   ```
2. Configure o firewall (UFW) para liberar apenas as portas HTTP/HTTPS que você vai usar:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 8080/tcp
   sudo ufw allow 8081/tcp
   sudo ufw enable
   ```
3. Garanta que o hostname/dns apontem para o IP da Hostinger e que os registros `A` estejam prontos.

## 2) Variáveis de ambiente

- `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` – credenciais do banco usadas pelo bootstrap, ERP e HeadShop.
- `HEADSHOP_DB_SCHEMA=headshop` – isola as tabelas do HeadShop dentro do mesmo banco.
- `ERP_FRONTEND_PORT` e `HEADSHOP_FRONTEND_PORT` – portas públicas que os frontends expõem.
- `PUBLIC_ERP_URL` – URL completa do ERP usada pelo HeadShop para redirecionar clientes (ex.: `https://erp.seu-dominio.com/login`).
- `HEADSHOP_JWT_SECRET` – segredo JWT do HeadShop.
- `MP_*` – tokens/URLs do MercadoPago; defina `MP_ACCESS_TOKEN`, `MP_SUCCESS_URL`, `MP_PENDING_URL`, `MP_FAILURE_URL`, `MP_WEBHOOK_URL`.

Copie o exemplo e mantenha esse arquivo fora do Git (`.gitignore` já cobre `.env.hostinger`). Depois, use:

```bash
cp .env.hostinger.example .env.hostinger
nano .env.hostinger
```

## 3) Deploy inicial

1. Verifique o compose:
   ```bash
   docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml config
   ```
2. Suba o stack:
   ```bash
   docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml pull
   docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml up -d --build
   ```
3. Espere o `db-bootstrap` terminar (ele sai automaticamente com `restart: "no"`). Você pode acompanhar:
   ```bash
   docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml logs db-bootstrap
   docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml logs -f headshop-backend
   docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml logs -f erp-backend
   ```

## 4) Saúde e monitoramento

- `docker compose ... ps` mostra containers e estado de saúde (o Postgres usa `pg_isready`).
- `docker compose ... exec postgres pg_isready` pode validar manualmente.
- `docker compose ... exec headshop-backend npx prisma migrate status` garante que o Prisma rodou.
- Os frontends usam `nginx.hostinger.conf` (headshop) e `nginx-spa.conf` (ERP) para servir os builds; verifique se o arquivo `headshop-frontend/nginx.hostinger.conf` está sendo copiado no `Dockerfile`.

## 5) Dados e backups

- O volume `postgres_data` guarda os dados. Faça backup com `docker compose --env-file ... exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql`.
- Para migrar dados entre servidores, pare os serviços e use `docker run --rm -v postgres_data:/var/lib/postgresql/data -v $PWD:/backup alpine tar czf /backup/postgres_data.tar.gz -C /var/lib/postgresql/data .`.

## 6) Pipeline de releases

1. No GitHub, crie tags (ex.: `git tag v1.3.0`) e configure um workflow (`.github/workflows/release.yml`) que:
   - Roda testes e `docker compose -f docker-compose.hostinger.yml build`.
   - Publica as imagens num registry (Docker Hub, GHCR).
   - Usa `ssh` ou webhook para chamar um `deploy.sh` na VPS que:
     ```bash
     git pull origin main
     docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml pull
     docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml up -d --build
     docker compose --env-file .env.hostinger -f docker-compose.hostinger.yml logs --tail 50
     ```

2. Se quiser zero downtime, o script pode executar `docker compose up -d --no-deps --build erp-backend` antes de atualizar o frontend, e só depois recarregar os outros serviços com `docker compose stop headshop-backend` seguido de `docker compose up -d headshop-backend`.

3. Mantenha um arquivo `deploy/notes.txt` ou similar com o ID da última release para facilitar rollback (`docker compose --env-file ... pull --ignore-pull-failures` e `docker tag registry/erp:prev erp:latest`).

## 7) Rotina de atualização

1. `git pull`
2. Atualize `.env.hostinger` se necessário.
3. `docker compose ... pull`
4. `docker compose ... up -d --build`
5. Verifique logs e status.

Se algo falhar, volte ao backup do volume ou use `docker compose --env-file ... down -v` e reconstrua.
