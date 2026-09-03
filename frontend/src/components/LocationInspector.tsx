import React from 'react';
import { ObservationPoint, ParameterInfo } from '../types';
import {
  MapPin, AlertOctagon, CheckCircle2, AlertTriangle,
  Compass, Gauge, Activity, ShieldAlert, X
} from 'lucide-react';

interface LocationInspectorProps {
  selectedObservation: ObservationPoint | null;
  onClearSelection: () => void;
  currentParameter: ParameterInfo;
  currentDepth: number;
  allObservations: ObservationPoint[];
  onSelectStation: (obs: ObservationPoint) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LocationInspector: React.FC<LocationInspectorProps> = ({
  selectedObservation,
  onClearSelection,
  currentParameter,
  currentDepth,
  allObservations,
  onSelectStation,
  isCollapsed = false,
  onToggleCollapse
}) => {
  if (isCollapsed) {
    return (
      <aside className="w-11 h-full flex flex-col items-center py-3 glass-panel border-l border-sky-500/20 text-slate-200 z-20 shrink-0 select-none">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white border border-sky-500/20 transition-all cursor-pointer"
          title="Expand Location Inspector"
          aria-label="Expand Location Inspector"
        >
          <Compass className="w-4 h-4" />
        </button>
        <div className="mt-8 flex flex-col items-center gap-4 text-[10px] font-mono tracking-widest text-slate-400 [writing-mode:vertical-lr]">
          <span className="text-cyan-400 font-semibold uppercase">Inspector</span>
          {selectedObservation && (
            <span className="text-slate-300 truncate max-h-24">{selectedObservation.id}</span>
          )}
          <span className="text-slate-500">{allObservations.length} Obs</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full flex flex-col gap-2.5 p-3 overflow-y-auto glass-panel border-l border-sky-500/20 text-slate-200 text-xs shrink-0 select-none transition-all">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
        <div className="flex items-center gap-1.5">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
              title="Collapse Location Inspector"
              aria-label="Collapse Location Inspector"
            >
              <span className="text-slate-400 text-xs font-mono">▶</span>
            </button>
          )}
          <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" /> Location Inspector
          </span>
        </div>
        {selectedObservation && (
          <button
            onClick={onClearSelection}
            className="px-2 py-0.5 rounded bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-mono transition-colors flex items-center gap-1 border border-slate-700/60"
            title="Deselect Station"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {selectedObservation ? (
        <div className="space-y-2.5">
          {/* Station Metadata Identity Card */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-sky-500/20">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-white font-semibold text-sm leading-tight truncate">
                  {selectedObservation.platform_name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                  <span className="text-cyan-400 font-medium">Type: {selectedObservation.platform_type}</span>
                </div>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700/80 text-cyan-300 shrink-0 font-medium">
                {selectedObservation.id}
              </span>
            </div>

            {/* Coordinates & Sampling Depth Grid */}
            <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-800 text-[11px] font-mono">
              <div className="bg-slate-950/70 px-2 py-1.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Latitude</span>
                <span className="text-slate-100 font-semibold">{selectedObservation.lat.toFixed(2)}° N</span>
              </div>
              <div className="bg-slate-950/70 px-2 py-1.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Longitude</span>
                <span className="text-slate-100 font-semibold">{selectedObservation.lon.toFixed(2)}° E</span>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between px-1">
              <span>Depth Stratum:</span>
              <span className="font-mono text-cyan-300 font-medium">{currentDepth}m (Sensor: {selectedObservation.depth}m)</span>
            </div>
          </div>

          {/* PRIMARY ANALYTICAL SECTION: Model vs Observed Comparison */}
          <div className="bg-slate-900/85 p-3 rounded-xl border border-sky-500/25 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                Analytical Comparison
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {currentParameter.unit}
              </span>
            </div>

            {/* Numerical Grid: Model vs In-Situ */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {/* Numerical Model */}
              <div className="bg-slate-950/80 p-2 rounded-lg border border-sky-500/20">
                <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">Model Value</span>
                <div className="font-mono font-bold text-sm text-cyan-300 mt-0.5">
                  {selectedObservation.model_value.toFixed(2)}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">{currentParameter.unit}</span>
                </div>
              </div>

              {/* In-Situ Observation */}
              <div className="bg-slate-950/80 p-2 rounded-lg border border-emerald-500/20">
                <span className="text-[9.5px] uppercase font-semibold text-slate-400 block">Observed Value</span>
                <div className="font-mono font-bold text-sm text-emerald-400 mt-0.5">
                  {selectedObservation.observed_value.toFixed(2)}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">{currentParameter.unit}</span>
                </div>
              </div>
            </div>

            {/* Calculated Difference Row (Observed - Model) */}
            <div className={`p-2 rounded-lg border ${
              selectedObservation.difference > 0
                ? 'bg-rose-950/25 border-rose-500/30'
                : selectedObservation.difference < 0
                ? 'bg-sky-950/25 border-sky-500/30'
                : 'bg-slate-950/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-medium text-xs block">Difference (Obs - Model):</span>
                  <span className="text-[9.5px] text-slate-400 font-mono">
                    {selectedObservation.difference > 0
                      ? 'Positive Residual (Obs > Model)'
                      : selectedObservation.difference < 0
                      ? 'Negative Residual (Obs < Model)'
                      : 'Zero Residual (Equilibrium)'}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold text-base ${
                    selectedObservation.difference > 0
                      ? 'text-rose-400'
                      : selectedObservation.difference < 0
                      ? 'text-sky-400'
                      : 'text-slate-300'
                  }`}>
                    {selectedObservation.difference > 0 ? '+' : ''}{selectedObservation.difference.toFixed(3)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1">{currentParameter.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Anomaly Detection Assessment & Z-Score */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-sky-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                Anomaly Detection Assessment
              </span>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-white">
                Z = {selectedObservation.z_score.toFixed(2)}
              </span>
            </div>

            {/* Severity Status Badge */}
            {selectedObservation.anomaly_severity === 'NORMAL' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs uppercase tracking-wide">NORMAL</div>
                  <div className="text-[9.5px] text-emerald-400/90 leading-tight">Deviation within |Z| &lt; 1.5 baseline threshold.</div>
                </div>
              </div>
            )}

            {selectedObservation.anomaly_severity === 'MODERATE DEVIATION' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs uppercase tracking-wide">MODERATE DEVIATION</div>
                  <div className="text-[9.5px] text-amber-400/90 leading-tight">Deviation 1.5 ≤ |Z| &lt; 2.5 warrants tracking.</div>
                </div>
              </div>
            )}

            {selectedObservation.anomaly_severity === 'SIGNIFICANT ANOMALY' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 shadow-sm shadow-rose-950/40">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-xs uppercase tracking-wide">SIGNIFICANT ANOMALY</div>
                  <div className="text-[9.5px] text-rose-300 leading-tight">Extreme deviation |Z| ≥ 2.5 (High confidence).</div>
                </div>
              </div>
            )}

            {/* Existing Explanation/Reason */}
            <div className="text-[10px] text-slate-300 leading-relaxed bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block font-semibold text-[9px] uppercase tracking-wider mb-0.5">EXPLANATION</span>
              {selectedObservation.anomaly_reason}
            </div>
          </div>

          {/* Location Decision Support Advisory */}
          <div className="bg-sky-950/30 p-2.5 rounded-xl border border-sky-500/25">
            <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[10.5px] mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Location Decision Support</span>
            </div>
            <p className="text-[10.5px] text-slate-200 leading-relaxed font-sans">
              {selectedObservation.decision_support}
            </p>
          </div>
        </div>
      ) : (
        /* Empty State: Clear prompt + In-Situ Station directory */
        <div className="flex flex-col gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-dashed border-sky-500/25 text-center">
            <MapPin className="w-7 h-7 text-sky-400/60 mx-auto mb-1.5" />
            <div className="font-semibold text-slate-200 text-xs">No Observation Selected</div>
            <p className="text-[10.5px] text-slate-400 mt-0.5 leading-normal">
              Click any 3D buoy beacon or select a station below to inspect telemetry and comparison metrics.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[10px]">
                Available In-Situ Stations
              </span>
              <span className="font-mono text-[9.5px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {allObservations.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {allObservations.map((obs) => {
                const isAnom = obs.anomaly_severity === 'SIGNIFICANT ANOMALY';
                const isMod = obs.anomaly_severity === 'MODERATE DEVIATION';
                return (
                  <button
                    key={obs.id}
                    onClick={() => onSelectStation(obs)}
                    className={`w-full p-2 rounded-lg text-left transition-all border flex items-center justify-between ${
                      isAnom
                        ? 'bg-rose-950/20 border-rose-500/35 hover:bg-rose-900/30'
                        : isMod
                        ? 'bg-amber-950/15 border-amber-500/30 hover:bg-amber-900/25'
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-sky-500/30'
                    }`}
                  >
                    <div className="truncate min-w-0 pr-2">
                      <div className="font-medium text-slate-200 truncate text-xs">{obs.platform_name}</div>
                      <div className="text-[9.5px] font-mono text-slate-400">
                        {obs.lat.toFixed(1)}°N, {obs.lon.toFixed(1)}°E
                      </div>
                    </div>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      isAnom ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : isMod ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {obs.anomaly_severity === 'SIGNIFICANT ANOMALY' ? 'ANOMALY' : obs.anomaly_severity === 'MODERATE DEVIATION' ? 'DEV' : 'NORM'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
