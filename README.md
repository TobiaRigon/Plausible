# Plausible

Plausible is a local-first investment outcome simulator. It explores plausible ranges of outcomes based on explicit assumptions. It does not predict returns.

## Key ideas

- Planning beats forecasting
- Explicit assumptions over hidden averages
- Ranges and probabilities over single numbers
- No optimization, no recommendations, no hype

## Tech stack

- Vue 3 + Vite + TypeScript
- Fully client-side (no backend)
- Static deployment friendly (Vercel)

## Getting started

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## App structure

- `/` Home (disclaimer + core principles)
- `/dashboard` User portfolios
- `/portfolio/new` Create portfolio
- `/portfolio/:id/edit` Edit portfolio
- `/simulate/:portfolioId` Simulation
- `/settings` Export/Import/Preferences

## Local-first storage

All user data is stored in the browser (localStorage). No backend is required.

Keys:

- `sim_user_portfolios_v1`
- `sim_user_instruments_v1`
- `sim_last_params_v1`
- `sim_user_preferences_v1`

Export/Import is available in Settings for backup and transfer.

## Instruments catalog

Static instruments live in `src/data/instruments/*.json`. Each file is a single instrument:

```json
{
  "id": "vwce",
  "label": "VWCE",
  "assetClass": "equity_global",
  "instrumentType": "ETF",
  "exposure": "equity",
  "simModel": "risky",
  "ter": 0.0019,
  "mu": { "3Y": 0.06, "10Y": 0.07 },
  "sigma": { "3Y": 0.18, "10Y": 0.15 },
  "notes": "Optional"
}
```

Supported fields:

- `id` (unique)
- `label`
- `assetClass`
- `instrumentType` (ETF, ETC, ETP, etc.)
- `exposure` (equity, bond, mixed, commodity, cash, etc.)
- `simModel` (`risky` or `rate`)
- `ter` (annual fee, decimal)
- `mu`/`sigma` (by window)

Add a new instrument by adding a new JSON file to that folder.

## Assumptions and windows

Global configuration is stored in `src/data/config.json` and includes windows, units, methodology, and optional correlations by window.

## Simulation notes

- Risky instruments use a monthly GBM model.
- Rate-like instruments are deterministic.
- Portfolio volatility can use correlations when available.
- The engine runs Monte Carlo simulations in a Web Worker.

## Disclaimer

This tool does not predict returns. It explores plausible outcomes based on assumptions. Markets may behave differently. If you are looking for certainty, this is not the right tool.
