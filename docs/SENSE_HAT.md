# Raspberry Pi Sense HAT Setup & Calibration Guide

> Complete guide for configuring, calibrating, and running the physical Raspberry Pi Sense HAT on Infoboard via Docker or bare-metal Node.js.

---

## 1. Overview & Architecture

Infoboard communicates with the Raspberry Pi Sense HAT directly via **user-space I2C** on `/dev/i2c-1` using native Node.js [`i2c-bus`](../server/utils/senseHatDriver.ts) bindings. It reads telemetry directly from the two onboard STMicroelectronics micro-sensors:

- **HTS221** (I2C address `0x5f`): Capacitive digital relative humidity and temperature.
- **LPS25H** (I2C address `0x5c`): 24-bit piezoresistive barometric pressure and temperature.

### Why Direct User-Space I2C?
Earlier revisions relied on Linux kernel Industrial I/O (IIO) modules (`hts221_i2c`, `lps25h_i2c`). However, kernel driver binding frequently caused device bus lockups (`EBUSY` errors) and unpredictable device numbering across reboots. Infoboard bypasses kernel sensor drivers entirely by issuing register-level SMBus/I2C commands directly to `/dev/i2c-1`.

### Ribbon Cable Hardware Topology
The temperature and humidity algorithms in [`server/utils/senseHatDriver.ts`](../server/utils/senseHatDriver.ts) are specifically calibrated for a **ribbon-cable tethered Sense HAT** positioned 10–20 cm away from the Raspberry Pi 4/5 board:
- **No CPU Load Math:** Traditional Sense HAT math attempts to subtract Raspberry Pi CPU temperature ($T_{ambient} = T_{hat} - \frac{T_{cpu} - T_{hat}}{c}$). This formula drifts wildly depending on CPU load, fan speed, and throttling.
- **Constant Thermal Offset:** With the Sense HAT physically isolated on a ribbon cable, convection heat from the Broadcom SoC is eliminated. Only a minor constant PCB self-heating offset is applied (`NUXT_SENSOR_SENSE_HAT_TEMP_OFFSET`, default `-1.8`°C):
  $$T_{calibrated} = \frac{T_{HTS221} + T_{LPS25H}}{2} + \text{offset}$$
- **Magnus-Tetens Relative Humidity Compensation:** Relative humidity is temperature-dependent. Because the onboard sensor warms up slightly from PCB power, raw relative humidity ($RH_{raw}$) drops below true room humidity. Infoboard derives the absolute **dew point** from warmed raw values ($T_{raw}$, $RH_{raw}$), then computes true ambient relative humidity ($RH_{ambient}$) at the calibrated room temperature ($T_{calibrated}$).
- **In-Memory Server-Side Caching:** Sensor reads are protected with an in-memory 4-second cache and concurrency lock to protect `/dev/i2c-1` from high-frequency frontend polling saturation.
- **Zero-Downtime Fallback:** If the Sense HAT is disconnected, unpowered, or if Infoboard is running in local development (Mac/Windows/Linux without `/dev/i2c-1`), the driver gracefully falls back to simulated room telemetry (`isSimulated: true`) without crashing.

---

## 2. Raspberry Pi Host Setup (Fresh System)

Follow these steps on a clean Raspberry Pi OS installation (Bookworm or Bullseye):

### Step 2.1: Physical Installation
1. Power off the Raspberry Pi.
2. Connect the Sense HAT to the 40-pin GPIO header.
   > [!TIP]
   > For accurate temperature and humidity readings, use a **40-pin GPIO extension ribbon cable** to position the Sense HAT away from the Raspberry Pi SoC. If mounted directly on top of the Pi ("HAT style"), the CPU heat will warm the sensors and require a larger negative offset (e.g. `-5.0`°C to `-8.0`°C).
3. Power on the Raspberry Pi.

### Step 2.2: Enable I2C Interface
The I2C hardware bus (`/dev/i2c-1`) must be enabled on the host operating system:

