"""
Ocean3D Engine - Synthetic Oceanographic Data Engine with Xarray-compatible data structures
Simulates numerical ocean models (MOM6 / ROMS / INCOIS-style) and in-situ observations (Argo floats, RAMA moored buoys, tide gauges).
Supports parameter extraction, depth stratification, model vs observation comparisons, deterministic z-score anomaly detection,
and disaster risk decision support analytics.
"""

import math
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta

from backend.models import (
    ParameterInfo, RegionInfo, OceanGridPoint, ObservationPoint,
    ComparisonSummary, AnomalyItem, StatisticsSummary
)

# Supported Parameters
PARAMETERS: Dict[str, ParameterInfo] = {
    "sst": ParameterInfo(
        id="sst",
        name="Sea Surface Temperature",
        unit="°C",
        description="Ocean thermal structure representing sea surface and subsurface temperature.",
        min_val=10.0,
        max_val=34.0,
        color_map="turbo"
    ),
    "salinity": ParameterInfo(
        id="salinity",
        name="Salinity",
        unit="PSU",
        description="Practical Salinity Units measuring dissolved salt concentration and freshwater plumes.",
        min_val=28.0,
        max_val=38.0,
        color_map="viridis"
    ),
    "ssh": ParameterInfo(
        id="ssh",
        name="Sea Surface Height",
        unit="m",
        description="Dynamic topography relative to geoid indicating eddies, storm surges, and sea level rise.",
        min_val=-0.4,
        max_val=0.6,
        color_map="coolwarm"
    ),
    "current_velocity": ParameterInfo(
        id="current_velocity",
        name="Current Velocity",
        unit="m/s",
        description="Total kinetic horizontal current velocity vector magnitude.",
        min_val=0.0,
        max_val=2.2,
        color_map="plasma"
    )
}

# Standard Depth Levels
DEPTH_LEVELS: List[float] = [0.0, 10.0, 50.0, 100.0, 500.0]

# Supported Geographical Regions
REGIONS: Dict[str, RegionInfo] = {
    "bay_of_bengal": RegionInfo(
        id="bay_of_bengal",
        name="Bay of Bengal",
        lat_min=5.0,
        lat_max=22.5,
        lon_min=80.0,
        lon_max=98.0,
        center_lat=14.5,
        center_lon=88.5,
        default_zoom=4.5,
        description="Primary Disaster Management focus area. Intense cyclone activity, low salinity freshwater lens from Ganga-Brahmaputra, and warm SST pools."
    ),
    "arabian_sea": RegionInfo(
        id="arabian_sea",
        name="Arabian Sea",
        lat_min=8.0,
        lat_max=26.0,
        lon_min=55.0,
        lon_max=77.0,
        center_lat=17.0,
        center_lon=66.0,
        default_zoom=4.2,
        description="High salinity basin driven by high evaporation and strong seasonal Findlater jet upwelling."
    ),
    "indian_ocean": RegionInfo(
        id="indian_ocean",
        name="North Indian Ocean Basin",
        lat_min=-5.0,
        lat_max=25.0,
        lon_min=50.0,
        lon_max=102.0,
        center_lat=10.0,
        center_lon=76.0,
        default_zoom=3.0,
        description="Comprehensive basin view incorporating the Indian subcontinent, equatorial current jets, and dipole modes."
    ),
    "global": RegionInfo(
        id="global",
        name="Global Overview",
        lat_min=-40.0,
        lat_max=45.0,
        lon_min=30.0,
        lon_max=125.0,
        center_lat=5.0,
        center_lon=80.0,
        default_zoom=2.2,
        description="Macro digital twin perspective spanning the Indo-Pacific tropical warm pool."
    )
}

# 10 Timesteps with 6-hour intervals
START_TIME = datetime(2026, 9, 1, 0, 0, 0)
TIMESTEPS: List[str] = [
    (START_TIME + timedelta(hours=6 * i)).strftime("%Y-%m-%dT%H:%M:%SZ")
    for i in range(10)
]

