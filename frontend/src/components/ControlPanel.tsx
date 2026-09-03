import React from 'react';
import { ParameterInfo, RegionInfo, ActiveLayers } from '../types';
import {
  Thermometer, Droplet, Waves, Wind, Play, Pause,
  ChevronLeft, ChevronRight, Eye, AlertTriangle, Layers, MapPin, Lock
} from 'lucide-react';

interface ControlPanelProps {
  parameters: ParameterInfo[];
  currentParameter: ParameterInfo;
  onSelectParameter: (param: ParameterInfo) => void;
  depths: number[];
  currentDepth: number;
  onSelectDepth: (depth: number) => void;
  timesteps: string[];
  currentTimeIndex: number;
  onSelectTimeIndex: (idx: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  regions: RegionInfo[];
  currentRegion: RegionInfo;
  onSelectRegion: (reg: RegionInfo) => void;
  layers: ActiveLayers;
  onToggleLayer: (layerKey: keyof ActiveLayers) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  parameters,
  currentParameter,
  onSelectParameter,
  depths,
  currentDepth,
  onSelectDepth,
  timesteps,
  currentTimeIndex,
  onSelectTimeIndex,
  isPlaying,
  onTogglePlay,
  regions,
  currentRegion,
  onSelectRegion,
  layers,
  onToggleLayer,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const getParamIcon = (id: string) => {
    switch (id) {
      case 'sst': return <Thermometer className="w-4 h-4 text-rose-400" />;
      case 'salinity': return <Droplet className="w-4 h-4 text-emerald-400" />;
      case 'ssh': return <Waves className="w-4 h-4 text-sky-400" />;
      case 'current_velocity': return <Wind className="w-4 h-4 text-purple-400" />;
      default: return <Waves className="w-4 h-4" />;
    }
  };

  const currentTimeStr = timesteps[currentTimeIndex] || '';
  const formattedDate = currentTimeStr ? new Date(currentTimeStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
  }) + ' UTC' : 'Loading...';