```bash
sudo raspi-config
```
1. Navigate to **Interface Options** (or **Interfacing Options**).
2. Select **I2C**.
3. Choose **Yes** to enable the ARM I2C interface.
4. Finish and reboot when prompted (or run `sudo reboot`).

*Alternative via configuration file:*
Ensure `dtparam=i2c_arm=on` is present in `/boot/firmware/config.txt` (Raspberry Pi OS Bookworm) or `/boot/config.txt` (older versions):
```ini
dtparam=i2c_arm=on
```

> [!WARNING]
> **Do NOT enable `dtoverlay=rpi-sense` in `config.txt`.**
> The `rpi-sense` device-tree overlay loads kernel IIO modules that claim exclusive ownership of the I2C bus. This prevents user-space software (including Node.js and Docker) from opening the sensor registers and causes `EBUSY: resource busy or locked` errors.

### Step 2.3: Verify Hardware on Host
1. Log in to the Raspberry Pi terminal.
2. Confirm that `/dev/i2c-1` is present:
   ```bash
   ls -l /dev/i2c-1
   # Output should look like:
   # crw-rw---- 1 root i2c 89, 1 Oct 22 12:00 /dev/i2c-1
   ```
3. Check the host group ID (GID) for `i2c`:
   ```bash
   stat -c '%g' /dev/i2c-1
   # Output is typically: 988 (or 998 on some distros)
   ```
4. Install `i2c-tools` and probe the bus:
   ```bash
   sudo apt update
   sudo apt install -y i2c-tools
   i2cdetect -y 1
   ```
   **Expected Output:**
   ```text
        0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
   00:                         -- -- -- -- -- -- -- -- 
   10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
   20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
   30: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
   40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
   50: -- -- -- -- -- -- -- -- -- -- -- -- 5c -- -- 5f 
   60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
   70: -- -- -- -- -- -- -- --                         
   ```
   - **`5c`** is the LPS25H pressure & temperature sensor.
   - **`5f`** is the HTS221 humidity & temperature sensor.

   > [!IMPORTANT]
   > If you see **`UU`** at address `5c` or `5f`, a kernel driver has locked the sensor. Remove `dtoverlay=rpi-sense` from your boot config or unload the drivers with:
   > ```bash
   > sudo modprobe -r hts221_i2c lps25h_i2c
   > ```

---

## 3. Running with Docker (Recommended)

Infoboard's [`Dockerfile`](../Dockerfile) and [`docker-compose.yml`](../docker-compose.yml) are pre-configured to build native `i2c-bus` bindings in Alpine Linux and run securely as non-root user `1001:1001` with I2C group permissions.

### Step 3.1: Enable `docker-compose.yml` Device & Verify Group
In [`docker-compose.yml`](../docker-compose.yml), uncomment the `devices` mapping for `/dev/i2c-1` and confirm the supplementary group:
```yaml
services:
  infoboard:
    build:
      context: .
      dockerfile: Dockerfile
    image: infoboard:latest
    devices:
      - /dev/i2c-1:/dev/i2c-1
    group_add:
      - 988
```
> [!NOTE]
> If `stat -c '%g' /dev/i2c-1` on your host returned a number other than `988` (for example `998`), update `group_add: [998]` in [`docker-compose.yml`](../docker-compose.yml).

### Step 3.2: Configure Environment Variables in `.env`
Enable the Sense HAT sensor in your `.env` file:

```env
# Enable physical Sense HAT sensor
NUXT_SENSOR_SENSE_HAT_ENABLED=true

# Temperature calibration offset in °C (default: -1.8 for ribbon-cable isolation)
NUXT_SENSOR_SENSE_HAT_TEMP_OFFSET=-1.8

# Barometric pressure calibration offset in hPa (default: 0.0)
NUXT_SENSOR_SENSE_HAT_PRESSURE_OFFSET_HPA=0.0
```

### Step 3.3: Build & Launch Container
On your Raspberry Pi:

```bash
# Build container locally on target machine and start in background
docker compose up -d --build
```

