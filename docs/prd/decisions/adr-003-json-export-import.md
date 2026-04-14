# ADR-003 JSON Export Import

## Status

Accepted

## Context

Because the product stores data locally in IndexedDB and has no backend sync, users need a backup and restore mechanism. Project notes also show a future interest in OFX, but the current shipped implementation is JSON-based and tightly aligned to the app’s internal data model.

## Decision

The product will use JSON export/import as the canonical backup and restore mechanism for the current scope, with schema-like validation and explicit replace-versus-merge import behavior.

## Consequences

- Backup and restore are available without adding server infrastructure
- The exported format is highly compatible with the internal data model
- Import can be validated strictly for integrity and compatibility
- Cross-tool interoperability remains limited
- Future OFX support, if added, should be treated as an extension rather than a replacement for the current JSON contract

## Alternatives Considered

- No backup or restore support
- Manual browser-storage guidance only
- OFX as the primary interchange format
- Cloud backup tied to a backend architecture
