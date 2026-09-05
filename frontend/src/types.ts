export type DataStatus =
  | 'LIVE'
  | 'LIVE MODEL'
  | 'LIVE SATELLITE'
  | 'OBSERVATIONAL PRODUCT'
  | 'DERIVED'
  | 'SIMULATED'
  | 'FALLBACK'
  | 'UNAVAILABLE';

export interface ParameterInfo {
  id: string;
  name: string;
  unit: string;
  description: string;
  min_val: number;
  max_val: number;
  color_map: string;
  data_status?: DataStatus;
}

export interface RegionInfo {
  id: string;
  name: string;
  lat_min: number;
  lat_max: number;
  lon_min: number;
  lon_max: number;
  center_lat: number;
  center_lon: number;
  default_zoom: number;
  description: string;
}

export interface OceanGridPoint {
  id: string;
  lat: number;
  lon: number;
  depth: number;
  time: string;
  temperature: number;
  salinity: number;
  ssh: number;
  current_u: number;
  current_v: number;
  current_magnitude: number;
  parameter_value: number;
  wind_speed?: number;
  surface_pressure?: number;
  data_status?: DataStatus;
  source_attribution?: string;
}

export interface ObservationPoint {
  id: string;
  platform_name: string;
  platform_type: string;
  lat: number;
  lon: number;
  depth: number;
  time: string;
  parameter?: string;
  temperature: number;
  salinity: number;
  ssh: number;
  current_magnitude: number;
  oxygen?: number;
  chlorophyll?: number;
  wind_speed?: number;
  surface_pressure?: number;
  model_value: number;
  observed_value: number | null;
  difference: number | null;
  z_score: number | null;
  anomaly_severity: 'NORMAL' | 'MODERATE DEVIATION' | 'SIGNIFICANT ANOMALY' | 'UNAVAILABLE';
  anomaly_reason: string;
  decision_support: string;
  data_status?: DataStatus;
  source_attribution?: string;
  is_observed_available?: boolean;
}

export interface ComparisonSummary {
  parameter: string;
  unit: string;
  depth: number;
  time: string;
  region: string;
  matched_points_count: number;
  mean_model: number;
  mean_observed: number | null;
  mean_difference: number | null;
  min_difference: number | null;
  max_difference: number | null;
  rmse: number | null;
  observations: ObservationPoint[];
  data_status?: DataStatus;
}

export interface AnomalyItem {
  id: string;
  platform_name: string;
  lat: number;
  lon: number;
  depth: number;
  time: string;
  parameter: string;
  unit: string;
  model_value: number;
  observed_value: number | null;
  difference: number | null;
  z_score: number | null;
  severity: string;
  reason: string;
  decision_support_advisory: string;
  data_status?: DataStatus;
}

export interface StatisticsSummary {
  parameter: string;
  unit: string;
  depth: number;
  time: string;
  region: string;
  model_mean: number;
  model_min: number;
  model_max: number;
  model_std: number;
  observed_mean: number | null;
  observed_min: number | null;
  observed_max: number | null;
  mean_difference: number | null;
  min_difference: number | null;
  max_difference: number | null;
  rmse: number | null;
  normal_count: number;
  moderate_count: number;
  anomaly_count: number;
  data_status?: DataStatus;
}

export interface TimeSeriesPoint {
  time: string;
  label: string;
  model_value: number;
  observed_value: number | null;
  difference: number | null;
  z_score?: number | null;
  severity?: string;
  rmse?: number | null;
}

export interface ActiveLayers {
  model: boolean;
  observations: boolean;
  difference: boolean;
  anomaly: boolean;
  currentVectors: boolean;
  auv: boolean;
}

export interface ResearchVehicle {
  id: string;
  name: string;
  callsign: string;
  vehicle_type: string;
  operator: string;
  lat: number;
  lon: number;
  depth: number;
  max_depth_rating: number;
  heading: number;
  speed_knots: number;
  mission: string;
  battery_percent: number;
  sensor_payload: string[];
  current_readings: Record<string, number>;
  waypoints: Array<{ lat: number; lon: number; depth: number }>;
  data_status: DataStatus;
  scientific_disclaimer: string;
}
