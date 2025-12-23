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

// Function to convert IP to approximate geo coordinates (mock for demo)
const ipToGeoLocation = (address: string, index: number): { lat: number; lng: number } => {
  // In production, you'd use a real IP geolocation service
  // For demo, distribute nodes around the globe based on address hash
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Create clusters in major regions
  const regions = [
    { lat: 37.7749, lng: -122.4194 }, // San Francisco
    { lat: 40.7128, lng: -74.006 },   // New York
    { lat: 51.5074, lng: -0.1278 },   // London
    { lat: 52.52, lng: 13.405 },      // Berlin
    { lat: 48.8566, lng: 2.3522 },    // Paris
    { lat: 35.6762, lng: 139.6503 },  // Tokyo
    { lat: 22.3193, lng: 114.1694 },  // Hong Kong
    { lat: 1.3521, lng: 103.8198 },   // Singapore
    { lat: -33.8688, lng: 151.2093 }, // Sydney
    { lat: 55.7558, lng: 37.6173 },   // Moscow
    { lat: 19.076, lng: 72.8777 },    // Mumbai
    { lat: -23.5505, lng: -46.6333 }, // São Paulo
  ];
  
  const baseRegion = regions[(hash + index) % regions.length];
  // Add some randomness around the region
  return {
    lat: baseRegion.lat + (Math.sin(hash * index) * 8),
    lng: baseRegion.lng + (Math.cos(hash * index) * 12),
  };
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
  mid.normalize().multiplyScalar(1 + distance * 0.15);
  
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
  
  // Convert nodes to geo locations
  const nodeLocations = useMemo<PNodeLocation[]>(() => {
    return nodes.map((node, index) => ({
      id: node.id,
      ...ipToGeoLocation(node.address, index),
      status: node.status,
      stake: node.stake,
    }));
  }, [nodes]);

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
    camera.position.z = 3.5;

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
    const purpleColor = new THREE.Color('hsl(290, 60%, 40%)');
    const orangeColor = new THREE.Color('hsl(35, 95%, 55%)');

    // Earth sphere with wireframe
    const earthRadius = 1;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    
    // Inner glow sphere
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('hsl(220, 25%, 8%)'),
      transparent: true,
      opacity: 0.95,
    });
    const innerSphere = new THREE.Mesh(earthGeometry, innerMaterial);
    globe.add(innerSphere);

    // Wireframe grid
    const wireframeGeometry = new THREE.SphereGeometry(earthRadius * 1.002, 36, 24);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: tealColor,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    globe.add(wireframe);

    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(earthRadius * 1.15, 32, 32);
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
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, intensity * 0.4);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    globe.add(glow);

    // Node points
    const pointsGroup = new THREE.Group();
    globe.add(pointsGroup);

    const linesGroup = new THREE.Group();
    globe.add(linesGroup);

    // Create node points
    nodeLocations.forEach((node) => {
      const position = latLngToVector3(node.lat, node.lng, earthRadius * 1.01);
      
      // Point geometry
      const pointGeometry = new THREE.SphereGeometry(0.015, 16, 16);
      const pointColor = node.status === 'online' 
        ? tealColor 
        : node.status === 'syncing' 
          ? orangeColor 
          : new THREE.Color('hsl(0, 84%, 60%)');
      
      const pointMaterial = new THREE.MeshBasicMaterial({
        color: pointColor,
        transparent: true,
        opacity: 0.9,
      });
      
      const point = new THREE.Mesh(pointGeometry, pointMaterial);
      point.position.copy(position);
      pointsGroup.add(point);

      // Glow ring for each point
      const ringGeometry = new THREE.RingGeometry(0.02, 0.035, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: pointColor,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      pointsGroup.add(ring);
    });

    // Create connection lines between nearby online nodes
    const onlineNodes = nodeLocations.filter(n => n.status === 'online');
    const maxConnections = Math.min(40, onlineNodes.length * 2);
    let connectionCount = 0;

    for (let i = 0; i < onlineNodes.length && connectionCount < maxConnections; i++) {
      const node1 = onlineNodes[i];
      const pos1 = latLngToVector3(node1.lat, node1.lng, earthRadius * 1.01);
      
      // Connect to 2-3 nearest nodes
      const nearbyNodes = onlineNodes
        .filter((_, j) => j !== i)
        .sort((a, b) => {
          const distA = Math.sqrt(
            Math.pow(a.lat - node1.lat, 2) + Math.pow(a.lng - node1.lng, 2)
          );
          const distB = Math.sqrt(
            Math.pow(b.lat - node1.lat, 2) + Math.pow(b.lng - node1.lng, 2)
          );
          return distA - distB;
        })
        .slice(0, 2);

      nearbyNodes.forEach((node2) => {
        if (connectionCount >= maxConnections) return;
        const pos2 = latLngToVector3(node2.lat, node2.lng, earthRadius * 1.01);
        const line = createCurvedLine(pos1, pos2, tealColor, 0.3);
        linesGroup.add(line);
        connectionCount++;
      });
    }

    // Ambient particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.3 + Math.random() * 0.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: tealColor,
      size: 0.008,
      transparent: true,
      opacity: 0.5,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Mouse interaction
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

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => { autoRotate = true; }, 3000);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(2, Math.min(6, camera.position.z + e.deltaY * 0.002));
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

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
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // Auto rotation
      if (autoRotate && !isDragging) {
        globe.rotation.y += 0.002;
      }

      // Damping for manual rotation
      if (!isDragging) {
        rotationVelocity.x *= 0.95;
        rotationVelocity.y *= 0.95;
        globe.rotation.x += rotationVelocity.x;
        globe.rotation.y += rotationVelocity.y;
      }

      // Animate particles
      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;

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
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [nodeLocations]);

  // Calculate stats
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const syncingCount = nodes.filter(n => n.status === 'syncing').length;
  const offlineCount = nodes.filter(n => n.status === 'offline').length;

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
        className="w-full h-[400px] cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
      
      <div className="absolute bottom-8 left-8 text-xs text-muted-foreground">
        <p>Drag to rotate • Scroll to zoom</p>
      </div>
    </div>
  );
};

export default PNodeGlobe;
