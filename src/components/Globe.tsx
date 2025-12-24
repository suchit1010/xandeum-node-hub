import * as React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { countryCentroids, allCountryKeys } from "@/lib/geo";

type PNode = {
  id?: string;
  pubkey?: string;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  region?: string;
  uptime?: number;
};

type Cluster = {
  x: THREE.Vector3;
  lat: number;
  lon: number;
  count: number;
  nodes: PNode[];
  color: string;
  pointScale?: number;
  title?: string;
  name?: string;
  region?: string;
};
function latLonToVector3(lat: number, lon: number, radius = 2) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

function GlowingPoint({ pos, color = "#2dd4bf", scale = 0.03, onClick, title }: { pos: THREE.Vector3; color?: string; scale?: number; onClick?: () => void; title?: string }) {
  const ref = useRef<THREE.Mesh | null>(null);
  const [hover, setHover] = useState(false);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 3.5) * 0.12;
    ref.current.scale.setScalar(scale * pulse);
  });

  return (
    <group position={pos.toArray()}>
      <mesh>
        <sphereGeometry args={[scale * 2.6, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} />
      </mesh>
      <mesh
        ref={ref}
        onClick={onClick}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[scale, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} />
      </mesh>
      {hover && title && (
        <Html distanceFactor={6} position={[0, scale + 0.06, 0]} center>
          <div className="whitespace-nowrap bg-black/90 text-white text-[11px] px-2 py-1 rounded-md">{title}</div>
        </Html>
      )}
    </group>
  );
}

