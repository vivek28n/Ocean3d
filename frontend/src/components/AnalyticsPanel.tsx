import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine
} from 'recharts';
import {
  StatisticsSummary, TimeSeriesPoint, ParameterInfo, ObservationPoint
} from '../types';
import { TrendingUp, BarChart3, Activity, Layers, Target } from 'lucide-react';

interface AnalyticsPanelProps {
  statistics: StatisticsSummary | null;
  timeseriesData: TimeSeriesPoint[];
  currentParameter: ParameterInfo;
  selectedObservation: ObservationPoint | null;
  currentTimeIndex: number;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  statistics,
  timeseriesData,
  currentParameter,
  selectedObservation,
  currentTimeIndex,
}) => {
  return (
    <div className="w-full bg-slate-950/80 glass-panel border-t border-sky-500/20 px-4 py-3 text-slate-200">
      <div className="grid grid-cols-12 gap-3 items-center">
        
        {/* 1. KEY STATISTICAL METRICS CARDS (Cols 1-4) */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Mean Card */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-sky-500/20">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Mean Model / Obs</span>
            <div className="font-mono font-bold text-sm text-cyan-300 mt-1">
              {statistics ? statistics.model_mean.toFixed(2) : '--'}
              <span className="text-slate-400 font-normal text-xs ml-1">/</span>
              <span className="text-emerald-400 ml-1">
                {statistics ? statistics.observed_mean.toFixed(2) : '--'}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono">{currentParameter.unit}</span>
          </div>

          {/* Min Card */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-sky-500/20">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Minimum</span>
            <div className="font-mono font-bold text-sm text-slate-200 mt-1">
              {statistics ? statistics.model_min.toFixed(2) : '--'}
            </div>
            <span className="text-[9px] text-slate-400 font-mono">{currentParameter.unit}</span>
          </div>

          {/* Max Card */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-sky-500/20">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Maximum</span>
            <div className="font-mono font-bold text-sm text-slate-200 mt-1">
              {statistics ? statistics.model_max.toFixed(2) : '--'}
            </div>
            <span className="text-[9px] text-slate-400 font-mono">{currentParameter.unit}</span>
          </div>

          {/* RMSE Card */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/30">
            <span className="text-[10px] uppercase font-semibold text-amber-300 block flex items-center gap-1">
              <Target className="w-3 h-3 text-amber-400" /> RMSE
            </span>
            <div className="font-mono font-bold text-sm text-amber-300 mt-1">
              {statistics ? statistics.rmse.toFixed(3) : '--'}
            </div>
            <span className="text-[9px] text-slate-400 font-mono">Deviation Index</span>
          </div>
        </div>

        {/* 2. MODEL VS OBSERVATION LINE CHART (Cols 5-8) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-slate-900/80 p-2.5 rounded-xl border border-sky-500/20 h-32 flex flex-col">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Model vs Observation Progression
            </span>
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
              {selectedObservation ? selectedObservation.platform_name : 'Basin Mean'}
            </span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#091528', borderColor: '#38bdf8', fontSize: '11px' }}
                  itemStyle={{ padding: '0px' }}
                />
                <Line
                  type="monotone"
                  dataKey="model_value"
                  name="Model"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="observed_value"
                  name="Observed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. DIFFERENCE CHART (Cols 9-12) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-slate-900/80 p-2.5 rounded-xl border border-sky-500/20 h-32 flex flex-col">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Difference (Observed - Model)
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Unit: {currentParameter.unit}
            </span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeseriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#091528', borderColor: '#f59e0b', fontSize: '11px' }}
                />
                <Bar
                  dataKey="difference"
                  name="Difference"
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
