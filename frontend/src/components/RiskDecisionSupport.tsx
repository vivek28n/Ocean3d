import React from 'react';
import { AnomalyItem, ParameterInfo, RegionInfo } from '../types';
import { ShieldAlert, AlertTriangle, Info, CheckCircle, Flame, Waves, Wind } from 'lucide-react';

interface RiskDecisionSupportProps {
  anomalies: AnomalyItem[];
  currentParameter: ParameterInfo;
  currentRegion: RegionInfo;
  currentDepth: number;
  onSelectAnomalyStation?: (stationId: string) => void;
}

export const RiskDecisionSupport: React.FC<RiskDecisionSupportProps> = ({
  anomalies,
  currentParameter,
  currentRegion,
  currentDepth,
  onSelectAnomalyStation
}) => {
  const significantCount = anomalies.filter(a => a.severity === 'SIGNIFICANT ANOMALY').length;
  const moderateCount = anomalies.filter(a => a.severity === 'MODERATE DEVIATION').length;

  // Synthesize domain decision support insight
  const getSyntheticAdvisory = () => {
    if (significantCount > 0) {
      if (currentParameter.id === 'sst') {
        return {
          title: "Thermal Energy Anomaly Advisory (Upper Ocean Heat Content Assessment)",
          level: "MONITORING ADVISORY",
          color: "border-rose-500/50 bg-rose-950/40 text-rose-200",
          icon: <Flame className="w-5 h-5 text-rose-400 shrink-0" />,
          summary: `Elevated sea surface temperature anomaly detected in ${currentRegion.name} (${significantCount} stations with |Z| ≥ 2.5). This condition indicates abnormal upper ocean heat content that may be relevant to assessment of extreme marine and convective weather conditions. Enhanced marine and atmospheric monitoring recommended.`
        };
      } else if (currentParameter.id === 'ssh') {
        return {
          title: "Sea Surface Height Anomaly Advisory (Coastal Monitoring Indicator)",
          level: "COASTAL MONITORING",
          color: "border-amber-500/50 bg-amber-950/40 text-amber-200",
          icon: <Waves className="w-5 h-5 text-amber-400 shrink-0" />,
          summary: `Significant positive sea surface height deviation detected. Dynamic topography elevation exceeds baseline thresholds. This region may require closer coastal monitoring, tide gauge cross-verification, and heightened observation along vulnerable coastal sectors.`
        };
      } else if (currentParameter.id === 'current_velocity') {
        return {
          title: "Ocean Current Velocity Advisory (Maritime Monitoring)",
          level: "NAVIGATION ADVISORY",
          color: "border-purple-500/50 bg-purple-950/40 text-purple-200",
          icon: <Wind className="w-5 h-5 text-purple-400 shrink-0" />,
          summary: `Unusual ocean current acceleration and shear detected surpassing seasonal numerical model guidance. Increased marine monitoring may be warranted for offshore platforms, navigation corridors, and artisanal craft.`
        };
      } else {
        return {
          title: "Halocline & Barrier Layer Salinity Advisory (Stratification Assessment)",
          level: "STRATIFICATION ADVISORY",
          color: "border-cyan-500/50 bg-cyan-950/40 text-cyan-200",
          icon: <Waves className="w-5 h-5 text-cyan-400 shrink-0" />,
          summary: `Substantial negative salinity deviation detected in upper ${currentDepth}m. Freshwater runoff creates a stable barrier layer that can inhibit vertical ocean mixing and preserve upper ocean thermal stratification. Continued monitoring recommended.`
        };
      }
    } else if (moderateCount > 0) {
      return {
        title: "Moderate Numerical Model vs In-Situ Observation Deviation",
        level: "ADVISORY TRACKING",
        color: "border-sky-500/40 bg-sky-950/30 text-sky-200",
        icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
        summary: `Moderate localized divergence between numerical model predictions and in-situ buoy telemetry. Telemetry deviation is within 1.5 to 2.5 standard deviations. Routine observation assimilation and sensor cross-calibration advised.`
      };
    } else {
      return {
        title: "Ocean Basin Stability Baseline Confirmed",
        level: "NOMINAL",
        color: "border-emerald-500/30 bg-emerald-950/20 text-emerald-200",
        icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
        summary: `All active in-situ observation platforms in ${currentRegion.name} are operating within normal baseline tolerance (|Z| < 1.5). Numerical model guidance and observational telemetry show high consistency.`
      };
    }
  };

  const advisory = getSyntheticAdvisory();

  return (
    <div className={`p-3 rounded-xl border ${advisory.color} backdrop-blur-md transition-all shadow-lg`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">{advisory.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-white">
                Risk & Decision Support
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-black/40 border border-white/20">
                {advisory.level}
              </span>
            </div>
            <div className="text-xs font-semibold text-white/90 mt-0.5">
              {advisory.title}
            </div>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed max-w-4xl font-sans">
              {advisory.summary}
            </p>
          </div>
        </div>

        {/* Anomaly Counts Badge */}
        <div className="flex items-center gap-2 shrink-0 self-center font-mono text-[11px]">
          <div className="px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300">
            <span className="font-bold">{significantCount}</span> Significant
          </div>
          <div className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <span className="font-bold">{moderateCount}</span> Moderate
          </div>
        </div>
      </div>

      {/* Individual flagged stations shortcut if any */}
      {anomalies.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-300 uppercase font-semibold">Flagged Stations:</span>
          {anomalies.slice(0, 4).map((a) => (
            <button
              key={a.id}
              onClick={() => onSelectAnomalyStation?.(a.id)}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 border border-sky-400/30 text-cyan-300 hover:border-cyan-400 transition-all flex items-center gap-1"
            >
              <span>{a.platform_name}</span>
              <span className={a.severity === 'SIGNIFICANT ANOMALY' ? 'text-rose-400' : 'text-amber-400'}>
                (Z={a.z_score.toFixed(1)})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
