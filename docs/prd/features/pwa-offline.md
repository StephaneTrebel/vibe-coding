# Feature PRD - PWA And Offline

## Why This Feature Exists

PWA and offline behavior make the local-first product usable without constant connectivity.

## Scope

- Offline asset access after first load
- Installability
- GitHub Pages subpath compatibility
- Local-only data behavior

## Requirements

- The application must be statically deployable.
- The application must register a service worker that caches build and static assets.
- The service worker must use a cache-first strategy for `GET` requests.
- The service worker must remove stale caches on activation.
- The app must provide a valid manifest with app name, short name, colors, display mode, and icons.
- The manifest and internal paths must support `BASE_PATH` deployment under GitHub Pages.
- Internal navigation must use `$app/paths` `base`.
- The app must provide a route-refresh fallback strategy compatible with static hosting.
- The app must not depend on network requests for product data read/write operations.
- The UI must remain usable on mobile widths with dedicated mobile navigation and bottom safe-area handling.
- Core pages must maintain basic accessibility with no axe violations in the current suite.

## Offline Behavior

- After initial asset caching, the app can serve cached assets through the service worker.
- Product data is stored locally in IndexedDB, so CRUD behavior does not require remote APIs.
- Offline support is strongest for revisiting the already-installed or already-cached app, not for a first visit without connectivity.

## Installability Requirements

- Manifest must define:
  `name`, `short_name`, `description`, `start_url`, `display`, `background_color`, `theme_color`, and app icons.
- `display` must be `standalone`.
- Icons must include 192x192 and 512x512 assets.
- The app shell must include the expected PWA metadata and a service worker.
- Installability in practice still depends on browser and HTTPS conditions.

## Deployment Constraints

- Production deployment target is GitHub Pages on branch `trunk`.
- `BASE_PATH` is empty in dev and set for GitHub Pages builds.
- Static adapter fallback uses `index.html`.
- `404.html` is generated to support SPA refresh behavior on GitHub Pages.
- `.nojekyll` is required to prevent GitHub Pages processing issues.

## Acceptance Criteria

- Given the app is built for production, when deployed under the configured base path, then internal routes resolve correctly.
- Given the app is installed or revisited after caching, when a `GET` asset request is made, then the service worker can satisfy it from cache first.
- Given a new app version is activated, when the service worker activates, then old caches are removed.
- Given the user opens the app on mobile width, when the layout renders, then the bottom navigation is visible and usable.
- Given the user opens the app on desktop width, when the layout renders, then the top navbar is visible and the mobile bottom navigation is hidden.
- Given core routes are analyzed with axe, when tests run, then no accessibility violations are reported in the current suite.
- Given the product performs data CRUD, when the user interacts with transactions, budgets, or goals, then no network API is required for persistence.

## Non-Goals

- Real-time synchronization
- Push notifications
- Background sync
- Cloud backup
- Multi-user sessions
- Complex offline conflict resolution

## Verification Signals

- `frontend/src/service-worker.js` defines cache-first asset behavior and old-cache cleanup.
- `frontend/static/manifest.json.template` defines the generated manifest structure with `BASE_PATH` placeholders.
- `frontend/svelte.config.js` defines static adapter usage and `base` path behavior.
- `DEPLOY.md` documents the GitHub Pages deployment model and failure cases.
- `frontend/e2e/navigation.spec.ts` verifies responsive navigation behavior.
- `frontend/e2e/accessibility.spec.ts` verifies zero axe violations on the main pages.
- `frontend/e2e/NON_FUNCTIONAL_REQUIREMENTS.md` captures the broader intended non-functional posture.

## Open Questions

- Which offline and installability guarantees should be treated as hard release requirements versus documented best effort?
- Should offline behavior get a dedicated smoke test against the deployed static build?
- Is GitHub Pages still the long-term deployment target if the product scope remains local-first but grows?
