import { Suspense, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { PNode } from "@/components/PNodeTable";

interface NetworkGlobeProps {
  nodes: PNode[];
  onLocationClick?: (region: string) => void;
}

// Region to lat/long mapping
const regionCoordinates: Record<string, { lat: number; lng: number; country: string }> = {
  // Europe
  "France": { lat: 46, lng: 2, country: "France" },
  "Germany": { lat: 51, lng: 10, country: "Germany" },
  "Netherlands": { lat: 52.3, lng: 4.9, country: "Netherlands" },
  "United Kingdom": { lat: 51.5, lng: -0.1, country: "United Kingdom" },
  "Finland": { lat: 61, lng: 25, country: "Finland" },
  "Poland": { lat: 52, lng: 19, country: "Poland" },
  "Spain": { lat: 40.4, lng: -3.7, country: "Spain" },
  "Italy": { lat: 41.9, lng: 12.5, country: "Italy" },
  "Sweden": { lat: 59.3, lng: 18, country: "Sweden" },
  "Switzerland": { lat: 46.8, lng: 8.2, country: "Switzerland" },
  "Belgium": { lat: 50.8, lng: 4.4, country: "Belgium" },
  "Austria": { lat: 48.2, lng: 16.4, country: "Austria" },
  "Portugal": { lat: 38.7, lng: -9.1, country: "Portugal" },
  "Ireland": { lat: 53.3, lng: -6.3, country: "Ireland" },
  "Denmark": { lat: 55.7, lng: 12.6, country: "Denmark" },
  "Norway": { lat: 59.9, lng: 10.7, country: "Norway" },
  "Czech Republic": { lat: 50.1, lng: 14.4, country: "Czech Republic" },
  "Romania": { lat: 44.4, lng: 26.1, country: "Romania" },
  "Hungary": { lat: 47.5, lng: 19, country: "Hungary" },
  "Ukraine": { lat: 50.4, lng: 30.5, country: "Ukraine" },
  "Greece": { lat: 37.98, lng: 23.7, country: "Greece" },
  "Bulgaria": { lat: 42.7, lng: 23.3, country: "Bulgaria" },
  "Europe": { lat: 50, lng: 10, country: "Europe" },
  
  // North America
  "United States": { lat: 39.8, lng: -98.6, country: "United States" },
  "US": { lat: 39.8, lng: -98.6, country: "United States" },
  "USA": { lat: 39.8, lng: -98.6, country: "United States" },
  "Missouri": { lat: 38, lng: -92, country: "USA - Missouri" },
  "California": { lat: 36.8, lng: -119.4, country: "USA - California" },
  "Texas": { lat: 31, lng: -100, country: "USA - Texas" },
  "New York": { lat: 40.7, lng: -74, country: "USA - New York" },
  "Virginia": { lat: 37.4, lng: -78.7, country: "USA - Virginia" },
  "Florida": { lat: 27.6, lng: -81.5, country: "USA - Florida" },
  "Oregon": { lat: 43.8, lng: -120.5, country: "USA - Oregon" },
  "Washington": { lat: 47.4, lng: -120.7, country: "USA - Washington" },
  "Canada": { lat: 56.1, lng: -106.3, country: "Canada" },
  "North America": { lat: 45, lng: -100, country: "North America" },
  
  // Asia
  "Japan": { lat: 36.2, lng: 138.3, country: "Japan" },
  "Singapore": { lat: 1.35, lng: 103.8, country: "Singapore" },
  "Hong Kong": { lat: 22.3, lng: 114.2, country: "Hong Kong" },
  "South Korea": { lat: 35.9, lng: 127.8, country: "South Korea" },
  "Taiwan": { lat: 23.7, lng: 121, country: "Taiwan" },
  "India": { lat: 20.6, lng: 79, country: "India" },
  "Vietnam": { lat: 14, lng: 108.3, country: "Vietnam" },
  "Thailand": { lat: 15.9, lng: 100.9, country: "Thailand" },
  "Malaysia": { lat: 4.2, lng: 101.9, country: "Malaysia" },
  "Indonesia": { lat: -0.8, lng: 113.9, country: "Indonesia" },
  "Philippines": { lat: 12.9, lng: 121.8, country: "Philippines" },
  "China": { lat: 35.9, lng: 104.2, country: "China" },
  "Asia": { lat: 34.0, lng: 100.6, country: "Asia" },
  
  // Oceania
  "Australia": { lat: -25.3, lng: 133.8, country: "Australia" },
  "New Zealand": { lat: -40.9, lng: 174.9, country: "New Zealand" },
  "Oceania": { lat: -25, lng: 140, country: "Oceania" },
  
  // South America
  "Brazil": { lat: -14.2, lng: -51.9, country: "Brazil" },
  "Argentina": { lat: -38.4, lng: -63.6, country: "Argentina" },
  "Chile": { lat: -35.7, lng: -71.5, country: "Chile" },
  "Colombia": { lat: 4.6, lng: -74.3, country: "Colombia" },
  "South America": { lat: -15, lng: -60, country: "South America" },
  
  // Africa
  "South Africa": { lat: -30.6, lng: 22.9, country: "South Africa" },
  "Nigeria": { lat: 9.1, lng: 8.7, country: "Nigeria" },
  "Kenya": { lat: -0.02, lng: 37.9, country: "Kenya" },
  "Egypt": { lat: 26.8, lng: 30.8, country: "Egypt" },
  "Africa": { lat: 8.8, lng: 34.5, country: "Africa" },
  
  // Middle East
  "UAE": { lat: 23.4, lng: 53.8, country: "UAE" },
  "Israel": { lat: 31, lng: 34.9, country: "Israel" },
  "Turkey": { lat: 38.9, lng: 35.2, country: "Turkey" },
};

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
}

