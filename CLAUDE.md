# CLAUDE.md - Guidelines for Claude Code

## Commands
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style Guidelines
- **TypeScript**: Use TypeScript for type safety. Avoid `any` types when possible.
- **Imports**: Group imports by external libraries, then internal components/utils.
- **Components**: Use functional React components with hooks.
- **Naming**: PascalCase for components, camelCase for functions/variables.
- **Error Handling**: Use try/catch for async operations. Log errors appropriately.
- **State Management**: Use contexts for shared state (see AuthContext, GameContext).
- **Styling**: Use TailwindCSS for styling with customized configuration.
- **Firebase**: Follow established patterns for Firestore interactions.

## Repository Structure
- `/src` - Next.js application source
- `/public` - Static assets
- `/legacy` - Old codebase (for reference only)