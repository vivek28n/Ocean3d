import React from 'react';
import { Waves, Activity, Sparkles, RefreshCw } from 'lucide-react';
import { RegionInfo, ParameterInfo } from '../types';

interface HeaderProps {
  currentRegion: RegionInfo;
  currentParameter: ParameterInfo;
  currentDepth: number;
  currentTimestamp: string;
  onRunDemoPreset: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRegion,
  currentParameter,
  currentDepth,
  currentTimestamp,
  onRunDemoPreset,
  isLoading
}) => {
  const formattedTime = currentTimestamp ? new Date(currentTimestamp).toUTCString() : 'Syncing...';

  return (
    <header className="w-full h-14 bg-slate-950/90 glass-panel border-b border-sky-500/25 px-4 flex items-center justify-between z-30 select-none">
      
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30">
          <Waves className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-wide">Ocean3D</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-cyan-300 border border-sky-500/30">
              SIH 2026 • PS: SIH26067
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Interactive Ocean Digital Twin & Disaster Management Support
          </div>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Prototype Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-sky-500/25 text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="text-slate-300 font-mono text-[10.5px]">
            Prototype Data • Synthetic Ocean Model + Simulated In-Situ Observations
          </span>
        </div>

        {/* Current State Indicator */}
        <div className="text-xs text-slate-300 flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-cyan-400 font-semibold">{currentRegion.name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-200">{currentParameter.name}</span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-cyan-300">{currentDepth}m</span>
        </div>

        {/* Data Timestamp */}
        <div className="font-mono text-xs text-slate-300 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 mr-1.5">Timestep:</span>
          <span className="text-cyan-300">{formattedTime}</span>
        </div>
      </div>

      {/* Right Controls: Quick SIH Demo Runner */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRunDemoPreset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          title="Load the standard SIH Bay of Bengal Disaster Demo Flow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo Flow</span>
        </button>

        {isLoading && (
          <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
        )}
      </div>

    </header>
  );
};
