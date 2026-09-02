export interface ParameterInfo {
  id: string;
  name: string;
  unit: string;
  description: string;
  min_val: number;
  max_val: number;
  color_map: string;
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
}

export interface ObservationPoint {
  id: string;
  platform_name: string;
  platform_type: string;
  lat: number;
  lon: number;
  depth: number;
  time: string;
  temperature: number;
  salinity: number;
  ssh: number;
  current_magnitude: number;
  model_value: number;
  observed_value: number;
  difference: number;
  z_score: number;
  anomaly_severity: 'NORMAL' | 'MODERATE DEVIATION' | 'SIGNIFICANT ANOMALY';
  anomaly_reason: string;
  decision_support: string;
}

export interface ComparisonSummary {
  parameter: string;
  unit: string;
  depth: number;
  time: string;
  region: string;
  matched_points_count: number;
  mean_model: number;
  mean_observed: number;
  mean_difference: number;
  min_difference: number;
  max_difference: number;
  rmse: number;
  observations: ObservationPoint[];
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
  observed_value: number;
  difference: number;
  z_score: number;
  severity: 'NORMAL' | 'MODERATE DEVIATION' | 'SIGNIFICANT ANOMALY';
  reason: string;
  decision_support_advisory: string;
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
  observed_mean: number;
  observed_min: number;
  observed_max: number;
  mean_difference: number;
  min_difference: number;
  max_difference: number;
  rmse: number;
  normal_count: number;
  moderate_count: number;
  anomaly_count: number;
}

export interface TimeSeriesPoint {
  time: string;
  label: string;
  model_value: number;
  observed_value: number;
  difference: number;
  z_score?: number;
  severity?: string;
  rmse?: number;
}

export interface ActiveLayers {
  model: boolean;
  observations: boolean;
  difference: boolean;
  anomaly: boolean;
  currentVectors: boolean;
}