function SelectionRing({ sel }: { sel: { pos: THREE.Vector3; color: string; radius: number; ts: number } }) {
  const ref = useRef<THREE.Mesh | null>(null);
  const quat = useMemo(() => {
    const normal = sel.pos.clone().normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    return q;
  }, [sel.pos]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime - sel.ts / 1000;
    const opacity = Math.max(0, 0.45 - t * 0.5);
    if (ref.current.material) ref.current.material.opacity = opacity;
    ref.current.scale.setScalar(1 + Math.min(1, t) * 0.6);
  });

  return (
    <group position={sel.pos.toArray()} quaternion={quat}>
      <mesh ref={ref}>
        <ringGeometry args={[sel.radius * 0.9, sel.radius * 1.6, 64]} />
        <meshStandardMaterial color={sel.color} transparent opacity={0.45} emissive={sel.color} emissiveIntensity={0.8} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function Globe({ nodes, regionClusters }: { nodes?: PNode[]; regionClusters?: Array<{ lat: number; lon: number; count: number; name?: string; region?: string; }> }) {
  const regionLookup = countryCentroids;

  const clusters = useMemo(() => {
    if (regionClusters && regionClusters.length > 0) {
      return (regionClusters || []).map((c) => ({
        ...c,
        x: latLonToVector3(c.lat, c.lon, 2.02),
        pointScale: Math.min(0.15, 0.04 + Math.log10((c.count || 0) + 1) * 0.05),
        title: `${c.name || c.region || 'Region'}: ${c.count} nodes`,
      }));
    }

    const mapped = (nodes || [])
      .map((n) => {
        const lat = typeof n.lat === "number" ? n.lat : n.latitude;
        const lon = typeof n.lon === "number" ? n.lon : n.longitude;
        if (typeof lat === "number" && typeof lon === "number") return { ...n, lat, lon } as PNode & { lat: number; lon: number };
        const regionKey = (n.region || "").trim();
        if (regionKey && regionLookup[regionKey]) {
          const r = regionLookup[regionKey];
          return { ...n, lat: r.lat, lon: r.lon } as PNode & { lat: number; lon: number };
        }
        const countryGuess = (regionKey || "").split(",").slice(-1)[0].trim();
        if (countryGuess && regionLookup[countryGuess]) {
          const r = regionLookup[countryGuess];
          return { ...n, lat: r.lat, lon: r.lon } as PNode & { lat: number; lon: number };
        }
        const found = allCountryKeys.find((k) => regionKey && regionKey.toLowerCase().includes(k.split(",")[0].toLowerCase()));
        if (found) {
          const r = regionLookup[found];
          return { ...n, lat: r.lat, lon: r.lon } as PNode & { lat: number; lon: number };
        }
        return null;
      })
      .filter(Boolean) as Array<PNode & { lat: number; lon: number }>;

    const map: Record<string, { lat: number; lon: number; nodes: PNode[] }> = {};
    for (const p of mapped) {
      const key = p.region ? `region:${p.region}` : `${Math.round(p.lat)}:${Math.round(p.lon)}`;
      if (!map[key]) map[key] = { lat: p.lat, lon: p.lon, nodes: [] };
      map[key].nodes.push(p);
    }

    return Object.values(map).map((c) => {
      const center = latLonToVector3(c.lat, c.lon, 2.01);
      const avgUptime = c.nodes.reduce((s, x) => s + (x.uptime ?? 0), 0) / Math.max(1, c.nodes.length);
      return {
        x: center,
        lat: c.lat,
        lon: c.lon,
        count: c.nodes.length,
        nodes: c.nodes,
        color: avgUptime >= 95 ? "#2dd4bf" : avgUptime >= 80 ? "#f59e0b" : "#f43f5e",
        pointScale: Math.min(0.12, 0.03 + Math.log(c.nodes.length + 1) * 0.018),
        title: `${c.nodes.length} nodes • ${Math.round(avgUptime)}% uptime • ${c.nodes[0]?.region || 'Region'}`,
      } as Cluster;
    });
  }, [regionClusters, nodes]);

  const [selected, setSelected] = useState<null | { pos: THREE.Vector3; color: string; radius: number; ts: number }>(null);
  useEffect(() => {
    if (!selected) return;
    const id = setTimeout(() => setSelected(null), 2500);
    return () => clearTimeout(id);
  }, [selected]);

  const handleClick = (cluster: Cluster) => {
    window.dispatchEvent(new CustomEvent("xandeum:globe-select", { detail: cluster }));
    setSelected({ pos: cluster.x.clone(), color: cluster.color, radius: (cluster.pointScale || 0.04) * 3.0, ts: Date.now() });
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-white/5 bg-[#0b1220]/50 backdrop-blur-md relative">
      <div style={{ width: "100%", height: 460 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
          <ambientLight intensity={0.45} />
          <pointLight position={[10, 10, 10]} intensity={1} />

          {/* Dark Earth Base */}
          <mesh>
            <sphereGeometry args={[2, 64, 64]} />
            <meshStandardMaterial color="#071126" roughness={0.85} metalness={0.1} emissive="#020417" emissiveIntensity={0.35} />
          </mesh>

          {/* dotted map overlay */}
          <group rotation={[0, Math.PI / 2, 0]}>
            {Array.from({ length: 180 / 6 }, (_, iLat) => -84 + iLat * 6).map((lat) => (
              Array.from({ length: 360 / 6 }, (_, iLon) => -180 + iLon * 6).map((lon, j) => {
                const v = latLonToVector3(lat as number, lon as number, 2.001);
                const key = `dot-${lat}-${lon}-${j}`;
                return (
                  <mesh key={key} position={v.toArray()}>
                    <sphereGeometry args={[0.006, 6, 6]} />
                    <meshStandardMaterial color="#0b1220" roughness={1} metalness={0} />
                  </mesh>
                );
              })
            ))}
          </group>

          {/* clusters */}
          {clusters.map((c: any, i: number) => (
            <group key={i} position={c.x.toArray()}>
              <GlowingPoint pos={c.x} color={c.color} scale={c.pointScale} title={c.title} onClick={() => handleClick(c)} />
            </group>
          ))}

          {selected && <SelectionRing sel={selected} />}

          <Stars radius={100} depth={50} count={800} factor={4} saturation={0} fade />
          <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.36} minDistance={3} maxDistance={9} />
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