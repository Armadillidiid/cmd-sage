# Agent Guidelines

> See @llms.txt for comprehensive Effect documentation and API references.

## Commands
- **Build**: `pnpm build` (uses tsup, outputs to `dist/`)
- **Test**: `pnpm test` (runs all tests)
- **Type check**: `pnpm typecheck`
- **Clean**: `pnpm clean`

## Code Style
- **Effect-TS**: Use Effect for side effects, errors, and services. Follow Effect patterns (Effect.gen, pipe, Service classes)
- **Imports**: Use namespace imports (`import * as Module from "..."`) for Effect libraries. Use `.js` extensions in imports (ESM)
- **Types**: Strict TypeScript enabled. Use `noUncheckedIndexedAccess`, no implicit any/this. Prefer type inference over explicit types
- **Formatting**: Semicolons required, no unused imports/locals
- **Modules**: ESM only (`type: "module"`). Use `NodeNext` module resolution
- **CLI**: Use `@effect/cli` for commands. Define commands with `Command.make()` and wrap in Effect services
- **Naming**: Use PascalCase for services/classes, camelCase for functions/variables
- **Error handling**: Use Effect's error channel, not throw/catch
- **Paths**: Use `@/*` alias for `./src/*` imports

## Project Structure
- `src/bin.ts` - CLI entry point with Effect runtime
- `src/cli.ts` - Command definitions and CliService
- Single `tsconfig.json` - No extends, all config in one file
