# Especificacao - ERP Abacaxita

## Objetivo
Sistema de gerenciamento (ERP pequeno) para controle de produtos, estoque, imagens e relatorios.

## Modulos
- Autenticacao e perfis
- Produtos (CRUD)
- Estoque (entradas/saidas)
- Pedidos (historico e status)
- Relatorios basicos

## Entidades principais
- Usuario: id, email, role, status, created_at
- Produto: id, nome, descricao, preco, categoria, ativo, imagem_url, created_at, updated_at
- Estoque: id, produto_id, quantidade, minimo, atualizado_em
- Pedido: id, usuario_id, total, status, criado_em
- ItemPedido: id, pedido_id, produto_id, quantidade, preco_unitario

## Fluxos
- Admin loga > acessa painel
- Admin cria/edita produtos
- Admin ajusta estoque
- Admin acompanha pedidos

## Integracao com site
- Endpoint publico para listagem de produtos ativos
- Endpoint para historico de pedidos por usuario
- Endpoint para criar pedido
