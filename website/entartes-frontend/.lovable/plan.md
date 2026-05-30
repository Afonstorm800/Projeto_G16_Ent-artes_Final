# Plano de alterações — Ent'Artes

Aplicar os pedidos por papel. Tudo continua frontend/mock (sem backend).

## 1. Encarregado de Educação (EE)

### Página inicial passa a ser "A minha semana"
- Remover o `DashboardPage` para o EE.
- Nova página `WeekPage` (rota default do EE) com duas zonas:
  - **Horário da semana** — grelha Seg–Sex × horas com os coachings/aulas marcados dos educandos (cartões coloridos por modalidade).
  - **Notificações Ent'Artes** — lista lateral de avisos (pedido aceite, sessão a confirmar, novo item no marketplace, etc.).
- Sidebar do EE: substituir "Dashboard" por "A minha semana"; manter "Marcações", "Validações", "Inventário", "Perfil".

### Marcações
- Em "Detalhes do Pedido" corrigir copy: "alunos participantes" → "educandos".
- Cada educando interessado faz o seu próprio pedido (campo "Educando" no formulário, com lista dos filhos do EE; um pedido = um educando).

### Marketplace (Inventário) — vista do EE
- Botão **"Submeter Item"** → **"Adicionar Item"**.
- Modal "Adicionar Item":
  - Campo **Lista**: selector com listas existentes ("Os meus figurinos", "Acessórios da Rita", …) + opção **"+ Criar nova lista"** que abre input.
  - Campo **Fotografia** (upload com preview — mock, aceita ficheiro e mostra thumbnail).
- Remover totalmente a tab/secção de **Contribuições** (não querem esse fluxo).
- Adicionar **disclaimer** visível no topo do marketplace:
  > O Ent'Artes não se responsabiliza por falhas, perdas ou danos em alugueres ou vendas. Este é um serviço opcional disponibilizado à comunidade.

### Dashboard (cartões)
- Cartão "Aulas confirmadas" → "Coachings confirmados".

## 2. Professor

### Dashboard
- Adicionar bloco **"O meu horário desta semana"** (mini-grelha com aulas regulares + coachings agendados).
- Adicionar **link rápido "Pedidos pendentes"** que leva à página de Validações na tab "Pedidos para mim".

### Disponibilidade (nova página "Disponibilidade")
- Sidebar do professor ganha entrada **"Disponibilidade"**.
- Grelha Seg–Sex × horas onde o professor clica para marcar slots como disponíveis para coachings (toggle).
- Texto explicativo: "Os pais só conseguem pedir coachings nos horários marcados como disponíveis."
- A `BookingPage` (vista do EE) passa a ler essa disponibilidade.

### Validações
- Ordenar pedidos por **ordem de chegada** (timestamp asc) — já é por id, mas adicionar coluna "Recebido" com data/hora para ficar explícito.

## 3. Direção

### Horário geral (nova página)
- Sidebar da direção ganha **"Horário Geral"**.
- Grelha semanal com TODAS as aulas regulares + coachings da escola (filtros por professor/modalidade/sala).
- Texto: "Os horários regulares são definidos no fim do ano letivo pela Direção."
- Botão "Adicionar aula regular" (mock — abre modal com professor/modalidade/dia/hora/sala).

### Validações
- Renomear ação na aprovação final: manter "Validar & Atribuir Sala"; adicionar botão **"Desaprovar"** (substitui "Rejeitar" com copy mais claro de que é a Direção a recusar).

## 4. Página "Horário" partilhada (consulta)
- Sidebar de **EE e Professor** ganha entrada **"Horário"** dedicada (separada de "Marcações") — só de consulta.
- EE vê o horário dos educandos; Professor vê o seu horário.
- Resolve o feedback "não é intuitivo consultar o horário nas marcações".

## 5. Copy / tom impessoal
Rever textos visíveis e remover formas que se "dirigem a" (ex.: "Bem-vindo, Ana", "Os seus pedidos", "Confirmar a sua parte") substituindo por formas neutras:
- "Bem-vindo, Ana" → "Início — Ana Ferreira"
- "Os meus pedidos" → "Pedidos do encarregado"
- "Confirmar conclusão" mantém-se (é ação).
- Subtítulos do dashboard reescritos em voz impessoal.

## 6. Testes de funcionalidade (guião de demo)
Criar uma nova página `TestScriptPage` (acesso por URL `/?demo=1` ou link discreto no rodapé do login) com **dois guiões**:
- **Guião A — Encarregado de Educação**: lista de tarefas a executar ("Adicionar um item ao marketplace", "Pedir um coaching para um educando", "Confirmar uma sessão realizada"…), sem dizer COMO. Cada tarefa tem checkbox.
- **Guião B — Outro perfil (Professor / Direção)**: equivalente para os restantes papéis.
Texto introdutório explica o sistema (uma plataforma para gerir uma escola de artes com vários estilos) e pede para realizarem as tarefas. Linguagem impessoal.

## Ficheiros afetados
- `src/pages/WeekPage.tsx` (novo)
- `src/pages/SchedulePage.tsx` (novo — consulta de horário)
- `src/pages/AvailabilityPage.tsx` (novo — professor)
- `src/pages/GeneralSchedulePage.tsx` (novo — direção)
- `src/pages/TestScriptPage.tsx` (novo)
- `src/pages/Index.tsx` (rotas + default por papel)
- `src/components/AppSidebar.tsx` (nav por papel)
- `src/pages/DashboardPage.tsx` (cartões + horário do prof + link pedidos)
- `src/pages/BookingPage.tsx` (campo educando, copy)
- `src/pages/InventoryPage.tsx` (modal Adicionar/Lista/Foto, remover contribuições, disclaimer)
- `src/pages/ValidationPage.tsx` (coluna Recebido, copy "Desaprovar")
- `src/contexts/AuthContext.tsx` (adicionar lista de educandos ao mock do EE)

## O que NÃO se mexe
- Backend / Cloud (continua tudo mock).
- Estética geral (Playfair/Inter, paleta).
- BillingPage (já foi feita na ronda anterior).
