# Ent'Artes - Gemini CLI Instructions

## Project Overview
Ent'Artes is a management system for a dance school, featuring coaching bookings, monthly billing, and a community marketplace. It is a full-stack application built with .NET 10 and React.

## Technical Stack
- **Backend:** .NET 10 Web API, Entity Framework Core (SQL Server), JWT (Auth), EPPlus (Excel reports).
- **Frontend:** React 18/19, TypeScript, Vite, TailwindCSS, Shadcn UI, TanStack Query, Axios.
- **Testing:** xUnit, Moq (Backend); Vitest, Playwright (Frontend).

## Project Structure
- `website/backend/`: .NET solution with layered architecture.
    - `EntArtes.API`: Controllers, DTOs, DI configuration.
    - `EntArtes.Core`: Domain entities, service interfaces, business logic.
    - `EntArtes.Infrastructure`: Service implementations, DB context, migrations.
    - `EntArtes.Tests`: Unit and integration tests.
- `website/frontend/`: React application.
    - `src/pages/`: Page components (navigation is state-driven in `Index.tsx`).
    - `src/services/`: API client modules.
    - `src/components/`: Reusable UI components (Shadcn UI).
- `Especificação/`: Design and architectural diagrams.
- `Documentação/`: Formal project reports.

## Key Conventions & Workflows
### Architecture
- **Layered Backend:** Business logic must stay in `EntArtes.Core` or `EntArtes.Infrastructure`. Controllers should be thin.
- **Frontend Navigation:** Most pages are rendered via the `Index.tsx` component based on local state (`currentPage`). When adding a new page, register it in `Index.tsx` and update the `allowedByRole` map.

### Security
- **JWT Auth:** Tokens are validated against a `SecurityStamp` in the database. Changing a user's role should trigger a `SecurityStamp` update to revoke active tokens.
- **Roles:** 
    - `direcao` (0): Full access.
    - `professor` (1): Schedule and validation access.
    - `encarregado` (2): Booking and marketplace access.

### Development Guidelines
- **API Communication:** Always use the centralized `api.ts` axios instance for backend calls.
- **Database:** Use `DbInitializer.cs` for seed data. Avoid manual SQL scripts; use EF Migrations.
- **UI:** Follow Shadcn UI patterns. Use `lucide-react` for icons and `sonner` for notifications.

## Testing Strategy
- **Backend:** Add unit tests in `EntArtes.Tests` for any new service logic.
- **Frontend:** Use Vitest for component tests and Playwright for E2E flows.
- **Validation:** Always verify the triple approval flow for bookings: Encarregado (Request) -> Professor (Accept) -> Direção (Validate/Assign Studio).
