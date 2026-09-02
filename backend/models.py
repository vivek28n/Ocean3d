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
    current_magnitude: float
    parameter_value: float

class ObservationPoint(BaseModel):
    id: str
    platform_name: str
    platform_type: str  # Argo Float, RAMA Moored Buoy, Coastal Tide Gauge
    lat: float
    lon: float
    depth: float
    time: str
    temperature: float
    salinity: float
    ssh: float
    current_magnitude: float
    model_value: float
    observed_value: float
    difference: float
    z_score: float
    anomaly_severity: str  # NORMAL, MODERATE DEVIATION, SIGNIFICANT ANOMALY
    anomaly_reason: str
    decision_support: str

class ComparisonSummary(BaseModel):
    parameter: str
    unit: str
    depth: float
    time: str
    region: str
    matched_points_count: int
    mean_model: float
    mean_observed: float
    mean_difference: float
    min_difference: float
    max_difference: float
    rmse: float
    observations: List[ObservationPoint]

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
    observed_value: float
    difference: float
    z_score: float
    severity: str
    reason: str
    decision_support_advisory: str

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
    observed_mean: float
    observed_min: float
    observed_max: float
    mean_difference: float
    min_difference: float
    max_difference: float
    rmse: float
    normal_count: int
    moderate_count: int
    anomaly_count: int