# Fixed In-Situ Observation Platforms (Simulating RAMA, Argo, INCOIS Buoys, and Coastal Gauges)
STATION_CATALOG = [
    # Bay of Bengal Stations
    {"id": "RAMA-BD02", "name": "RAMA Moored Buoy BD02", "type": "RAMA Moored Buoy", "lat": 15.0, "lon": 90.0, "region": "bay_of_bengal", "anomaly_tendency": "high_sst"},
    {"id": "ARGO-IN-290145", "name": "Argo Float #290145", "type": "Argo Profiling Float", "lat": 12.8, "lon": 85.5, "region": "bay_of_bengal", "anomaly_tendency": "high_ssh"},
    {"id": "INCOIS-CB04", "name": "INCOIS Coastal Buoy CB04", "type": "Coastal Buoy", "lat": 17.6, "lon": 83.4, "region": "bay_of_bengal", "anomaly_tendency": "low_salinity"},
    {"id": "TIDE-PARADIP", "name": "Paradip Port Gauge", "type": "Coastal Tide Gauge", "lat": 20.3, "lon": 86.7, "region": "bay_of_bengal", "anomaly_tendency": "high_ssh"},
    {"id": "ARGO-IN-290188", "name": "Argo Float #290188", "type": "Argo Profiling Float", "lat": 9.2, "lon": 88.8, "region": "bay_of_bengal", "anomaly_tendency": "normal"},
    {"id": "RAMA-BD08", "name": "RAMA Moored Buoy BD08", "type": "RAMA Moored Buoy", "lat": 18.2, "lon": 89.6, "region": "bay_of_bengal", "anomaly_tendency": "low_salinity"},
    {"id": "ARGO-IN-290210", "name": "Argo Float #290210", "type": "Argo Profiling Float", "lat": 13.5, "lon": 92.5, "region": "bay_of_bengal", "anomaly_tendency": "high_current"},
    {"id": "ANDAMAN-B01", "name": "Port Blair Marine Station", "type": "Coastal Buoy", "lat": 11.7, "lon": 92.7, "region": "bay_of_bengal", "anomaly_tendency": "normal"},

    # Arabian Sea Stations
    {"id": "RAMA-AD01", "name": "RAMA Moored Buoy AD01", "type": "RAMA Moored Buoy", "lat": 15.5, "lon": 69.2, "region": "arabian_sea", "anomaly_tendency": "normal"},
    {"id": "ARGO-AS-19022", "name": "Argo Float #19022", "type": "Argo Profiling Float", "lat": 18.4, "lon": 64.0, "region": "arabian_sea", "anomaly_tendency": "high_salinity"},
    {"id": "INCOIS-AS02", "name": "INCOIS Offshore Buoy AS02", "type": "Offshore Buoy", "lat": 20.8, "lon": 70.1, "region": "arabian_sea", "anomaly_tendency": "high_current"},
    {"id": "TIDE-MUMBAI", "name": "Mumbai Port Sea Level Station", "type": "Coastal Tide Gauge", "lat": 18.9, "lon": 72.8, "region": "arabian_sea", "anomaly_tendency": "normal"},
    {"id": "ARGO-AS-19045", "name": "Argo Float #19045", "type": "Argo Profiling Float", "lat": 11.2, "lon": 67.5, "region": "arabian_sea", "anomaly_tendency": "normal"},
    {"id": "RAMA-AD04", "name": "RAMA Moored Buoy AD04", "type": "RAMA Moored Buoy", "lat": 12.0, "lon": 68.0, "region": "arabian_sea", "anomaly_tendency": "normal"},

    # Equatorial & Southern Indian Ocean Stations
    {"id": "EQUAT-RAMA-01", "name": "Equatorial RAMA 01", "type": "RAMA Moored Buoy", "lat": 0.0, "lon": 80.5, "region": "indian_ocean", "anomaly_tendency": "high_current"},
    {"id": "ARGO-IO-39001", "name": "Argo Float #39001", "type": "Argo Profiling Float", "lat": -4.2, "lon": 75.0, "region": "indian_ocean", "anomaly_tendency": "normal"},
    {"id": "ARGO-IO-39014", "name": "Argo Float #39014", "type": "Argo Profiling Float", "lat": 3.5, "lon": 78.0, "region": "indian_ocean", "anomaly_tendency": "normal"},
    {"id": "COLOMBO-STN", "name": "Sri Lanka South Station", "type": "Coastal Buoy", "lat": 5.9, "lon": 80.6, "region": "indian_ocean", "anomaly_tendency": "high_sst"}
]


