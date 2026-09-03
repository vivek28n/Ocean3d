import React from 'react';
import { Waves, Sparkles, RefreshCw } from 'lucide-react';
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
    <header className="w-full h-14 bg-slate-950/90 glass-panel border-b border-sky-500/20 px-3.5 sm:px-4 flex items-center justify-between z-30 select-none">
      
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-950 border border-sky-500/30 text-cyan-400 shadow-sm shadow-sky-950/50">
          <Waves className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-wider uppercase font-sans">Ocean3D</h1>
            <span className="text-[9.5px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-cyan-300 border border-sky-500/30 font-medium">
              SIH26067
            </span>
          </div>
          <div className="text-[10.5px] text-slate-400 font-normal tracking-tight hidden sm:block">
            Ocean Digital Twin & Decision Support System
          </div>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden lg:flex items-center gap-2.5">
        {/* Prototype Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-sky-500/20 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-slate-300 font-mono text-[10px] tracking-tight">
            Synthetic Ocean Model + Simulated In-Situ Telemetry
          </span>
        </div>

        {/* Current State Indicator */}
        <div className="text-xs text-slate-300 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/70 border border-slate-800 font-sans">
          <span className="text-cyan-400 font-medium">{currentRegion.name}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-200">{currentParameter.name}</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-cyan-300">{currentDepth}m</span>
        </div>

        {/* Data Timestamp */}
        <div className="font-mono text-xs text-slate-300 px-2.5 py-1 rounded-lg bg-slate-900/70 border border-slate-800">
          <span className="text-slate-400 mr-1 text-[10px]">T:</span>
          <span className="text-cyan-300 text-[11px]">{formattedTime}</span>
        </div>
      </div>

      {/* Right Controls: Quick SIH Demo Runner */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRunDemoPreset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-cyan-200 hover:text-white border border-sky-400/40 font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-sky-950/40"
          title="Load the standard SIH Bay of Bengal Disaster Demo Flow"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Demo Flow</span>
        </button>

        {isLoading && (
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
        )}
      </div>

    </header>
  );
};
