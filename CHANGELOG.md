# Changelog & Version History

All notable changes and release notes for Infoboard are documented in this file.

---

## v4.4.3
- **Dev Environment Service Worker & HMR Fix:** Updated [`app/plugins/pwa.client.ts`](app/plugins/pwa.client.ts) to skip Service Worker registration in development (`import.meta.dev`), automatically unregister stale Service Workers, and purge `infoboard-shell-*` caches so Vite HMR and `/_nuxt/` dev modules are never intercepted.
- **Service Worker Origin & Protocol Hardening:** Updated [`public/sw.js`](public/sw.js) (bumped to `infoboard-shell-v2`) to ignore non-HTTP(S) schemes (e.g. `chrome-extension://`), cross-origin requests, and Vite dev transform/HMR parameters.
- **Explicit Nitro External for `i2c-bus`:** Marked `i2c-bus` as external under `nitro.rollupConfig.external` in [`nuxt.config.ts`](nuxt.config.ts), silencing the Rollup build warning on non-Linux dev machines while preserving native addon resolution in production.

## v4.4.2
- **Documentation Modularization & Git Production Workflow:** Moved comprehensive version history into this dedicated `CHANGELOG.md`.
- **Dedicated Hardware Sensor Documentation:** Created [`docs/SENSE_HAT.md`](docs/SENSE_HAT.md) covering fresh Raspberry Pi OS host setup, direct user-space I2C bus wiring, ribbon cable calibration formulas, GID mapping, and troubleshooting.
- **Cleaned Deployment & Target Update Instructions:** Removed obsolete references to remote registries (`your-registry/infoboard`). Provided streamlined first-time installation steps and clear target machine production update instructions (`git pull` and `docker compose up -d --build`).

## v4.4.1
- **Alpine Docker `i2c-bus` Native Build & Runtime Resolution Fix:** Added `linux-headers` (`<linux/types.h>`) to the Alpine builder stage in [`Dockerfile`](Dockerfile) so `node-gyp` compiles `i2c-bus` instead of silently skipping it as an optional dependency. Explicitly preserved `i2c-bus`, `bindings`, and `file-uri-to-path` in `.output/server/node_modules/` and configured `NODE_PATH` / `/app/node_modules` symlink in the production runner image.

## v4.4.0
- **Direct User-Space I2C Sense HAT Hardware Driver:** Integrated physical Raspberry Pi Sense HAT environmental sensors directly via user-space I2C on `/dev/i2c-1` querying `HTS221` (`0x5f`, relative humidity and temperature) and `LPS25H` (`0x5c`, barometric pressure and temperature). Avoids kernel IIO driver loading (`hts221_i2c`, `lps25h_i2c`) and eliminates `EBUSY` bus contention.
- **Physical Calibration for Ribbon Cable Isolation:** Specifically tailored for ribbon-cable-tethered setups isolated from the Raspberry Pi 4 SoC. Does not factor in Pi CPU thermal throttling math. Applies configurable PCB self-heating offset `NUXT_SENSOR_SENSE_HAT_TEMP_OFFSET` (default: `-1.8`°C) to the averaged raw sensor temperature ($T_{calibrated} = T_{raw} + offset$).
- **Magnus-Tetens Humidity Compensation:** Derives actual dew point from warmed sensor readings ($T_{raw}$, $RH_{raw}$), then recalculates true ambient relative humidity ($RH_{ambient}$) at the calibrated ambient temperature, clamped between 0% and 100%.
- **Barometric Pressure & Elevation Calibration:** Reads barometric pressure in hPa directly from the `LPS25H` 24-bit register with optional elevation offset `NUXT_SENSOR_SENSE_HAT_PRESSURE_OFFSET_HPA` (default: `0.0`).
- **In-Memory Server-Side Caching & Local Dev Fallback:** Implements a 4-second in-memory server cache and concurrency lock to protect `/dev/i2c-1` from high-frequency frontend polling saturation. Gracefully falls back to simulated room telemetry when physical hardware or `/dev/i2c-1` is missing (e.g. local dev).
- **Docker Compose & Container Permissions:** Updated [`docker-compose.yml`](docker-compose.yml) to pass device `/dev/i2c-1:/dev/i2c-1` with supplementary `group_add: 988`, and updated [`Dockerfile`](Dockerfile) to grant the non-root `1001:1001` runner user membership in the `i2c` group with lean multistage packaging.

## v4.3.8
- **Sense HAT & Hardware Sensor Docker Integration:** Mounted host `/sys` as read-only (`/sys:/sys:ro`) in [`docker-compose.yml`](docker-compose.yml) to allow Docker containers to read Linux IIO sysfs device nodes.
- **Dynamic IIO Device Resolution:** Replaced static sysfs path lookups (`iio:device0`, `iio:device1`) with dynamic IIO device discovery scanning for LPS25H (pressure) and HTS221 (humidity/temperature), preventing failures when device probe order changes.
- **Runtime Configuration Fallback:** Added explicit fallback support for both `NUXT_SENSOR_SENSE_HAT_ENABLED` and `NUXT_SENSOR_SENSEHAT_ENABLED` across Nitro runtime config, `/api/config`, and `/api/sensors`.

## v4.3.7
- **Flicker-Free Background Transitions for Low-Power / WebKit Devices:** Fixed background rotation on low-powered devices (such as older iPads) where outgoing images were unmounted before the incoming image bitmap was ready, causing a 1-2 second black screen gap. `BackgroundHost.vue` now verifies DOM `<img>` element attachment, full load, and asynchronous hardware decoding off-thread via `img.decode()` while the incoming slot is completely invisible (`opacity: 0`). The crossfade only commences once the new image is confirmed rendered, keeping the outgoing image solid underneath and eliminating intermediate black screens.

