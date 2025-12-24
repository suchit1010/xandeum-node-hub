import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";

type PNode = {
  region?: string;
  uptime?: number;
};

// Converts coordinates to 3D space
function latLonToVector3(lat: number, lon: number, radius = 2) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function GlowingPoint({ pos, color, scale, title, onClick }: any) {
  const ref = useRef<THREE.Mesh>(null as any);
  const [hover, setHover] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 4) * 0.15;
    if (ref.current) ref.current.scale.setScalar((scale || 0.03) * pulse);
  });

  return (
    <group position={pos.toArray()}>
      <mesh>
        <sphereGeometry args={[ (scale || 0.03) * 2.5, 16, 16 ]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      <mesh
        ref={ref}
        onClick={onClick}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[scale || 0.03, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
        {hover && title && (
          <Html distanceFactor={6} position={[0, (scale || 0.03) + 0.1, 0]}>
            <div className="whitespace-nowrap bg-black/90 text-white border border-white/20 px-2 py-1 rounded-md text-[10px] shadow-xl backdrop-blur-sm">
              {title}
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
}

export default function GlobeClean({ nodes, regionClusters }: { nodes: PNode[]; regionClusters: any[] }) {
  const points = useMemo(() => {
    return (regionClusters || []).map((cluster) => ({
      ...cluster,
      pos: latLonToVector3(cluster.lat, cluster.lon, 2.02),
      pointScale: Math.min(0.15, 0.04 + Math.log10((cluster.count || 0) + 1) * 0.05)
    }));
  }, [regionClusters]);

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-white/5 bg-[#0b1220]/50 backdrop-blur-md">
      <div style={{ width: "100%", height: 450 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <mesh>
            <sphereGeometry args={[2, 64, 64]} />
            <meshStandardMaterial
              color="#0b1220"
              roughness={0.8}
              metalness={0.2}
              emissive="#111827"
              emissiveIntensity={0.5}
            />
          </mesh>

          {points.map((p, i) => (
            <GlowingPoint
              key={i}
              pos={p.pos}
              color={p.color}
              scale={p.pointScale}
              title={`${p.name}: ${p.count} Nodes`}
              onClick={() => window.dispatchEvent(new CustomEvent("xandeum:globe-select", { detail: p }))}
            />
          ))}

          <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
          <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.4} minDistance={3} maxDistance={8} />
        </Canvas>
      </div>
      <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] uppercase tracking-wider text-white/40">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2dd4bf]" /> High Uptime</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Warning</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f43f5e]" /> Issues</div>
      </div>
    </div>
  );
}
