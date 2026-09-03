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
    <aside className="w-80 h-full flex flex-col gap-3 p-3 overflow-y-auto glass-panel border-l border-sky-500/20 text-slate-200 text-xs shrink-0 select-none transition-all">
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
              <X className="w-3.5 h-3.5 hidden" />
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
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            title="Deselect Station"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {selectedObservation ? (
        <div className="space-y-3">
          {/* Station Identity Card */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-sky-500/25">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-white font-semibold text-sm leading-tight">
                  {selectedObservation.platform_name}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                  Type: {selectedObservation.platform_type}
                </div>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                {selectedObservation.id}
              </span>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-mono">
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[9px]">LATITUDE</span>
                <span className="text-slate-200 font-semibold">{selectedObservation.lat.toFixed(2)}° N</span>
              </div>
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-400 block text-[9px]">LONGITUDE</span>
                <span className="text-slate-200 font-semibold">{selectedObservation.lon.toFixed(2)}° E</span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Sampling Depth:</span>
              <span className="font-mono text-cyan-300 font-semibold">{currentDepth}m (Obs: {selectedObservation.depth}m)</span>
            </div>
          </div>

          {/* Model vs Observation Comparison Values */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-sky-500/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Active Parameter</span>
              <span className="font-semibold text-cyan-300">{currentParameter.name}</span>
            </div>

            <div className="space-y-1.5">
              {/* Numerical Model Value */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-sky-500/15">
                <span className="text-slate-400">Model Value:</span>
                <span className="font-mono text-cyan-300 font-bold text-sm">
                  {selectedObservation.model_value.toFixed(2)} {currentParameter.unit}
                </span>
              </div>

              {/* In-Situ Observed Value */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-emerald-500/20">
                <span className="text-slate-400">Observed Value:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {selectedObservation.observed_value.toFixed(2)} {currentParameter.unit}
                </span>
              </div>

              {/* Calculated Difference: difference = observed - model */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-amber-500/25">
                <div>
                  <span className="text-slate-300 block font-medium">Difference:</span>
                  <span className="text-[9px] text-slate-400 font-mono">(Observed - Model)</span>
                </div>
                <span className={`font-mono font-bold text-sm ${
                  selectedObservation.difference > 0 ? 'text-rose-400' : 'text-sky-400'
                }`}>
                  {selectedObservation.difference > 0 ? '+' : ''}{selectedObservation.difference.toFixed(3)} {currentParameter.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Anomaly Detection Status & Z-Score */}
          <div className="bg-slate-900/70 p-3 rounded-xl border border-sky-500/25">
            <span className="text-slate-300 font-semibold uppercase tracking-wider text-[10px] block mb-2">
              Anomaly Detection Assessment
            </span>

            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Statistical Z-Score:</span>
              <span className="font-mono font-bold text-sm px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white">
                Z = {selectedObservation.z_score.toFixed(2)}
              </span>
            </div>

            {/* Severity Badge */}
            <div className="mt-2">
              {selectedObservation.anomaly_severity === 'NORMAL' && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wide">NORMAL</div>
                    <div className="text-[10px] text-emerald-400/90">Deviation within |Z| &lt; 1.5 standard threshold.</div>
                  </div>
                </div>
              )}

              {selectedObservation.anomaly_severity === 'MODERATE DEVIATION' && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wide">MODERATE DEVIATION</div>
                    <div className="text-[10px] text-amber-400/90">Deviation 1.5 ≤ |Z| &lt; 2.5 requires validation.</div>
                  </div>
                </div>
              )}

              {selectedObservation.anomaly_severity === 'SIGNIFICANT ANOMALY' && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 glow-alert-border">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wide">SIGNIFICANT ANOMALY</div>
                    <div className="text-[10px] text-rose-300">Extreme deviation |Z| ≥ 2.5. High confidence anomaly.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2.5 text-[10px] text-slate-300 leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block font-semibold mb-0.5">EXPLANATION:</span>
              {selectedObservation.anomaly_reason}
            </div>
          </div>

          {/* Location Decision Support Advisory */}
          <div className="bg-sky-950/40 p-3 rounded-xl border border-sky-400/30">
            <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px] mb-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>Location Decision Support</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
              {selectedObservation.decision_support}
            </p>
          </div>
        </div>
      ) : (
        /* Empty State: Prompt user or show quick station list */
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-dashed border-sky-500/30 text-center">
            <MapPin className="w-8 h-8 text-sky-400/60 mx-auto mb-2 animate-pulse" />
            <div className="font-semibold text-slate-200">No Observation Selected</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Click any 3D buoy beacon or select a station below to inspect model vs observation differences.
            </p>
          </div>

          <div>
            <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[10px] block mb-2">
              Available In-Situ Stations ({allObservations.length})
            </span>
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
                        ? 'bg-rose-950/30 border-rose-500/40 hover:bg-rose-900/40'
                        : isMod
                        ? 'bg-amber-950/20 border-amber-500/30 hover:bg-amber-900/30'
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-sky-500/30'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-medium text-slate-200 truncate">{obs.platform_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {obs.lat.toFixed(1)}°N, {obs.lon.toFixed(1)}°E
                      </div>
                    </div>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isAnom ? 'bg-rose-500/20 text-rose-300' : isMod ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
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
