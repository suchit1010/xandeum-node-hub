import React, { useEffect, useRef, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import ThreeGlobe from "three-globe";
import * as THREE from "three";
import gsap from "gsap";
import type { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls";

// --- CONFIGURATION & DATA ---
const GEOJSON_URL = 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/country-polygons/ne_110m_admin_0_countries.geojson';

type Office = {
  lat: number;
  lng: number;
  name: string;
  color: string;
  mainHub?: boolean;
};

const OFFICES: Office[] = [
  { lat: 1.3521, lng: 103.8198, name: "Singapore", color: "#ffcc00", mainHub: true },
  { lat: 51.5074, lng: -0.1278, name: "London", color: "#ff3366" },
  { lat: 37.7749, lng: -122.4194, name: "San Francisco", color: "#33ffaa" },
  { lat: 28.6139, lng: 77.2090, name: "Bangalore", color: "#aa33ff" },
  { lat: 48.8566, lng: 2.3522, name: "Paris", color: "#3366ff" },
  { lat: -33.8688, lng: 151.2093, name: "Sydney", color: "#ff8800" },
];

// --- GLOBE COMPONENT ---
const GlobeCore = () => {
  const globeRef = useRef<THREE.Group>(null!);
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls?: ThreeOrbitControls };

  // 1. Camera Animation Logic (Fly-To)
  const flyTo = (lat: number, lng: number) => {
    // Convert Lat/Lng to 3D coords for camera positioning
    const r = 200; // Globe internal radius
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    // Stop auto-rotation during flight
    if (controls) controls.autoRotate = false;

    gsap.to(camera.position, {
      x: x * 2.2, // Zoom distance multiplier
      y: y * 2.2,
      z: z * 2.2,
      duration: 1.8,
      ease: "power3.inOut",
      onUpdate: () => camera.lookAt(0, 0, 0),
      onComplete: () => {
        if (controls) controls.autoRotate = true;
      }
    });
  };

  // 2. Initialize ThreeGlobe
  const globeInstance = useMemo(() => {
    const Globe = new ThreeGlobe()
      // Dotted Landmass
      .hexPolygonsData([]) 
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .hexPolygonColor(() => "#444444")
      
      // Office Markers
      .labelsData(OFFICES)
      .labelDotRadius(0.6)
      .labelSize(1.2)
      .labelColor((d: Office) => d.color)
      .labelText((d: Office) => d.name)
      .labelIncludeDot(true)
      
      // The Pulse Effect (specifically for Singapore)
      .ringsData(OFFICES.filter(o => o.mainHub))
      .ringColor(() => "#ffcc00")
      .ringMaxRadius(5)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1500);

    // Interaction: attach handler via any-cast because typings may not include onLabelClick
    (Globe as any).onLabelClick((label: Office) => {
      flyTo(label.lat, label.lng);
    });

    // Load Landmass Data
    fetch(GEOJSON_URL)
      .then(res => res.json())
      .then(countries => {
        Globe.hexPolygonsData(countries.features);
      });

    return Globe;
  }, []);

  // 3. Mount Globe to Three.js Scene
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.add(globeInstance);
    }
  }, [globeInstance]);

  // Handle cursor changes on hover
  useEffect(() => {
    (globeInstance as any).onLabelHover((label: any) => {
      document.body.style.cursor = label ? "pointer" : "default";
    });
  }, [globeInstance]);

  return <group ref={globeRef} scale={[0.02, 0.02, 0.02]} />;
};

// --- MAIN EXPORT ---
export default function InteractiveGlobe() {
  return (
    <div className="h-screen w-full bg-white flex items-center justify-center relative">
      {/* Optional Overlay UI */}
      <div className="absolute top-10 left-10 z-10 pointer-events-none">
        <h1 className="text-3xl font-bold text-gray-900">Global Network</h1>
        <p className="text-gray-500">Click a city to explore</p>
      </div>

      <Canvas shadows antialias="true">
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
        
        {/* Soft lighting to match the clean aesthetic */}
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />

        <GlobeCore />

        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          autoRotate={true}
          autoRotateSpeed={0.5}
          minDistance={6}
          maxDistance={15}
        />
      </Canvas>
    </div>
  );
}