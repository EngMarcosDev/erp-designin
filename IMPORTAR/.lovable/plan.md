
# Plano: ERP Abacaxita - Sistema de Gestão Completo

## 🎨 Design Visual
- **Tema terroso**: Tons de bege (#f5f0e8), marrom dourado (#8B7355), verde oliva (#6B7B4F)
- **Barra colorida no topo**: Gradiente multicolorido (vermelho, laranja, amarelo, verde) como no original
- **Banners por categoria**: Cada categoria de produto terá uma cor característica (sedas = marrom, piteira = verde, cuia = laranja, bacakits = terracota)
- **Cards elegantes**: Bordas sutis, sombras suaves e hover effects

## 📱 Menu Lateral Colapsável
- Ícone de hambúrguer (☰) no canto esquerdo para abrir/fechar
- Quando fechado: apenas ícones visíveis
- Quando aberto: ícones + nomes das seções
- Seções: Pedidos, Produtos, Usuários, Estoque, Relatórios
- Indicador visual da página ativa

## 📦 Módulo Pedidos (Dashboard)
- 3 cards com contadores: Total de Pedidos, Pagos, Pendentes
- Cores diferenciadas para cada status
- Histórico de pedidos em tabela com filtros
- Estado vazio amigável quando não houver pedidos

## 🛍️ Módulo Produtos (CRUD)
- **Listagem**: Cards visuais com imagem do produto, nome, categoria, preço e estoque
- **Formulário em Modal**: Pop-up elegante para cadastrar/editar produtos
- **Campos**: Nome, Preço, Categoria (select), Estoque, Upload de Imagem, Upload de Banner, Status Ativo/Inativo
- **Ações**: Botão de editar e desativar em cada item
- **Filtros**: Busca por nome e filtro por categoria

## 👥 Módulo Usuários
- **Listagem**: Cards com avatar, nome, email e papel
- **Formulário em Modal**: Pop-up para cadastrar/editar usuários
- **Campos**: Nome, Email, Senha, Papel (ADMIN/USUÁRIO)
- **Ações**: Editar e trocar papel do usuário

## 📊 Módulo Estoque
- **Grid de Cards**: Cada produto em card visual com quantidade e status (Ativo/Inativo)
- **Botão "Checar estoque do sistema"**: Abre modal de comparação
- **Modal de Comparação ERP x HeadShop**: Tabela mostrando diferenças entre sistemas
- **Ações**: Puxar HeadShop → ERP | Enviar ERP → Site
- **Destaque visual**: Linhas com diferenças ficam destacadas em amarelo

## 📈 Módulo Relatórios
- Página com cards de resumo
- Visão geral de estoque e pedidos
- Preparado para expansão futura com gráficos

## ✨ Pop-ups e Modais
- Design consistente com cantos arredondados
- Botão "Fechar" no canto superior direito
- Botão de confirmação verde "Salvar"
- Animações suaves de entrada/saída
- Validação de campos com feedback visual

## 🔔 Feedback Visual
- Toasts de sucesso ao salvar/editar/excluir
- Estados de loading ao processar
- Confirmação antes de ações destrutivas
- Mensagens amigáveis para listas vazias

---

**Nota**: Como você escolheu frontend apenas, os dados serão mantidos em memória (estado local) - ao recarregar a página, voltam ao estado inicial. Quando quiser persistir os dados, podemos adicionar o Lovable Cloud depois.
