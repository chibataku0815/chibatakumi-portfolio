# CLAUDE.md - Portfolio Project Guidelines

## Commands
- Run dev server (web app): `cd apps/web && npm run dev` or `turbo run dev --filter web`
- Run dev server (all apps): `turbo run dev`
- Build: `turbo run build` or `turbo run build --filter web`
- Lint: `turbo run lint` or `cd apps/web && npm run lint`
- Type check: `turbo run check-types` or `cd apps/web && npm run check-types`

## Code Style Guidelines
- Use TypeScript with strict typing when possible
- JSDoc comments for components and important functions (see Hero.tsx)
- Use 'use client' directive for client-side components
- Organize imports: React/Next.js first, then third-party libraries, then local imports
- Component structure: constants → refs → state → effects → handlers → render
- Use tailwind classes for styling with custom color variables
- For animations, prefer GSAP and useEffect for initialization
- Prefer explicit typing over 'any' or type inference for function parameters

## Project Structure
- Monorepo using Turborepo with apps/ and packages/ directories
- Components in app/components/, hooks in app/hooks/
- Follow existing naming conventions: PascalCase for components, camelCase for functions