import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

interface PNodeLocation {
  id: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'syncing';
  stake?: number;
}

interface PNodeGlobeProps {
  nodes: Array<{
    id: string;
    address: string;
    status: 'online' | 'offline' | 'syncing';
    stake?: number;
  }>;
}

// Mock pNode locations for demo when no real data
const mockNodeLocations: PNodeLocation[] = [
  // North America
  { id: 'node-1', lat: 37.7749, lng: -122.4194, status: 'online', stake: 5000 },
  { id: 'node-2', lat: 40.7128, lng: -74.006, status: 'online', stake: 8000 },
  { id: 'node-3', lat: 34.0522, lng: -118.2437, status: 'online', stake: 3500 },
  { id: 'node-4', lat: 41.8781, lng: -87.6298, status: 'syncing', stake: 2000 },
  { id: 'node-5', lat: 47.6062, lng: -122.3321, status: 'online', stake: 4500 },
  { id: 'node-6', lat: 25.7617, lng: -80.1918, status: 'online', stake: 3000 },
  { id: 'node-7', lat: 49.2827, lng: -123.1207, status: 'online', stake: 2800 },
  // Europe
  { id: 'node-8', lat: 51.5074, lng: -0.1278, status: 'online', stake: 7500 },
  { id: 'node-9', lat: 52.52, lng: 13.405, status: 'online', stake: 6000 },
  { id: 'node-10', lat: 48.8566, lng: 2.3522, status: 'online', stake: 5500 },
  { id: 'node-11', lat: 41.9028, lng: 12.4964, status: 'syncing', stake: 3200 },
  { id: 'node-12', lat: 59.3293, lng: 18.0686, status: 'online', stake: 4000 },
  { id: 'node-13', lat: 52.3676, lng: 4.9041, status: 'online', stake: 5200 },
  { id: 'node-14', lat: 50.0755, lng: 14.4378, status: 'online', stake: 2900 },
  { id: 'node-15', lat: 55.7558, lng: 37.6173, status: 'online', stake: 4800 },
  // Asia
  { id: 'node-16', lat: 35.6762, lng: 139.6503, status: 'online', stake: 9000 },
  { id: 'node-17', lat: 22.3193, lng: 114.1694, status: 'online', stake: 7000 },
  { id: 'node-18', lat: 1.3521, lng: 103.8198, status: 'online', stake: 6500 },
  { id: 'node-19', lat: 37.5665, lng: 126.978, status: 'online', stake: 5800 },
  { id: 'node-20', lat: 31.2304, lng: 121.4737, status: 'syncing', stake: 4200 },
  { id: 'node-21', lat: 19.076, lng: 72.8777, status: 'online', stake: 3800 },
  { id: 'node-22', lat: 28.6139, lng: 77.209, status: 'online', stake: 3100 },
  { id: 'node-23', lat: 13.7563, lng: 100.5018, status: 'online', stake: 2700 },
  // Oceania
  { id: 'node-24', lat: -33.8688, lng: 151.2093, status: 'online', stake: 4500 },
  { id: 'node-25', lat: -37.8136, lng: 144.9631, status: 'online', stake: 3200 },
  { id: 'node-26', lat: -36.8509, lng: 174.7645, status: 'syncing', stake: 1800 },
  // South America
  { id: 'node-27', lat: -23.5505, lng: -46.6333, status: 'online', stake: 4000 },
  { id: 'node-28', lat: -34.6037, lng: -58.3816, status: 'online', stake: 2500 },
  { id: 'node-29', lat: -33.4489, lng: -70.6693, status: 'online', stake: 2100 },
  // Africa
  { id: 'node-30', lat: -33.9249, lng: 18.4241, status: 'online', stake: 1900 },
  { id: 'node-31', lat: 30.0444, lng: 31.2357, status: 'online', stake: 2300 },
  { id: 'node-32', lat: 6.5244, lng: 3.3792, status: 'syncing', stake: 1500 },
];

