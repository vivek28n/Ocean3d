import React, { useState } from 'react';
import { AnomalyItem, ParameterInfo, RegionInfo, ObservationPoint } from '../types';
import { ShieldAlert, Info, CheckCircle, Flame, Waves, Wind, ChevronDown, ChevronUp } from 'lucide-react';

interface RiskDecisionSupportProps {
  anomalies: AnomalyItem[];
  currentParameter: ParameterInfo;
  currentRegion: RegionInfo;
  currentDepth: number;
  selectedObservation?: ObservationPoint | null;
  onSelectAnomalyStation?: (stationId: string) => void;
}

export const RiskDecisionSupport: React.FC<RiskDecisionSupportProps> = ({
  anomalies,
  currentParameter,
  currentRegion,
  currentDepth,
  selectedObservation,
  onSelectAnomalyStation
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const significantCount = anomalies.filter(a => a.severity === 'SIGNIFICANT ANOMALY').length;
  const moderateCount = anomalies.filter(a => a.severity === 'MODERATE DEVIATION').length;

  // Synthesize domain decision support insight
  const getSyntheticAdvisory = () => {
    if (significantCount > 0) {
      if (currentParameter.id === 'sst') {
        return {
          title: "Thermal Energy Anomaly Advisory (Upper Ocean Heat Content Assessment)",
          level: "MONITORING ADVISORY",
          color: "border-rose-500/40 bg-slate-950/85 text-rose-200 shadow-rose-950/40",
          badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          icon: <Flame className="w-4 h-4 text-rose-400 shrink-0" />,
          summary: `Elevated sea surface temperature anomaly detected in ${currentRegion.name} (${significantCount} stations with |Z| ≥ 2.5). This condition indicates abnormal upper ocean heat content that may be relevant to assessment of extreme marine and convective weather conditions. Enhanced marine and atmospheric monitoring recommended.`
        };
      } else if (currentParameter.id === 'ssh') {
        return {
          title: "Sea Surface Height Anomaly Advisory (Coastal Monitoring Indicator)",
          level: "COASTAL MONITORING",
          color: "border-amber-500/40 bg-slate-950/85 text-amber-200 shadow-amber-950/40",
          badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          icon: <Waves className="w-4 h-4 text-amber-400 shrink-0" />,
          summary: `Significant positive sea surface height deviation detected. Dynamic topography elevation exceeds baseline thresholds. This region may require closer coastal monitoring, tide gauge cross-verification, and heightened observation along vulnerable coastal sectors.`
        };
      } else if (currentParameter.id === 'current_velocity') {
        return {
          title: "Ocean Current Velocity Advisory (Maritime Monitoring)",
          level: "NAVIGATION ADVISORY",
          color: "border-purple-500/40 bg-slate-950/85 text-purple-200 shadow-purple-950/40",
          badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
          icon: <Wind className="w-4 h-4 text-purple-400 shrink-0" />,
          summary: `Unusual ocean current acceleration and shear detected surpassing seasonal numerical model guidance. Increased marine monitoring may be warranted for offshore platforms, navigation corridors, and artisanal craft.`
        };
      } else {
        return {
          title: "Halocline & Barrier Layer Salinity Advisory (Stratification Assessment)",
          level: "STRATIFICATION ADVISORY",
          color: "border-cyan-500/40 bg-slate-950/85 text-cyan-200 shadow-cyan-950/40",
          badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
          icon: <Waves className="w-4 h-4 text-cyan-400 shrink-0" />,
          summary: `Substantial negative salinity deviation detected in upper ${currentDepth}m. Freshwater runoff creates a stable barrier layer that can inhibit vertical ocean mixing and preserve upper ocean thermal stratification. Continued monitoring recommended.`
        };
      }
    } else if (moderateCount > 0) {
      return {
        title: "Moderate Numerical Model vs In-Situ Observation Deviation",
        level: "ADVISORY TRACKING",
        color: "border-sky-500/35 bg-slate-950/85 text-sky-200 shadow-sky-950/30",
        badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
        icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
        summary: `Moderate localized divergence between numerical model predictions and in-situ buoy telemetry. Telemetry deviation is within 1.5 to 2.5 standard deviations. Routine observation assimilation and sensor cross-calibration advised.`
      };
    } else {
      return {
        title: "Ocean Basin Stability Baseline Confirmed",
        level: "NOMINAL",
        color: "border-emerald-500/30 bg-slate-950/85 text-emerald-200 shadow-emerald-950/20",
        badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        icon: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
        summary: `All active in-situ observation platforms in ${currentRegion.name} are operating within normal baseline tolerance (|Z| < 1.5). Numerical model guidance and observational telemetry show high consistency.`
      };
    }
  };

  const advisory = getSyntheticAdvisory();

  return (
    <div
      className={`rounded-xl border ${advisory.color} backdrop-blur-md transition-all duration-200 shadow-xl max-w-2xl select-none`}
    >
      {/* Compact Header Bar */}
      <div className="px-3 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">{advisory.icon}</div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-xs tracking-wide text-slate-100 uppercase whitespace-nowrap">
              Risk Decision Support
            </span>
            <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider border shrink-0 ${advisory.badgeColor}`}>
              {advisory.level}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Station/Anomaly status badges */}
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            {significantCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                {significantCount} Sig Anomaly
              </span>
            )}
            {moderateCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                {moderateCount} Dev
              </span>
            )}
            {selectedObservation && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-sky-500/20 text-cyan-300 border border-sky-500/30 font-semibold">
                {selectedObservation.platform_name}
              </span>
            )}
          </div>

          {/* Toggle Compact / Expanded Button */}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title={isExpanded ? "Collapse Advisory Details" : "Expand Advisory Details"}
            aria-label={isExpanded ? "Collapse Advisory Details" : "Expand Advisory Details"}
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 text-xs">
          <div className="text-[11px] font-medium text-slate-200 mt-1">
            {advisory.title}
          </div>
          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed font-sans">
            {advisory.summary}
          </p>

          {/* Flagged Stations Shortcut List */}
          {anomalies.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[9.5px] font-mono text-slate-400 uppercase font-semibold">Flagged:</span>
              {anomalies.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelectAnomalyStation?.(a.id)}
                  className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-slate-900/90 border border-sky-500/30 text-cyan-300 hover:border-cyan-400 transition-colors flex items-center gap-1"
                >
                  <span>{a.platform_name}</span>
                  <span className={a.severity === 'SIGNIFICANT ANOMALY' ? 'text-rose-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    (Z={a.z_score.toFixed(1)})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
