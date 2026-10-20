# Infoboard v4

> High-performance, resource-efficient 24/7 information dashboard designed for dedicated Raspberry Pi displays and modern browsers. Built with **Nuxt 4**, **Nitro**, **Vue 3**, and **TypeScript**.

---

## Key Features

- **Continuous 24/7 Uptime:** Engineered for zero memory leaks. Polling uses chained `setTimeout` execution and automatically pauses when the display is sleeping or the browser tab is hidden to minimize idle CPU and thermal footprint.
- **Self-Contained Nitro Caching:** Integrated in-memory Stale-While-Revalidate (SWR) caching layer. Prevents exceeding third-party API rate limits and serves cached data seamlessly during network drops. No external services like Redis required.
- **Zero Exposed Secrets:** All external API requests (Open-Meteo, TfL, NASA, Unsplash, Pexels, Flickr, iCal) are brokered server-side. Zero API keys or tokens are bundled into client JavaScript.
- **Hardware-Aware Design:**
  - **Magic Mirror Mode:** Pure `#000000` background and high-contrast `#ffffff` typography for reflective mirror installations.
  - **Low-Power Mode:** Disables backdrop blur and heavy box shadows for smooth 60fps rendering on low-RAM Raspberry Pi units (Pi 3B+, Pi Zero 2W).
  - **PWA & Standalone Kiosk:** Installable Progressive Web App (PWA) with service worker offline shell caching, standalone display mode, and adaptive maskable icons for desktops, tablets, and kiosks.
- **Widgets:**
  - **Clock & Date:** Large monospace typography (Cousine), configurable format, synchronized to system seconds.
  - **Weather & Forecast:** Real-time conditions from Open-Meteo with 28 standard WMO weather code icons, feels-like temperature, and up to 16-day forecast carousel.
  - **Detailed Microclimate Metrics:** Expandable indicators including barometric pressure, sea level pressure, wind speed/gust/direction, solar radiation (GHI), sunshine duration, sunrise/sunset, moon phase, PM2.5, PM10, US AQI, European AQI, NO2, O3, SO2, CO, and 6 pollen species forecasts (grass, birch, alder, ragweed, olive, mugwort).
  - **Transport for London (TfL):** Real-time line statuses with official brand colors (Tube, Overground, DLR, Elizabeth line, Tram), plus live bus arrivals grouped by stop point.
  - **Calendar Agenda:** iCal ingestion with full RFC-5545 recurrence rule (RRULE) expansion, exception dates, 60-day horizon, and relative dates ("Today", "Tomorrow").
  - **Local Hardware Sensors:** Kernel-level sysfs / iio support for DHT11/22 and Sense HAT, serial communication for Nova SDS011 air quality sensor, with automated simulation fallbacks.
  - **Dynamic Backgrounds:** Local directory traversal, MP4 video streaming with byte-range support, NASA Astronomy Picture of the Day (APOD), and weather-tagged photos from Unsplash, Pexels, and Flickr.

---

## Architecture Overview

```
infoboard-v4/
├── app/                  # Frontend Application Layer (Vue 3 Composition API)
│   ├── assets/           # CSS tokens (glassmorphism, monospace, typography) & SVGs
│   ├── components/       # Dashboard widgets and kiosk controls
│   ├── composables/      # usePolling (visibility-aware), useSystemClock, useKioskState
│   └── pages/            # Responsive kiosk layout
├── server/               # Nitro Engine Backend
│   ├── api/              # Cached proxy endpoints with SWR & hard timeouts
│   └── utils/            # Sandboxing (path traversal prevention), iCal & sensor drivers
├── shared/               # Universal TypeScript definitions, constants & schemas
├── public/               # Static assets & icons served at root
├── nuxt.config.ts        # Typed runtime configuration
├── Dockerfile            # Multi-stage lightweight ARM64/AMD64 container
└── docker-compose.yml    # Standalone container orchestration
```

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 22 LTS or newer
- npm 10 or newer

```bash
# 1. Clone repository
git clone https://github.com/SixBytesUnder/infoboard.git
cd infoboard

# 2. Copy environment template
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start development server with hot-reload
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Production Build & Preview

```bash
# Typecheck TypeScript
npm run typecheck

# Build optimized production bundle
npm run build

