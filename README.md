# Planning Poker with Astro

A JavaScript migration of the Planning Poker app. Astro builds the pages, React and Zustand run the game UI, and a Cloudflare Worker with Durable Objects stores room state and handles native WebSockets.

## Run locally

Use Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:8787. The development command builds Astro and runs the complete application in Wrangler, including Durable Objects. After changing frontend code, stop and rerun the command to rebuild it. Wrangler reloads Worker source changes automatically. `npm start` also builds the assets before starting Wrangler.

## Checks

```sh
npm run lint
npm run format:check
npm test
npm run build
```

With Wrangler running on port 8787, run real WebSocket tests:

```sh
npm run test:integration
```

Browser tests start their own Wrangler server on port 8788:

```sh
npx playwright install chromium
npm run test:browser
```

## Structure and routes

- `src/pages/index.astro` renders the home page with a small JavaScript create/join handler.
- `src/pages/game.astro` builds a shared game shell. The Worker serves it internally at `/game/:id`, preserving the public URL. `GameEntry.jsx` reads the ID and mounts the game in the browser.
- `src/components/` contains the React game components and their CSS modules.
- `src/lib/` contains Zustand state, socket transport, hooks, card presets, and vote helpers.
- `src/styles/` contains global CSS and shared primitives.
- `cloudflare/game-room.js` stores room state under the existing `room` key and handles WebSocket hibernation, reconnects, disconnect grace periods, and expiry.
- `cloudflare/validation.js` validates incoming messages at runtime.
- `cloudflare/router.js` routes `/ws/:id`, `/api/game/:id`, room pages, and static assets.
- `worker.js` exports the Worker and `GameRoom` class.

Application source and configuration use JavaScript, JSX, CSS, JSON, and Astro templates. Astro may generate TypeScript declarations inside its ignored `.astro` directory as part of its own tooling.

The API and event names, room storage shape, stable player identity key `planning-poker-user-id`, and room-specific `hasJoined-<id>` keys match the original app. Browser identity is origin-specific. Opening this app on a different domain requires joining again.

## Deployment

```sh
npm run deploy
```

Local Wrangler commands run `npm run build` through the custom build configuration. Cloudflare Workers Builds does not honor Wrangler custom builds, so configure its Build command as `npm run build` and its Deploy command as `npx wrangler deploy`. The root directory must contain this project's `package.json` and `wrangler.jsonc`.

This deploys a separate Worker named `planning-poker-astro` with a new Durable Object namespace. No production deployment has been performed as part of the migration.

To replace the existing `poker` Worker while preserving active rooms, first verify the namespace binding and migration history in the Cloudflare account. Deploy this implementation to the existing Worker name, retaining `ROOMS`, class `GameRoom`, migration tag `v1`, and the existing storage shape. Do not delete or rename the Durable Object class or namespace. Back up the prior deployment and verify a returning room before moving traffic. The `v1` migration entry is the existing migration, not a request to create a replacement namespace on the same Worker.

The rewrite removes Next.js, OpenNext, Next routing, and application TypeScript. It preserves card presets and editing, voting and reveal/reset, player renaming, session restoration, statistics, emoji throwing, and confetti.

## Dependency audit

The installation audit reports eight moderate advisories in development lint dependencies, rooted in minimatch. They do not affect production dependencies. No forced major-version overrides were applied.
