# ADR-001 Local-First No Backend

## Status

Accepted

## Context

The project was originally conceived with a backend-centric architecture, then pivoted to a static PWA using IndexedDB. The current repository, documentation, and deployment model all assume there is no server-side data API, no authentication, and no always-on infrastructure.

## Decision

`Mon Budget` will be treated as a local-first, frontend-only product. Core user data lives in IndexedDB on the device, and product scope will not assume a backend service.

## Consequences

- Lower hosting and operational complexity
- Stronger privacy posture for personal budget data
- No native multi-device sync
- No cloud recovery by default
- Export/import becomes a core resilience feature
- Product capabilities should remain simple and device-local unless a new architecture decision is made

## Alternatives Considered

- Backend API with persistent server-side storage
- Authenticated cloud-sync budgeting app
- Hybrid model with optional account sync
