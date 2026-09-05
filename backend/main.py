"""
Ocean3D REST API Backend - FastAPI Application
Provides interactive endpoints for ocean digital twin parameters, bathymetry,
dense numerical model grids, sparse in-situ observations, real-time difference calculation,
deterministic z-score anomaly detection, and decision support advisories.
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any

from backend.models import (
    ParameterInfo, RegionInfo, OceanGridPoint, ObservationPoint,
    ComparisonSummary, AnomalyItem, StatisticsSummary, ResearchVehicleInfo
)
from backend.data_engine import (
    engine, PARAMETERS, REGIONS, DEPTH_LEVELS, TIMESTEPS
)
from backend.live_ocean_client import live_client

app = FastAPI(
    title="Ocean3D API — Interactive Ocean Digital Twin",
    description="Smart India Hackathon 2026 (SIH26067) - Disaster Management & Ocean Digital Twin Prototype",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def get_health() -> Dict[str, Any]:
    """Health check endpoint to verify backend operational readiness and live API status."""
    return {
        "status": "operational",
        "service": "Ocean3D Backend",
        "version": "1.0.0",
        "sih_problem_id": "SIH26067",
        "theme": "Disaster Management",
        "engine": "Operational Ocean Digital Twin Engine (Open-Meteo Marine & NOAA Altimetry Integrated)",
        "live_api_status": live_client.last_api_status,
        "available_timesteps_count": len(TIMESTEPS),
        "available_depth_levels": DEPTH_LEVELS
    }


@app.get("/api/parameters", response_model=List[ParameterInfo])
def get_parameters() -> List[ParameterInfo]:
    """Retrieve metadata of all supported physical oceanographic parameters."""
    return list(PARAMETERS.values())


@app.get("/api/regions", response_model=List[RegionInfo])
def get_regions() -> List[RegionInfo]:
    """Retrieve supported ocean geographical bounds and view centers."""
    return list(REGIONS.values())


@app.get("/api/ocean-data", response_model=List[OceanGridPoint])
def get_ocean_data(
    region: str = Query(default="bay_of_bengal", description="Geographic region identifier"),
    parameter: str = Query(default="sst", description="Physical parameter (sst, salinity, ssh, current_velocity)"),
    depth: float = Query(default=0.0, description="Ocean depth level in meters (0, 10, 50, 100, 500)"),
    time: Optional[str] = Query(default=None, description="ISO timestamp (defaults to first timestep if omitted)")
) -> List[OceanGridPoint]:
    """
    Retrieve dense numerical model grid points for 3D visualization.
    Calculates parameter values based on physics, depth stratification, and mesoscale dynamics.
    """
    if region not in REGIONS:
        region = "bay_of_bengal"
    if parameter not in PARAMETERS:
        parameter = "sst"
    if parameter in ("ssh", "chlorophyll", "wind_speed", "surface_pressure"):
        depth = 0.0  # Surface/atmospheric parameter
    elif depth not in DEPTH_LEVELS:
        depth = 0.0
    if not time or time not in TIMESTEPS:
        time = TIMESTEPS[0]

    return engine.get_grid_data(region, parameter, depth, time)


@app.get("/api/observations", response_model=List[ObservationPoint])
def get_observations(
    region: str = Query(default="bay_of_bengal", description="Geographic region identifier"),
    parameter: str = Query(default="sst", description="Physical parameter (sst, salinity, ssh, current_velocity)"),
    depth: float = Query(default=0.0, description="Ocean depth level in meters (0, 10, 50, 100, 500)"),
    time: Optional[str] = Query(default=None, description="ISO timestamp (defaults to first timestep if omitted)")
) -> List[ObservationPoint]:
    """
    Retrieve in-situ observations (RAMA moored buoys, Argo floats, tide gauges)
    complete with difference = observed - model, deterministic z-score, and severity classification.
    """
    if region not in REGIONS:
        region = "bay_of_bengal"
    if parameter not in PARAMETERS:
        parameter = "sst"
    if parameter in ("ssh", "chlorophyll", "wind_speed", "surface_pressure"):
        depth = 0.0  # Surface/atmospheric parameter
    elif depth not in DEPTH_LEVELS:
        depth = 0.0
    if not time or time not in TIMESTEPS:
        time = TIMESTEPS[0]

    return engine.get_observations(region, parameter, depth, time)


@app.get("/api/comparison", response_model=ComparisonSummary)
def get_comparison(
    region: str = Query(default="bay_of_bengal", description="Geographic region identifier"),
    parameter: str = Query(default="sst", description="Physical parameter (sst, salinity, ssh, current_velocity)"),
    depth: float = Query(default=0.0, description="Ocean depth level in meters"),
    time: Optional[str] = Query(default=None, description="ISO timestamp")
) -> ComparisonSummary:
    """
    Core Model vs Observation comparison endpoint.
    Calculates difference, mean model, mean observed, mean difference, min/max deviation, and RMSE.
    """
    if region not in REGIONS:
        region = "bay_of_bengal"
    if parameter not in PARAMETERS:
        parameter = "sst"
    if parameter in ("ssh", "chlorophyll", "wind_speed", "surface_pressure"):
        depth = 0.0  # Surface/atmospheric parameter
    elif depth not in DEPTH_LEVELS:
        depth = 0.0
    if not time or time not in TIMESTEPS:
        time = TIMESTEPS[0]

    return engine.get_comparison(region, parameter, depth, time)


@app.get("/api/anomalies", response_model=List[AnomalyItem])
def get_anomalies(
    region: str = Query(default="bay_of_bengal", description="Geographic region identifier"),
    parameter: str = Query(default="sst", description="Physical parameter"),
    depth: float = Query(default=0.0, description="Depth level in meters"),
    time: Optional[str] = Query(default=None, description="ISO timestamp")
) -> List[AnomalyItem]:
    """
    Retrieve flagged MODERATE DEVIATION and SIGNIFICANT ANOMALY items
    along with actionable disaster management decision support insights.
    """
    if region not in REGIONS:
        region = "bay_of_bengal"
    if parameter not in PARAMETERS:
        parameter = "sst"
    if parameter in ("ssh", "chlorophyll", "wind_speed", "surface_pressure"):
        depth = 0.0  # Surface/atmospheric parameter
    elif depth not in DEPTH_LEVELS:
        depth = 0.0
    if not time or time not in TIMESTEPS:
        time = TIMESTEPS[0]

    return engine.get_anomalies(region, parameter, depth, time)


@app.get("/api/statistics", response_model=StatisticsSummary)
def get_statistics(
    region: str = Query(default="bay_of_bengal", description="Geographic region identifier"),
    parameter: str = Query(default="sst", description="Physical parameter"),
    depth: float = Query(default=0.0, description="Ocean depth level in meters"),
    time: Optional[str] = Query(default=None, description="ISO timestamp")
) -> StatisticsSummary:
    """Compute comprehensive statistical metrics across numerical model and in-situ observations."""
    if region not in REGIONS:
        region = "bay_of_bengal"
    if parameter not in PARAMETERS:
        parameter = "sst"
    if parameter in ("ssh", "chlorophyll", "wind_speed", "surface_pressure"):
        depth = 0.0  # Surface/atmospheric parameter
    elif depth not in DEPTH_LEVELS:
        depth = 0.0
    if not time or time not in TIMESTEPS:
        time = TIMESTEPS[0]

    return engine.get_statistics(region, parameter, depth, time)


@app.get("/api/timeseries")
def get_timeseries(
    region: str = Query(default="bay_of_bengal"),
    parameter: str = Query(default="sst"),
    depth: float = Query(default=0.0),
    station_id: Optional[str] = Query(default=None)
) -> Dict[str, Any]:
    """
    Compute time-series evolution across all 10 timesteps for the selected station
    or regional average. Directly feeds the Model vs Observation & Difference charts.
    """
    if region not in REGIONS:
        region = "bay_of_bengal"
    if parameter not in PARAMETERS:
        parameter = "sst"
    if parameter in ("ssh", "chlorophyll", "wind_speed", "surface_pressure"):
        depth = 0.0

    series_data = []
    for t_str in TIMESTEPS:
        observations = engine.get_observations(region, parameter, depth, t_str)
        target_obs = None
        if station_id:
            for obs in observations:
                if obs.id == station_id:
                    target_obs = obs
                    break

        if target_obs:
            series_data.append({
                "time": t_str,
                "label": t_str.split("T")[1][:5],
                "model_value": target_obs.model_value,
                "observed_value": target_obs.observed_value,
                "difference": target_obs.difference,
                "z_score": target_obs.z_score,
                "severity": target_obs.anomaly_severity
            })
        else:
            # Fallback to regional comparison average
            comp = engine.get_comparison(region, parameter, depth, t_str)
            series_data.append({
                "time": t_str,
                "label": t_str.split("T")[1][:5],
                "model_value": comp.mean_model,
                "observed_value": comp.mean_observed,
                "difference": comp.mean_difference,
                "rmse": comp.rmse
            })

    return {
        "parameter": parameter,
        "depth": depth,
        "station_id": station_id,
        "timesteps": TIMESTEPS,
        "data": series_data
    }


@app.get("/api/timesteps")
def get_timesteps() -> List[str]:
    """Retrieve all available simulation timesteps."""
    return TIMESTEPS


@app.get("/api/research-vehicle", response_model=ResearchVehicleInfo)
def get_research_vehicle() -> ResearchVehicleInfo:
    """Retrieve telemetry, mission status, and payload for the scientific survey AUV."""
    return engine.get_research_vehicle()