  if (isCollapsed) {
    return (
      <aside className="w-11 h-full flex flex-col items-center py-3 glass-panel border-r border-sky-500/20 text-slate-200 z-20 shrink-0 select-none">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white border border-sky-500/20 transition-all cursor-pointer"
          title="Expand Control Panel"
          aria-label="Expand Control Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-8 flex flex-col items-center gap-4 text-[10px] font-mono tracking-widest text-slate-400 [writing-mode:vertical-lr] rotate-180">
          <span className="text-cyan-400 font-semibold uppercase">Controls</span>
          <span>{currentParameter.unit}</span>
          <span className="text-slate-500">{currentDepth}m</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full flex flex-col gap-3 p-3 overflow-y-auto glass-panel border-r border-sky-500/20 text-slate-200 text-xs shrink-0 select-none transition-all">
      {/* Panel Top Header with Collapse Button */}
      <div className="flex items-center justify-between pb-2 border-b border-sky-500/20">
        <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" /> Digital Twin Controls
        </span>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
            title="Collapse Control Panel"
            aria-label="Collapse Control Panel"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 1. REGION SELECTOR */}
      <section className="bg-slate-900/60 rounded-xl p-2.5 border border-sky-500/15">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[10.5px] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Ocean Basin / Region
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {regions.map((reg) => {
            const isSelected = currentRegion.id === reg.id;
            const isBoB = reg.id === 'bay_of_bengal';
            return (
              <button
                key={reg.id}
                onClick={() => onSelectRegion(reg)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left transition-all flex items-center justify-between border cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-400/80 text-white font-medium shadow-sm shadow-sky-950/40'
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:bg-slate-800/70 hover:border-sky-500/30'
                }`}
              >
                <div className="truncate pr-1">
                  <div className="truncate font-medium text-xs">{reg.name}</div>
                </div>
                {isBoB && (
                  <span className="text-[8.5px] uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold tracking-wider shrink-0">
                    SIH Priority
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. PARAMETER SELECTOR */}
      <section className="bg-slate-900/60 rounded-xl p-2.5 border border-sky-500/15">
        <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[10.5px] block mb-2">
          Physical Parameter
        </span>
        <div className="grid grid-cols-1 gap-1">
          {parameters.map((param) => {
            const isSelected = currentParameter.id === param.id;
            return (
              <button
                key={param.id}
                onClick={() => onSelectParameter(param)}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left transition-all flex items-center justify-between border cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-400/80 text-white font-medium shadow-sm shadow-sky-950/40'
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:bg-slate-800/70 hover:border-sky-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  {getParamIcon(param.id)}
                  <span className="truncate text-xs">{param.name}</span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-950/60 text-slate-300 border border-slate-700 shrink-0">
                  {param.unit}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. DEPTH SELECTOR */}
      <section className="bg-slate-900/60 rounded-xl p-2.5 border border-sky-500/15">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[10.5px]">
            Depth Stratification
          </span>
          <span className="font-mono text-cyan-300 text-xs font-semibold">{currentDepth}m Level</span>
        </div>
        
        {/* SSH Surface Locking Notice */}
        {currentParameter.id === 'ssh' && (
          <div className="mb-2 p-1.5 rounded bg-sky-950/40 border border-sky-500/25 text-[9.5px] text-cyan-200 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>SSH is constrained to 0m (sea surface variable).</span>
          </div>
        )}

        <div className="grid grid-cols-5 gap-1">
          {depths.map((d) => {
            const isSelected = currentDepth === d;
            const isLocked = currentParameter.id === 'ssh' && d !== 0;
            return (
              <button
                key={d}
                onClick={() => !isLocked && onSelectDepth(d)}
                disabled={isLocked}
                title={isLocked ? "SSH only exists at 0m surface level" : `Set depth to ${d}m`}
                className={`py-1.5 rounded text-center font-mono text-xs transition-all border ${
                  isSelected
                    ? 'bg-sky-500/30 text-cyan-200 border-sky-400 font-bold shadow-sm shadow-sky-950/40'
                    : isLocked
                    ? 'bg-slate-950/30 border-slate-800/80 text-slate-600 cursor-not-allowed opacity-40'
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-sky-500/40 cursor-pointer'
                }`}
              >
                {d}m
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. TIME CONTROLS */}
      <section className="bg-slate-900/60 rounded-xl p-2.5 border border-sky-500/15">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[10.5px]">
            Timeline Navigation
          </span>
          <span className="text-[9.5px] text-slate-400 font-mono">6h Interval</span>
        </div>

        {/* Current Timestamp Display */}
        <div className="p-2 rounded-lg bg-slate-950/70 border border-sky-500/20 text-center mb-2.5">
          <div className="text-cyan-300 font-mono text-xs font-medium">{formattedDate}</div>
          <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">Step {currentTimeIndex + 1} of {timesteps.length}</div>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <button
            onClick={() => onSelectTimeIndex(Math.max(0, currentTimeIndex - 1))}
            disabled={currentTimeIndex === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Previous 6h Step"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium text-xs transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-semibold'
                : 'bg-sky-500/20 hover:bg-sky-500/30 text-cyan-200 border border-sky-400/40 font-semibold'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-amber-400" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-cyan-400" /> Play Loop
              </>
            )}
          </button>

          <button
            onClick={() => onSelectTimeIndex(Math.min(timesteps.length - 1, currentTimeIndex + 1))}
            disabled={currentTimeIndex === timesteps.length - 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Next 6h Step"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timeline Slider */}
        <input
          type="range"
          min={0}
          max={Math.max(0, timesteps.length - 1)}
          value={currentTimeIndex}
          onChange={(e) => onSelectTimeIndex(parseInt(e.target.value, 10))}
          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>T0</span>
          <span>T4</span>
          <span>T9 (Latest)</span>
        </div>
      </section>

      {/* 5. ACTIVE DIGITAL TWIN LAYERS */}
      <section className="bg-slate-900/60 rounded-xl p-3 border border-sky-500/15">
        <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[11px] block mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> Digital Twin Layers
        </span>
        <div className="space-y-1.5">
          {/* Model Layer */}
          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 cursor-pointer">
            <span className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Numerical Model Grid</span>
            </span>
            <input
              type="checkbox"
              checked={layers.model}
              onChange={() => onToggleLayer('model')}
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
          </label>

          {/* Observations Layer */}
          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 cursor-pointer">
            <span className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>In-Situ Observations (Buoys/Argo)</span>
            </span>
            <input
              type="checkbox"
              checked={layers.observations}
              onChange={() => onToggleLayer('observations')}
              className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
            />
          </label>

          {/* Difference Layer */}
          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 cursor-pointer">
            <span className="flex items-center gap-2">
              <Waves className="w-3.5 h-3.5 text-amber-400" />
              <span>Difference (Obs - Model)</span>
            </span>
            <input
              type="checkbox"
              checked={layers.difference}
              onChange={() => onToggleLayer('difference')}
              className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
            />
          </label>

          {/* Anomaly Layer */}
          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 cursor-pointer">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Anomaly Beacons (|Z| ≥ 1.5)</span>
            </span>
            <input
              type="checkbox"
              checked={layers.anomaly}
              onChange={() => onToggleLayer('anomaly')}
              className="accent-red-400 w-4 h-4 rounded cursor-pointer"
            />
          </label>

          {/* Current Velocity Vectors */}
          <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 cursor-pointer">
            <span className="flex items-center gap-2">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Current Flow Vectors</span>
            </span>
            <input
              type="checkbox"
              checked={layers.currentVectors}
              onChange={() => onToggleLayer('currentVectors')}
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
          </label>
        </div>
      </section>
    </aside>
  );
};
