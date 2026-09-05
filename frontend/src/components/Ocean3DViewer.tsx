import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OceanGridPoint, ObservationPoint, ParameterInfo, RegionInfo, ActiveLayers, ResearchVehicle } from '../types';
import { Rotate3D, ZoomIn, ZoomOut, Maximize2, Compass, Waves } from 'lucide-react';

interface Ocean3DViewerProps {
  gridData: OceanGridPoint[];
  observations: ObservationPoint[];
  currentParameter: ParameterInfo;
  currentRegion: RegionInfo;
  currentDepth: number;
  layers: ActiveLayers;
  selectedObservation: ObservationPoint | null;
  onSelectObservation: (obs: ObservationPoint | null) => void;
  researchVehicle?: ResearchVehicle | null;
}

// Color scale helper for parameters
function getParameterColor(paramId: string, value: number, minVal: number, maxVal: number): THREE.Color {
  const t = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal || 1)));

  if (paramId === 'sst') {
    // Thermal scale: Navy -> Blue -> Cyan -> Yellow -> Orange -> Crimson
    if (t < 0.25) return new THREE.Color().lerpColors(new THREE.Color(0x0f2b5c), new THREE.Color(0x0088cc), t / 0.25);
    if (t < 0.5) return new THREE.Color().lerpColors(new THREE.Color(0x0088cc), new THREE.Color(0x00ffcc), (t - 0.25) / 0.25);
    if (t < 0.75) return new THREE.Color().lerpColors(new THREE.Color(0x00ffcc), new THREE.Color(0xffcc00), (t - 0.5) / 0.25);
    return new THREE.Color().lerpColors(new THREE.Color(0xffcc00), new THREE.Color(0xee2222), (t - 0.75) / 0.25);
  } else if (paramId === 'salinity') {
    // Viridis style: Deep Blue -> Teal -> Green -> Bright Yellow
    if (t < 0.33) return new THREE.Color().lerpColors(new THREE.Color(0x1a237e), new THREE.Color(0x00897b), t / 0.33);
    if (t < 0.66) return new THREE.Color().lerpColors(new THREE.Color(0x00897b), new THREE.Color(0x7cb342), (t - 0.33) / 0.33);
    return new THREE.Color().lerpColors(new THREE.Color(0x7cb342), new THREE.Color(0xfdd835), (t - 0.66) / 0.34);
  } else if (paramId === 'ssh') {
    // Coolwarm style: Deep Blue (depression) -> Cyan -> White -> Orange -> Crimson (surge)
    if (t < 0.5) return new THREE.Color().lerpColors(new THREE.Color(0x1565c0), new THREE.Color(0x80deea), t / 0.5);
    return new THREE.Color().lerpColors(new THREE.Color(0x80deea), new THREE.Color(0xe53935), (t - 0.5) / 0.5);
  } else if (paramId === 'oxygen') {
    // Cividis style: Dark Navy Blue -> Slate Blue -> Amber Gold -> Bright Yellow
    if (t < 0.5) return new THREE.Color().lerpColors(new THREE.Color(0x00204d), new THREE.Color(0x414d6b), t / 0.5);
    return new THREE.Color().lerpColors(new THREE.Color(0x414d6b), new THREE.Color(0xffea46), (t - 0.5) / 0.5);
  } else if (paramId === 'chlorophyll') {
    // Ocean Color Phytoplankton scale: Deep Indigo -> Sea Green -> Spring Green -> Bright Chartreuse
    if (t < 0.5) return new THREE.Color().lerpColors(new THREE.Color(0x051b2c), new THREE.Color(0x059669), t / 0.5);
    return new THREE.Color().lerpColors(new THREE.Color(0x059669), new THREE.Color(0x84cc16), (t - 0.5) / 0.5);
  } else if (paramId === 'wind_speed') {
    // Wind scale: Sky Blue (gentle breeze) -> Emerald -> Amber -> Crimson -> Magenta (gale/cyclonic)
    if (t < 0.3) return new THREE.Color().lerpColors(new THREE.Color(0x38bdf8), new THREE.Color(0x10b981), t / 0.3);
    if (t < 0.6) return new THREE.Color().lerpColors(new THREE.Color(0x10b981), new THREE.Color(0xf59e0b), (t - 0.3) / 0.3);
    if (t < 0.85) return new THREE.Color().lerpColors(new THREE.Color(0xf59e0b), new THREE.Color(0xef4444), (t - 0.6) / 0.25);
    return new THREE.Color().lerpColors(new THREE.Color(0xef4444), new THREE.Color(0xd946ef), (t - 0.85) / 0.15);
  } else if (paramId === 'surface_pressure') {
    // Barometric scale: Magenta/Crimson (cyclonic low) -> Cyan -> Deep Navy (high pressure anticyclone)
    if (t < 0.35) return new THREE.Color().lerpColors(new THREE.Color(0xd946ef), new THREE.Color(0xef4444), t / 0.35);
    if (t < 0.6) return new THREE.Color().lerpColors(new THREE.Color(0xef4444), new THREE.Color(0x00ffcc), (t - 0.35) / 0.25);
    return new THREE.Color().lerpColors(new THREE.Color(0x00ffcc), new THREE.Color(0x0f2b5c), (t - 0.6) / 0.4);
  } else {
    // Current Velocity: Dark Purple -> Magenta -> Orange -> Bright Yellow
    if (t < 0.4) return new THREE.Color().lerpColors(new THREE.Color(0x2a0845), new THREE.Color(0x8e24aa), t / 0.4);
    if (t < 0.75) return new THREE.Color().lerpColors(new THREE.Color(0x8e24aa), new THREE.Color(0xf4511e), (t - 0.4) / 0.35);
    return new THREE.Color().lerpColors(new THREE.Color(0xf4511e), new THREE.Color(0xffeb3b), (t - 0.75) / 0.25);
  }
}

