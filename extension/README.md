# Plausible Instrument Helper (Chrome)

Minimal MV3 extension to capture basic data from JustETF and add a custom instrument to Plausible (localStorage key `sim_user_instruments_v1`).

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked" and select the `chrome` folder in this repo.

## Use

1. Open a JustETF instrument page and click "Capture from JustETF".
2. Fill in missing fields (mu/sigma are decimals, e.g. 0.07 for 7%).
3. Open Plausible in another tab (e.g. `http://localhost:5173`).
4. Click "Add to Plausible" to write to localStorage.

## Host permissions

If Plausible runs on a different host, add it to `host_permissions` in `chrome/manifest.json` and reload the extension.
