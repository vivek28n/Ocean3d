import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ParameterInfo, RegionInfo, OceanGridPoint, ObservationPoint,
  ComparisonSummary, AnomalyItem, StatisticsSummary, TimeSeriesPoint, ActiveLayers
} from './types';
import {
  fetchParameters, fetchRegions, fetchTimesteps, fetchOceanData,
  fetchObservations, fetchComparison, fetchAnomalies, fetchStatistics,
  fetchTimeseries
} from './api';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { Ocean3DViewer } from './components/Ocean3DViewer';
import { LocationInspector } from './components/LocationInspector';
import { RiskDecisionSupport } from './components/RiskDecisionSupport';
import { AnalyticsPanel } from './components/AnalyticsPanel';

export const App: React.FC = () => {
  // Navigation & State Management
  const [parameters, setParameters] = useState<ParameterInfo[]>([]);
  const [currentParameter, setCurrentParameter] = useState<ParameterInfo | null>(null);
  
  const [regions, setRegions] = useState<RegionInfo[]>([]);
  const [currentRegion, setCurrentRegion] = useState<RegionInfo | null>(null);
  
  const [depths] = useState<number[]>([0.0, 10.0, 50.0, 100.0, 500.0]);
  const [currentDepth, setCurrentDepth] = useState<number>(0.0);
  
  const [timesteps, setTimesteps] = useState<string[]>([]);
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Digital Twin Active Layers
  const [layers, setLayers] = useState<ActiveLayers>({
    model: true,
    observations: true,
    difference: true,
    anomaly: true,
    currentVectors: false,
  });

  // Data Stores
  const [gridData, setGridData] = useState<OceanGridPoint[]>([]);
  const [observations, setObservations] = useState<ObservationPoint[]>([]);
  const [comparison, setComparison] = useState<ComparisonSummary | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [statistics, setStatistics] = useState<StatisticsSummary | null>(null);
  const [timeseriesData, setTimeseriesData] = useState<TimeSeriesPoint[]>([]);
  const [selectedObservation, setSelectedObservation] = useState<ObservationPoint | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Side panel collapse states (default open to preserve original UX)
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState<boolean>(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(false);

  // 1. Initial configuration load
  useEffect(() => {
    async function initApp() {
      try {
        const [paramsList, regionsList, timesList] = await Promise.all([
          fetchParameters(),
          fetchRegions(),
          fetchTimesteps()
        ]);
        setParameters(paramsList);
        setCurrentParameter(paramsList[0] || null);

        setRegions(regionsList);
        // Default to Bay of Bengal (SIH Disaster Priority)
        const bob = regionsList.find(r => r.id === 'bay_of_bengal') || regionsList[0];
        setCurrentRegion(bob || null);

        setTimesteps(timesList);
        setCurrentTimeIndex(0);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    initApp();
  }, []);

  // 2. Data fetching when parameters, region, depth, or time changes
  const loadOceanData = useCallback(async () => {
    if (!currentParameter || !currentRegion || timesteps.length === 0) return;
    const timeStr = timesteps[currentTimeIndex];
    if (!timeStr) return;

    setIsLoading(true);
    try {
      const [gridRes, obsRes, compRes, anomsRes, statsRes, tsRes] = await Promise.allSettled([
        fetchOceanData(currentRegion.id, currentParameter.id, currentDepth, timeStr),
        fetchObservations(currentRegion.id, currentParameter.id, currentDepth, timeStr),
        fetchComparison(currentRegion.id, currentParameter.id, currentDepth, timeStr),
        fetchAnomalies(currentRegion.id, currentParameter.id, currentDepth, timeStr),
        fetchStatistics(currentRegion.id, currentParameter.id, currentDepth, timeStr),
        fetchTimeseries(currentRegion.id, currentParameter.id, currentDepth, selectedObservation?.id)
      ]);

      if (gridRes.status === 'fulfilled') {
        setGridData(gridRes.value);
      } else {
        console.warn('Grid data fetch failed:', gridRes.reason);
      }

      if (obsRes.status === 'fulfilled') {
        const obs = obsRes.value;
        setObservations(obs);
        // Keep selected observation fresh with latest timestep values
        if (selectedObservation) {
          const updatedObs = obs.find(o => o.id === selectedObservation.id);
          if (updatedObs) setSelectedObservation(updatedObs);
        }
      } else {
        console.warn('Observations fetch failed:', obsRes.reason);
      }

      if (compRes.status === 'fulfilled') {
        setComparison(compRes.value);
      } else {
        console.warn('Comparison fetch failed:', compRes.reason);
      }

      if (anomsRes.status === 'fulfilled') {
        setAnomalies(anomsRes.value);
      } else {
        console.warn('Anomalies fetch failed:', anomsRes.reason);
      }

      if (statsRes.status === 'fulfilled') {
        setStatistics(statsRes.value);
      } else {
        console.warn('Statistics fetch failed:', statsRes.reason);
      }

      if (tsRes.status === 'fulfilled') {
        setTimeseriesData(tsRes.value);
      } else {
        console.warn('Timeseries fetch failed:', tsRes.reason);
      }
    } catch (err) {
      console.error('Failed to load ocean data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentParameter, currentRegion, currentDepth, currentTimeIndex, timesteps, selectedObservation?.id]);

  useEffect(() => {
    loadOceanData();
  }, [loadOceanData]);

  // 3. Playback timeline timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && timesteps.length > 0) {
      interval = setInterval(() => {
        setCurrentTimeIndex((prev) => (prev + 1) % timesteps.length);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, timesteps.length]);

  // 4. Layer toggle handler
  const handleToggleLayer = (layerKey: keyof ActiveLayers) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // 5. Select station from inspector or anomaly alert
  const handleSelectObservation = (obs: ObservationPoint | null) => {
    setSelectedObservation(obs);
  };

  const handleSelectParameter = (param: ParameterInfo) => {
    setCurrentParameter(param);
    if (param.id === 'ssh' && currentDepth !== 0.0) {
      setCurrentDepth(0.0);
    }
  };

  const handleSelectAnomalyStation = (stationId: string) => {
    const target = observations.find(o => o.id === stationId);
    if (target) setSelectedObservation(target);
  };

  // 6. PRIMARY SIH DEMO FLOW PRESET:
  // Step 1: Bay of Bengal
  // Step 2: Sea Surface Temperature
  // Step 3: 10m depth
  // Step 4: Step 2 time
  // Step 5: Enable Model, Observations, Difference, Anomaly
  // Step 6: Select RAMA-BD02 observation
  const handleRunDemoPreset = () => {
    const bob = regions.find(r => r.id === 'bay_of_bengal');
    if (bob) setCurrentRegion(bob);

    const sst = parameters.find(p => p.id === 'sst');
    if (sst) setCurrentParameter(sst);

    setCurrentDepth(10.0);
    setCurrentTimeIndex(2);

    setLayers({
      model: true,
      observations: true,
      difference: true,
      anomaly: true,
      currentVectors: true,
    });

    // Auto-select RAMA-BD02 which has an elevated thermal anomaly
    const targetStation = observations.find(o => o.id === 'RAMA-BD02') || observations[0];
    if (targetStation) {
      setSelectedObservation(targetStation);
    }
  };

  if (!currentParameter || !currentRegion) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#030712] text-cyan-400 font-mono">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm tracking-wider uppercase font-semibold">
            Initializing Ocean3D Digital Twin Simulation Engine...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#030712] overflow-hidden">
      
      {/* 1. TOP HEADER */}
      <Header
        currentRegion={currentRegion}
        currentParameter={currentParameter}
        currentDepth={currentDepth}
        currentTimestamp={timesteps[currentTimeIndex]}
        onRunDemoPreset={handleRunDemoPreset}
        isLoading={isLoading}
      />

      {/* 2. MIDDLE WORKSPACE: LEFT CONTROLS, CENTER 3D CANVAS, RIGHT INSPECTOR */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT CONTROLS */}
        <ControlPanel
          parameters={parameters}
          currentParameter={currentParameter}
          onSelectParameter={handleSelectParameter}
          depths={depths}
          currentDepth={currentDepth}
          onSelectDepth={setCurrentDepth}
          timesteps={timesteps}
          currentTimeIndex={currentTimeIndex}
          onSelectTimeIndex={setCurrentTimeIndex}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(p => !p)}
          regions={regions}
          currentRegion={currentRegion}
          onSelectRegion={setCurrentRegion}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={() => setIsLeftPanelCollapsed(prev => !prev)}
        />

        {/* CENTER 3D OCEAN VIEWPORT */}
        <main className="flex-1 relative h-full overflow-hidden">
          {/* Floating Risk & Decision Support HUD anchored to upper portion of 3D canvas */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl pointer-events-auto">
            <RiskDecisionSupport
              anomalies={anomalies}
              currentParameter={currentParameter}
              currentRegion={currentRegion}
              currentDepth={currentDepth}
              selectedObservation={selectedObservation}
              onSelectAnomalyStation={handleSelectAnomalyStation}
            />
          </div>

          {/* Core Interactive 3D Ocean Scene (occupies full height and width) */}
          <div className="relative w-full h-full">
            <Ocean3DViewer
              gridData={gridData}
              observations={observations}
              currentParameter={currentParameter}
              currentRegion={currentRegion}
              currentDepth={currentDepth}
              layers={layers}
              selectedObservation={selectedObservation}
              onSelectObservation={handleSelectObservation}
            />
          </div>
        </main>

        {/* RIGHT LOCATION INSPECTOR */}
        <LocationInspector
          selectedObservation={selectedObservation}
          onClearSelection={() => setSelectedObservation(null)}
          currentParameter={currentParameter}
          currentDepth={currentDepth}
          allObservations={observations}
          onSelectStation={handleSelectObservation}
          isCollapsed={isRightPanelCollapsed}
          onToggleCollapse={() => setIsRightPanelCollapsed(prev => !prev)}
        />

      </div>

      {/* 3. BOTTOM ANALYTICS PANEL */}
      <AnalyticsPanel
        statistics={statistics}
        timeseriesData={timeseriesData}
        currentParameter={currentParameter}
        selectedObservation={selectedObservation}
        currentTimeIndex={currentTimeIndex}
      />

    </div>
  );
};

export default App;
