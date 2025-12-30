# Codex Agent Notes

## Project overview
- Frontend-only Vue 3 + Vite + TypeScript.
- Local-first: all user data is stored in browser storage.
- No backend, no external APIs required for core functionality.

## Key constraints
- UI copy is English-only.
- Do not hardcode user data (portfolios, instruments, allocations, params) in repo.
- Prefer localStorage with versioned keys for persistence.
- Keep logic and UI aligned with `roadmap.md`.

## Local storage keys
- `sim_user_portfolios_v1`
- `sim_user_instruments_v1`
- `sim_last_params_v1`
- `sim_user_preferences_v1`

## Routing
- `/` Home
- `/dashboard` User portfolios
- `/portfolio/new` Create
- `/portfolio/:id/edit` Edit
- `/simulate/:portfolioId` Simulation
- `/settings` Export/Import/Preferences

## Instrument catalog
- Static instruments live in `src/data/instruments/*.json`.
- Each file must include `id`, `label`, `assetClass`, `instrumentType`, `exposure`, `simModel`, `ter`, `mu`, `sigma`.

## Simulation notes
- Risky assets use GBM; rate-like assets are deterministic.
- Monte Carlo runs in a Web Worker.
- Portfolio volatility can use correlations from `src/data/config.json`.

## Expectations
- Keep changes minimal and consistent with existing styles.
- Avoid adding heavy dependencies unless requested.
- Prefer simple, readable components and composables.
