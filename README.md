# Atspėk Žodžius

A multiplayer word-guessing game where players take turns revealing letters and guessing words. Built as a pure client-side P2P app — no backend required.

## Features

- **Peer-to-peer multiplayer** — host a game and share a room code; up to 10 players
- **Solo practice** — play alone against a timer
- **PvP turn-based rounds** — each round a player reveals one letter, others can guess the word
- **500+ words across 5 themes** — Filmai, Žmonės, Žaidimai, Knygos, Vietos
- **English & Lithuanian** — full i18n support, language synced across players
- **Lithuanian keyboard row** (ĄČĘĖĮŠŲŪŽ) when playing in LT mode

## Stack

- [Preact 10](https://preactjs.com/) + [Vite 6](https://vite.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/)
- [PeerJS 1.5](https://peerjs.com/) — WebRTC peer-to-peer (no backend)
- Custom i18n system (no library)

## Quick start

```bash
npm install
npm run dev       # dev server at http://localhost:4200/guess-the-words/
npm run build     # tsc -b && vite build
npm run preview   # preview production build
npm run deploy    # deploy to GitHub Pages
```

## Project structure

```
src/
├── App.tsx              — root component, screen routing, wires hooks together
├── main.tsx             — entry point
├── pages/
│   ├── HomeScreen.tsx   — name input, routes to MenuScreen or JoinScreen
│   ├── MenuScreen.tsx   — create game / solo practice buttons
│   ├── JoinScreen.tsx   — join game form (when ?room= in URL)
│   ├── Lobby.tsx        — thin lobby consumer, renders LobbyUI or GameScreen
│   ├── LobbyUI.tsx      — presentational lobby (player list, invite link)
│   ├── SoloGame.tsx     — solo game screen, mounts solo hooks
│   ├── GameScreen.tsx   — phase router (delegates to phase screens)
│   ├── PlayingScreen.tsx — playing phase (keyboard, word display, timer)
│   ├── RoundIntroScreen.tsx — round intro (theme reveal)
│   ├── RoundEndScreen.tsx   — round end (winner, answer reveal)
│   └── GameOverScreen.tsx   — game over (final standings)
├── components/
│   ├── WordDisplay.tsx  — letter tiles with reveal animation
│   ├── Keyboard.tsx     — on-screen keyboard with language variants
│   ├── GuessInput.tsx   — full-word guess input
│   ├── Timer.tsx        — turn timer bar
│   ├── ThemeReveal.tsx  — current theme card
│   ├── PlayerList.tsx   — multiplayer player list
│   └── Scoreboard.tsx   — scores table
├── store/
│   ├── game-logic.ts          — pure game logic functions + state builders
│   ├── use-language.ts        — language state hook
│   ├── use-solo-game.ts       — solo game state machine hook
│   └── use-multiplayer-game.ts — multiplayer host/peer game hook
├── utils/
│   └── share.ts         — copy/share invite link utilities
├── types/
│   ├── game.ts          — GameState, Player, GameConfig, Theme, Language
│   └── messages.ts      — WebRTC message types
├── data/entries/        — word bank JSON files (en, lt)
├── webrtc/
│   └── peer-manager.ts  — PeerJS wrapper for rooms & messaging
├── i18n/                — custom i18n (context, types, locales)
└── styles/
    └── global.css       — all styles, responsive mobile layout
```

## Game flow

1. Enter your name → create a game (room code) or join one
2. In the lobby, players join until the host starts
3. Each round: theme is revealed → players take turns revealing one letter
4. Any player can guess the full word at any time during their turn
5. Correct guess = points; first to guess wins the round
6. After 8 rounds, the player with most points wins

## i18n

- Default language: Lithuanian (`lt`)
- Switch via the button in the top-right corner
- Language is stored in `localStorage` and synced via WebRTC during games
- Template syntax: `t('roundOf', '3', '8')` → replaces `{0}`, `{1}`

## Deployment

Push to `main` triggers CI (`npm ci && npm run build`) and deploys to GitHub Pages automatically.

Manual deploy:

```bash
npm run deploy
```