### Step 3.4: Verify Telemetry
Test the live sensor endpoint from your Raspberry Pi or local network:

```bash
curl -s http://localhost:8086/api/sensors
```
**Expected Response:**
```json
{
  "temperature": 21.4,
  "humidity": 46.2,
  "pressure": 1014.1,
  "isSimulated": false
}
```
Notice `"isSimulated": false`, indicating that live hardware data is actively streaming from `/dev/i2c-1`.

---

## 4. Running Bare-Metal (Node.js without Docker)

If you prefer to run Infoboard directly on Raspberry Pi OS without Docker:

### Step 4.1: Install Build Prerequisites & Node.js 22
Native compilation tools (`make`, `g++`, `python3`) are required for `node-gyp` to compile the `i2c-bus` native addon:

```bash
sudo apt update
sudo apt install -y build-essential python3 curl git

# Install Node.js 22 LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 4.2: Add User to `i2c` Group
Ensure the user running Infoboard has permission to access `/dev/i2c-1`:

```bash
sudo usermod -aG i2c $USER
# Activate group in current session without logging out:
newgrp i2c
```

### Step 4.3: Install Dependencies & Build
```bash
git clone https://github.com/SixBytesUnder/infoboard.git
cd infoboard

cp .env.example .env
# Edit .env and ensure NUXT_SENSOR_SENSE_HAT_ENABLED=true
nano .env

# Install dependencies (node-gyp will compile i2c-bus)
npm install

# Build optimized production bundle
npm run build

# Start production server
node .output/server/index.mjs
```

---

## 5. Calibration & Fine-Tuning

### Temperature Offset (`NUXT_SENSOR_SENSE_HAT_TEMP_OFFSET`)
- **Default:** `-1.8`°C
- **Ribbon Cable (Recommended):** The default `-1.8`°C accounts for the slight internal heat produced by the Sense HAT's own power regulators and LED matrix idle power.
- **Mounted directly on Raspberry Pi 4/5:** If mounted directly on the GPIO header over the CPU, ambient thermal soak can add between `+4.0`°C and `+9.0`°C depending on fan cooling. Measure your room temperature with a standalone thermometer and adjust accordingly (e.g. `NUXT_SENSOR_SENSE_HAT_TEMP_OFFSET=-6.5`).

### Barometric Pressure Offset (`NUXT_SENSOR_SENSE_HAT_PRESSURE_OFFSET_HPA`)
- **Default:** `0.0` hPa
- The LPS25H sensor reports absolute local station barometric pressure. If you wish to calibrate the reading to match mean sea level pressure (QNH) from your local meteorological service, enter your elevation offset here (roughly $+1\text{ hPa}$ per $8.4\text{ meters}$ above sea level).

---

## 6. Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `EBUSY: resource busy or locked` | Kernel driver is claiming I2C addresses `0x5c` or `0x5f`. | Remove `dtoverlay=rpi-sense` from `/boot/firmware/config.txt`. Run `sudo modprobe -r hts221_i2c lps25h_i2c` and reboot. |
| `isSimulated: true` in `/api/sensors` | Hardware not detected, `/dev/i2c-1` missing, or permissions denied. | Check container logs (`docker compose logs -f infoboard`). Confirm `/dev/i2c-1` exists on host and `group_add: [988]` matches host GID. |
| `EACCES: permission denied, open '/dev/i2c-1'` | Non-root user in Docker or host lacks I2C group access. | Check host GID with `stat -c '%g' /dev/i2c-1`. If bare-metal, run `sudo usermod -aG i2c $USER`. If Docker, update `group_add` in [`docker-compose.yml`](../docker-compose.yml). |
| `i2cdetect` shows `UU` at `0x5c` / `0x5f` | Kernel module loaded. | Ensure `dtoverlay=rpi-sense` is commented out or disabled in boot config. |
| Alpine Docker build fails on `i2c-bus` | Missing `linux-headers` in build stage. | Ensure you are on Infoboard v4.4.1+ where `linux-headers` is included in [`Dockerfile`](../Dockerfile). |
