# Bug Squasher: DOM Defense

A tiny TypeScript canvas game about a production incident going sideways.
Bugs crawl in from the edges, your server sits in the middle, and every missed squash is one step closer to zero uptime.

The code is intentionally small, but it is not a one-file toy. The game loop, entities, spawning, rendering, input, and local storage are split into separate TypeScript modules so the structure is easy to read.

## Stack

- Next.js App Router
- React client component for the canvas host
- TypeScript game classes under `src/game`
- Canvas 2D rendering
- LocalStorage high score
- Original code-drawn graphics and app icon

## Run It

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Gameplay

- Production Bug: slow, 1 HP
- Friday Deploy: fast, 1 HP
- Legacy Code: slow, 3 HP
- Bad Hotfix: explodes into nearby bugs

Click bugs before they reach the server. The spawn rate and bug speed climb as the incident drags on. Combos increase score, and the best score is saved in the browser.

## Project Shape

```txt
app/
  components/BugSquasherGame.tsx
  globals.css
  layout.tsx
  page.tsx
src/
  game/
    Bug.ts
    Game.ts
    Input.ts
    Renderer.ts
    Spawner.ts
    storage.ts
    types.ts
```

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run ci
```

## Version

Current version: `0.1.0`

Release notes live in [CHANGELOG.md](CHANGELOG.md). The first release is tagged as `v0.1.0`.

## Public Repo Note

The `.gitignore` is set up for a public Next.js repo: dependencies, build output, local env files, caches, logs, OS files, and editor folders stay out of commits.

If an editor folder was already committed before this ignore file, untrack it before publishing:

```bash
git rm --cached -r .idea
```