// Generate elegant grid pattern for the entire globe (like reference image)
const generateGlobeGrid = (): { lat: number; lng: number; type: 'grid' | 'land' }[] => {
  const dots: { lat: number; lng: number; type: 'grid' | 'land' }[] = [];
  
  // Continental land detection - simplified but cleaner boundaries
  const isLand = (lat: number, lng: number): boolean => {
    // North America
    if (lat > 24 && lat < 72 && lng > -170 && lng < -52) {
      if (lat > 48 && lng > -145 && lng < -52) return true; // Canada
      if (lat > 24 && lat < 50 && lng > -130 && lng < -65) return true; // USA
      if (lat > 58 && lng > -170 && lng < -130) return true; // Alaska
    }
    // Mexico & Central America
    if (lat > 7 && lat < 33 && lng > -120 && lng < -80) return true;
    
    // South America
    if (lat > -58 && lat < 15 && lng > -82 && lng < -32) return true;
    
    // Europe
    if (lat > 35 && lat < 72 && lng > -12 && lng < 65) return true;
    
    // Africa
    if (lat > -36 && lat < 38 && lng > -20 && lng < 55) return true;
    
    // Middle East & Central Asia
    if (lat > 10 && lat < 45 && lng > 25 && lng < 75) return true;
    
    // Russia/Siberia
    if (lat > 45 && lat < 78 && lng > 25 && lng < 180) return true;
    
    // India
    if (lat > 6 && lat < 36 && lng > 68 && lng < 98) return true;
    
    // Southeast Asia
    if (lat > -10 && lat < 30 && lng > 92 && lng < 145) return true;
    
    // China & East Asia
    if (lat > 18 && lat < 55 && lng > 73 && lng < 145) return true;
    
    // Japan
    if (lat > 30 && lat < 46 && lng > 128 && lng < 148) return true;
    
    // Australia
    if (lat > -45 && lat < -10 && lng > 110 && lng < 158) return true;
    
    // New Zealand
    if (lat > -48 && lat < -33 && lng > 165 && lng < 180) return true;
    
    // Greenland
    if (lat > 59 && lat < 84 && lng > -75 && lng < -10) return true;
    
    return false;
  };

  // Create grid pattern - consistent spacing
  const step = 3;
  
  for (let lat = -70; lat <= 75; lat += step) {
    for (let lng = -180; lng <= 180; lng += step) {
      const type = isLand(lat, lng) ? 'land' : 'grid';
      dots.push({ lat, lng, type });
    }
  }
  
  return dots;
};
// Convert lat/lng to 3D coordinates on sphere
const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// Create curved line between two points on sphere
const createCurvedLine = (
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: THREE.Color,
  opacity: number
): THREE.Line => {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  mid.normalize().multiplyScalar(1 + distance * 0.2);
  
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
  });
  
  return new THREE.Line(geometry, material);
};

