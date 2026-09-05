"""
Ocean3D Live Operational Ocean Data Client
Integrates with real operational oceanographic APIs:
1. Open-Meteo Marine API (operational numerical models backed by Copernicus Marine Service & NOAA)
   - Real-time and multi-day hourly forecast for Sea Surface Temperature and Ocean Currents.
2. NOAA CoastWatch ERDDAP (nesdisSSH1day)
   - Satellite altimetry for Sea Surface Height Anomaly (SLA in meters).
3. NOAA PMEL RFROM v2.3 Real-Time (argo_rfromv23_temp_realtime & argo_rfromv23_sal_realtime)
   - Argo-informed 0.25°x0.25° Random Forest real-time gridded observational product down to 2000m (pressure 1975 dbar).
4. NOAA PMEL GOBAI-O2 (gobai_o2_hr_v10)
   - BGC-Argo-informed AI/ML gridded dissolved oxygen product down to 2000m (pressure 1975 dbar).
5. NOAA CoastWatch Ocean Color (nesdisVHNnoaaSNPPnoaa20NRTchlaGapfilledDaily)
   - Near-real-time daily satellite ocean color Chlorophyll-a radiometry at sea surface (0m).

Features:
- Multi-coordinate batch queries.
- In-memory TTL caching for sub-millisecond warm responses.
- Explicit data status tracking (LIVE, DERIVED, SIMULATED, FALLBACK, UNAVAILABLE).
- Graceful network timeout & fallback.
"""

import json
import math
import time
import urllib.request
import urllib.error
import logging
from typing import Dict, List, Optional, Tuple, Any

logger = logging.getLogger("ocean3d.live_client")
logging.basicConfig(level=logging.INFO)

OPEN_METEO_MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine"
NOAA_COASTWATCH_SSH_BASE = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/nesdisSSH1day.json"
NOAA_PMEL_ARGO_TEMP_BASE = "https://data.pmel.noaa.gov/pmel/erddap/griddap/argo_rfromv23_temp_realtime.json"
NOAA_PMEL_ARGO_SAL_BASE = "https://data.pmel.noaa.gov/pmel/erddap/griddap/argo_rfromv23_sal_realtime.json"
NOAA_PMEL_GOBAI_O2_BASE = "https://data.pmel.noaa.gov/pmel/erddap/griddap/gobai_o2_hr_v10.json"
NOAA_COASTWATCH_CHLA_BASE = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/nesdisVHNnoaaSNPPnoaa20NRTchlaGapfilledDaily.json"