# Preview production build locally
node .output/server/index.mjs
```

---

## Configuration Reference

All settings can be placed in your `.env` file using `NUXT_` prefixed environment variables.

| Variable                       | Default                                   | Description                                               |
| ------------------------------ | ----------------------------------------- | --------------------------------------------------------- |
| `NUXT_APP_MAGIC_MIRROR`        | `false`                                   | Enable high-contrast black/white display                  |
| `NUXT_APP_LOW_POWER_MODE`      | `false`                                   | Disable blur/shadows on low-RAM Raspberry Pis             |
| `NUXT_APP_TIME_FORMAT`         | `HH:mm:ss`                                | Day.js time format                                        |
| `NUXT_APP_DATE_FORMAT`         | `dddd, Do MMMM YYYY`                      | Day.js date format                                        |
| `NUXT_APP_NAV_BUTTONS`         | `true`                                    | Show kiosk action bar                                     |
| `NUXT_APP_SHOW_EXIF`           | `true`                                    | Show EXIF button on local photos                          |
| `NUXT_WEATHER_ENABLED`         | `true`                                    | Enable weather module                                     |
| `NUXT_WEATHER_API_KEY`         | `""`                                      | Optional Open-Meteo commercial API key (free tier needs none) |
| `NUXT_WEATHER_LATITUDE`        | `51.5074`                                 | Latitude                                                  |
| `NUXT_WEATHER_LONGITUDE`       | `-0.1278`                                 | Longitude                                                 |
| `NUXT_WEATHER_LOCATION_NAME`   | `London, UK`                              | Header location name                                      |
| `NUXT_WEATHER_UNITS`           | `metric`                                  | `metric` (°C, m/s, hPa) or `imperial` (°F, mph, inHg)     |
| `NUXT_WEATHER_ROUND_TEMP`      | `true`                                    | Round temperatures to whole degrees                       |
| `NUXT_WEATHER_FORECAST_DAYS`   | `7`                                       | Forecast days to display (1 to 16, default 7)             |
| `NUXT_WEATHER_CACHE_TTL`       | `300`                                     | Weather cache time in seconds (5 min)                     |
| `NUXT_TRANSIT_ENABLED`         | `true`                                    | Enable Transport for London module                        |
| `NUXT_TRANSIT_TFL_APP_ID`      | `""`                                      | Optional TfL App ID                                       |
| `NUXT_TRANSIT_TFL_APP_KEY`     | `""`                                      | Optional TfL App Key                                      |
| `NUXT_TRANSIT_BUS_STOPS`       | `""`                                      | Comma-separated TfL bus stop codes                        |
| `NUXT_TRANSIT_LINE_MODES`      | `tube,overground,dlr,elizabeth-line,tram` | Rail & tube line modes                                    |
| `NUXT_CALENDAR_ENABLED`        | `true`                                    | Enable iCal calendar module                               |
| `NUXT_CALENDAR_ICAL_URL`       | `""`                                      | iCal / ICS feed URL                                       |
| `NUXT_CALENDAR_MAX_EVENTS`     | `10`                                      | Maximum upcoming events                                   |
| `NUXT_MEDIA_SOURCE`            | `nasa`                                    | `local`, `single`, `nasa`, `unsplash`, `pexels`, `flickr` |
| `NUXT_MEDIA_INTERVAL`          | `60`                                      | Background rotation interval in seconds                   |
| `NUXT_MEDIA_LOCAL_DIR`         | `"/media/photos"`                         | Absolute path to local photos/videos                      |
| `NUXT_MEDIA_ALLOW_VIDEO`       | `false`                                   | Enable MP4 video playback                                 |
| `NUXT_MEDIA_VIDEO_MUTED`       | `true`                                    | Default video audio state                                 |
| `NUXT_SENSOR_DHT_ENABLED`      | `false`                                   | Read DHT11/22 via Linux sysfs                             |
| `NUXT_SENSOR_SENSEHAT_ENABLED` | `false`                                   | Read Raspberry Pi Sense HAT via sysfs                     |
| `NUXT_SENSOR_SDS_ENABLED`      | `false`                                   | Read SDS011 air quality via serial port                   |

---

## Deployment on Raspberry Pi

### Option A: Docker (Recommended)

Running the pre-built container ensures consistent dependencies and low memory usage.

```bash
# 1. On your Raspberry Pi, clone or copy the repository
cd /srv/infoboard

# 2. Configure .env with your credentials
cp .env.example .env
vim .env

# 3. Start container in background
docker compose up -d --build
```

### Cross-Compiling for Raspberry Pi (Docker Buildx)

To avoid heavy memory and CPU usage during compilation on 1GB/2GB Raspberry Pi units, build the container image on your workstation (Mac, Linux, or Windows WSL) using Docker Buildx and deploy the image:

```bash
# Enable multi-architecture builder
docker buildx create --name pibuilder --use
docker buildx inspect --bootstrap

