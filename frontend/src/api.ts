import {
  ParameterInfo, RegionInfo, OceanGridPoint, ObservationPoint,
  ComparisonSummary, AnomalyItem, StatisticsSummary, TimeSeriesPoint
} from './types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (err) {
    console.warn('Backend healthcheck fallback:', err);
    return { status: 'fallback_ready' };
  }
}

export async function fetchParameters(): Promise<ParameterInfo[]> {
  try {
    const res = await fetch(`${API_BASE}/parameters`);
    if (!res.ok) throw new Error('Failed to fetch parameters');
    return await res.json();
  } catch {
    return [
      { id: 'sst', name: 'Sea Surface Temperature', unit: '°C', description: 'Thermal structure of upper ocean', min_val: 10, max_val: 34, color_map: 'turbo' },
      { id: 'salinity', name: 'Salinity', unit: 'PSU', description: 'Salinity concentration and freshwater plumes', min_val: 28, max_val: 38, color_map: 'viridis' },
      { id: 'ssh', name: 'Sea Surface Height', unit: 'm', description: 'Dynamic sea level anomaly and eddies', min_val: -0.4, max_val: 0.6, color_map: 'coolwarm' },
      { id: 'current_velocity', name: 'Current Velocity', unit: 'm/s', description: 'Horizontal ocean current speed', min_val: 0, max_val: 2.2, color_map: 'plasma' },
    ];
  }
}

export async function fetchRegions(): Promise<RegionInfo[]> {
  try {
    const res = await fetch(`${API_BASE}/regions`);
    if (!res.ok) throw new Error('Failed to fetch regions');
    return await res.json();
  } catch {
    return [
      { id: 'bay_of_bengal', name: 'Bay of Bengal (SIH Priority)', lat_min: 5, lat_max: 22.5, lon_min: 80, lon_max: 98, center_lat: 14.5, center_lon: 88.5, default_zoom: 4.5, description: 'Primary SIH Disaster Management focus area.' },
      { id: 'arabian_sea', name: 'Arabian Sea', lat_min: 8, lat_max: 26, lon_min: 55, lon_max: 77, center_lat: 17, center_lon: 66, default_zoom: 4.2, description: 'High salinity basin and upwelling zones.' },
      { id: 'indian_ocean', name: 'North Indian Ocean Basin', lat_min: -5, lat_max: 25, lon_min: 50, lon_max: 102, center_lat: 10, center_lon: 76, default_zoom: 3, description: 'Comprehensive ocean basin view.' },
      { id: 'global', name: 'Global Overview', lat_min: -40, lat_max: 45, lon_min: 30, lon_max: 125, center_lat: 5, center_lon: 80, default_zoom: 2.2, description: 'Macro digital twin perspective.' },
    ];
  }
}

export async function fetchOceanData(
  region: string, parameter: string, depth: number, time: string
): Promise<OceanGridPoint[]> {
  const query = new URLSearchParams({
    region,
    parameter,
    depth: depth.toString(),
    time
  });
  const res = await fetch(`${API_BASE}/ocean-data?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch ocean grid data');
  return await res.json();
}

export async function fetchObservations(
  region: string, parameter: string, depth: number, time: string
): Promise<ObservationPoint[]> {
  const query = new URLSearchParams({
    region,
    parameter,
    depth: depth.toString(),
    time
  });
  const res = await fetch(`${API_BASE}/observations?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch observations');
  return await res.json();
}

export async function fetchComparison(
  region: string, parameter: string, depth: number, time: string
): Promise<ComparisonSummary> {
  const query = new URLSearchParams({
    region,
    parameter,
    depth: depth.toString(),
    time
  });
  const res = await fetch(`${API_BASE}/comparison?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch comparison');
  return await res.json();
}

export async function fetchAnomalies(
  region: string, parameter: string, depth: number, time: string
): Promise<AnomalyItem[]> {
  const query = new URLSearchParams({
    region,
    parameter,
    depth: depth.toString(),
    time
  });
  const res = await fetch(`${API_BASE}/anomalies?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch anomalies');
  return await res.json();
}

export async function fetchStatistics(
  region: string, parameter: string, depth: number, time: string
): Promise<StatisticsSummary> {
  const query = new URLSearchParams({
    region,
    parameter,
    depth: depth.toString(),
    time
  });
  const res = await fetch(`${API_BASE}/statistics?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return await res.json();
}

export async function fetchTimeseries(
  region: string, parameter: string, depth: number, stationId?: string
): Promise<TimeSeriesPoint[]> {
  const query = new URLSearchParams({
    region,
    parameter,
    depth: depth.toString()
  });
  if (stationId) query.append('station_id', stationId);

  const res = await fetch(`${API_BASE}/timeseries?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch timeseries');
  const data = await res.json();
  return data.data;
}

export async function fetchTimesteps(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/timesteps`);
    if (!res.ok) throw new Error('Failed to fetch timesteps');
    return await res.json();
  } catch {
    return [
      "2026-09-01T00:00:00Z", "2026-09-01T06:00:00Z", "2026-09-01T12:00:00Z", "2026-09-01T18:00:00Z",
      "2026-09-02T00:00:00Z", "2026-09-02T06:00:00Z", "2026-09-02T12:00:00Z", "2026-09-02T18:00:00Z",
      "2026-09-03T00:00:00Z", "2026-09-03T06:00:00Z"
    ];
  }
}
