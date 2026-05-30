# Ent'Artes - Sistema de Gestão de Escola de Dança

## 📖 Visão Geral

Aplicação Full-stack desenvolvida para a gestão integral de uma escola de dança. Este projeto foi realizado no âmbito académico para o IPCA (Instituto Politécnico do Cávado e do Ave) pelo Grupo 16.

O sistema permite a gestão de marcações de aulas (Coaching), faturação mensal de alunos, e um marketplace comunitário para doação, aluguer e venda de equipamentos de dança.

### Equipa (Grupo 16)
| Nome | Número | Função |
|---|---|---|
| Afonso Almeida | 26424 | Scrum Master |
| Brune Enes | 25992 | Product Owner |
| Erica Semedo | 30623 | Programadora |
| Diogo Bessa | 25430 | Programador |
| Thifany Antoni | 16077 | Programadora |

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Framework:** ASP.NET Core (.NET 10) Web API
- **Base de Dados:** SQL Server via Entity Framework Core
- **Autenticação:** JWT (JSON Web Tokens)
- **Relatórios:** EPPlus (Geração de Excel)
- **Testes:** xUnit + Moq + InMemory Database

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Estilização:** TailwindCSS + Shadcn UI
- **Animações:** Framer Motion
- **Gestão de Estado/Dados:** TanStack Query (React Query) + Axios

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- .NET 10 SDK
- Node.js (v18+)
- SQL Server (LocalDB ou instância completa)

### 1. Configuração do Backend
1. Navegue para `website/backend/EntArtes.API`.
2. Restaure as dependências: `dotnet restore`.
3. Verifique a ConnectionString no `appsettings.json`.
4. Execute a aplicação: `dotnet run`.
5. O Swagger estará disponível em: `http://localhost:5063/swagger`.

### 2. Configuração do Frontend
1. Navegue para `website/frontend`.
2. Instale as dependências: `npm install`.
3. Execute o servidor de desenvolvimento: `npm run dev`.
4. Aceda em: `http://localhost:5173`.

---

## 👥 Perfis de Utilizador

| Tipo | Descrição |
|---|---|
| **Direção** (0) | Acesso total. Valida marcações, gere inventário e faturação. |
| **Professor** (1) | Gere a sua disponibilidade e confirma a realização das aulas. |
| **Encarregado** (2) | Marca aulas para os seus educandos e gere alugueres/compras. |

---

## ✨ Funcionalidades Principais

### 1. Marcação de Coaching
- Fluxo de aprovação triplo: Pedido (Encarregado) → Aceitação (Professor) → Validação e Atribuição de Sala (Direção).
- Verificação inteligente de disponibilidade de professores e salas.

### 2. Confirmação 48h e Validação
- Após a aula, ambos (Professor e Encarregado) confirmam a sua realização.
- A Direção faz a validação final para que a sessão seja contabilizada para faturação.

### 3. Faturação Mensal
- Agrupamento automático de sessões por encarregado.
- Geração de relatórios individuais e exportação para Excel.

### 4. Marketplace Comunitário
- **Contribuição:** Doação de itens pela comunidade.
- **Aluguer:** Taxas simbólicas para utilização temporária de figurinos/acessórios.
- **Venda:** Compra direta de itens usados.

---

## 📂 Estrutura do Repositório

- `website/backend/`: Solução .NET com camadas API, Core e Infrastructure.
- `website/frontend/`: Aplicação React com componentes modernos e responsivos.
- `Especificação/`: Diagramas de Casos de Uso, Classe, ER, Sequência e Objetos.
- `Documentação/`: Relatório final do projeto em PDF e Word.

---

## 🔐 Credenciais de Teste (Seed Data)

| Role | Email | Password |
|---|---|---|
| **Direção** | `admin@entartes.pt` | `admin123` |
| **Encarregado** | `pai@example.com` | `123456` |
| **Professor** | `ana.silva@entartes.pt` | `prof123` |
