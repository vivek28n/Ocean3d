import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell
} from 'recharts';
import {
  StatisticsSummary, TimeSeriesPoint, ParameterInfo, ObservationPoint
} from '../types';
import { TrendingUp, BarChart3, Target } from 'lucide-react';

interface AnalyticsPanelProps {
  statistics: StatisticsSummary | null;
  timeseriesData: TimeSeriesPoint[];
  currentParameter: ParameterInfo;
  selectedObservation: ObservationPoint | null;
  currentTimeIndex: number;
}

// Custom tooltip renderer formatted for scientific ocean telemetry
const CustomTelemetryTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="glass-panel px-2.5 py-1.5 rounded-lg border border-sky-500/30 text-[11px] font-mono shadow-xl bg-slate-950/95">
      <div className="text-[10px] text-slate-400 font-semibold mb-1 border-b border-slate-800 pb-0.5">
        Timestep: {label}
      </div>
      <div className="space-y-0.5">
        {payload.map((entry: any, index: number) => {
          const isModel = entry.dataKey === 'model_value';
          const isObs = entry.dataKey === 'observed_value';
          const isDiff = entry.dataKey === 'difference';

          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[10.5px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                {isModel ? 'Numerical Model:' : isObs ? 'In-Situ Observed:' : isDiff ? 'Residual (Obs - Model):' : entry.name}
              </span>
              <span className="font-bold text-slate-100">
                {typeof entry.value === 'number'
                  ? (isDiff && entry.value > 0 ? `+${entry.value.toFixed(2)}` : entry.value.toFixed(2))
                  : entry.value}
                <span className="text-[9px] text-slate-400 font-normal ml-1">{unit}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Formats unique readable label per timestep to eliminate Recharts category collisions across days
const formatUniqueTimestepLabel = (timeStr?: string, fallbackLabel?: string) => {
  if (!timeStr) return fallbackLabel || '';
  try {
    const d = new Date(timeStr);
    const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = d.getUTCDate();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    return `${month} ${day} ${hours}:${mins}`;
  } catch {
    return fallbackLabel || timeStr;
  }
};

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  statistics,
  timeseriesData,
  currentParameter,
  selectedObservation,
  currentTimeIndex,
}) => {
  const chartData = timeseriesData.map((pt) => ({
    ...pt,
    uniqueLabel: formatUniqueTimestepLabel(pt.time, pt.label),
  }));

  const currentStepLabel = chartData[currentTimeIndex]?.uniqueLabel;
  const isStatsCurrent = Boolean(
    statistics && (!statistics.parameter || statistics.parameter === currentParameter.id)
  );
  const isSSH = currentParameter.id === 'ssh';

  return (
    <div className="w-full bg-slate-950/85 glass-panel border-t border-sky-500/20 px-3.5 py-2.5 text-slate-200 select-none">
      <div className="grid grid-cols-12 gap-2.5 items-center">
        
        {/* 1. KEY STATISTICAL METRICS CARDS (Cols 1-4) */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Mean Card */}
          <div className="bg-slate-900/80 p-2 rounded-xl border border-sky-500/20 flex flex-col justify-between">
            <span className="text-[9.5px] uppercase font-semibold tracking-wider text-slate-400 block">Mean (Mod / Obs)</span>
            <div className="font-mono font-bold text-sm text-cyan-300 mt-1 truncate">
              {isStatsCurrent && statistics ? (isSSH ? statistics.model_mean.toFixed(3) : statistics.model_mean.toFixed(2)) : '--'}
              <span className="text-slate-500 font-normal text-xs mx-1">/</span>
              <span className="text-emerald-400">
                {isStatsCurrent && statistics && statistics.observed_mean !== null
                  ? (isSSH ? statistics.observed_mean.toFixed(3) : statistics.observed_mean.toFixed(2))
                  : '--'}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">{currentParameter.unit}</span>
          </div>

          {/* Min Card */}
          <div className="bg-slate-900/80 p-2 rounded-xl border border-sky-500/20 flex flex-col justify-between">
            <span className="text-[9.5px] uppercase font-semibold tracking-wider text-slate-400 block">Minimum</span>
            <div className="font-mono font-bold text-sm text-slate-200 mt-1">
              {isStatsCurrent && statistics ? (isSSH ? statistics.model_min.toFixed(3) : statistics.model_min.toFixed(2)) : '--'}
            </div>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">{currentParameter.unit}</span>
          </div>

          {/* Max Card */}
          <div className="bg-slate-900/80 p-2 rounded-xl border border-sky-500/20 flex flex-col justify-between">
            <span className="text-[9.5px] uppercase font-semibold tracking-wider text-slate-400 block">Maximum</span>
            <div className="font-mono font-bold text-sm text-slate-200 mt-1">
              {isStatsCurrent && statistics ? (isSSH ? statistics.model_max.toFixed(3) : statistics.model_max.toFixed(2)) : '--'}
            </div>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">{currentParameter.unit}</span>
          </div>

          {/* RMSE Card */}
          <div className="bg-slate-900/80 p-2 rounded-xl border border-amber-500/30 flex flex-col justify-between">
            <span className="text-[9.5px] uppercase font-semibold tracking-wider text-amber-300 block flex items-center gap-1">
              <Target className="w-3 h-3 text-amber-400" /> RMSE
            </span>
            <div className="font-mono font-bold text-sm text-amber-300 mt-1">
              {isStatsCurrent && statistics && statistics.rmse !== null ? statistics.rmse.toFixed(3) : '--'}
            </div>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">Deviation Index</span>
          </div>
        </div>

        {/* 2. MODEL VS OBSERVATION LINE CHART (Cols 5-8) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-slate-900/80 p-2 rounded-xl border border-sky-500/20 h-32 flex flex-col">
          <div className="flex items-center justify-between text-[10.5px] mb-1 px-1">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Model vs Observation Progression
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[9.5px] font-mono text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" /> Model
              </span>
              <span className="flex items-center gap-1 text-[9.5px] font-mono text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Obs
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono truncate max-w-[90px]">
                {selectedObservation ? selectedObservation.platform_name : 'Basin Mean'}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="uniqueLabel" stroke="#64748b" tick={{ fontSize: 8, fontFamily: 'var(--font-mono)' }} />
                <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 8.5, fontFamily: 'var(--font-mono)' }} />
                <Tooltip content={<CustomTelemetryTooltip unit={currentParameter.unit} />} />
                {currentStepLabel && (
                  <ReferenceLine x={currentStepLabel} stroke="#38bdf8" strokeDasharray="3 3" opacity={0.7} />
                )}
                <Line
                  type="monotone"
                  dataKey="model_value"
                  name="Model"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#38bdf8' }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="observed_value"
                  name="Observed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#10b981' }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. DIFFERENCE CHART (Cols 9-12) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-slate-900/80 p-2 rounded-xl border border-sky-500/20 h-32 flex flex-col">
          <div className="flex items-center justify-between text-[10.5px] mb-1 px-1">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Difference (Observed − Model)
            </span>
            <div className="flex items-center gap-2 text-[9.5px] font-mono">
              <span className="text-rose-400">+ Warm/Over</span>
              <span className="text-slate-500">•</span>
              <span className="text-sky-400">- Cool/Under</span>
              <span className="text-slate-400 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">
                {currentParameter.unit}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="uniqueLabel" stroke="#64748b" tick={{ fontSize: 8, fontFamily: 'var(--font-mono)' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 8.5, fontFamily: 'var(--font-mono)' }} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                {currentStepLabel && (
                  <ReferenceLine x={currentStepLabel} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.7} />
                )}
                <Tooltip content={<CustomTelemetryTooltip unit={currentParameter.unit} />} />
                <Bar dataKey="difference" name="Difference" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.difference !== null && entry.difference >= 0 ? '#ef4444' : '#0284c7'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
