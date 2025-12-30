# Plausible — Core Declaration

## Core Service Definition

**Plausible** is fundamentally a **Monte Carlo–based outcome simulator**.

The core of the service is the generation of **many plausible future scenarios** for an investment plan, and the estimation of their **probabilities**, given a set of explicit assumptions.

Plausible does **not** replay historical market paths.
It does **not** forecast a single future.

Instead, it explores a _distribution of possible outcomes_ constrained by historically coherent risk characteristics.

---

## What “Based on Historical Data” Means

Historical data is used **only** to inform the _parameters_ of the model:

- expected returns (μ)
- volatility (σ)
- correlations (where applicable)

These parameters are:

- explicitly visible
- configurable by the user
- versioned over time

Historical prices are **not** used as simulation paths.

> We do not simulate history.
> We simulate plausible futures constrained by historical risk.

---

## Monte Carlo as the Core Engine

At the heart of Plausible is a Monte Carlo engine that:

- generates thousands of independent stochastic paths
- models time evolution at a monthly resolution
- incorporates contributions, fees, inflation, and rebalancing
- produces probability distributions rather than point estimates

Each simulation run represents **one possible world**.
The aggregate represents a **probability space**.

---

## Why Monte Carlo (and Not Backtesting)

Backtesting answers:

> “What would have happened if the past repeated exactly?”

Monte Carlo answers:

> “What _could_ plausibly happen, given the risk characteristics of the assets?”

Plausible intentionally avoids historical backtests because:

- they rely on a single realized path
- they embed regime-specific bias
- they often overstate certainty

Monte Carlo exposes uncertainty instead of hiding it.

---

## Interpreting Results

Outputs such as:

- p10 / p50 / p90 values
- percentile bands
- probability of reaching a threshold

should be read as:

- ranges, not predictions
- likelihoods, not promises

The median (p50) is **not** an expected outcome.
It is the center of the simulated distribution.

---

## Roadmap Alignment (Clarification)

The roadmap is intentionally centered around:

- improving scenario realism
- making assumptions more explicit
- enhancing interpretability of distributions

Future work may include:

- stress scenarios
- regime-based assumptions
- comparison of assumption sets

But the **core will remain Monte Carlo simulation**, not historical replay.

---

## Positioning Statement (Short Form)

> Plausible is a Monte Carlo–based simulator for exploring plausible investment outcomes.
> It uses historical data to constrain assumptions, not to predict the future.

---

## Non-Negotiables

Plausible will never:

- present historical performance as a promise
- collapse uncertainty into a single number
- optimize allocations for the user
- hide modeling assumptions

Uncertainty is the product.
Transparency is the feature.
