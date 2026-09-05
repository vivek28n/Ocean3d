from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ParameterInfo(BaseModel):
    id: str
    name: str
    unit: str
    description: str
    min_val: float
    max_val: float
    color_map: str
    data_status: str = "LIVE"  # LIVE, DERIVED, SIMULATED, FALLBACK, UNAVAILABLE


class RegionInfo(BaseModel):
    id: str
    name: str
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    center_lat: float
    center_lon: float
    default_zoom: float
    description: str


class OceanGridPoint(BaseModel):
    id: str
    lat: float
    lon: float
    depth: float
    time: str
    temperature: float
    salinity: float
    ssh: float
    current_u: float
    current_v: float
    current_magnitude: float = 0.0
    parameter_value: float
    wind_speed: Optional[float] = None
    surface_pressure: Optional[float] = None
    data_status: str = "LIVE"
    source_attribution: str = "Operational Model Grid"


class ObservationPoint(BaseModel):
    id: str
    platform_name: str
    platform_type: str  # Argo Profiling Float, RAMA Moored Buoy, Coastal Tide Gauge, BGC-Argo
    lat: float
    lon: float
    depth: float
    time: str
    parameter: str = "sst"  # sst, salinity, ssh, current_velocity, oxygen, chlorophyll, wind_speed, surface_pressure
    temperature: float
    salinity: float
    ssh: float
    current_magnitude: float
    oxygen: Optional[float] = None
    chlorophyll: Optional[float] = None
    wind_speed: Optional[float] = None
    surface_pressure: Optional[float] = None
    model_value: float
    observed_value: Optional[float] = None
    difference: Optional[float] = None
    z_score: Optional[float] = None
    anomaly_severity: str = "NORMAL"  # NORMAL, MODERATE DEVIATION, SIGNIFICANT ANOMALY, UNAVAILABLE
    anomaly_reason: str
    decision_support: str
    data_status: str = "SIMULATED"  # LIVE, DERIVED, SIMULATED, FALLBACK, UNAVAILABLE
    source_attribution: str = "NOAA In-Situ Observation Array"
    is_observed_available: bool = True


class ComparisonSummary(BaseModel):
    parameter: str
    unit: str
    depth: float
    time: str
    region: str
    matched_points_count: int
    mean_model: float
    mean_observed: Optional[float] = None
    mean_difference: Optional[float] = None
    min_difference: Optional[float] = None
    max_difference: Optional[float] = None
    rmse: Optional[float] = None
    observations: List[ObservationPoint]
    data_status: str = "LIVE"


class AnomalyItem(BaseModel):
    id: str
    platform_name: str
    lat: float
    lon: float
    depth: float
    time: str
    parameter: str
    unit: str
    model_value: float
    observed_value: Optional[float] = None
    difference: Optional[float] = None
    z_score: Optional[float] = None
    severity: str
    reason: str
    decision_support_advisory: str
    data_status: str = "LIVE"


class StatisticsSummary(BaseModel):
    parameter: str
    unit: str
    depth: float
    time: str
    region: str
    model_mean: float
    model_min: float
    model_max: float
    model_std: float
    observed_mean: Optional[float] = None
    observed_min: Optional[float] = None
    observed_max: Optional[float] = None
    mean_difference: Optional[float] = None
    min_difference: Optional[float] = None
    max_difference: Optional[float] = None
    rmse: Optional[float] = None
    normal_count: int
    moderate_count: int
    anomaly_count: int
    data_status: str = "LIVE"


class ResearchVehicleInfo(BaseModel):
    id: str
    name: str
    callsign: str
    vehicle_type: str  # Deep Ocean Scientific Research Glider / Autonomous Underwater Vehicle (AUV)
    operator: str      # e.g., INCOIS - NIOT (National Institute of Ocean Technology)
    lat: float
    lon: float
    depth: float
    max_depth_rating: float
    heading: float
    speed_knots: float
    mission: str
    battery_percent: float
    sensor_payload: List[str]
    current_readings: Dict[str, float]
    waypoints: List[Dict[str, float]]
    data_status: str = "SIMULATED"
    scientific_disclaimer: str = "Demonstration simulation. Trajectory based on planned NIOT/INCOIS oceanographic waypoints."
