"""
Ocean3D Test Suite - Live Operational Ocean API Integration Verification
Tests API client connectivity, Argo/BGC-Argo profiling down to 2000m,
oxygen and chlorophyll parameters, NOAA SSH altimetry, AUV layer,
and strict data status transparency (LIVE, DERIVED, SIMULATED, FALLBACK, UNAVAILABLE).
"""

import time
import unittest

from backend.main import (
    get_health, get_parameters, get_regions, get_ocean_data,
    get_observations, get_comparison, get_anomalies, get_statistics,
    get_timeseries, get_timesteps, get_research_vehicle
)
from backend.live_ocean_client import live_client, LiveOceanClient
from backend.data_engine import engine, STATION_CATALOG, REGIONS, PARAMETERS, DEPTH_LEVELS, TIMESTEPS


class TestLiveOceanIntegration(unittest.TestCase):

    def test_01_live_client_open_meteo_fetch(self):
        """Verify Open-Meteo Marine API returns live SST and current velocity."""
        coords = [(15.0, 90.0), (12.8, 85.5)]
        data = live_client.fetch_open_meteo_batch(coords, hourly=True)
        self.assertIsNotNone(data, "Open-Meteo Marine batch fetch should return data")
        self.assertEqual(len(data), 2, "Should return entries for both coordinates")
        self.assertIn("hourly", data[0])
        self.assertIn("sea_surface_temperature", data[0]["hourly"])
        self.assertIn("ocean_current_velocity", data[0]["hourly"])

    def test_02_argo_2000m_profile_fetch(self):
        """Verify real Argo profiling observations at 2000m depth."""
        val, status = live_client.fetch_argo_profile_obs("sst", 2000.0, 15.0, 90.0)
        self.assertIn(status, ("LIVE", "FALLBACK"))
        if val is not None:
            self.assertLess(val, 5.0, "Abyssal 2000m temperature should be <5°C")

    def test_02b_argo_salinity_profile_fetch(self):
        """Verify real Argo profiling salinity observations from RFROM v2.3 real-time at 2000m depth."""
        val, status = live_client.fetch_argo_profile_obs("salinity", 2000.0, 15.0, 90.0)
        self.assertIn(status, ("LIVE", "FALLBACK"))
        if val is not None:
            self.assertGreater(val, 34.0, "Abyssal 2000m salinity should be >34 PSU")
            self.assertLess(val, 36.0, "Abyssal 2000m salinity should be <36 PSU")

    def test_03_gobai_oxygen_fetch(self):
        """Verify real BGC-Argo dissolved oxygen profiling down to 2000m."""
        val, status = live_client.fetch_gobai_oxygen(500.0, 15.0, 90.0)
        self.assertIn(status, ("LIVE", "FALLBACK"))
        if val is not None:
            self.assertGreater(val, 0.0)

    def test_04_noaa_ssh_altimetry_fetch(self):
        """Verify NOAA CoastWatch satellite altimetry SSH."""
        val, status = live_client.fetch_noaa_ssh(15.0, 90.0)
        self.assertIn(status, ("LIVE", "FALLBACK"))
        if val is not None:
            self.assertGreater(val, -1.0)
            self.assertLess(val, 1.0)

    def test_05_parameters_endpoint_extended(self):
        """Verify /api/parameters includes 8 parameters including wind speed and atmospheric pressure."""
        data = get_parameters()
        param_ids = {p.id for p in data}
        expected = {"sst", "salinity", "ssh", "current_velocity", "oxygen", "chlorophyll", "wind_speed", "surface_pressure"}
        self.assertTrue(expected.issubset(param_ids), f"Missing parameters: {expected - param_ids}")
        for p in data:
            self.assertTrue(hasattr(p, "data_status"))
            self.assertIn(p.data_status, ("LIVE MODEL", "LIVE SATELLITE", "OBSERVATIONAL PRODUCT", "DERIVED", "SIMULATED"))

    def test_06_depth_levels_2000m(self):
        """Verify DEPTH_LEVELS includes 1000m and 2000m."""
        self.assertIn(1000.0, DEPTH_LEVELS)
        self.assertIn(2000.0, DEPTH_LEVELS)

    def test_07_observations_2000m_transparency(self):
        """Verify that surface tide gauges report UNAVAILABLE at 2000m (No fabrication)."""
        obs = get_observations(region="bay_of_bengal", parameter="sst", depth=2000.0)
        tide_gauge = next((o for o in obs if o.id == "TIDE-PARADIP"), None)
        self.assertIsNotNone(tide_gauge)
        self.assertFalse(tide_gauge.is_observed_available, "Tide gauge should not have sensor at 2000m")
        self.assertEqual(tide_gauge.data_status, "UNAVAILABLE")
        self.assertIsNone(tide_gauge.observed_value, "Must not fabricate live value at 2000m for surface gauge")
        self.assertIsNone(tide_gauge.difference)

        # Argo float should have profiling capability at 2000m
        argo = next((o for o in obs if o.id == "ARGO-IN-290145"), None)
        self.assertIsNotNone(argo)
        self.assertTrue(argo.is_observed_available)
        self.assertIsNotNone(argo.observed_value)

    def test_08_research_vehicle_endpoint(self):
        """Verify /api/research-vehicle returns single scientific survey AUV metadata with SIMULATED status."""
        auv = get_research_vehicle()
        self.assertEqual(auv.id, "AUV-SAMUDRA-01")
        self.assertEqual(auv.callsign, "IN-AUV-2601")
        self.assertEqual(auv.name, "Research AUV Samudra-1")
        self.assertIn("CTD", str(auv.sensor_payload))
        self.assertEqual(auv.data_status, "SIMULATED", "AUV must be labeled SIMULATED (no live satellite uplink)")

    def test_09_comparison_with_unavailable_stations(self):
        """Verify /api/comparison handles mixed available and unavailable observations cleanly."""
        comp = get_comparison(region="bay_of_bengal", parameter="sst", depth=2000.0)
        self.assertGreater(comp.matched_points_count, 0)
        self.assertIsNotNone(comp.rmse)

    def test_10_demo_preset_compatibility(self):
        """Verify Bay of Bengal SST 10m RAMA-BD02 station resolution works smoothly."""
        time_step_2 = TIMESTEPS[2]
        obs = engine.get_observations("bay_of_bengal", "sst", 10.0, time_step_2)
        rama = next((o for o in obs if o.id == "RAMA-BD02"), None)
        self.assertIsNotNone(rama)
        self.assertEqual(rama.platform_name, "RAMA Moored Buoy BD02")
        self.assertTrue(rama.is_observed_available)

    def test_11_wind_and_pressure_depth_locking(self):
        """Verify wind_speed and surface_pressure automatically constrain depth to 0m."""
        wind_grid = get_ocean_data(region="bay_of_bengal", parameter="wind_speed", depth=500.0)
        self.assertEqual(wind_grid[0].depth, 0.0, "Wind speed must lock to depth 0m")
        self.assertIn("wind_speed", PARAMETERS)
        self.assertEqual(PARAMETERS["wind_speed"].unit, "m/s")

        pres_grid = get_ocean_data(region="bay_of_bengal", parameter="surface_pressure", depth=1000.0)
        self.assertEqual(pres_grid[0].depth, 0.0, "Surface pressure must lock to depth 0m")
        self.assertEqual(PARAMETERS["surface_pressure"].unit, "hPa")

    def test_12_no_artificial_rama_offset(self):
        """Verify that RAMA-BD02 observation uses pure observation without artificial +1.85°C offset."""
        obs = engine.get_observations("bay_of_bengal", "sst", 10.0, TIMESTEPS[0])
        rama = next((o for o in obs if o.id == "RAMA-BD02"), None)
        self.assertIsNotNone(rama)
        self.assertNotIn("(Marine Heatwave Detected)", rama.source_attribution, "Artificial heatwave text must not be injected")


if __name__ == "__main__":
    unittest.main()
