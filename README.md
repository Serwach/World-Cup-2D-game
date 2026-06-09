# World Cup 2026 — 2D Arcade Football Game

Local 2-player top-down arcade football with real World Cup 2026 teams.

## Requirements

- Node.js 18+

The database is **SQLite** (via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)) — no external database server needed. The DB file is created automatically at `db/worldcup2026.sqlite`.

## Quick Start

```bash
# 1. (Optional) Create a .env file
cp .env.example .env
# Defaults work out of the box; set DB_FILE to override the SQLite path.

# 2. Install all dependencies
npm install

# 3. Start the development server
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

The server **auto-migrates** and **auto-seeds** the database on first run (48 teams, 192 players, group stage fixtures).

## Controls

| Action | Player 1 | Player 2 |
|---|---|---|
| Move | `WASD` | `Arrow Keys` |
| Shoot/Pass | Hold `SPACE` then release | Hold `ENTER` then release |

- **8-directional movement** — combine direction keys (e.g. W+D = move up-right)
- **Shot power bar** — hold the action button to charge; a bar shows above your player. Release to shoot.
- **Auto-select** — the player closest to the ball is automatically controlled
- **Goalkeeper AI** — GK stays near goal and moves to intercept danger

## Game Modes

### Quick Match
Pick any 2 teams and play a single match with configurable settings.

### Tournament
Full World Cup 2026 format:
- 48 teams in 12 groups of 4
- Round-robin group stage (6 matches per group)
- Top 2 from each group + 8 best 3rd-place teams advance (32 total)
- Knockout rounds: R32 → R16 → QF → SF → Final

**Group stage draws end the match** (no extra time in groups).

## Match Settings
- **Match Duration**: 1–90 minutes
- **Extra Time**: 2×15 min (knockout only)
- **Golden Goal**: First goal in extra time wins
- **Penalties**: 5-kick shootout after ET

## Running Tests

```bash
# Unit + integration tests
npm test

# E2E tests (requires game running)
npm run test:e2e
```

## Project Structure

```
world-cup-game/
├── client/          # Phaser 3 TypeScript game
│   └── src/
│       ├── scenes/  # Game scenes (Menu, Game, Tournament, etc.)
│       └── game/    # Game objects (Player, Ball, Field, HUD, AI)
├── server/          # Express + Socket.io backend
│   └── src/
│       ├── routes/  # API endpoints
│       ├── tournament/ # Ranking & advancement logic
│       └── socket/  # Real-time sync
├── shared/          # Shared TypeScript types & constants
├── db/              # SQL schema + seed data (48 teams, 192 players)
└── tests/           # Jest unit/integration + Playwright E2E
```

## Database Schema

- `teams` — 48 national teams with colors
- `players` — 192 players (4 per team: 1 GK + 3 outfield)
- `matches` — All fixtures (group + knockout)
- `standings` — Live group standings
- `tournament_config` — Current tournament state

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teams` | All teams |
| GET | `/api/groups` | Groups with standings |
| GET | `/api/matches` | Matches (filterable by stage/round) |
| POST | `/api/matches/result` | Submit match result |
| GET | `/api/tournament/state` | Full tournament state |
| GET | `/api/tournament/bracket` | Knockout bracket |
| POST | `/api/tournament/advance-to-knockout` | Generate knockout matches |
| POST | `/api/tournament/reset` | Reset tournament |
