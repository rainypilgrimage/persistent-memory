# Changelog

## [0.10.1] - 2026-09-12

### Changed

- Clarified that confirming the content of a memory update is separate from authorizing a filesystem change.
- Added an explicit write gate for writes, moves, and deletions: show the exact preview and wait for explicit approval before mutating files.
- Clarified that a request naming a project or note uses on-demand loading, while baseline context is loaded only for an explicit baseline request.
- Required current-state answers to include the canonical status conclusion, its last-updated or last-verified date, and the coverage or limitation of the answer.

### Compatibility

- This release preserves the v0.10.0 metadata, lifecycle, ownership, and freshness safeguards.
- It does not add background synchronization, automatic migration, or live-source polling.