class LiveOceanClient:
    """Client for querying operational real-world ocean data APIs with caching and fallback."""

    def __init__(self, cache_ttl_seconds: int = 3600, timeout_seconds: int = 6):
        self.cache_ttl = cache_ttl_seconds
        self.timeout = timeout_seconds
        # In-memory cache: key -> (timestamp, data, status)
        self._cache: Dict[str, Tuple[float, Any, str]] = {}
        self.last_api_status = {
            "open_meteo": "untested",
            "noaa_coastwatch_ssh": "untested",
            "noaa_pmel_argo": "untested",
            "noaa_pmel_gobai_o2": "untested",
            "noaa_coastwatch_chlorophyll": "untested",
            "last_fetch_timestamp": None,
            "cache_entries": 0
        }

    def _get_from_cache(self, key: str) -> Optional[Tuple[Any, str]]:
        if key in self._cache:
            expire_at, data, status = self._cache[key]
            if time.time() < expire_at:
                return data, status
        return None

    def _set_in_cache(self, key: str, data: Any, status: str = "LIVE", ttl: Optional[int] = None):
        expire_at = time.time() + (ttl if ttl is not None else self.cache_ttl)
        self._cache[key] = (expire_at, data, status)
        self.last_api_status["cache_entries"] = len(self._cache)
        self.last_api_status["last_fetch_timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    def fetch_open_meteo_batch(
        self,
        coordinates: List[Tuple[float, float]],
        hourly: bool = True
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Batch query Open-Meteo Marine API for (lat, lon) coordinates.
        Returns list of points with hourly forecast arrays or current surface values.
        """
        if not coordinates:
            return []

        coord_key = "_".join(f"{round(lat, 2)},{round(lon, 2)}" for lat, lon in coordinates[:10])
        cache_key = f"open_meteo_{coord_key}_{hourly}_{len(coordinates)}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached[0]

        lats_str = ",".join(str(round(lat, 3)) for lat, _ in coordinates)
        lons_str = ",".join(str(round(lon, 3)) for _, lon in coordinates)

        if hourly:
            url = (
                f"{OPEN_METEO_MARINE_BASE}?latitude={lats_str}&longitude={lons_str}"
                f"&hourly=sea_surface_temperature,ocean_current_velocity,ocean_current_direction"
                f"&forecast_days=3"
            )
        else:
            url = (
                f"{OPEN_METEO_MARINE_BASE}?latitude={lats_str}&longitude={lons_str}"
                f"&current=sea_surface_temperature,ocean_current_velocity,ocean_current_direction"
            )

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Ocean3D-DigitalTwin/2.0 (Operational Scientific)"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    result = [data] if isinstance(data, dict) else data
                    self._set_in_cache(cache_key, result, "LIVE MODEL")
                    self.last_api_status["open_meteo"] = "healthy"
                    return result
        except Exception as e:
            logger.warning("Failed to fetch from Open-Meteo Marine API: %s", e)
            self.last_api_status["open_meteo"] = f"offline: {str(e)[:30]}"

        return None

    def fetch_open_meteo_weather_batch(
        self,
        coordinates: List[Tuple[float, float]],
        hourly: bool = True
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Batch query Open-Meteo Weather Forecast API for wind speed (10m, m/s) and surface pressure (hPa).
        Returns list of points with hourly forecast arrays or current surface values.
        """
        if not coordinates:
            return []

        coord_key = "_".join(f"{round(lat, 2)},{round(lon, 2)}" for lat, lon in coordinates[:10])
        cache_key = f"open_meteo_weather_{coord_key}_{hourly}_{len(coordinates)}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached[0]

        lats_str = ",".join(str(round(lat, 3)) for lat, _ in coordinates)
        lons_str = ",".join(str(round(lon, 3)) for _, lon in coordinates)

        if hourly:
            url = (
                f"https://api.open-meteo.com/v1/forecast?latitude={lats_str}&longitude={lons_str}"
                f"&hourly=wind_speed_10m,surface_pressure&wind_speed_unit=ms&forecast_days=3"
            )
        else:
            url = (
                f"https://api.open-meteo.com/v1/forecast?latitude={lats_str}&longitude={lons_str}"
                f"&current=wind_speed_10m,surface_pressure&wind_speed_unit=ms"
            )

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Ocean3D-DigitalTwin/2.0 (Meteorological Operational)"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    result = [data] if isinstance(data, dict) else data
                    self._set_in_cache(cache_key, result, "LIVE MODEL")
                    return result
        except Exception as e:
            logger.warning("Failed to fetch from Open-Meteo Weather API: %s", e)

        return None

    def fetch_noaa_ssh(self, lat: float, lon: float) -> Tuple[Optional[float], str]:
        """
        Fetch Sea Level Anomaly (SSH in meters) from NOAA CoastWatch satellite altimetry.
        Returns (value, data_status).
        """
        cache_key = f"noaa_ssh_{round(lat, 1)}_{round(lon, 1)}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached[0], cached[1]

        url = f"{NOAA_COASTWATCH_SSH_BASE}?sla[(last)][({round(lat, 2)})][({round(lon, 2)})]"
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Ocean3D-DigitalTwin/2.0"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    rows = data.get("table", {}).get("rows", [])
                    if rows and len(rows[0]) >= 4 and rows[0][3] is not None:
                        val = round(float(rows[0][3]), 3)
                        self._set_in_cache(cache_key, val, "LIVE")
                        self.last_api_status["noaa_coastwatch_ssh"] = "healthy"
                        return val, "LIVE"
        except Exception as e:
            logger.debug("NOAA SSH query note: %s", e)
            self.last_api_status["noaa_coastwatch_ssh"] = f"fallback: {str(e)[:30]}"
            self._set_in_cache(cache_key, None, "FALLBACK", ttl=180)

        return None, "FALLBACK"

    def fetch_argo_profile_obs(
        self, parameter: str, depth: float, lat: float, lon: float
    ) -> Tuple[Optional[float], str]:
        """
        Fetch genuine Argo in-situ profiling observation (temperature or salinity)
        down to 2000m from NOAA PMEL RFROM v2.3 Real-Time gridded Argo observations.
        Returns (value, data_status).
        """
        if parameter not in ("sst", "salinity"):
            return None, "UNAVAILABLE"

        press = max(2.5, min(1975.0, depth if depth > 0 else 2.5))
        base_url = NOAA_PMEL_ARGO_TEMP_BASE if parameter == "sst" else NOAA_PMEL_ARGO_SAL_BASE
        var_name = "ocean_temperature" if parameter == "sst" else "ocean_salinity"

        cache_key = f"argo_{parameter}_{press}_{round(lat, 1)}_{round(lon, 1)}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached[0], cached[1]

        url = f"{base_url}?{var_name}[(last)][({press})][({round(lat, 2)})][({round(lon, 2)})]"
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Ocean3D-DigitalTwin/2.0"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    rows = data.get("table", {}).get("rows", [])
                    if rows and len(rows[0]) >= 5 and rows[0][4] is not None:
                        val = round(float(rows[0][4]), 2 if parameter == "sst" else 2)
                        self._set_in_cache(cache_key, val, "LIVE")
                        self.last_api_status["noaa_pmel_argo"] = "healthy"
                        return val, "LIVE"
        except Exception as e:
            logger.debug("Argo profile query note: %s", e)
            self.last_api_status["noaa_pmel_argo"] = f"fallback: {str(e)[:30]}"
            self._set_in_cache(cache_key, None, "FALLBACK", ttl=180)

        return None, "FALLBACK"

    def fetch_gobai_oxygen(self, depth: float, lat: float, lon: float) -> Tuple[Optional[float], str]:
        """
        Fetch genuine BGC-Argo Dissolved Oxygen observation (µmol/kg)
        down to 2000m from NOAA PMEL GOBAI-O2.
        Returns (value, data_status).
        """
        press = max(2.5, min(1975.0, depth if depth > 0 else 2.5))
        cache_key = f"gobai_o2_{press}_{round(lat, 1)}_{round(lon, 1)}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached[0], cached[1]

        url = f"{NOAA_PMEL_GOBAI_O2_BASE}?o2[(last)][({press})][({round(lat, 2)})][({round(lon, 2)})]"
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Ocean3D-DigitalTwin/2.0"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    rows = data.get("table", {}).get("rows", [])
                    if rows and len(rows[0]) >= 5 and rows[0][4] is not None:
                        val = round(float(rows[0][4]), 2)
                        self._set_in_cache(cache_key, val, "LIVE")
                        self.last_api_status["noaa_pmel_gobai_o2"] = "healthy"
                        return val, "LIVE"
        except Exception as e:
            logger.debug("GOBAI O2 query note: %s", e)
            self.last_api_status["noaa_pmel_gobai_o2"] = f"fallback: {str(e)[:30]}"
            self._set_in_cache(cache_key, None, "FALLBACK", ttl=180)

        return None, "FALLBACK"

    def fetch_coastwatch_chlorophyll(self, depth: float, lat: float, lon: float) -> Tuple[Optional[float], str]:
        """
        Fetch genuine NOAA CoastWatch satellite ocean color Chlorophyll-a observation (mg/m³).
        Optical satellite only measures surface layer (depth = 0.0m).
        """
        if depth > 0.0:
            return None, "UNAVAILABLE"

        cache_key = f"coastwatch_chla_{round(lat, 1)}_{round(lon, 1)}"
        cached = self._get_from_cache(cache_key)
        if cached is not None:
            return cached[0], cached[1]

        url = f"{NOAA_COASTWATCH_CHLA_BASE}?chlor_a[(last)][(0.0)][({round(lat, 2)})][({round(lon, 2)})]"
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Ocean3D-DigitalTwin/2.0"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    rows = data.get("table", {}).get("rows", [])
                    if rows and len(rows[0]) >= 5 and rows[0][4] is not None:
                        val = round(float(rows[0][4]), 3)
                        self._set_in_cache(cache_key, val, "LIVE")
                        self.last_api_status["noaa_coastwatch_chlorophyll"] = "healthy"
                        return val, "LIVE"
        except Exception as e:
            logger.debug("CoastWatch Chlorophyll query note: %s", e)
            self.last_api_status["noaa_coastwatch_chlorophyll"] = f"fallback: {str(e)[:30]}"
            self._set_in_cache(cache_key, None, "FALLBACK", ttl=180)

        return None, "FALLBACK"

    @staticmethod
    def uv_from_speed_dir(speed: float, direction_deg: float) -> Tuple[float, float]:
        """
        Convert current velocity speed (m/s) and direction (degrees)
        into zonal (u) and meridional (v) components.
        """
        if speed is None or math.isnan(speed):
            return 0.0, 0.0
        if direction_deg is None or math.isnan(direction_deg):
            return round(speed, 3), 0.0

        rad = math.radians(direction_deg)
        u = round(float(speed * math.sin(rad)), 3)
        v = round(float(speed * math.cos(rad)), 3)
        return u, v


# Global singleton instance
live_client = LiveOceanClient()