export const PNodeGlobe: React.FC<PNodeGlobeProps> = ({ nodes }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);
  
  // Use mock data if no real nodes, or real nodes if available
  const nodeLocations = useMemo<PNodeLocation[]>(() => {
    if (nodes.length === 0) {
      return mockNodeLocations;
    }
    // Map real nodes to locations
    return nodes.map((node, index) => {
      const mockLocation = mockNodeLocations[index % mockNodeLocations.length];
      return {
        id: node.id,
        lat: mockLocation.lat + (Math.sin(index) * 5),
        lng: mockLocation.lng + (Math.cos(index) * 8),
        status: node.status,
        stake: node.stake,
      };
    });
  }, [nodes]);

  // Pre-generate globe grid
  const globeGridDots = useMemo(() => generateGlobeGrid(), []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.2;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Globe group
    const globe = new THREE.Group();
    globeRef.current = globe;
    scene.add(globe);

    // Xandeum theme colors
    const tealColor = new THREE.Color('hsl(168, 80%, 45%)');
    const orangeColor = new THREE.Color('hsl(35, 95%, 55%)');

    // Earth sphere base
    const earthRadius = 1;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    
    // Clean dark base sphere (like the reference image)
    const baseMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('hsl(220, 30%, 8%)'),
      transparent: true,
      opacity: 1,
    });
    const baseSphere = new THREE.Mesh(earthGeometry, baseMaterial);
    globe.add(baseSphere);

    // Remove wireframe grid - use dots only like reference
    
    // Create globe dots group
    const globeDotsGroup = new THREE.Group();
    globe.add(globeDotsGroup);

    // Dot materials - land vs ocean grid
    const landDotGeometry = new THREE.CircleGeometry(0.012, 8);
    const landDotMaterial = new THREE.MeshBasicMaterial({
      color: tealColor,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    
    const gridDotGeometry = new THREE.CircleGeometry(0.006, 6);
    const gridDotMaterial = new THREE.MeshBasicMaterial({
      color: tealColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });

    globeGridDots.forEach((dot) => {
      const position = latLngToVector3(dot.lat, dot.lng, earthRadius * 1.002);
      const geometry = dot.type === 'land' ? landDotGeometry : gridDotGeometry;
      const material = dot.type === 'land' ? landDotMaterial : gridDotMaterial;
      const dotMesh = new THREE.Mesh(geometry, material);
      dotMesh.position.copy(position);
      dotMesh.lookAt(new THREE.Vector3(0, 0, 0));
      globeDotsGroup.add(dotMesh);
    });

    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(earthRadius * 1.12, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: tealColor },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, intensity * 0.35);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    globe.add(glow);

    // Node points group
    const pointsGroup = new THREE.Group();
    globe.add(pointsGroup);

    // Connection lines group
    const linesGroup = new THREE.Group();
    globe.add(linesGroup);

    // Create node points with glowing effect
    nodeLocations.forEach((node) => {
      const position = latLngToVector3(node.lat, node.lng, earthRadius * 1.015);
      
      const pointColor = node.status === 'online' 
        ? tealColor 
        : node.status === 'syncing' 
          ? orangeColor 
          : new THREE.Color('hsl(0, 84%, 60%)');
      
      // Main point
      const pointGeometry = new THREE.SphereGeometry(0.02, 16, 16);
      const pointMaterial = new THREE.MeshBasicMaterial({
        color: pointColor,
        transparent: true,
        opacity: 1,
      });
      const point = new THREE.Mesh(pointGeometry, pointMaterial);
      point.position.copy(position);
      pointsGroup.add(point);

      // Glow ring
      const ringGeometry = new THREE.RingGeometry(0.025, 0.04, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: pointColor,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      pointsGroup.add(ring);

      // Pulse ring (animated)
      const pulseGeometry = new THREE.RingGeometry(0.03, 0.035, 32);
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: pointColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.position.copy(position);
      pulse.lookAt(new THREE.Vector3(0, 0, 0));
      pulse.userData = { 
        isPulse: true, 
        baseScale: 1,
        speed: 0.5 + Math.random() * 0.5 
      };
      pointsGroup.add(pulse);
    });

    // Create connection lines between online nodes
    const onlineNodes = nodeLocations.filter(n => n.status === 'online');
    const connections: Set<string> = new Set();

    onlineNodes.forEach((node1, i) => {
      const pos1 = latLngToVector3(node1.lat, node1.lng, earthRadius * 1.015);
      
      // Connect to 2-3 nearest nodes
      const nearbyNodes = onlineNodes
        .filter((_, j) => j !== i)
        .sort((a, b) => {
          const distA = Math.sqrt(Math.pow(a.lat - node1.lat, 2) + Math.pow(a.lng - node1.lng, 2));
          const distB = Math.sqrt(Math.pow(b.lat - node1.lat, 2) + Math.pow(b.lng - node1.lng, 2));
          return distA - distB;
        })
        .slice(0, 2);

      nearbyNodes.forEach((node2) => {
        const connectionKey = [node1.id, node2.id].sort().join('-');
        if (connections.has(connectionKey)) return;
        connections.add(connectionKey);

        const pos2 = latLngToVector3(node2.lat, node2.lng, earthRadius * 1.015);
        const line = createCurvedLine(pos1, pos2, tealColor, 0.4);
        linesGroup.add(line);
      });
    });

    // Mouse interaction variables
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };
    let autoRotate = true;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y,
      };

      rotationVelocity = {
        x: deltaMove.y * 0.005,
        y: deltaMove.x * 0.005,
      };

      globe.rotation.x += rotationVelocity.x;
      globe.rotation.y += rotationVelocity.y;

      // Clamp vertical rotation
      globe.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globe.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => { autoRotate = true; }, 3000);
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      
      const deltaMove = {
        x: e.touches[0].clientX - previousMousePosition.x,
        y: e.touches[0].clientY - previousMousePosition.y,
      };

      rotationVelocity = {
        x: deltaMove.y * 0.005,
        y: deltaMove.x * 0.005,
      };

      globe.rotation.x += rotationVelocity.x;
      globe.rotation.y += rotationVelocity.y;
      globe.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globe.rotation.x));

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging = false;
      setTimeout(() => { autoRotate = true; }, 3000);
    };

    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchmove', onTouchMove);
    container.addEventListener('touchend', onTouchEnd);

    // Animation loop
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.016;

      // Auto rotation
      if (autoRotate && !isDragging) {
        globe.rotation.y += 0.006;
      }

      // Damping for manual rotation
      if (!isDragging) {
        rotationVelocity.x *= 0.95;
        rotationVelocity.y *= 0.95;
        globe.rotation.x += rotationVelocity.x;
        globe.rotation.y += rotationVelocity.y;
        globe.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globe.rotation.x));
      }

      // Animate pulse rings
      pointsGroup.children.forEach((child) => {
        if (child.userData.isPulse) {
          const scale = 1 + Math.sin(time * child.userData.speed * 3) * 0.5;
          child.scale.set(scale, scale, 1);
          const mesh = child as THREE.Mesh;
          if (mesh.material && !Array.isArray(mesh.material)) {
            (mesh.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - (scale - 1));
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [nodeLocations, globeGridDots]);

  // Calculate stats
  const onlineCount = nodeLocations.filter(n => n.status === 'online').length;
  const syncingCount = nodeLocations.filter(n => n.status === 'syncing').length;
  const offlineCount = nodeLocations.filter(n => n.status === 'offline').length;

  return (
    <div className="glass-card rounded-xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Global pNode Network</h3>
          <p className="text-sm text-muted-foreground">Real-time geo distribution</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">{onlineCount} Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-muted-foreground">{syncingCount} Syncing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">{offlineCount} Offline</span>
          </div>
        </div>
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full h-[450px] cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
      
      <div className="absolute bottom-8 left-8 text-xs text-muted-foreground">
        <p>Drag to rotate</p>
      </div>
    </div>
  );
};

export default PNodeGlobe;
