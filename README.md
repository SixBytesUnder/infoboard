# Infoboard v4

> High-performance, resource-efficient 24/7 information dashboard designed for dedicated Raspberry Pi displays and modern browsers. Built with **Nuxt 4**, **Nitro**, **Vue 3**, and **TypeScript**.

---

## Key Features

- **Continuous 24/7 Uptime:** Engineered for zero memory leaks. Polling uses chained `setTimeout` execution and automatically pauses when the display is sleeping or the browser tab is hidden to minimize idle CPU and thermal footprint.
- **Self-Contained Nitro Caching:** Integrated in-memory Stale-While-Revalidate (SWR) caching layer. Prevents exceeding third-party API rate limits and serves cached data seamlessly during network drops. No external services like Redis required.
- **Zero Exposed Secrets:** All external API requests (Tomorrow.io, TfL, NASA, Unsplash, Pexels, Flickr, iCal) are brokered server-side. Zero API keys or tokens are bundled into client JavaScript.
- **Hardware-Aware Design:**
  - **Magic Mirror Mode:** Pure `#000000` background and high-contrast `#ffffff` typography for reflective mirror installations.
  - **Low-Power Mode:** Disables backdrop blur and heavy box shadows for smooth 60fps rendering on low-RAM Raspberry Pi units (Pi 3B+, Pi Zero 2W).
- **Widgets:**
  - **Clock & Date:** Large monospace typography (Cousine), configurable format, synchronized to system seconds.
  - **Weather & Forecast:** Real-time conditions from Tomorrow.io with 26 weather code icons, feels-like temperature, and 7-day forecast carousel.
  - **Detailed Microclimate Metrics:** 16 expandable indicators including barometric pressure, wind speed/gust, solar GHI, moon phase, PM2.5, PM10, EPA air quality index, and tree/weed/grass pollen indices.
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

All settings can be placed in your `.env` file. Modern `NUXT_` prefixed variables are recommended; legacy variable names from v2.x are supported automatically for backwards compatibility.

| Variable | Default | Description |
|---|---|---|
| `NUXT_APP_MAGIC_MIRROR` | `false` | Enable high-contrast black/white display |
| `NUXT_APP_LOW_POWER_MODE` | `false` | Disable blur/shadows on low-RAM Raspberry Pis |
| `NUXT_APP_TIME_FORMAT` | `HH:mm:ss` | Day.js time format |
| `NUXT_APP_DATE_FORMAT` | `dddd, Do MMMM YYYY` | Day.js date format |
| `NUXT_APP_NAV_BUTTONS` | `true` | Show kiosk action bar |
| `NUXT_APP_SHOW_EXIF` | `true` | Show EXIF button on local photos |
| `NUXT_WEATHER_ENABLED` | `true` | Enable weather module |
| `NUXT_WEATHER_API_KEY` | `""` | Tomorrow.io API v4 key |
| `NUXT_WEATHER_LATITUDE` | `51.5074` | Latitude |
| `NUXT_WEATHER_LONGITUDE` | `-0.1278` | Longitude |
| `NUXT_WEATHER_LOCATION_NAME`| `London, UK` | Header location name |
| `NUXT_WEATHER_UNITS` | `metric` | `metric` (°C, m/s, hPa) or `imperial` (°F, mph, inHg) |
| `NUXT_WEATHER_ROUND_TEMP` | `true` | Round temperatures to whole degrees |
| `NUXT_WEATHER_CACHE_TTL` | `300` | Weather cache time in seconds (5 min) |
| `NUXT_TRANSIT_ENABLED` | `true` | Enable Transport for London module |
| `NUXT_TRANSIT_TFL_APP_ID` | `""` | Optional TfL App ID |
| `NUXT_TRANSIT_TFL_APP_KEY`| `""` | Optional TfL App Key |
| `NUXT_TRANSIT_BUS_STOPS` | `""` | Comma-separated TfL bus stop codes |
| `NUXT_TRANSIT_LINE_MODES` | `tube,overground,dlr,elizabeth-line,tram` | Rail & tube line modes |
| `NUXT_CALENDAR_ENABLED` | `true` | Enable iCal calendar module |
| `NUXT_CALENDAR_ICAL_URL` | `""` | iCal / ICS feed URL |
| `NUXT_CALENDAR_MAX_EVENTS`| `10` | Maximum upcoming events |
| `NUXT_MEDIA_SOURCE` | `nasa` | `local`, `single`, `nasa`, `unsplash`, `pexels`, `flickr` |
| `NUXT_MEDIA_INTERVAL` | `60` | Background rotation interval in seconds |
| `NUXT_MEDIA_LOCAL_DIR` | `"/media/photos"` | Absolute path to local photos/videos |
| `NUXT_MEDIA_ALLOW_VIDEO` | `false` | Enable MP4 video playback |
| `NUXT_MEDIA_VIDEO_MUTED` | `true` | Default video audio state |
| `NUXT_MEDIA_NASA_API_KEY` | `DEMO_KEY` | NASA APOD API key |
| `NUXT_SENSOR_DHT_ENABLED` | `false` | Read DHT11/22 via Linux sysfs |
| `NUXT_SENSOR_SENSEHAT_ENABLED` | `false` | Read Raspberry Pi Sense HAT via sysfs |
| `NUXT_SENSOR_SDS_ENABLED`| `false` | Read SDS011 air quality via serial port |

---

## Deployment on Raspberry Pi

### Option A: Docker (Recommended)

Running the pre-built container ensures consistent dependencies and low memory usage.

```bash
# 1. On your Raspberry Pi, clone or copy the repository
cd /srv/infoboard

# 2. Configure .env with your credentials
cp .env.example .env
nano .env

# 3. Start container in background
docker compose up -d
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
docker compose up -d
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

## License

[MIT](LICENSE)