## v4.3.6
- **Blurry Background Image Restoration:** Restored `BackgroundHost.vue` to its original implementation, fixing the double URI-encoding (`%2520`) regression that prevented the blurred background layer (`bg-image-blur`) from rendering.
- **IDE TypeScript / Vue Language Server Diagnostics Fix:** Added explicit root-relative path mappings in `tsconfig.json` and simplified composable bindings in `DateTimeCard.vue` and `KioskActionBar.vue`, resolving all 52 IDE Problems across Vetur, Volar, and TypeScript.

## v4.3.5
- **Resource & Concurrency Hardening:** Fixed file handle closure in EXIF header reader (`try...finally`), guarded serial port initialization and close callbacks in the SDS011 driver against timeouts/disconnects, validated byte-range headers in the video stream endpoint, and switched iCal parsing to asynchronous `nodeIcal.async.parseICS`.
- **Sensitive Credential Redaction:** Added `sanitizeErrorMessage` to mask API keys, tokens, and private calendar URLs from upstream error logs and client responses while preserving diagnostic error details.
- **Vue 3.5 Reactivity, Performance & Accessibility:** Updated `useSystemClock` and `usePolling` to accept reactive getters (`MaybeRefOrGetter`), guarded polling state transitions with execution tokens, adopted `shallowRef` for large data payloads, synced native `fullscreenchange` state via `useState`, extracted modular subcomponents (`TransitTubeSection`, `weatherMetrics`), and improved ARIA dialog/toggle semantics.

## v4.3.4
- **SSR Hydration Text Mismatch Fix:** Suppressed text content mismatch warnings on `DateTimeCard`'s live clock using Vue 3.5's `data-allow-mismatch="text"`, and updated `useSystemClock` to evaluate dynamic timestamps per request during SSR to prevent stale module-level state.

## v4.3.3
- **Production Server Deployment Guide:** Added step-by-step documentation for deploying Infoboard behind an Nginx reverse proxy with automated Let's Encrypt SSL/TLS via Certbot.

## v4.3.2
- **Configurable Docker Host Port Binding:** Made the host port binding in [`docker-compose.yml`](docker-compose.yml) configurable via `HOST_PORT` (defaulting to `127.0.0.1:8086:3000`), resolving conflicts on servers running system web servers (like Nginx) or existing reverse proxies.

## v4.3.1
- **Weather Drawer Type Safety Fix:** Fixed TypeScript type error in `WeatherMoreDrawer.vue` by nullish-coalescing indexed moon phase lookups to conform with strict metric candidate typing (`string | null`).

## v4.3.0
- **Full Migration to Open-Meteo Weather API:** Migrated from Tomorrow.io to Open-Meteo, delivering 10,000 requests/day with zero API key requirement, eliminating rate limit risks on 24/7 displays.
- **Complete Air Quality & Pollen Suite for Free:** Integrated Open-Meteo's Air Quality API, displaying live US Air Quality Index (AQI), European AQI, PM2.5, PM10, Nitrogen Dioxide (NO₂), Ozone (O₃), Sulfur Dioxide (SO₂), Carbon Monoxide (CO), and 6 pollen species forecasts (grass, birch, alder, ragweed, olive, mugwort).
- **Expanded Solar & Astronomical Metrics:** Added sunshine duration, daylight duration, sunrise/sunset times, sea level pressure, and precision synodic moon phase calculations.
- **WMO Weather Interpretation Icons:** Added support for all 28 WMO weather interpretation codes (0–99) mapped to crisp white SVG weather glyphs.

## v4.2.0
- **Adaptive Tomorrow.io Account Tier Handling:** Automatically detects whether the Tomorrow.io account tier supports air quality and pollen layers. On free accounts, unavailable metrics are omitted instead of falling back to misleading zeros (`0 μg/m³`, `Good`, or `None`). On paid accounts with air quality or pollen add-ons, all layers are rendered automatically with grouped section headers.
- **Rich Free-Tier Atmospheric Metrics:** Expanded the "More" drawer with full support for free-tier atmospheric metrics, including Dew Point, Cloud Cover, Precipitation Chance, Wind Direction with compass bearings, Visibility, and UV Index.
- **Accurate Forecast Highs & Lows:** Upstream daily forecast queries now include actual `temperatureMax` and `temperatureMin` fields directly from Tomorrow.io.

## v4.1.2
- **Forecast Temperature Indicators:** Added sleek, lightweight vector indicator icons to the 7-day forecast cards to clearly distinguish daily high (upward arrow) and low (downward arrow) temperatures.

## v4.1.1
- **Hardware-Optimized Background Crossfader:** Dual-slot ping-pong buffer with asynchronous off-thread image preloading and decoding (`img.decode()`), eliminating jank and frame drops on older tablets such as iPad Pro.
- **Synchronized Image Dissolve:** Unified opacity crossfade for both the sharp foreground photo and ambient blurred backdrop, eliminating desynchronization, instant snapping, and black flashes.
- **Removed Blur Scaling:** Removed transform scaling from blurred backdrop; uses viewport bleed margins to eliminate edge artifacts cleanly.
- **Zero-Leak Memory Management:** Decoded bitmap textures and DOM nodes are explicitly unmounted upon crossfade completion, maintaining constant $O(1)$ memory usage across thousands of rotations.

## v4.1.0
- **Progressive Web App (PWA):** Web App Manifests, service worker offline shell precaching, standalone kiosk display mode, and client registration.
- **Refreshed Dashboard Iconography:** 512×512 PNG, multi-resolution 256×256 ICO, and adaptive maskable launcher icons representing the four core modules (Clock, Weather, Sensors, Calendar).

## v4.0.0
- Baseline Infoboard v4 release built with Nuxt 4, Nitro, Vue 3, and TypeScript.
