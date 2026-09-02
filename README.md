# Ocean3D — Interactive Ocean Digital Twin
**Smart India Hackathon 2026** | **Problem Statement ID: SIH26067** | **Theme: Disaster Management**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js-black.svg)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

---

## 1. Project Overview

**Ocean3D** is a web-based, interactive 3D ocean digital twin built to bridge the gap between high-resolution numerical ocean models and real-time in-situ oceanographic observations. Developed for **Smart India Hackathon 2026 (Problem Statement SIH26067)** under the **Disaster Management** theme, the platform focuses on the Northern Indian Ocean basin—with priority emphasis on the **Bay of Bengal** and the **Arabian Sea**—to detect extreme marine thermal events, barrier layer stratification, sea surface height anomalies, and hazardous currents.

---

## 2. Problem Statement (SIH26067)

Numerical ocean circulation models (e.g., MOM6, ROMS, INCOIS operational forecasts) provide dense, continuous spatial grids of physical oceanographic parameters. Conversely, in-situ observation platforms (Argo profiling floats, RAMA moored buoys, coastal tide gauges) supply ground-truth telemetry at sparse spatial points. 

Disaster management authorities and oceanographers face two critical challenges:
1. **Lack of an interactive 3D digital twin** that intuitively co-visualizes multi-depth numerical model outputs alongside sparse in-situ telemetry in a single, responsive view.
2. **Absence of automated, explainable difference calculations and anomaly detection** that translate raw sensor residuals into actionable decision-support advisories for extreme weather risks (e.g., tropical cyclogenesis, marine heatwaves, coastal storm surges).

---

## 3. The Ocean3D Solution

Ocean3D delivers a complete end-to-end digital twin pipeline:
```
[ Ocean Data Source (Model + In-Situ) ]
                 │
                 ▼
[ Xarray-Compatible Scientific Processing Engine ]
                 │
                 ▼
[ Difference Engine (Observed - Model) & Z-Score Anomaly Detector ]
                 │
                 ▼
[ FastAPI High-Performance REST API ]
                 │
                 ▼
[ Interactive 3D WebGL Digital Twin (Three.js + React + Recharts) ]
                 │
                 ▼
[ Actionable Disaster Risk & Decision Support Advisories ]
```

---

## 4. System Architecture & Tech Stack

### Frontend Architecture
- **Framework**: React 19 + TypeScript + Vite 8
- **3D Visualization Engine**: Three.js WebGL with custom bathymetric particle fields, procedural coastline contours, pulsing radar beacons, and dynamic current flow vectors
- **Controls & Navigation**: OrbitControls (360° rotate, pan, zoom, nadir/perspective presets)
- **Styling**: Tailwind CSS v4, Glassmorphism, Deep Navy Dark Ocean Palette
- **Analytics & Charting**: Recharts (Model vs. Observation multi-step progression, Difference bar charts)
- **Icons**: Lucide React

### Backend Architecture
- **Framework**: Python 3.12 + FastAPI + Uvicorn
- **Data Architecture**: Xarray/NetCDF-ready spatial grid engine
- **Math & Science**: NumPy, Pandas, SciPy
- **Data Validation**: Pydantic v2 schemas

---

## 5. Key Features

1. **Genuinely Interactive 3D Ocean Digital Twin**:
   - Depth stratification slices (0m, 10m, 50m, 100m, 500m).
   - Real-time parameter colormapping:
     - **Sea Surface Temperature (SST)**: Turbo thermal scale (°C).
     - **Salinity**: Viridis halocline scale (PSU).
     - **Sea Surface Height (SSH)**: Coolwarm dynamic elevation (m).
     - **Current Velocity**: Plasma kinetic velocity vector field (m/s).
   - Procedural geographic coastline contours for the Indian subcontinent, Sri Lanka, Andaman & Nicobar islands, and the Bay of Bengal rim.
   - Animated ocean surface breathing motion and current velocity vector particles.

2. **In-Situ Observation Markers (RAMA & Argo)**:
   - 3D moored buoy and profiling float beacons anchored at accurate coordinates.
   - Interactive raycasting: hover tooltips and click-to-inspect.
   - Pulsing radar rings color-coded by anomaly severity.

3. **Dynamic Model vs Observation Comparison**:
   - `difference = observed_value - model_value` calculated dynamically in code.
   - Never hardcoded; computed across all depths, parameters, and time steps.

4. **Deterministic Statistical Anomaly Detection**:
   - Computes standard deviations against regional baselines:
     - $|Z| < 1.5$ &rarr; **NORMAL** (Emerald Green)
     - $1.5 \le |Z| < 2.5$ &rarr; **MODERATE DEVIATION** (Amber)
     - $|Z| \ge 2.5$ &rarr; **SIGNIFICANT ANOMALY** (Crimson Red with pulsing beacon)
   - Exposes anomaly scores, severity classification, and scientific rationale.

5. **Risk & Decision Support Panel**:
   - Contextual disaster risk translation (marine heatwave alerts, cyclogenesis heat potential, coastal storm surge warnings, and maritime navigation hazards).
   - Responsible, decision-support advisory language without unsupported predictive claims.

