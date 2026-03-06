# Seguranca - checklist minimo para producao

- Separar bancos: mantenha um banco para ERP e outro para Headshop, se necessario.
- Privilegios minimos: evite superuser para aplicacao; use usuario com permissoes restritas.
- Senhas fortes e rotacao: use placeholders em exemplos e troque credenciais periodicamente.
- Use SSL/TLS no Postgres: habilite `ssl` entre app e banco em producao.
- Nao armazenar senha em plaintext: migrar para hashing (ex.: `bcrypt`).
- Ambientes separados: dev, staging e prod com segredos diferentes.
- Backups automaticos: mantenha rotina de dump/snapshot com teste de restauracao.
- Auditoria e monitoramento: acompanhe falhas de login, erros e latencia.
- Secrets management: prefira Docker secrets, Vault, Azure Key Vault ou AWS Secrets Manager.
- Firewall e rede: exponha apenas o necessario via proxy com TLS.

Recomendacao imediata:
- Atualizar autenticacao para hash de senha no backend e no seed.
- Garantir `.env` e arquivos de segredo no `.gitignore`.