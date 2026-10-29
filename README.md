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
  - **Local Hardware Sensors:** Direct user-space I2C driver for Raspberry Pi Sense HAT (HTS221, LPS25H) with ribbon-cable thermal calibration, Linux sysfs for DHT11/22, serial driver for Nova SDS011 air quality, and automatic development simulation fallbacks. See [Sense HAT Setup Guide](docs/SENSE_HAT.md).
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
| `NUXT_SENSOR_SENSE_HAT_ENABLED` | `false`                                  | Read Raspberry Pi Sense HAT via user-space I2C (`/dev/i2c-1`) |
| `NUXT_SENSOR_SENSE_HAT_TEMP_OFFSET` | `-1.8`                               | Onboard self-heating temp offset in °C (ribbon cable setup)|
| `NUXT_SENSOR_SENSE_HAT_PRESSURE_OFFSET_HPA` | `0.0`                        | Barometric pressure elevation offset in hPa               |
| `NUXT_SENSOR_SDS_ENABLED`      | `false`                                   | Read SDS011 air quality via serial port                   |

> [!TIP]
> For hardware wiring, Raspberry Pi host I2C configuration, calibration formulas, and troubleshooting for the physical Sense HAT, see the standalone [Sense HAT Setup Guide](docs/SENSE_HAT.md).

---

## Deployment & Operations

### First-Time Installation (Fresh Setup via Docker)

Running Infoboard inside Docker is the recommended approach. It packages all native I2C bindings, node-gyp dependencies, and runtime tools into a self-contained container, eliminating host configuration issues.

```bash
# 1. On your Raspberry Pi or target machine, clone the repository
git clone https://github.com/SixBytesUnder/infoboard.git
cd infoboard

# 2. Copy the configuration template
cp .env.example .env

# 3. Edit .env with your configuration
nano .env   # Configure weather coordinates, transit stops, calendar, or sensor toggles
```

> [!TIP]
> **Port Configuration:**
> - By default, Infoboard binds to `127.0.0.1:8086` so it can sit securely behind a reverse proxy (e.g. Nginx).
> - For a **standalone Raspberry Pi** accessible directly on your home LAN without a reverse proxy, set `HOST_PORT="80"` in `.env`.

> [!NOTE]
> **Hardware Sensors (Sense HAT):**
> By default, `/dev/i2c-1` device passthrough is commented out in [`docker-compose.yml`](docker-compose.yml) so the container starts cleanly on servers and machines without Raspberry Pi I2C hardware. If you are connecting a physical Raspberry Pi Sense HAT, uncomment the `devices` section (`/dev/i2c-1:/dev/i2c-1`) in [`docker-compose.yml`](docker-compose.yml), follow the [Sense HAT Setup Guide](docs/SENSE_HAT.md) to enable host I2C (`/dev/i2c-1`), and set `NUXT_SENSOR_SENSE_HAT_ENABLED=true` in `.env` before starting the container.

```bash
# 4. Build and start the container in the background
docker compose up -d --build

# 5. Check container logs to verify startup
docker compose logs -f infoboard
```

Visit `http://<your-pi-ip>:8086` (or `http://<your-pi-ip>` if using port 80) in your web browser.

---

### Updating Production (Pulling Latest Git Changes)

When you make changes or want to update your target machine to the latest commit from Git, run these commands directly on the target machine:

```bash
# 1. Navigate to the Infoboard directory
cd /path/to/infoboard

# 2. Pull latest changes from the Git repository
git pull

# 3. Rebuild and restart the container (downtime is only a few seconds during swap)
docker compose up -d --build

# 4. (Recommended) Reclaim disk space by pruning old dangling build layers
docker image prune -f
```

---

### Alternative: Bare-Metal Setup (Without Docker)

If you prefer to run Infoboard directly with Node.js on the host operating system:

```bash
# First-time installation
git clone https://github.com/SixBytesUnder/infoboard.git
cd infoboard
cp .env.example .env
nano .env
npm install
npm run build
node .output/server/index.mjs

# Updating bare-metal production
git pull
npm install
npm run build
# Restart your process manager (e.g. PM2 or systemd)
pm2 restart infoboard
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

For release notes, migration guides, and changelog history across all versions, see [CHANGELOG.md](CHANGELOG.md).

---

## License

[MIT](LICENSE)