6. **Temporal Navigation (4D Ocean Twin)**:
   - 10 timesteps with 6-hour delta intervals.
   - Automated timeline loop playback with play/pause and step scrubbing.

7. **Comprehensive Analytics**:
   - Real-time Model vs Observation line chart over time.
   - Difference bar chart for residual analysis.
   - Summary statistics cards: Mean (Model & Obs), Min, Max, and RMSE.

---

## 6. Scientific Data Model & Synthetic Engine

The local data engine simulates realistic ocean physics matching the Northern Indian Ocean:
- **Temperature Decay**: Surface warm pool (~29.5–31°C) with exponential thermocline decay:
  $$T(z) = 8.5 + (T_{\text{surf}} - 8.5) \cdot e^{-z / 130}$$
- **Salinity Plume**: Realistic Ganga-Brahmaputra freshwater discharge in the northern Bay of Bengal (dropping surface salinity to ~28–31 PSU), contrasted with high evaporation in the Arabian Sea (~36–37 PSU).
- **Mesoscale Dynamics**: Cyclonic and anticyclonic eddies producing localized SSH anomalies (-0.3m to +0.45m).
- **In-Situ Platform Network**: Simulates active RAMA moorings (e.g., `RAMA-BD02`, `RAMA-AD01`), INCOIS coastal buoys, and Argo profiling floats (`ARGO-IN-290145`).

---

## 7. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, version, and configuration |
| `GET` | `/api/parameters` | List all supported physical oceanographic parameters |
| `GET` | `/api/regions` | Geographic bounding boxes and default centers |
| `GET` | `/api/ocean-data` | Dense numerical model grid points for 3D rendering |
| `GET` | `/api/observations` | In-situ observations with computed differences & Z-scores |
| `GET` | `/api/comparison` | Aggregated model vs obs comparison, mean difference, RMSE |
| `GET` | `/api/anomalies` | Filtered list of moderate and significant anomalies |
| `GET` | `/api/statistics` | Spatial and statistical summary (Mean, Min, Max, Std, RMSE) |
| `GET` | `/api/timeseries` | 10-step temporal progression for selected station or basin |
| `GET` | `/api/timesteps` | List all available simulation ISO timestamps |

---

## 8. Installation & Setup

### Prerequisites
- **Node.js**: v18+ (tested with v24.13.0)
- **Python**: 3.10+ (tested with 3.12.5)
- **npm**: v9+

### 1. Clone or Open Workspace
```bash
cd "Ocean 3d"
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install fastapi uvicorn pydantic numpy pandas scipy

# Run FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
The backend will be available at `http://127.0.0.1:8000` (Swagger UI at `/docs`).

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```
The frontend will be available at `http://127.0.0.1:5173`.

---

## 9. Primary SIH Demo Flow

To demonstrate the full capability in under 2 minutes:
1. Open `http://127.0.0.1:5173`.
2. Click the **'Demo Flow'** button in the top header (or manually select **Bay of Bengal**, **Sea Surface Temperature**, **10m Depth**).
3. Observe the 3D bathymetric ocean surface, geographic coastline contour, and glowing observation beacons.
4. Verify the top **Risk & Decision Support** panel displaying a **Critical Thermal Energy Anomaly Alert**.
5. Click on **RAMA Moored Buoy BD02** (or select it from the right Location Inspector):
   - Model Value: `~28.02 °C`
   - Observed Value: `~30.52 °C`
   - Calculated Difference: `+2.500 °C`
   - Statistical Z-score: `Z = 2.94`
   - Severity: `SIGNIFICANT ANOMALY`
6. Review the bottom **Analytics Panel**:
   - Model vs Observation progression line chart across timesteps.
   - Difference bar chart highlighting positive residual spikes.
   - Updated RMSE and basin statistics.
7. Click **Play Loop** to witness seamless 4D temporal evolution through 6-hour forecast intervals.
8. Switch parameters to **Salinity (PSU)** or **Sea Surface Height (m)** to observe the instant recalculation of physical fields and updated disaster risk insights.

---

## 10. Future Real-Data Integration Roadmap

The modular architecture separates the data ingestion layer from visualization:
- **Copernicus Marine Service (CMEMS)**: Integration of Global Ocean Physics Analysis and Forecast (`GLOBAL_ANALYSISFORECAST_PHY_001_024`) via Copernicus API / OPeNDAP.
- **NOAA / ERDDAP**: Ingestion of GHRSST satellite sea surface temperature feeds.
- **INCOIS & Argo Global Data Assembly Centre (GDAC)**: Automated FTP/HTTP retrieval of real NetCDF Argo profile files.
- **Xarray & NetCDF Engine**: Transition `data_engine.py` from synthetic functions to `xarray.open_dataset('model.nc')` with zero changes required to the frontend.

---

## 11. Authors & Hackathon Team

- **Team**: Ocean3D Innovation Team
- **Event**: Smart India Hackathon 2026
- **Problem Statement**: SIH26067
- **Theme**: Disaster Management
