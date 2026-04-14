# ADR-002 GitHub Pages Base Path

## Status

Accepted

## Context

The product is deployed as a static site on GitHub Pages, where the application may be served from a repository subpath instead of the domain root. Without explicit base-path handling, internal links and static assets can break in production.

## Decision

The application will treat GitHub Pages subpath deployment as a first-class constraint by using `BASE_PATH`, `$app/paths` `base`, generated manifest paths, and SPA fallback handling.

## Consequences

- Internal links must use `$app/paths` `base`
- Manifest assets and `start_url` must be generated with the configured base path
- Build and deployment flows must preserve the base-path contract
- Static-hosting refresh behavior requires explicit SPA fallback support
- Deployment docs and testing must account for subpath-specific failures

## Alternatives Considered

- Root-only deployment assumption
- Different static host with root-path guarantees
- Server-assisted routing instead of GitHub Pages SPA fallback
