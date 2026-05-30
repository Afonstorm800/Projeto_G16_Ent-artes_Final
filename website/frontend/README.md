# Ent'Artes - Frontend (React)

## 📖 Sobre
Interface web moderna desenvolvida para a Escola de Dança Ent'Artes. Construída com foco na experiência do utilizador e responsividade.

## 🛠️ Tecnologias
- **React 19** com **TypeScript**
- **Vite** (Build Tool)
- **TailwindCSS** + **Shadcn UI** (Design System)
- **Framer Motion** (Interações e Animações)
- **React Query** (Sincronização de dados com API)
- **React Hook Form** + **Zod** (Validação de formulários)

## 🚀 Como Executar
1. Instale as dependências:
   ```sh
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```sh
   npm run dev
   ```
3. Aceda em `http://localhost:5173`.

## 📂 Estrutura de Pastas
- `src/components/`: Componentes reutilizáveis (UI, Sidebar, Badges).
- `src/pages/`: Páginas principais da aplicação.
- `src/services/`: Integração com a API (Axios).
- `src/contexts/`: Gestão de estado global (Autenticação).
- `src/hooks/`: Hooks personalizados.

## 🔐 Configuração da API
O frontend comunica com o backend em `http://localhost:5063`. Esta configuração pode ser encontrada em `src/services/api.ts`.