class OceanDataEngine:
    """Core scientific computation and synthetic data provider."""

    def __init__(self):
        # Pre-seed deterministic random generator for reproducible scientific patterns
        self.rng = np.random.default_rng(20260901)
        self._cached_grid_data: Dict[str, List[OceanGridPoint]] = {}
        self._cached_observations: Dict[str, List[ObservationPoint]] = {}

    def is_land(self, lat: float, lon: float) -> bool:
        """Heuristic land-mask filter for Indian subcontinent and Indo-China peninsula."""
        # Main Indian Landmass (simplified polygon boundary)
        if 8.0 <= lat <= 28.0 and 70.0 <= lon <= 88.0:
            # Check triangular taper of southern peninsula
            if lat < 18.0:
                left_bound = 73.0 - (lat - 8.0) * 0.4
                right_bound = 79.5 + (lat - 8.0) * 0.55
                if left_bound <= lon <= right_bound:
                    return True
            else:
                if 72.0 <= lon <= 87.0:
                    return True
        # Northern Bay of Bengal land (Bangladesh & East India above 22.8N)
        if lat > 22.8 and 88.0 <= lon <= 92.5:
            return True
        # Myanmar / Andaman east coast landmass
        if 15.0 <= lat <= 24.0 and lon >= 94.5:
            return True
        # Arabian Peninsula / Middle East
        if lat >= 16.0 and lon <= 60.0:
            return True
        return False

    def compute_model_physics(
        self, lat: float, lon: float, depth: float, time_idx: int
    ) -> Tuple[float, float, float, float, float, float]:
        """
        Simulate realistic ocean physics for numerical models (SST, Salinity, SSH, U, V, Mag).
        Includes latitude gradients, depth thermocline decay, seasonal monsoon currents, and mesoscale eddies.
        """
        t_phase = (time_idx / 10.0) * 2.0 * math.pi

        # 1. Temperature (°C)
        # Tropical warm pool in Northern Indian Ocean (~29-30°C at surface)
        lat_gradient = -0.15 * max(0.0, lat - 5.0)
        # Bay of Bengal is warmer than Arabian Sea due to stratification
        basin_offset = 1.0 if (lon > 80.0 and lat > 10.0) else 0.0
        # Diurnal and tidal cycle
        diurnal = 0.4 * math.sin(t_phase)
        # Mesoscale thermal eddy
        eddy_sst = 0.6 * math.sin(lat * 0.45) * math.cos(lon * 0.35 + t_phase * 0.5)

        surface_temp = 29.5 + lat_gradient + basin_offset + diurnal + eddy_sst
        # Exponential thermocline decay with depth: 0m -> ~30°C, 100m -> ~22°C, 500m -> ~9°C
        temp_at_depth = 8.5 + (surface_temp - 8.5) * math.exp(-depth / 130.0)
        temp_at_depth = round(float(np.clip(temp_at_depth, 7.5, 33.5)), 2)

        # 2. Salinity (PSU)
        # Bay of Bengal has massive freshwater discharge (Ganga-Brahmaputra in the north)
        if lon > 80.0 and lat > 14.0:
            # Strong freshwater lens in north BoB (surface drops to ~29-31 PSU)
            freshwater_factor = (lat - 14.0) / 8.5
            surface_salinity = 33.2 - 3.8 * freshwater_factor
        elif lon <= 77.0:
            # Arabian Sea has high evaporation (~36.0 - 36.8 PSU)
            surface_salinity = 35.8 + 0.6 * math.sin(lat * 0.2)
        else:
            # Equatorial Indian Ocean (~34.2 PSU)
            surface_salinity = 34.4 + 0.2 * math.cos(lat * 0.15)

        # Depth stratification: Salinity increases with depth in BoB (under freshwater lens)
        if lon > 80.0 and lat > 14.0:
            sal_at_depth = surface_salinity + (34.8 - surface_salinity) * (1.0 - math.exp(-depth / 80.0))
        else:
            sal_at_depth = surface_salinity - 0.5 * (1.0 - math.exp(-depth / 150.0))
        sal_at_depth = round(float(np.clip(sal_at_depth, 27.5, 38.0)), 2)

        # 3. Sea Surface Height (m)
        # Dynamic height varies with eddies (-0.3m to +0.45m)
        # Cyclonic / anticyclonic mesoscale eddies in Bay of Bengal
        eddy_ssh = 0.18 * math.sin(lat * 0.6 + t_phase * 0.8) * math.cos(lon * 0.5)
        regional_tilt = 0.08 * math.cos(lat * 0.2) + 0.05 * math.sin(lon * 0.15)
        # SSH slightly decays with depth pressure reference
        ssh = round(float(np.clip(regional_tilt + eddy_ssh, -0.35, 0.52)), 3)

        # 4. Current Velocity (u, v in m/s)
        # East India Coastal Current (EICC) flowing along west margin of BoB + monsoonal drift
        u_base = 0.35 * math.sin(lat * 0.3 + t_phase * 0.7)
        v_base = 0.40 * math.cos(lon * 0.25)
        if 80.0 <= lon <= 85.0 and 10.0 <= lat <= 19.0:
            # Western boundary intensification (EICC)
            v_base += 0.55 * (1.0 - (lon - 80.0) / 5.0)

        # Attenuate current with depth
        depth_damping = math.exp(-depth / 180.0)
        u_curr = round(float(u_base * depth_damping), 3)
        v_curr = round(float(v_base * depth_damping), 3)
        mag_curr = round(float(math.sqrt(u_curr * u_curr + v_curr * v_curr)), 3)

        return temp_at_depth, sal_at_depth, ssh, u_curr, v_curr, mag_curr

    def get_grid_data(
        self, region_id: str, parameter: str, depth: float, time_str: str
    ) -> List[OceanGridPoint]:
        """Generate or retrieve dense numerical model grid points for a given region, depth, and time."""
        reg = REGIONS.get(region_id, REGIONS["bay_of_bengal"])
        time_idx = TIMESTEPS.index(time_str) if time_str in TIMESTEPS else 0
        cache_key = f"{region_id}_{parameter}_{depth}_{time_idx}"

        if cache_key in self._cached_grid_data:
            return self._cached_grid_data[cache_key]

        # Determine grid resolution appropriate for smooth rendering without performance degradation
        if region_id == "bay_of_bengal":
            lat_step = 0.85
            lon_step = 0.85
        elif region_id == "arabian_sea":
            lat_step = 0.95
            lon_step = 0.95
        elif region_id == "indian_ocean":
            lat_step = 1.4
            lon_step = 1.4
        else:  # global
            lat_step = 2.8
            lon_step = 2.8

        points: List[OceanGridPoint] = []
        lats = np.arange(reg.lat_min, reg.lat_max + 0.1, lat_step)
        lons = np.arange(reg.lon_min, reg.lon_max + 0.1, lon_step)

        idx = 0
        for lat in lats:
            for lon in lons:
                if self.is_land(lat, lon):
                    continue

                t, s, ssh, u, v, mag = self.compute_model_physics(lat, lon, depth, time_idx)

                param_val = t
                if parameter == "salinity":
                    param_val = s
                elif parameter == "ssh":
                    param_val = ssh
                elif parameter == "current_velocity":
                    param_val = mag

                pt = OceanGridPoint(
                    id=f"grid_{region_id}_{idx}",
                    lat=round(float(lat), 3),
                    lon=round(float(lon), 3),
                    depth=depth,
                    time=time_str,
                    temperature=t,
                    salinity=s,
                    ssh=ssh,
                    current_u=u,
                    current_v=v,
                    current_magnitude=mag,
                    parameter_value=param_val
                )
                points.append(pt)
                idx += 1

        self._cached_grid_data[cache_key] = points
        return points

    def get_observations(
        self, region_id: str, parameter: str, depth: float, time_str: str
    ) -> List[ObservationPoint]:
        """
        Generate in-situ observation data with realistic deviations, systematic biases,
        and localized anomalies to evaluate model vs observation differences.
        """
        reg = REGIONS.get(region_id, REGIONS["bay_of_bengal"])
        time_idx = TIMESTEPS.index(time_str) if time_str in TIMESTEPS else 0
        cache_key = f"obs_{region_id}_{parameter}_{depth}_{time_idx}"

        if cache_key in self._cached_observations:
            return self._cached_observations[cache_key]

        # Baseline standard deviations for parameters (for deterministic z-scores)
        baseline_stds = {
            "sst": 0.85,
            "salinity": 0.65,
            "ssh": 0.08,
            "current_velocity": 0.22
        }
        std_val = baseline_stds.get(parameter, 1.0)

        obs_list: List[ObservationPoint] = []

        for stn in STATION_CATALOG:
            # Filter stations within regional bounding box
            if not (reg.lat_min <= stn["lat"] <= reg.lat_max and reg.lon_min <= stn["lon"] <= reg.lon_max):
                continue

            # Model value at observation coordinate
            m_temp, m_sal, m_ssh, m_u, m_v, m_mag = self.compute_model_physics(
                stn["lat"], stn["lon"], depth, time_idx
            )

            m_val = m_temp
            if parameter == "salinity":
                m_val = m_sal
            elif parameter == "ssh":
                m_val = m_ssh
            elif parameter == "current_velocity":
                m_val = m_mag

            # Generate synthetic observed value with realistic sensor noise and deliberate anomalies
            tendency = stn["anomaly_tendency"]
            delta = 0.0
            anomaly_reason = "Observation is within normal sensor tolerance and model resolution."
            decision_support = "Observation aligns with numerical model guidance. Routine monitoring."

            # Subtle sensor jitter based on station id hash
            pseudo_seed = (hash(stn["id"]) + time_idx * 13) % 100
            jitter = (pseudo_seed / 50.0 - 1.0) * 0.25 * std_val

            # Apply structured anomalies matching SIH Disaster Management scenarios
            if parameter == "sst":
                if tendency == "high_sst" and depth <= 50.0:
                    # Significant Marine Heatwave pulse (+2.4 to +2.9 °C)
                    delta = 2.45 + (pseudo_seed % 10) * 0.05
                    anomaly_reason = f"Elevated sea surface thermal anomaly of +{delta:.2f}°C detected by {stn['name']}."
                    decision_support = (
                        "DECISION SUPPORT ADVISORY: Significant SST thermal anomaly detected (>29.5°C threshold). "
                        "Elevated upper ocean heat content may be relevant to assessment of extreme marine and convective conditions in the Bay of Bengal. "
                        "Closer monitoring recommended."
                    )
                else:
                    delta = jitter

            elif parameter == "ssh":
                if tendency == "high_ssh":
                    # Coastal surge / sea level rise anomaly (+0.25 to +0.38 m)
                    delta = 0.26 + (pseudo_seed % 10) * 0.015
                    anomaly_reason = f"Elevated positive sea surface height deviation of +{delta:.2f}m detected."
                    decision_support = (
                        "COASTAL MONITORING ADVISORY: Significant positive sea surface height deviation detected. "
                        "This region may require closer coastal gauge verification and increased marine monitoring."
                    )
                else:
                    delta = jitter * 0.5

            elif parameter == "salinity":
                if tendency == "low_salinity":
                    # Massive freshwater plume / barrier layer anomaly (-1.8 to -2.6 PSU)
                    delta = -2.1 - (pseudo_seed % 10) * 0.05
                    anomaly_reason = f"Significant freshwater dilution of {delta:.2f} PSU detected relative to numerical model."
                    decision_support = (
                        "BARRIER LAYER ADVISORY: Significant freshwater lens anomaly detected near northern coastal sector. "
                        "Halocline stratification may inhibit vertical ocean mixing and preserve upper layer heat content. "
                        "Continued observation recommended."
                    )
                elif tendency == "high_salinity":
                    delta = 1.6 + (pseudo_seed % 10) * 0.04
                    anomaly_reason = f"Elevated hypersaline intrusion (+{delta:.2f} PSU) detected."
                    decision_support = "Salinity deviation detected relative to climatological model. Routine observation assimilation recommended."
                else:
                    delta = jitter

            elif parameter == "current_velocity":
                if tendency == "high_current":
                    # Velocity surge anomaly (+0.65 to +0.95 m/s)
                    delta = 0.72 + (pseudo_seed % 10) * 0.03
                    anomaly_reason = f"Unusual current velocity anomaly (+{delta:.2f} m/s) surpassing seasonal model guidance."
                    decision_support = (
                        "MARITIME NAVIGATION ADVISORY: Unusual current behaviour detected. "
                        "Increased marine monitoring may be warranted for navigation corridors, offshore operations, and coastal craft."
                    )
                else:
                    delta = jitter

            obs_val = round(float(m_val + delta), 2 if parameter != "ssh" else 3)
            # Difference MUST be calculated in code: difference = observed_value - model_value
            difference = round(float(obs_val - m_val), 3)

            # Deterministic z-score calculation
            z_score = round(float(difference / std_val), 2)
            abs_z = abs(z_score)

            # Strict classification according to requirements:
            # |z| < 1.5 -> NORMAL
            # 1.5 <= |z| < 2.5 -> MODERATE DEVIATION
            # |z| >= 2.5 -> SIGNIFICANT ANOMALY
            if abs_z < 1.5:
                severity = "NORMAL"
            elif 1.5 <= abs_z < 2.5:
                severity = "MODERATE DEVIATION"
                if "DISASTER" not in decision_support and "ALERT" not in decision_support:
                    decision_support = (
                        f"Moderate model-observation deviation (|Z|={abs_z:.2f}). "
                        "Routine observation assimilation and spatial tracking advised."
                    )
            else:
                severity = "SIGNIFICANT ANOMALY"

            obs_point = ObservationPoint(
                id=stn["id"],
                platform_name=stn["name"],
                platform_type=stn["type"],
                lat=stn["lat"],
                lon=stn["lon"],
                depth=depth,
                time=time_str,
                temperature=round(float(m_temp if parameter != "sst" else obs_val), 2),
                salinity=round(float(m_sal if parameter != "salinity" else obs_val), 2),
                ssh=round(float(m_ssh if parameter != "ssh" else obs_val), 3),
                current_magnitude=round(float(m_mag if parameter != "current_velocity" else obs_val), 3),
                model_value=m_val,
                observed_value=obs_val,
                difference=difference,
                z_score=z_score,
                anomaly_severity=severity,
                anomaly_reason=anomaly_reason,
                decision_support=decision_support
            )
            obs_list.append(obs_point)

        self._cached_observations[cache_key] = obs_list
        return obs_list

    def get_comparison(
        self, region_id: str, parameter: str, depth: float, time_str: str
    ) -> ComparisonSummary:
        """Compute statistical model vs observation comparisons and RMSE."""
        param_info = PARAMETERS.get(parameter, PARAMETERS["sst"])
        observations = self.get_observations(region_id, parameter, depth, time_str)

        if not observations:
            return ComparisonSummary(
                parameter=parameter,
                unit=param_info.unit,
                depth=depth,
                time=time_str,
                region=region_id,
                matched_points_count=0,
                mean_model=0.0,
                mean_observed=0.0,
                mean_difference=0.0,
                min_difference=0.0,
                max_difference=0.0,
                rmse=0.0,
                observations=[]
            )

        model_vals = [obs.model_value for obs in observations]
        obs_vals = [obs.observed_value for obs in observations]
        diffs = [obs.difference for obs in observations]

        mean_model = round(float(np.mean(model_vals)), 3)
        mean_obs = round(float(np.mean(obs_vals)), 3)
        mean_diff = round(float(np.mean(diffs)), 3)
        min_diff = round(float(np.min(diffs)), 3)
        max_diff = round(float(np.max(diffs)), 3)
        # RMSE: sqrt(mean((observed - model)^2))
        rmse = round(float(np.sqrt(np.mean(np.square(diffs)))), 3)

        return ComparisonSummary(
            parameter=parameter,
            unit=param_info.unit,
            depth=depth,
            time=time_str,
            region=region_id,
            matched_points_count=len(observations),
            mean_model=mean_model,
            mean_observed=mean_obs,
            mean_difference=mean_diff,
            min_difference=min_diff,
            max_difference=max_diff,
            rmse=rmse,
            observations=observations
        )

    def get_anomalies(
        self, region_id: str, parameter: str, depth: float, time_str: str
    ) -> List[AnomalyItem]:
        """Return list of detected anomalies classified as MODERATE or SIGNIFICANT."""
        observations = self.get_observations(region_id, parameter, depth, time_str)
        param_info = PARAMETERS.get(parameter, PARAMETERS["sst"])

        anomalies: List[AnomalyItem] = []
        for obs in observations:
            if obs.anomaly_severity in ("MODERATE DEVIATION", "SIGNIFICANT ANOMALY"):
                anomalies.append(AnomalyItem(
                    id=obs.id,
                    platform_name=obs.platform_name,
                    lat=obs.lat,
                    lon=obs.lon,
                    depth=obs.depth,
                    time=obs.time,
                    parameter=parameter,
                    unit=param_info.unit,
                    model_value=obs.model_value,
                    observed_value=obs.observed_value,
                    difference=obs.difference,
                    z_score=obs.z_score,
                    severity=obs.anomaly_severity,
                    reason=obs.anomaly_reason,
                    decision_support_advisory=obs.decision_support
                ))

        # Sort by absolute z-score descending
        anomalies.sort(key=lambda x: abs(x.z_score), reverse=True)
        return anomalies

    def get_statistics(
        self, region_id: str, parameter: str, depth: float, time_str: str
    ) -> StatisticsSummary:
        """Compute full statistical summary across both model grid and observation network."""
        grid_data = self.get_grid_data(region_id, parameter, depth, time_str)
        observations = self.get_observations(region_id, parameter, depth, time_str)
        param_info = PARAMETERS.get(parameter, PARAMETERS["sst"])

        grid_vals = [p.parameter_value for p in grid_data] if grid_data else [0.0]
        obs_vals = [o.observed_value for o in observations] if observations else [0.0]
        diffs = [o.difference for o in observations] if observations else [0.0]

        model_mean = round(float(np.mean(grid_vals)), 3)
        model_min = round(float(np.min(grid_vals)), 3)
        model_max = round(float(np.max(grid_vals)), 3)
        model_std = round(float(np.std(grid_vals)), 3)

        obs_mean = round(float(np.mean(obs_vals)), 3)
        obs_min = round(float(np.min(obs_vals)), 3)
        obs_max = round(float(np.max(obs_vals)), 3)

        mean_diff = round(float(np.mean(diffs)), 3)
        min_diff = round(float(np.min(diffs)), 3)
        max_diff = round(float(np.max(diffs)), 3)
        rmse = round(float(np.sqrt(np.mean(np.square(diffs)))), 3)

        normal_cnt = sum(1 for o in observations if o.anomaly_severity == "NORMAL")
        mod_cnt = sum(1 for o in observations if o.anomaly_severity == "MODERATE DEVIATION")
        anom_cnt = sum(1 for o in observations if o.anomaly_severity == "SIGNIFICANT ANOMALY")

        return StatisticsSummary(
            parameter=parameter,
            unit=param_info.unit,
            depth=depth,
            time=time_str,
            region=region_id,
            model_mean=model_mean,
            model_min=model_min,
            model_max=model_max,
            model_std=model_std,
            observed_mean=obs_mean,
            observed_min=obs_min,
            observed_max=obs_max,
            mean_difference=mean_diff,
            min_difference=min_diff,
            max_difference=max_diff,
            rmse=rmse,
            normal_count=normal_cnt,
            moderate_count=mod_cnt,
            anomaly_count=anom_cnt
        )

# Global engine singleton
engine = OceanDataEngine()
