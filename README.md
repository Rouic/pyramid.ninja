# 🎮 Pyramid.Ninja

An engaging multiplayer card game leveraging realtime Firebase and Next.js for a fluid gaming experience.

## 🚀 Tech Stack

- **Frontend**: Next.js (React) with TypeScript
- **Styling**: TailwindCSS with custom game-themed extensions
- **Database**: Firebase Firestore (realtime)
- **Authentication**: Firebase Auth
- **Deployment**: Vercel

## 🎯 Game Overview

Pyramid.Ninja is a digital implementation of the classic drinking card game "Pyramid" (also known as "Ride the Bus"). It's designed for social gameplay where players gather around a virtual table and take turns.

### 📋 Game Rules

1. **Setup**: 
   - The game builds a pyramid of cards (typically 5 rows)
   - Each player receives 4 cards that only they can see
   - Players memorize their cards before the game starts

2. **Gameplay**:
   - The host reveals cards from the pyramid one at a time
   - If a player has a matching card in their hand, they can assign drinks
   - Other players can challenge if they think someone is bluffing
   - The number of drinks assigned depends on the row of the pyramid (higher rows = more drinks)

3. **Challenges**:
   - If a challenge is successful, the challenged player drinks
   - If a challenge fails, the challenger drinks
   - When challenged or after assigning drinks, players must replace the card they used

## 🗂️ Project Structure

```
pyramid.ninja/
├── public/          # Static assets, images, sounds
├── src/
│   ├── components/  # React components
│   │   ├── layout/  # Layout components (Header, Footer, etc)
│   │   └── ...      # Game-specific components
│   ├── contexts/    # React context providers
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utilities and Firebase interactions
│   │   └── firebase/ # Firebase setup and database functions
│   ├── pages/       # Next.js pages
│   │   └── game/    # Game-related pages
│   ├── styles/      # Global CSS and styling
│   └── types/       # TypeScript type definitions
├── legacy/          # Old codebase (reference only)
```

## 🛣️ Common Code Paths

### Game Creation & Joining

1. `/src/pages/host.tsx` - Host creates a new game
2. `/src/pages/join.tsx` - Players join with game code
3. `/src/pages/game/[id].tsx` - Main game screen (dynamic route with game ID)

### Game Logic

1. `/src/lib/firebase/gameState.ts` - Game state management
2. `/src/lib/firebase/gameCards.ts` - Card-related operations
3. `/src/contexts/GameContext.tsx` - Game context provider for sharing state

### UI Components

1. `/src/components/GamePyramid.tsx` - Renders the pyramid of cards
2. `/src/components/PlayerHand.tsx` - Manages player's hand of cards
3. `/src/components/GameControls.tsx` - Game control buttons
4. `/src/components/DrinkAssignmentPanel.tsx` - Handles assigning drinks

## 🚦 State Management

The game uses a combination of:

- **Firebase Firestore**: For persistent, realtime game state shared between players
- **React Context**: For local state management and component communication
- **React Hooks**: For component-level state and Firebase subscription management

Key state includes:
- Game phase (waiting, memorizing, playing, ended)
- Player information and readiness status
- Card positions and visibility
- Drink assignments and challenges

## 🔄 Data Flow

1. **Host Creates Game**: 
   - Generates unique game ID
   - Configures game settings
   - Creates initial Firestore document

2. **Player Joins Game**:
   - Adds player to the game's player list
   - Subscribes to realtime updates

3. **Game Flow**:
   - Host deals cards to players
   - Players memorize their cards
   - Host reveals pyramid cards
   - Players assign/receive drinks and challenge
   - Cards are replaced until pyramid is complete

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm run start

# Run ESLint
npm run lint
```

## 📱 Responsive Design

The game is designed for multiple devices:
- **Desktop**: Full layout with card dragging and standard sizing
- **Tablet**: Adjusted layout with optimized card positioning
- **Mobile**: Compact view with 2x2 grid for cards in portrait mode

Specific mobile optimizations include:
- Reduced control panel sizes
- Optimized spacing for smaller screens
- Touch-friendly card interactions
- Responsive typography with smaller sizes on mobile

## 🧩 Key Components

### GameCard

The base card component with:
- Flip animations
- Drag functionality
- Visual indicators for new/revealed cards
- Challenge and selection states

### GamePyramid

Renders the pyramid structure with:
- Row-based organization
- Card reveal animations
- Visual indicators for current row/card

### PlayerHand

Manages the player's cards with:
- Draggable positioning
- Responsive grid layout on mobile
- Card memorization and reveal capabilities

## 🔒 Security Model

- Game access is controlled by game IDs
- Player actions are validated server-side
- Firebase security rules prevent unauthorized access
- Client-side validation complements server-side rules

## 🎨 Styling Approach

- Custom TailwindCSS configuration with game-specific colors
- Card-themed design system inspired by Balatro
- CSS variables for consistent theming
- Responsive design with Tailwind's responsive prefixes (xs:, sm:, md:, etc.)
- Animation system for cards and UI elements

## 🌐 Deployment

The project is configured for deployment on Vercel with:
- Automatic preview deployments for PRs
- Production branch deployment
- Environment variable configuration

## 🚀 Future Enhancements

- Additional game modes
- Voice chat integration
- More customization options
- Enhanced mobile experience
- Persistent user profiles

---

© 2024 Pyramid.Ninja