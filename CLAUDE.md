# CLAUDE.md

> This file is automatically pulled by Claude at the start of a conversation for context. It contains key developer knowledge, common commands, repo conventions, and other “tribal knowledge” about the monorepo.

---

## 1. Repository Overview

**Monorepo Structure (TurboRepo):**

root/
├─ apps/
│ ├─ app1/
│ └─ app2/
├─ packages/
│ ├─ dtos/ # Shared data transfer objects
│ ├─ dto-models/ # Typed models for validation and transformation
│ ├─ service-actions/ # Functions to perform actions across services
│ ├─ service-contracts/ # API request/response definitions between apps/services
│ ├─ isamorphic-utils/ # Utilities shared across backend and frontend
│ ├─ backend-utils/ # Backend-specific helper functions
│ └─ ai/ # AI-related utilities, prompts, and agents

---

## 2. Package Manager

We use **pnpm** as the package manager for the monorepo.

Common commands:

- Install dependencies: `pnpm install`
- Add a package: `pnpm add <package> -w` (workspace root) or `pnpm add <package> -F <package-name>` (specific package)
- Run scripts: `pnpm run <script> -F <package-name>`
- Update dependencies: `pnpm up`

---

## 3. Common Bash Commands

- Build all packages: `pnpm build`
- Lint all packages: `pnpm lint`
- Run tests: `pnpm test`
- Clean node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Turbo commands: `pnpm turbo run <task> --filter=<package-name>`

---

## 4. Core Files & Utility Functions

- dtos/: shared data contracts for input/output across services
- dto-models/: type-safe validation and transformation
- service-actions/: core functions to execute actions across services
- service-contracts/: API request/response definitions
- isamorphic-utils/: utility functions shared between frontend and backend
- backend-utils/: backend-specific utilities
- ai/: AI prompts, helper functions, and agent orchestrations

---

## 5. Code Style Guidelines

- TypeScript with strict types
- Use Zod or equivalent for runtime validation
- PascalCase for types, camelCase for variables/functions
- No implicit any
- Consistent formatting with Prettier (run `pnpm format`)

---

## 6. Testing Instructions

- Each package may have its own test suite
- Run all tests: `pnpm test`
- Run a single package’s tests: `pnpm test -F <package-name>`
- Coverage reports: `pnpm test -- --coverage`
- Recommended: write tests for all service-actions and AI helpers

---

## 7. Repository Etiquette

- Branch naming: `<type>/<short-description>` (e.g., feature/ai-agent, fix/login-bug)
- Merge strategy: prefer **rebase** over merge for feature branches
- Pull request: must include description, related ticket, and testing steps
- Code reviews: at least one approval before merging
- CI/CD: ensure all lint, test, and build steps pass before merging

---

## 8. Developer Environment Setup

- Node version managed via `volta` or `nvm`
- Use `pnpm install` at the root
- IDEs: VSCode recommended, with TypeScript plugin
- Ensure turbo caching is enabled for faster builds
- Compilers: TypeScript >=5.1, Node >=20

---

## 9. Unexpected Behaviors / Warnings

- Some AI utilities may log long prompts; ensure logs don’t leak sensitive data
- DTOs and service-contracts must stay in sync; mismatched types can cause runtime errors
- Turbo caching may occasionally serve stale builds; use `pnpm turbo prune` to refresh
- Some packages rely on environment variables stored in `.env.local`

---

## 10. AI & Agent Notes

- ai/: contains reusable prompts and agent orchestration code
- Use Mastra or VercelAI SDK as per project guidance
- Keep prompts in `.hbs` format for templating
- Include human-in-the-loop validation in workflows
- Avoid prompt injection and ensure access control when processing sensitive company data
