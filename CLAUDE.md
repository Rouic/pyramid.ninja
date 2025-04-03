# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style Guidelines
- **TypeScript**: Use TypeScript for type safety. Explicit return types on functions. `strictNullChecks` is disabled.
- **Imports**: Group imports by external libraries, then internal components/utils.
- **Components**: Use functional React components with hooks.
- **Naming**: PascalCase for components, camelCase for functions/variables, interfaces prefixed with 'I'.
- **Error Handling**: Use try/catch for async operations, especially Firebase interactions.
- **State Management**: Use contexts for shared state (AuthContext, GameContext, PlayerContext).
- **Styling**: Use TailwindCSS for styling with customized configuration.
- **Firebase**: Follow established patterns for Firestore interactions in `lib/firebase/`.

## Repository Structure
- `/src` - Next.js application source
  - `/components` - React components
  - `/contexts` - React context providers
  - `/hooks` - Custom React hooks
  - `/lib` - Utilities and Firebase interactions
  - `/pages` - Next.js pages
  - `/types` - TypeScript type definitions
- `/public` - Static assets
- `/legacy` - Old codebase (for reference only, do not modify)