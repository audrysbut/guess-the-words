# Guess the Words — AGENTS.md

## Build & dev
- `npm run dev` — Vite dev server on `127.0.0.1:4200`
- `npm run build` — `tsc -b && vite build` (must pass both)
- `npm run preview` — preview production build
- `npm run deploy` — `gh-pages -d dist` (manual deploy)
- CI (`.github/workflows/deploy.yml`): `npm ci && npm run build` on push to `main`

## Stack
- Preact 10 + Vite 6 + TypeScript 5.7, JSX with `jsxImportSource: "preact"`
- Path alias `@/` → `./src/*`
- PeerJS 1.5 for WebRTC peer-to-peer (no backend server)
- No test runner, no linter, no formatter configured

## Project structure
- `src/App.tsx` — root component, screen routing, room management, wires hooks together
- `src/pages/` — HomeScreen, Lobby, GameScreen, SoloGame
  - `SoloGame.tsx` — solo game screen, mounts `useSoloGame`, renders `GameScreen`
  - `Lobby.tsx` — multiplayer container, owns PeerManager + `useMultiplayerGame`, renders lobby UI or `GameScreen` internally
- `src/components/` — Keyboard, GuessInput, WordDisplay, Timer, ThemeReveal, PlayerList, Scoreboard
- `src/store/` — hooks and pure game logic
  - `game-logic.ts` — pure game state transformation functions (letter guess, word guess, round transitions)
  - `use-language.ts` — language state with localStorage persistence
  - `use-solo-game.ts` — solo game state machine (state, handlers, round effects)
  - `use-multiplayer-game.ts` — host/multiplayer game logic (handlers, timer, peer message routing, round effects)
- `src/types/game.ts` — GameState, Player, GameConfig, Theme, Language types
- `src/types/messages.ts` — WebRTC message types
- `src/data/words.ts` — English word bank (~180 entries) + language-aware `selectWordsForGame()`
- `src/data/words.lt.ts` — Lithuanian word bank
- `src/webrtc/peer-manager.ts` — PeerJS wrapper (create/join rooms, messaging)
- `src/i18n/` — custom i18n system (see below)

## i18n
- Custom system (no library): `I18nProvider` + `useT()` hook in `src/i18n/context.tsx`
- Translation keys: `src/i18n/types.ts` (TranslationKey union)
- Strings: `src/i18n/locales/en.ts` and `src/i18n/locales/lt.ts`
- Template syntax: `t('roundOf', '3', '8')` → replaces `{0}`, `{1}` etc.
- Default language: `lt` (stored in localStorage key `guess-the-words-lang`)
- Language stored in `GameConfig.language`, synced via WebRTC
- App.tsx uses inline conditionals for error strings (cannot call `useT()` since it renders I18nProvider)

## Game architecture
- Hooks are mounted per-screen, not in App.tsx: solo hooks only active during solo, multiplayer hooks only active during multiplayer
- Host drives all game logic locally, sends `state_sync` messages to peers
- Solo mode runs entirely client-side via `soloGameState`
- Phases: `lobby → round_intro → playing → round_end → game_over` (cycle round_intro→playing→round_end)
- Letter matching uses `/\p{L}/u` (Unicode letter class) — supports Lithuanian characters
- Keyboard component accepts `lang` prop; adds Lithuanian row (ĄČĘĖĮŠŲŪŽ) in LT mode

## Word bank
- `selectWordsForGame(themes, totalRounds, language)` picks from English or Lithuanian word bank
- Both banks share the same `Theme` enum; entries have `{answer, tokens, theme}`
- Actors, famous people, and video games use original English names in both banks

## Conventions
- No tests — verify with `npm run build`
- Do not commit or push unless the user explicitly requests it
