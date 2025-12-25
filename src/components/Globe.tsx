import * as React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Html, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";

// CORE DATA TYPES
type PNode = { lat?: number; lon?: number; region?: string; uptime?: number; lastSeen?: string; };

// RUTHLESSLY BETTER TEXTURED EARTH
function XandeumEarth() {
  // Use high-contrast textures for a "Cyberpunk" look
  const [colorMap, bumpMap, specMap] = useLoader(TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atk.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png'
  ]);

  return (
    <group>
      {/* GLOWING ATMOSPHERE */}
      <mesh scale={[1.04, 1.04, 1.04]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
      
      {/* THE MAIN BODY */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          map={colorMap} 
          bumpMap={bumpMap} 
          bumpScale={0.05}
          emissiveMap={specMap} // Shows city lights in dark areas
          emissive={new THREE.Color("#2dd4bf")}
          emissiveIntensity={0.2}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

// DATA-DRIVEN P-NODE CLUSTER
type PNodeClusterProps = {
  pos: THREE.Vector3;
  color: string;
  count: number;
  title: string;
  onClick?: (e?: unknown) => void;
};

function PNodeCluster({ pos, color, count, title, onClick }: PNodeClusterProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const [hover, setHover] = useState(false);

  // LOGARITHMIC SCALING (Visual impact without blocking landmasses)
  const baseScale = 0.04 + Math.log10(count + 1) * 0.08;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Core Pulse
    meshRef.current.scale.setScalar(baseScale * (1 + Math.sin(t * 3) * 0.15));
    // Data Flow Ring
    if (ringRef.current) {
      ringRef.current.scale.setScalar(baseScale * (1.5 + Math.sin(t * 2) * 1.5));
      const material = Array.isArray(ringRef.current.material)
        ? (ringRef.current.material[0] as THREE.MeshBasicMaterial)
        : (ringRef.current.material as THREE.MeshBasicMaterial);
      if (material) {
        material.opacity = 0.4 * (1 - (Math.sin(t * 2) + 1) / 2);
        material.transparent = true;
      }
    }
  });

  return (
    <group position={pos.toArray()}>
      {/* Pulse Data Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.15, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Node Core */}
      <mesh 
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={hover ? 4 : 2} 
        />
      </mesh>

      {hover && (
        <Html center position={[0, baseScale + 0.2, 0]} distanceFactor={8}>
          <div className="bg-black/90 border border-primary/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white shadow-2xl">
            <p className="text-[10px] font-bold tracking-tighter uppercase text-primary/80">Xandeum Cluster</p>
            <p className="text-xs font-mono">{title}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function XandeumGlobe({ nodes = [] }: { nodes: PNode[] }) {
  // CLUSTERING LOGIC: Group nodes by rounded lat/lon to avoid overlap
  const clusters = useMemo(() => {
    const map: Record<string, { lat: number; lon: number; nodes: PNode[] }> = {};
    nodes.forEach(n => {
      const lat = n.lat || 0;
      const lon = n.lon || 0;
      const key = `${Math.round(lat / 5) * 5}:${Math.round(lon / 5) * 5}`;
      if (!map[key]) map[key] = { lat, lon, nodes: [] };
      map[key].nodes.push(n);
    });

    return Object.values(map).map(c => ({
      pos: latLonToVector3(c.lat, c.lon, 2.05),
      count: c.nodes.length,
      title: `${c.nodes.length} Nodes in ${c.nodes[0].region || 'Global'}`,
      color: c.nodes.every(n => (n.uptime || 0) > 95) ? "#2dd4bf" : "#f59e0b"
    }));
  }, [nodes]);

  return (
    <div className="h-[500px] w-full bg-[#0b1220] rounded-2xl border border-white/5 overflow-hidden">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#2dd4bf" />
        
        <XandeumEarth />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade />

        {clusters.map((c, i) => (
          <PNodeCluster key={i} {...c} />
        ))}

        <OrbitControls 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5} 
          minDistance={3.5} 
          maxDistance={7} 
        />
      </Canvas>
    </div>
  );
}

// UTILITY
function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}