// Diverging color scale helper for Difference layer (Observed - Model)
function getDifferenceColor(residual: number, maxResidual: number): THREE.Color {
  const norm = Math.max(-1, Math.min(1, residual / (maxResidual || 1)));
  if (norm < 0) {
    // Negative difference: Cool blue (0x0284c7) -> Neutral silver/cyan (0xe0f2fe)
    return new THREE.Color().lerpColors(new THREE.Color(0x0284c7), new THREE.Color(0xe0f2fe), norm + 1);
  } else {
    // Positive difference: Neutral silver/cyan (0xe0f2fe) -> Warm crimson (0xef4444)
    return new THREE.Color().lerpColors(new THREE.Color(0xe0f2fe), new THREE.Color(0xef4444), norm);
  }
}

export const Ocean3DViewer: React.FC<Ocean3DViewerProps> = ({
  gridData,
  observations,
  currentParameter,
  currentRegion,
  currentDepth,
  layers,
  selectedObservation,
  onSelectObservation,
  researchVehicle
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Group references
  const oceanSurfaceRef = useRef<THREE.Mesh | null>(null);
  const oceanPointsRef = useRef<THREE.Points | null>(null);
  const buoysGroupRef = useRef<THREE.Group | null>(null);
  const auvGroupRef = useRef<THREE.Group | null>(null);
  const flowVectorsGroupRef = useRef<THREE.Group | null>(null);
  const landmassGroupRef = useRef<THREE.Group | null>(null);
  const gridLinesGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState<boolean>(false);

  // Coordinate projection helper: converts lat, lon into 3D scene coordinates (centered around current region)
  const projectGeoTo3D = (lat: number, lon: number, alt: number = 0) => {
    const scale = 0.5;
    const x = (lon - currentRegion.center_lon) * scale;
    const z = -(lat - currentRegion.center_lat) * scale; // negative z points north
    const y = alt;
    return new THREE.Vector3(x, y, z);
  };

  // 1. Initialize Three.js Scene and Camera
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x040914);
    scene.fog = new THREE.FogExp2(0x040914, 0.025);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const baseZoom = 4.5;
    const zoomRatio = baseZoom / (currentRegion.default_zoom || 4.5);
    camera.position.set(0, 18 * zoomRatio, 16 * zoomRatio);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.05; // don't go below sea level plane
    controls.minDistance = 3;
    controls.maxDistance = 80;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xd9f1ff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xa5f3fc, 1.2);
    sunLight.position.set(20, 40, 20);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(-20, 15, -20);
    scene.add(rimLight);

    // Groups
    const buoysGroup = new THREE.Group();
    scene.add(buoysGroup);
    buoysGroupRef.current = buoysGroup;

    const auvGroup = new THREE.Group();
    scene.add(auvGroup);
    auvGroupRef.current = auvGroup;

    const flowGroup = new THREE.Group();
    scene.add(flowGroup);
    flowVectorsGroupRef.current = flowGroup;

    const landGroup = new THREE.Group();
    scene.add(landGroup);
    landmassGroupRef.current = landGroup;

    const gridLines = new THREE.Group();
    scene.add(gridLines);
    gridLinesGroupRef.current = gridLines;

    // Container Resize handling (Window & Side Panel Collapse/Expand)
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      controls.update();

      // Subtle breathing wave motion for ocean surface
      if (oceanSurfaceRef.current) {
        oceanSurfaceRef.current.position.y = Math.sin(elapsedTime * 1.2) * 0.04;
      }

      // Pulse beacon rings for observation markers
      if (buoysGroupRef.current) {
        buoysGroupRef.current.children.forEach((child) => {
          const ring = child.getObjectByName('pulseRing');
          if (ring) {
            const scale = 1.0 + Math.sin(elapsedTime * 3.5 + child.id) * 0.45;
            ring.scale.set(scale, scale, 1);
            const ringMat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
            if (ringMat) {
              ringMat.opacity = Math.max(0.15, 0.8 - (scale - 1.0) * 1.5);
            }
          }
        });
      }

      // Animate flow current particles along their actual u, v velocity vectors
      if (flowVectorsGroupRef.current && flowVectorsGroupRef.current.visible) {
        flowVectorsGroupRef.current.children.forEach((p) => {
          if (p.userData && p.userData.vx !== undefined) {
            p.position.x += p.userData.vx;
            p.position.z += p.userData.vz;
            p.userData.age = (p.userData.age || 0) + 1;
            if (p.userData.age > 75) {
              p.position.x = p.userData.originX;
              p.position.z = p.userData.originZ;
              p.userData.age = 0;
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 1b. Region-specific camera framing: adjust camera distance based on default_zoom
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const baseZoom = 4.5;
    const zoomRatio = baseZoom / (currentRegion.default_zoom || 4.5);
    cameraRef.current.position.set(0, 18 * zoomRatio, 16 * zoomRatio);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [currentRegion.id, currentRegion.default_zoom]);

  // 2. Build Geographic Features & Coastlines
  useEffect(() => {
    if (!landmassGroupRef.current || !gridLinesGroupRef.current) return;
    const landGroup = landmassGroupRef.current;
    const gridLines = gridLinesGroupRef.current;

    // Clear old geography
    while (landGroup.children.length > 0) {
      landGroup.remove(landGroup.children[0]);
    }
    while (gridLines.children.length > 0) {
      gridLines.remove(gridLines.children[0]);
    }

    // Build stylized Indian Peninsula & Sri Lanka & Bay of Bengal rim
    // Indian Mainland stylized polygon
    const indiaCoast = [
      { lat: 8.1, lon: 77.55 },   // Kanyakumari
      { lat: 10.0, lon: 79.85 },  // Nagapattinam
      { lat: 13.08, lon: 80.27 }, // Chennai
      { lat: 17.68, lon: 83.21 }, // Visakhapatnam
      { lat: 19.8, lon: 85.8 },   // Puri
      { lat: 21.6, lon: 87.5 },   // Digha
      { lat: 22.5, lon: 88.3 },   // Sundarbans base
      { lat: 26.0, lon: 88.0 },   // North inland
      { lat: 26.0, lon: 73.0 },   // Rajasthan inland
      { lat: 23.0, lon: 70.0 },   // Gujarat
      { lat: 20.9, lon: 71.5 },   // Saurashtra
      { lat: 18.9, lon: 72.8 },   // Mumbai
      { lat: 15.3, lon: 73.8 },   // Goa
      { lat: 12.9, lon: 74.8 },   // Mangalore
      { lat: 9.9, lon: 76.2 },    // Kochi
      { lat: 8.1, lon: 77.55 }    // Kanyakumari
    ];

    const landShape = new THREE.Shape();
    indiaCoast.forEach((pt, i) => {
      const pos = projectGeoTo3D(pt.lat, pt.lon, 0);
      if (i === 0) landShape.moveTo(pos.x, -pos.z);
      else landShape.lineTo(pos.x, -pos.z);
    });

    const extrudeSettings = { depth: 0.35, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
    const landGeo = new THREE.ExtrudeGeometry(landShape, extrudeSettings);
    landGeo.rotateX(Math.PI / 2); // align with x-z plane

    const landMat = new THREE.MeshStandardMaterial({
      color: 0x0f223a,
      roughness: 0.7,
      metalness: 0.2,
      emissive: 0x071526,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });

    const landMesh = new THREE.Mesh(landGeo, landMat);
    landMesh.position.y = 0.05;
    landGroup.add(landMesh);

    // Glowing shoreline contour line
    const coastPoints: THREE.Vector3[] = indiaCoast.map(pt => projectGeoTo3D(pt.lat, pt.lon, 0.42));
    const coastGeo = new THREE.BufferGeometry().setFromPoints(coastPoints);
    const coastMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2, transparent: true, opacity: 0.85 });
    const coastLine = new THREE.Line(coastGeo, coastMat);
    landGroup.add(coastLine);

    // Sri Lanka island
    const sriLankaCoast = [
      { lat: 9.8, lon: 80.2 },
      { lat: 8.5, lon: 81.2 },
      { lat: 6.0, lon: 80.6 },
      { lat: 6.9, lon: 79.8 },
      { lat: 9.0, lon: 79.8 },
      { lat: 9.8, lon: 80.2 }
    ];
    const slShape = new THREE.Shape();
    sriLankaCoast.forEach((pt, i) => {
      const pos = projectGeoTo3D(pt.lat, pt.lon, 0);
      if (i === 0) slShape.moveTo(pos.x, -pos.z);
      else slShape.lineTo(pos.x, -pos.z);
    });
    const slGeo = new THREE.ExtrudeGeometry(slShape, extrudeSettings);
    slGeo.rotateX(Math.PI / 2);
    const slMesh = new THREE.Mesh(slGeo, landMat);
    slMesh.position.y = 0.05;
    landGroup.add(slMesh);

    const slPoints = sriLankaCoast.map(pt => projectGeoTo3D(pt.lat, pt.lon, 0.42));
    const slLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(slPoints), coastMat);
    landGroup.add(slLine);

    // Andaman & Nicobar Archipelago (Crucial for Bay of Bengal)
    const andamanPoints = [
      { lat: 13.5, lon: 93.0 },
      { lat: 12.0, lon: 92.8 },
      { lat: 10.5, lon: 92.6 },
      { lat: 8.0, lon: 93.5 },
      { lat: 7.0, lon: 93.8 }
    ];
    andamanPoints.forEach((pt) => {
      const pos = projectGeoTo3D(pt.lat, pt.lon, 0.15);
      const isleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.35, 6),
        landMat
      );
      isleMesh.position.copy(pos);
      landGroup.add(isleMesh);
    });

    // Additional regional coastline contours for geographic context:
    // 1. Arabian Peninsula & Persian Gulf Coastline
    const arabiaCoast = [
      { lat: 12.6, lon: 44.0 }, // Bab el Mandeb
      { lat: 14.5, lon: 49.2 }, // Yemen south coast
      { lat: 17.0, lon: 54.5 }, // Salalah
      { lat: 20.8, lon: 58.8 }, // Oman east coast
      { lat: 22.6, lon: 59.8 }, // Sur / Ras al Hadd
      { lat: 24.5, lon: 57.5 }, // Muscat / Gulf of Oman
      { lat: 26.2, lon: 56.4 }, // Strait of Hormuz
      { lat: 27.2, lon: 51.5 }, // Qatar / Persian Gulf
      { lat: 29.5, lon: 48.5 }  // Kuwait / Shatt al Arab
    ];
    const arabiaPoints = arabiaCoast.map(pt => projectGeoTo3D(pt.lat, pt.lon, 0.35));
    const arabiaLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arabiaPoints), coastMat);
    landGroup.add(arabiaLine);

    // 2. East African Horn / Somalia Coastline
    const somaliaCoast = [
      { lat: 12.0, lon: 51.0 }, // Ras Asir (Horn of Africa)
      { lat: 10.5, lon: 51.3 },
      { lat: 7.5, lon: 49.8 },
      { lat: 4.5, lon: 48.0 },
      { lat: 2.0, lon: 45.3 }, // Mogadishu
      { lat: -0.5, lon: 42.8 },
      { lat: -4.0, lon: 39.6 } // Mombasa
    ];
    const somaliaPoints = somaliaCoast.map(pt => projectGeoTo3D(pt.lat, pt.lon, 0.35));
    const somaliaLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(somaliaPoints), coastMat);
    landGroup.add(somaliaLine);

    // 3. Southeast Asian Coastline (Myanmar, Thailand, Malaysia, Sumatra)
    const seAsiaCoast = [
      { lat: 21.0, lon: 92.2 }, // Rakhine Coast
      { lat: 18.0, lon: 94.2 },
      { lat: 16.0, lon: 95.0 }, // Irrawaddy Delta
      { lat: 13.5, lon: 98.2 }, // Tenasserim Coast
      { lat: 9.5, lon: 98.5 },  // Phuket
      { lat: 7.0, lon: 100.0 }, // Strait of Malacca
      { lat: 3.5, lon: 101.5 },
      { lat: 1.3, lon: 103.8 }  // Singapore
    ];
    const seAsiaPoints = seAsiaCoast.map(pt => projectGeoTo3D(pt.lat, pt.lon, 0.35));
    const seAsiaLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(seAsiaPoints), coastMat);
    landGroup.add(seAsiaLine);

    const sumatraCoast = [
      { lat: 5.6, lon: 95.3 },  // Banda Aceh (Sumatra north tip)
      { lat: 3.0, lon: 97.5 },
      { lat: 0.5, lon: 99.0 },
      { lat: -2.5, lon: 101.5 },
      { lat: -5.5, lon: 105.5 } // Sunda Strait
    ];
    const sumatraPoints = sumatraCoast.map(pt => projectGeoTo3D(pt.lat, pt.lon, 0.35));
    const sumatraLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(sumatraPoints), coastMat);
    landGroup.add(sumatraLine);

    // Lat/Lon Reference Grid lines
    const gridLineMat = new THREE.LineBasicMaterial({
      color: 0x1e3a8a,
      transparent: true,
      opacity: 0.35
    });

    // Latitude lines
    for (let lat = 0; lat <= 30; lat += 5) {
      const pts = [projectGeoTo3D(lat, 50, -0.05), projectGeoTo3D(lat, 105, -0.05)];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridLineMat);
      gridLines.add(line);
    }
    // Longitude lines
    for (let lon = 50; lon <= 105; lon += 5) {
      const pts = [projectGeoTo3D(0, lon, -0.05), projectGeoTo3D(28, lon, -0.05)];
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridLineMat);
      gridLines.add(line);
    }

  }, [currentRegion]);

  // 3. Render Dynamic Ocean Digital Twin Surface (Dense Numerical Grid)
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove existing ocean mesh
    if (oceanSurfaceRef.current) {
      scene.remove(oceanSurfaceRef.current);
      oceanSurfaceRef.current.geometry.dispose();
      oceanSurfaceRef.current = null;
    }
    if (oceanPointsRef.current) {
      scene.remove(oceanPointsRef.current);
      oceanPointsRef.current.geometry.dispose();
      oceanPointsRef.current = null;
    }

    if (!layers.model || gridData.length === 0) return;

    // Compute bounds and color buffers
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    const minVal = currentParameter.min_val;
    const maxVal = currentParameter.max_val;

    // Depth displacement factor (visualizing depth slice level)
    const depthY = -currentDepth * 0.0035;
    const isDiffActive = layers.difference && observations.length > 0;
    const maxDiff = currentParameter.id === 'sst' ? 2.5 : currentParameter.id === 'salinity' ? 2.0 : currentParameter.id === 'ssh' ? 0.3 : 0.8;

    gridData.forEach((pt) => {
      const pos = projectGeoTo3D(pt.lat, pt.lon, depthY);

      // Height modulation based on SSH (Sea surface elevation)
      const heightOffset = pt.ssh * 0.8;
      positions.push(pos.x, pos.y + heightOffset, pos.z);

      let color: THREE.Color;
      if (isDiffActive) {
        // Weighted influence from in-situ observations (lightweight stable interpolation)
        let diffSum = 0;
        let weightSum = 0;
        for (let k = 0; k < observations.length; k++) {
          const obs = observations[k];
          if (obs.difference === null || obs.difference === undefined) continue;
          const dLat = pt.lat - obs.lat;
          const dLon = pt.lon - obs.lon;
          const distSq = dLat * dLat + dLon * dLon;
          const w = 1.0 / (distSq + 0.4);
          diffSum += obs.difference * w;
          weightSum += w;
        }
        const ptDiff = weightSum > 0 ? diffSum / weightSum : 0;
        color = getDifferenceColor(ptDiff, maxDiff);
      } else {
        const colorVal = pt.parameter_value;
        color = getParameterColor(currentParameter.id, colorVal, minVal, maxVal);
      }
      colors.push(color.r, color.g, color.b);
      sizes.push(8.5);
    });

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    pointsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Dynamic point material with soft circular alpha
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.85)');
      grad.addColorStop(0.8, 'rgba(255,255,255,0.25)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const pointsMat = new THREE.PointsMaterial({
      size: 0.65,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const oceanPoints = new THREE.Points(pointsGeo, pointsMat);
    scene.add(oceanPoints);
    oceanPointsRef.current = oceanPoints;

    // Base glowing bathymetric plane beneath
    const baseZoom = 4.5;
    const zoomRatio = baseZoom / (currentRegion.default_zoom || 4.5);
    const planeW = 28 * Math.max(1, zoomRatio * 0.9);
    const planeH = 22 * Math.max(1, zoomRatio * 0.9);
    const planeGeo = new THREE.PlaneGeometry(planeW, planeH, 40, 40);
    planeGeo.rotateX(-Math.PI / 2);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x041935,
      roughness: 0.85,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65,
      wireframe: false
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.position.y = depthY - 0.25;
    scene.add(planeMesh);
    oceanSurfaceRef.current = planeMesh;

  }, [gridData, currentParameter, currentRegion, currentDepth, layers.model, layers.difference, observations]);

  // 4. Render In-Situ Observation Markers (RAMA buoys, Argo floats)
  useEffect(() => {
    if (!buoysGroupRef.current) return;
    const group = buoysGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (!layers.observations) return;

    observations.forEach((obs) => {
      const depthY = -currentDepth * 0.0035;
      const pos = projectGeoTo3D(obs.lat, obs.lon, depthY + 0.3);

      const isSelected = selectedObservation?.id === obs.id;

      // Color code by Anomaly Severity:
      // NORMAL: Emerald Green
      // MODERATE DEVIATION: Warning Amber
      // SIGNIFICANT ANOMALY: Vivid Crimson Red
      let beaconColor = 0x10b981; // Green
      if (obs.anomaly_severity === 'MODERATE DEVIATION') {
        beaconColor = 0xf59e0b; // Amber
      } else if (obs.anomaly_severity === 'SIGNIFICANT ANOMALY') {
        beaconColor = 0xef4444; // Crimson Red
      }

      const buoyContainer = new THREE.Group();
      buoyContainer.position.copy(pos);
      buoyContainer.userData = { observation: obs };

      // Buoy Body (Cylinder / Float body)
      const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.5, 16);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0x38bdf8 : beaconColor,
        roughness: 0.3,
        metalness: 0.8,
        emissive: beaconColor,
        emissiveIntensity: isSelected ? 0.8 : (obs.anomaly_severity === 'SIGNIFICANT ANOMALY' ? 0.6 : 0.25)
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.25;
      buoyContainer.add(bodyMesh);

      // Antenna mast & Sensor head
      const mastGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 });
      const mastMesh = new THREE.Mesh(mastGeo, mastMat);
      mastMesh.position.y = 0.7;
      buoyContainer.add(mastMesh);

      // Flashing Beacon Light at top
      const beaconGeo = new THREE.SphereGeometry(0.09, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x38bdf8 : beaconColor
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.y = 0.95;
      buoyContainer.add(beaconMesh);

      // Pulsing Radar Ping Ring for Anomalies or Selected Station
      const showRing = isSelected || (layers.anomaly && obs.anomaly_severity !== 'NORMAL');
      if (showRing) {
        const ringGeo = new THREE.RingGeometry(0.3, 0.4, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: beaconColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.name = 'pulseRing';
        ringMesh.position.y = 0.02;
        buoyContainer.add(ringMesh);
      }

      // Vertical Tether line descending into depth
      const tetherGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -1.8, 0)
      ]);
      const tetherMat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.15,
        gapSize: 0.08,
        transparent: true,
        opacity: 0.45
      });
      const tetherLine = new THREE.Line(tetherGeo, tetherMat);
      tetherLine.computeLineDistances();
      buoyContainer.add(tetherLine);

      group.add(buoyContainer);
    });

  }, [observations, layers.observations, layers.anomaly, selectedObservation, currentDepth]);

  // 5. Render Animated Current Velocity Vectors
  useEffect(() => {
    if (!flowVectorsGroupRef.current) return;
    const group = flowVectorsGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    group.visible = layers.currentVectors;
    if (!layers.currentVectors) return;

    const depthY = -currentDepth * 0.0035;

    // Subsample grid points to display streamlined dynamic velocity vectors
    const stride = currentRegion.id === 'bay_of_bengal' ? 2 : 3;
    gridData.forEach((pt, i) => {
      if (i % stride !== 0) return;

      const pos = projectGeoTo3D(pt.lat, pt.lon, depthY + 0.15);
      const rawMag = pt.current_magnitude ?? Math.hypot(pt.current_u || 0, pt.current_v || 0);
      const mag = Math.min(1.5, Math.max(0.2, Number.isFinite(rawMag) && rawMag > 0 ? rawMag : 0.4));

      // Arrow direction vector
      const u = Number.isFinite(pt.current_u) ? pt.current_u : 0.1;
      const v = Number.isFinite(pt.current_v) ? pt.current_v : 0.1;
      const dir = new THREE.Vector3(u, 0, -v);
      if (dir.lengthSq() < 1e-6) dir.set(0.1, 0, -0.1);
      dir.normalize();
      const length = mag * 0.7;

      const arrow = new THREE.ArrowHelper(
        dir,
        pos,
        length,
        0x38bdf8,
        length * 0.35,
        length * 0.25
      );
      (arrow.line.material as THREE.LineBasicMaterial).transparent = true;
      (arrow.line.material as THREE.LineBasicMaterial).opacity = 0.75;

      arrow.userData = {
        originX: pos.x,
        originZ: pos.z,
        vx: dir.x * mag * 0.018,
        vz: dir.z * mag * 0.018,
        age: (i * 7) % 75
      };

      group.add(arrow);
    });

  }, [gridData, layers.currentVectors, currentRegion, currentDepth]);

  // 5b. Render Scientific Research AUV Survey Vehicle
  useEffect(() => {
    if (!auvGroupRef.current) return;
    const group = auvGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (!layers.auv || !researchVehicle) return;

    const depthY = -researchVehicle.depth * 0.0035;
    const pos = projectGeoTo3D(researchVehicle.lat, researchVehicle.lon, depthY + 0.35);

    const auvContainer = new THREE.Group();
    auvContainer.position.copy(pos);

    const headingRad = THREE.MathUtils.degToRad(researchVehicle.heading);
    auvContainer.rotation.y = -headingRad;

    const currentReadingVal = researchVehicle.current_readings[currentParameter.id] ?? 11.4;

    const auvObservation: ObservationPoint = {
      id: researchVehicle.id,
      platform_name: researchVehicle.name,
      platform_type: researchVehicle.vehicle_type,
      lat: researchVehicle.lat,
      lon: researchVehicle.lon,
      depth: researchVehicle.depth,
      time: new Date().toISOString(),
      temperature: researchVehicle.current_readings.temperature ?? 11.4,
      salinity: researchVehicle.current_readings.salinity ?? 34.8,
      ssh: 0.0,
      current_magnitude: researchVehicle.current_readings.current_velocity ?? 0.18,
      oxygen: researchVehicle.current_readings.oxygen ?? 24.8,
      chlorophyll: 0.05,
      model_value: currentReadingVal,
      observed_value: currentReadingVal,
      difference: 0.0,
      z_score: 0.0,
      anomaly_severity: 'NORMAL',
      anomaly_reason: `Autonomous survey dive demonstration at ${researchVehicle.depth}m depth. Battery: ${researchVehicle.battery_percent}%. Speed: ${researchVehicle.speed_knots} kts.`,
      decision_support: researchVehicle.mission,
      data_status: 'SIMULATED',
      source_attribution: `${researchVehicle.operator} - ${researchVehicle.scientific_disclaimer}`,
      is_observed_available: true
    };

    auvContainer.userData = { observation: auvObservation };

    // Hull: Yellow cylinder
    const hullGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.6, 16);
    hullGeo.rotateX(Math.PI / 2);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.25,
      metalness: 0.5,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.2
    });
    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.userData = { observation: auvObservation };
    auvContainer.add(hullMesh);

    // Nose Cone
    const noseGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 });
    const noseMesh = new THREE.Mesh(noseGeo, noseMat);
    noseMesh.position.z = 0.8;
    noseMesh.userData = { observation: auvObservation };
    auvContainer.add(noseMesh);

    // Hydrofoil Wings
    const wingGeo = new THREE.BoxGeometry(1.8, 0.03, 0.3);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const wingMesh = new THREE.Mesh(wingGeo, wingMat);
    wingMesh.position.z = 0.1;
    wingMesh.userData = { observation: auvObservation };
    auvContainer.add(wingMesh);

    // Tail Rudder
    const rudderGeo = new THREE.BoxGeometry(0.04, 0.5, 0.35);
    const rudderMesh = new THREE.Mesh(rudderGeo, wingMat);
    rudderMesh.position.set(0, 0.25, -0.75);
    rudderMesh.userData = { observation: auvObservation };
    auvContainer.add(rudderMesh);

    // Beacon Light
    const beaconLight = new THREE.PointLight(0x38bdf8, 1.2, 4.0);
    beaconLight.position.set(0, 0.4, 0.0);
    auvContainer.add(beaconLight);

    group.add(auvContainer);

    // Survey Waypoint Track
    if (researchVehicle.waypoints && researchVehicle.waypoints.length > 1) {
      const trackPoints = researchVehicle.waypoints.map(wp => {
        const wpDepthY = -wp.depth * 0.0035;
        return projectGeoTo3D(wp.lat, wp.lon, wpDepthY + 0.35);
      });
      const trackGeo = new THREE.BufferGeometry().setFromPoints(trackPoints);
      const trackMat = new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        dashSize: 0.5,
        gapSize: 0.25,
        transparent: true,
        opacity: 0.65
      });
      const trackLine = new THREE.Line(trackGeo, trackMat);
      trackLine.computeLineDistances();
      group.add(trackLine);
    }
  }, [layers.auv, researchVehicle, currentRegion, currentParameter]);

  // 6. Raycasting for Observation & AUV Click / Hover Interaction
  const handlePointerDown = (event: React.MouseEvent<HTMLDivElement>) => {
    pointerDownPosRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current) return;
    const dx = event.clientX - pointerDownPosRef.current.x;
    const dy = event.clientY - pointerDownPosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const interactiveObjects = [
      ...(buoysGroupRef.current?.children || []),
      ...(auvGroupRef.current?.children || [])
    ];
    const intersects = raycasterRef.current.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      let target: THREE.Object3D | null = intersects[0].object;
      while (target && !target.userData?.observation && target.parent) {
        target = target.parent;
      }
      if (target?.userData?.observation) {
        onSelectObservation(target.userData.observation as ObservationPoint);
      }
    }
  };

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();

    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const interactiveObjects = [
      ...(buoysGroupRef.current?.children || []),
      ...(auvGroupRef.current?.children || [])
    ];
    const intersects = raycasterRef.current.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      let target: THREE.Object3D | null = intersects[0].object;
      while (target && !target.userData?.observation && target.parent) {
        target = target.parent;
      }
      if (target?.userData?.observation) {
        const obs = target.userData.observation as ObservationPoint;
        setHoveredStation(obs.platform_name);
        setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        return;
      }
    }
    setHoveredStation(null);
    setTooltipPos(null);
  };

  // Camera preset handlers respecting region zoom scale
  const handleResetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    const baseZoom = 4.5;
    const zoomRatio = baseZoom / (currentRegion.default_zoom || 4.5);
    cameraRef.current.position.set(0, 18 * zoomRatio, 16 * zoomRatio);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const handleTopDownView = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    const baseZoom = 4.5;
    const zoomRatio = baseZoom / (currentRegion.default_zoom || 4.5);
    cameraRef.current.position.set(0, 26 * zoomRatio, 0.01);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.multiplyScalar(delta);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#040914]">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
      />

      {/* Floating Hover Tooltip */}
      {hoveredStation && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none px-3 py-1.5 rounded-lg glass-panel text-xs text-cyan-300 font-mono tracking-wide border border-cyan-500/30 glow-cyan-border shadow-xl transform -translate-x-1/2 -translate-y-12"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          {hoveredStation}
          <div className="text-[10px] text-slate-300">Click to Inspect Sensor Data</div>
        </div>
      )}

      {/* Camera Viewport Controls Overlay (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 glass-panel p-1.5 rounded-xl border border-sky-500/20 backdrop-blur-md">
        <button
          onClick={handleResetCamera}
          title="Reset 3D Perspective"
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-sky-500/20 rounded-lg transition-all"
        >
          <Rotate3D className="w-5 h-5" />
        </button>
        <button
          onClick={handleTopDownView}
          title="Nadir Bathymetry View"
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-sky-500/20 rounded-lg transition-all"
        >
          <Compass className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleZoom(0.85)}
          title="Zoom In"
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-sky-500/20 rounded-lg transition-all"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleZoom(1.15)}
          title="Zoom Out"
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-sky-500/20 rounded-lg transition-all"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Region & Depth Badge Overlay (Top Left) */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-3">
        <div className="glass-panel px-3.5 py-1.5 rounded-xl border border-sky-500/20 flex items-center gap-2.5">
          <Waves className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {currentRegion.name}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
            {currentDepth}m Depth
          </span>
        </div>
      </div>

      {/* Scientific Parameter & Difference Legend Bar (Bottom Left of 3D Canvas) */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel p-2.5 rounded-xl border border-sky-500/20 max-w-xs transition-all select-none">
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="text-[11px] font-semibold text-cyan-300">
            {layers.difference ? 'Difference Scale' : currentParameter.name}
          </span>
          <button
            onClick={() => setIsLegendCollapsed(prev => !prev)}
            className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
            title={isLegendCollapsed ? "Expand Legend" : "Collapse Legend"}
          >
            {isLegendCollapsed ? 'Expand' : 'Hide'}
          </button>
        </div>

        {!isLegendCollapsed && (
          <div className="mt-1.5">
            {layers.difference ? (
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                  <span className="text-amber-300 font-medium">Observed − Model</span>
                  <span className="font-mono text-slate-400">{currentParameter.unit}</span>
                </div>

                {/* Diverging Residual Gradient Bar */}
                <div
                  className="h-2 w-full rounded-full border border-sky-500/30"
                  style={{
                    background: 'linear-gradient(to right, #0284c7, #e0f2fe, #ef4444)'
                  }}
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-300 mt-1">
                  <span className="text-sky-400">
                    -{currentParameter.id === 'sst' ? '2.5' : currentParameter.id === 'salinity' ? '2.0' : currentParameter.id === 'ssh' ? '0.3' : '0.8'}
                  </span>
                  <span className="text-slate-300 font-bold">0.0</span>
                  <span className="text-rose-400">
                    +{currentParameter.id === 'sst' ? '2.5' : currentParameter.id === 'salinity' ? '2.0' : currentParameter.id === 'ssh' ? '0.3' : '0.8'}
                  </span>
                </div>

                <div className="text-[9.5px] text-slate-400 mt-1.5 pt-1 border-t border-sky-500/15 flex items-center justify-between">
                  <span className="text-sky-400">Cool: Underprediction</span>
                  <span className="text-rose-400">Warm: Overprediction</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                  <span className="text-slate-300 font-medium">{currentParameter.name}</span>
                  <span className="font-mono text-slate-400">{currentParameter.unit}</span>
                </div>

                {/* Dynamic Gradient Bar */}
                <div
                  className="h-2 w-full rounded-full border border-sky-500/30"
                  style={{
                    background:
                      currentParameter.id === 'sst'
                        ? 'linear-gradient(to right, #0f2b5c, #0088cc, #00ffcc, #ffcc00, #ee2222)'
                        : currentParameter.id === 'salinity'
                        ? 'linear-gradient(to right, #1a237e, #00897b, #7cb342, #fdd835)'
                        : currentParameter.id === 'ssh'
                        ? 'linear-gradient(to right, #1565c0, #80deea, #ffffff, #ff9800, #e53935)'
                        : 'linear-gradient(to right, #2a0845, #8e24aa, #f4511e, #ffeb3b)'
                  }}
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>{currentParameter.min_val}</span>
                  <span>{((currentParameter.min_val + currentParameter.max_val) / 2).toFixed(1)}</span>
                  <span>{currentParameter.max_val}</span>
                </div>

                {/* Legend Key */}
                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 pt-1 border-t border-sky-500/15">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> |Z|&lt;1.5
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> 1.5-2.5
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> ≥2.5
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