# Build and push directly for ARM64 target (Raspberry Pi 3/4/5)
docker buildx build \
  --platform linux/arm64 \
  -t your-registry/infoboard:latest \
  --push .

# On the Raspberry Pi, simply run:
docker pull your-registry/infoboard:latest
docker compose up -d --build
```

---

## Production Server Deployment (Docker + Nginx Reverse Proxy + SSL)

If deploying Infoboard on a VPS or dedicated Linux server alongside existing websites or web servers (such as host Nginx/Apache):

### 1. Configure Port Binding in `.env`
When host ports `80` or `3000` are already in use by host services, set `HOST_PORT` in `.env` to bind the container to loopback on an available port (e.g., `8086`):

```bash
# Add to .env
HOST_PORT="127.0.0.1:8086"
```

Start the container in the background:
```bash
docker compose up -d --build
```

Verify that the local container is responding:
```bash
curl -I http://127.0.0.1:8086
```

### 2. Configure Nginx Reverse Proxy
Create a new Nginx virtual host configuration:

```bash
sudo nano /etc/nginx/sites-available/infoboard.yourdomain.com
```

Add the following configuration (replace `infoboard.yourdomain.com` with your domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name infoboard.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8086;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site configuration, verify syntax, and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/infoboard.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Provision Free SSL Certificate (Certbot / Let's Encrypt)
Ensure your domain's DNS `A` or `CNAME` record is pointed to your server's IP address. Then run Certbot:

```bash
sudo certbot --nginx -d infoboard.yourdomain.com
```

Certbot will automatically:
- Verify domain ownership via ACME HTTP-01 challenge.
- Download and install the SSL certificate.
- Configure HTTP/2, secure cipher suites, and an automatic HTTP-to-HTTPS redirect (`301 Moved Permanently`).
- Register background certificate auto-renewal.

### 4. Verify HTTPS Deployment
Test that the HTTPS site is reachable:

```bash
curl -I https://infoboard.yourdomain.com/
```

---

## Raspberry Pi Chromium Kiosk Autostart

To automatically launch Infoboard fullscreen on Raspberry Pi OS without window frames or mouse cursor:

Create or edit `~/.config/wayfire.ini` (on modern Wayland Bookworm) or `~/.config/lxsession/LXDE-pi/autostart`:

```ini
[autostart]
screensaver = false
dpms = false
infoboard = chromium-browser --kiosk --noerrdialogs --disable-infobars --check-for-update-interval=31536000 --disable-pinch http://localhost:3000
```

---

## Version History

### v4.3.7
- **Flicker-Free Background Transitions for Low-Power / WebKit Devices:** Fixed background rotation on low-powered devices (such as older iPads) where outgoing images were unmounted before the incoming image bitmap was ready, causing a 1-2 second black screen gap. `BackgroundHost.vue` now verifies DOM `<img>` element attachment, full load, and asynchronous hardware decoding off-thread via `img.decode()` while the incoming slot is completely invisible (`opacity: 0`). The crossfade only commences once the new image is confirmed rendered, keeping the outgoing image solid underneath and eliminating intermediate black screens.

### v4.3.6
- **Blurry Background Image Restoration:** Restored `BackgroundHost.vue` to its original implementation, fixing the double URI-encoding (`%2520`) regression that prevented the blurred background layer (`bg-image-blur`) from rendering.
- **IDE TypeScript / Vue Language Server Diagnostics Fix:** Added explicit root-relative path mappings in `tsconfig.json` and simplified composable bindings in `DateTimeCard.vue` and `KioskActionBar.vue`, resolving all 52 IDE Problems across Vetur, Volar, and TypeScript.

### v4.3.5
- **Resource & Concurrency Hardening:** Fixed file handle closure in EXIF header reader (`try...finally`), guarded serial port initialization and close callbacks in the SDS011 driver against timeouts/disconnects, validated byte-range headers in the video stream endpoint, and switched iCal parsing to asynchronous `nodeIcal.async.parseICS`.
- **Sensitive Credential Redaction:** Added `sanitizeErrorMessage` to mask API keys, tokens, and private calendar URLs from upstream error logs and client responses while preserving diagnostic error details.
- **Vue 3.5 Reactivity, Performance & Accessibility:** Updated `useSystemClock` and `usePolling` to accept reactive getters (`MaybeRefOrGetter`), guarded polling state transitions with execution tokens, adopted `shallowRef` for large data payloads, synced native `fullscreenchange` state via `useState`, extracted modular subcomponents (`TransitTubeSection`, `weatherMetrics`), and improved ARIA dialog/toggle semantics.

### v4.3.4
- **SSR Hydration Text Mismatch Fix:** Suppressed text content mismatch warnings on `DateTimeCard`'s live clock using Vue 3.5's `data-allow-mismatch="text"`, and updated `useSystemClock` to evaluate dynamic timestamps per request during SSR to prevent stale module-level state.

### v4.3.3
- **Production Server Deployment Guide:** Added step-by-step documentation for deploying Infoboard behind an Nginx reverse proxy with automated Let's Encrypt SSL/TLS via Certbot.

### v4.3.2
- **Configurable Docker Host Port Binding:** Made the host port binding in `docker-compose.yml` configurable via `HOST_PORT` (defaulting to `127.0.0.1:8086:3000`), resolving conflicts on servers running system web servers (like Nginx) or existing reverse proxies.

### v4.3.1
- **Weather Drawer Type Safety Fix:** Fixed TypeScript type error in `WeatherMoreDrawer.vue` by nullish-coalescing indexed moon phase lookups to conform with strict metric candidate typing (`string | null`).

### v4.3.0
- **Full Migration to Open-Meteo Weather API:** Migrated from Tomorrow.io to Open-Meteo, delivering 10,000 requests/day with zero API key requirement, eliminating rate limit risks on 24/7 displays.
- **Complete Air Quality & Pollen Suite for Free:** Integrated Open-Meteo's Air Quality API, displaying live US Air Quality Index (AQI), European AQI, PM2.5, PM10, Nitrogen Dioxide (NO₂), Ozone (O₃), Sulfur Dioxide (SO₂), Carbon Monoxide (CO), and 6 pollen species forecasts (grass, birch, alder, ragweed, olive, mugwort).
- **Expanded Solar & Astronomical Metrics:** Added sunshine duration, daylight duration, sunrise/sunset times, sea level pressure, and precision synodic moon phase calculations.
- **WMO Weather Interpretation Icons:** Added support for all 28 WMO weather interpretation codes (0–99) mapped to crisp white SVG weather glyphs.

### v4.2.0
- **Adaptive Tomorrow.io Account Tier Handling:** Automatically detects whether the Tomorrow.io account tier supports air quality and pollen layers. On free accounts, unavailable metrics are omitted instead of falling back to misleading zeros (`0 μg/m³`, `Good`, or `None`). On paid accounts with air quality or pollen add-ons, all layers are rendered automatically with grouped section headers.
- **Rich Free-Tier Atmospheric Metrics:** Expanded the "More" drawer with full support for free-tier atmospheric metrics, including Dew Point, Cloud Cover, Precipitation Chance, Wind Direction with compass bearings, Visibility, and UV Index.
- **Accurate Forecast Highs & Lows:** Upstream daily forecast queries now include actual `temperatureMax` and `temperatureMin` fields directly from Tomorrow.io.

### v4.1.2
- **Forecast Temperature Indicators:** Added sleek, lightweight vector indicator icons to the 7-day forecast cards to clearly distinguish daily high (upward arrow) and low (downward arrow) temperatures.

### v4.1.1
- **Hardware-Optimized Background Crossfader:** Dual-slot ping-pong buffer with asynchronous off-thread image preloading and decoding (`img.decode()`), eliminating jank and frame drops on older tablets such as iPad Pro.
- **Synchronized Image Dissolve:** Unified opacity crossfade for both the sharp foreground photo and ambient blurred backdrop, eliminating desynchronization, instant snapping, and black flashes.
- **Removed Blur Scaling:** Removed transform scaling from blurred backdrop; uses viewport bleed margins to eliminate edge artifacts cleanly.
- **Zero-Leak Memory Management:** Decoded bitmap textures and DOM nodes are explicitly unmounted upon crossfade completion, maintaining constant $O(1)$ memory usage across thousands of rotations.

### v4.1.0
- **Progressive Web App (PWA):** Web App Manifests, service worker offline shell precaching, standalone kiosk display mode, and client registration.
- **Refreshed Dashboard Iconography:** 512×512 PNG, multi-resolution 256×256 ICO, and adaptive maskable launcher icons representing the four core modules (Clock, Weather, Sensors, Calendar).

### v4.0.0
- Baseline Infoboard v4 release built with Nuxt 4, Nitro, Vue 3, and TypeScript.

---

## License

[MIT](LICENSE)
