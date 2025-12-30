# Simulatore Portafoglio Investimenti (Vercel)

## Obiettivo

Realizzare una web app deployata su **Vercel** usando **Vue 3 + Vite + TypeScript** (no backend obbligatorio). che consenta di simulare l’evoluzione di un portafoglio finanziario **senza prezzi live**.

L’app gestisce **due bucket separati**:

- **Fondo Emergenze** (strumento cash-like)
- **Fondo Investimenti** (azionario + obbligazionario + Bitcoin)

Tutto il calcolo è **client-side**. Nessun backend obbligatorio. Architettura già predisposta per una futura integrazione API.

---

## Bucket e Strumenti

### 1. Fondo Emergenze

- **Xtrackers II EUR Overnight Rate Swap UCITS ETF 1C (XEON)**

  - ISIN: LU0290358497
  - Asset class: cash-like
  - TER: ~0,10%

### 2. Fondo Investimenti

- **Vanguard FTSE All-World UCITS ETF (Acc)**

  - ISIN: IE00BK5BQT80
  - Asset class: equity_global
  - TER: ~0,19%

- **iShares Core Global Aggregate Bond UCITS ETF EUR Hedged (Acc)**

  - ISIN: IE00BDBRDM35
  - Asset class: bond_global_ig_eur_hedged
  - TER: ~0,10%

- **WisdomTree Physical Bitcoin**

  - ISIN: GB00BJYDH287
  - Asset class: crypto_bitcoin
  - TER: ~0,15% (fee agevolata, da considerare variabile nel tempo)

---

## File di Seed

Creare `data/portfolio.default.json` come configurazione iniziale del progetto.

Contiene:

- valuta base (EUR)
- bucket
- strumenti
- TER
- asset class

La UI parte sempre da questo seed, poi sovrascrivibile via localStorage.

---

## Funzionalità MVP

### Dashboard

- Visualizza i due bucket come card separate
- Elenco strumenti per bucket
- TER medio calcolato
- Pulsante “Simula”

### Simulatore

Input:

- capitale iniziale
- contributo mensile (PAC)
- orizzonte temporale (anni)
- rendimento atteso annuo (μ)
- volatilità annua (σ)
- inflazione annua
- numero simulazioni Monte Carlo
- ribilanciamento (none / annuale semplificato)

Output:

- valore finale p10 / p50 / p90
- valore reale (inflation-adjusted)
- probabilità di superare una soglia
- grafico andamento nel tempo (bande percentile)
- istogramma distribuzione finale

---

## Motore di Simulazione

### Time Step

- mensile

### Modello

- Geometric Brownian Motion (GBM)
- PAC mensile
- applicazione TER mensile

Formula concettuale:

- ogni mese: `(valore + contributo) * exp(rendimento_mensile)`
- fee applicata mensilmente

### Monte Carlo

- default: 5.000 simulazioni
- restituisce:

  - serie temporale percentili (p10/p50/p90)
  - distribuzione finale
  - metriche riassuntive

---

## Gestione Bucket

### Fondo Emergenze

- μ basso
- σ molto bassa
- simulazione coerente ma semplice

### Fondo Investimenti

- pesi target configurabili in UI
- MVP: μ e σ inseriti manualmente a livello di portafoglio
- Fase futura: calcolo μ e σ pesati + correlazioni

---

## Architettura Frontend (Vue 3)

### Viste / Routing (Vue Router)

- `/` Dashboard
- `/simulate/:bucketId`
- `/settings` (import/export, reset)

### Componenti Vue

- BucketCard.vue
- InstrumentTable.vue
- SimulationForm.vue
- ResultsSummary.vue
- PercentileChart.vue
- DistributionChart.vue

### Moduli / Composables

- `src/types/index.ts`
- `src/composables/usePortfolio.ts` (TER, pesi, validazioni)
- `src/composables/useSimulationEngine.ts` (Monte Carlo)
- `src/composables/useStorage.ts` (localStorage + versioning)

---

## Persistenza

- Tutti i parametri salvati in localStorage
- Versioning dello schema per evitare rotture future

---

## Estensione Futura (NON MVP)

### Prezzi Live

- interfaccia `MarketDataProvider`
- implementazione futura via API route Vercel
- caching e protezione API key

### Extra

- valore attuale portafoglio
- backtest (con warning bias)
- import CSV broker
- confronto storico vs simulato

---

## Milestones di Sviluppo (Vue-first)

1. Setup Vue 3 + Vite + TypeScript
2. Seed `portfolio.default.json`
3. Dashboard bucket
4. Simulatore base (1 path)
5. Monte Carlo + grafici
6. Scenari predefiniti
7. Export / import
8. Preparazione hook per API future

---

## Nota di progetto

L’obiettivo non è fare previsioni, ma **capire sensibilità, range e probabilità**.
UI semplice, niente fuffa, niente overengineering tipo Bloomberg domestico.