interface LocationData {
  position: THREE.Vector3;
  region: string;
  country: string;
  nodeCount: number;
  avgUptime: number;
  onlineCount: number;
  lat: number;
  lng: number;
}

interface GlobePointProps {
  location: LocationData;
  maxNodes: number;
  onHover: (location: LocationData | null) => void;
  onClick: (region: string) => void;
  isHovered: boolean;
}

function GlobePoint({ location, maxNodes, onHover, onClick, isHovered }: GlobePointProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Calculate size based on node count (min 0.02, max 0.08)
  const baseSize = 0.02 + (location.nodeCount / maxNodes) * 0.06;
  const size = isHovered ? baseSize * 1.5 : baseSize;
  
  // Calculate color based on uptime (green = high, orange/red = low)
  const onlineRatio = location.onlineCount / location.nodeCount;
  const color = new THREE.Color();
  if (onlineRatio > 0.8) {
    color.setHSL(0.45, 0.9, 0.5); // Teal/Green
  } else if (onlineRatio > 0.5) {
    color.setHSL(0.12, 0.9, 0.5); // Orange
  } else {
    color.setHSL(0, 0.8, 0.5); // Red
  }
  
  useFrame((state) => {
    if (meshRef.current) {
      // Pulse animation
      const pulse = Math.sin(state.clock.elapsedTime * 2 + location.lng) * 0.1 + 1;
      meshRef.current.scale.setScalar(isHovered ? 1.5 : pulse);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(isHovered ? 2 : 1.5);
    }
  });
  
  return (
    <group position={location.position}>
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 2, 16, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={isHovered ? 0.4 : 0.2} 
        />
      </mesh>
      
      {/* Main point */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(location);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(location.region);
        }}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isHovered ? 1 : 0.5}
        />
      </mesh>
    </group>
  );
}

interface EarthProps {
  locations: LocationData[];
  maxNodes: number;
  onLocationHover: (location: LocationData | null) => void;
  onLocationClick: (region: string) => void;
  hoveredLocation: LocationData | null;
}

function Earth({ locations, maxNodes, onLocationHover, onLocationClick, hoveredLocation }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.001;
    }
  });

  // Create Earth texture procedurally with a glowing wireframe look
  const earthMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('hsl(220, 25%, 12%)'),
      emissive: new THREE.Color('hsl(168, 80%, 20%)'),
      emissiveIntensity: 0.1,
      wireframe: false,
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={earthMaterial} attach="material" />
      </mesh>
      
      {/* Grid lines on Earth */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.002, 32, 32]} />
        <meshBasicMaterial 
          color="hsl(168, 80%, 45%)"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <Sphere args={[1.08, 64, 64]}>
        <meshBasicMaterial
          color="hsl(168, 80%, 60%)"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Second atmosphere layer */}
      <Sphere args={[1.15, 64, 64]}>
        <meshBasicMaterial
          color="hsl(290, 60%, 40%)"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Location points */}
      {locations.map((location) => (
        <GlobePoint
          key={location.region}
          location={location}
          maxNodes={maxNodes}
          onHover={onLocationHover}
          onClick={onLocationClick}
          isHovered={hoveredLocation?.region === location.region}
        />
      ))}
    </group>
  );
}

