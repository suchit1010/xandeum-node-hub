import React, { useEffect, useRef, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import ThreeGlobe from "three-globe";
import * as THREE from "three";

// --- THEME COLORS ---
const COLORS = {
  land: "#1e293b",     // Deep navy for land dots
  primary: "#2dd4bf",  // Xandeum Cyan
  warning: "#f59e0b",  // Orange
  danger: "#ef4444",   // Red/Issue
  background: "#060b13" 
};

interface NodeRegion {
  lat: number;
  lng: number;
  name: string;
  color: string;
  pulse?: boolean;
}

// --- DATA FROM CSV (Shortened Labels & Health-Based Colors) ---
const NODE_REGIONS: NodeRegion[] = [
  { lat: 1.4, lng: 103.8, name: "Singapore: 3", color: COLORS.primary, pulse: true },
  { lat: 52.5, lng: -1.5, name: "England: 20", color: COLORS.primary },
  { lat: 40.4, lng: -3.7, name: "Madrid: 1", color: COLORS.primary },
  { lat: 48.6, lng: 6.0, name: "Grand Est: 94", color: COLORS.warning },
  { lat: 38.5, lng: -92.5, name: "Missouri: 30", color: COLORS.warning },
  { lat: 48.8, lng: 11.5, name: "Bavaria: 10", color: COLORS.warning },
  { lat: 59.3, lng: 18.0, name: "Stockholm: 7", color: COLORS.danger },
  { lat: 4.8, lng: 7.0, name: "Nigeria: 10", color: COLORS.danger },
  { lat: 28.6, lng: 77.1, name: "Delhi: 2", color: COLORS.danger },
  { lat: 35.6, lng: 139.6, name: "Tokyo: 1", color: COLORS.primary }
];

const GlobeCore = () => {
  const globeRef = useRef<THREE.Group>(null!);
  
  const globeInstance = useMemo(() => {
    return new ThreeGlobe()
      // 1. DOTTED LANDMASS (Hexagonal grid)
      .hexPolygonsData([]) 
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .hexPolygonColor(() => COLORS.land)
      
      // 2. ATMOSPHERE (Subtle cyan glow)
      .showAtmosphere(true)
      .atmosphereColor(COLORS.primary)
      .atmosphereAltitude(0.15)
      
      // 3. REGIONAL NODES (Markers from CSV)
      .labelsData(NODE_REGIONS)
      .labelDotRadius(0.8)
      .labelSize(1.5)
      .labelColor((d: NodeRegion) => d.color)
      .labelText((d: NodeRegion) => d.name)
      .labelIncludeDot(true)
      
      // 4. PULSES (Main Hubs)
      .ringsData(NODE_REGIONS.filter(d => d.pulse))
      .ringColor(() => COLORS.primary)
      .ringMaxRadius(12)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(2000);
  }, []);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/three-globe/master/example/country-polygons/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(countries => globeInstance.hexPolygonsData(countries.features));
    
    if (globeRef.current) {
      globeRef.current.add(globeInstance);
    }
  }, [globeInstance]);

  return <group ref={globeRef} scale={[1, 1, 1]} />;
};

export default function AnalyticsGlobe() {
  return (
    /* Medium container size for the Analytics Tab */
    <div className="w-full h-[450px] bg-[#060b13] rounded-xl overflow-hidden relative border border-white/5 shadow-2xl">
      
      {/* UI OVERLAY: Status Legend */}
      <div className="absolute top-5 left-6 z-10 pointer-events-none">
        <h2 className="text-sm font-bold text-white opacity-90 tracking-tight"> Xandeum PNode Distribution</h2>
        <div className="flex gap-4 mt-2">
           <div className="flex items-center gap-1.5">
             <span className="w-2 h-2 rounded-full bg-[#2dd4bf]"></span>
             <span className="text-[9px] text-gray-400 uppercase font-mono tracking-wider">Online</span>
           </div>
           <div className="flex items-center gap-1.5">
             <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
             <span className="text-[9px] text-gray-400 uppercase font-mono tracking-wider">Issues (Uptime &lt; 70%)</span>
           </div>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 480], fov: 45 }}>
        <Stars radius={300} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.8} />
        <pointLight position={[100, 100, 100]} intensity={1.5} color={COLORS.primary} />
        <GlobeCore />
        <OrbitControls 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5} 
          minDistance={300} // This is your Max Zoom limit
          maxDistance={600} 
        />
      </Canvas>
    </div>
  );
}