function GlobeScene({ nodes, onLocationClick }: { nodes: PNode[]; onLocationClick?: (region: string) => void }) {
  const [hoveredLocation, setHoveredLocation] = useState<LocationData | null>(null);
  
  // Process nodes into location data
  const { locations, maxNodes } = useMemo(() => {
    const locationMap = new Map<string, { nodes: PNode[]; coords: { lat: number; lng: number; country: string } }>();
    
    nodes.forEach((node) => {
      const region = node.region;
      const coords = regionCoordinates[region] || regionCoordinates["Europe"];
      
      if (!locationMap.has(region)) {
        locationMap.set(region, { nodes: [], coords });
      }
      locationMap.get(region)!.nodes.push(node);
    });
    
    let maxNodeCount = 0;
    const locationData: LocationData[] = [];
    
    locationMap.forEach((data, region) => {
      const nodeCount = data.nodes.length;
      maxNodeCount = Math.max(maxNodeCount, nodeCount);
      
      const avgUptime = data.nodes.reduce((sum, n) => sum + n.uptime, 0) / nodeCount;
      const onlineCount = data.nodes.filter(n => n.status === "online").length;
      
      locationData.push({
        position: latLngToVector3(data.coords.lat, data.coords.lng, 1.02),
        region,
        country: data.coords.country,
        nodeCount,
        avgUptime,
        onlineCount,
        lat: data.coords.lat,
        lng: data.coords.lng,
      });
    });
    
    return { locations: locationData, maxNodes: maxNodeCount };
  }, [nodes]);

  const handleLocationClick = useCallback((region: string) => {
    onLocationClick?.(region);
  }, [onLocationClick]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="hsl(168, 80%, 80%)" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="hsl(290, 60%, 60%)" />
      
      <Stars 
        radius={100} 
        depth={50} 
        count={3000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5}
      />
      
      <Earth 
        locations={locations}
        maxNodes={maxNodes}
        onLocationHover={setHoveredLocation}
        onLocationClick={handleLocationClick}
        hoveredLocation={hoveredLocation}
      />
      
      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        minDistance={1.5}
        maxDistance={4}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
      />
      
      {/* Tooltip */}
      {hoveredLocation && (
        <Html
          position={hoveredLocation.position.clone().multiplyScalar(1.15)}
          center
          style={{
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <div className="glass-card rounded-lg p-3 text-sm min-w-[160px] animate-fade-in border border-primary/30">
            <div className="font-semibold text-foreground mb-1">{hoveredLocation.country}</div>
            <div className="text-muted-foreground text-xs space-y-1">
              <div className="flex justify-between">
                <span>Nodes:</span>
                <span className="font-medium text-primary">{hoveredLocation.nodeCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Uptime:</span>
                <span className="font-medium text-emerald-400">{hoveredLocation.avgUptime.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Online:</span>
                <span className="font-medium text-emerald-400">{hoveredLocation.onlineCount}/{hoveredLocation.nodeCount}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground/70 mt-2 pt-2 border-t border-border/50">
              Click to filter table
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Loading globe...</p>
      </div>
    </div>
  );
}

export function NetworkGlobe({ nodes, onLocationClick }: NetworkGlobeProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h4 className="font-semibold flex items-center gap-2">
          <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Network Geography
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">Interactive</span>
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          Click on locations to filter nodes • Drag to rotate • Scroll to zoom
        </p>
      </div>
      
      <div className="relative h-[400px] md:h-[500px] bg-background/50">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ position: [0, 0, 2.5], fov: 45 }}
            dpr={[1, 2]}
            style={{ background: 'transparent' }}
          >
            <GlobeScene nodes={nodes} onLocationClick={onLocationClick} />
          </Canvas>
        </Suspense>
        
        {/* Decorative corner gradients */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-xandeum-purple/10 to-transparent pointer-events-none" />
      </div>
      
      {/* Legend */}
      <div className="p-4 border-t border-border/50 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>High uptime (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Medium uptime (50-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Low uptime (&lt;50%)</span>
        </div>
        <div className="ml-auto text-muted-foreground/70">
          Point size = node count
        </div>
      </div>
    </div>
  );
}
