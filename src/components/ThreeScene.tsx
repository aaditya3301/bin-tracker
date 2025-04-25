import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';

interface Viewport {
  width: number;
  height: number;
  aspectRatio: number;
  isMobile: boolean;
  isTablet: boolean;
}

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const cityRef = useRef<THREE.Group | null>(null);
  const truckGroupRef = useRef<THREE.Group | null>(null);
  const coinsRef = useRef<any[]>([]);
  const binsRef = useRef<THREE.Mesh[]>([]);
  const pathRef = useRef<any[]>([]);
  const pathIndexRef = useRef<number>(0);
  
  // For rotation
  const targetRotationRef = useRef({ x: 0, y: 0 });

  const [viewport, setViewport] = useState<Viewport>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    aspectRatio: typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16/9,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
  });

  // Moved getSceneConfig outside of the component render cycle
  const getSceneConfig = useCallback(() => ({
    gridSize: viewport.isMobile ? 15 : viewport.isTablet ? 18 : 20,
    spacing: viewport.isMobile ? 1.2 : viewport.isTablet ? 1.3 : 1.5,
    cameraPosition: {
      y: viewport.isMobile ? 8 : viewport.isTablet ? 6 : 5,
      z: viewport.isMobile ? 18 : viewport.isTablet ? 15 : 12
    },
    buildingHeight: viewport.isMobile ? 2 : viewport.isTablet ? 2.5 : 3,
    numElements: {
      bins: viewport.isMobile ? 8 : viewport.isTablet ? 12 : 15,
      coins: viewport.isMobile ? 5 : viewport.isTablet ? 8 : 10
    }
  }), [viewport.isMobile, viewport.isTablet]);

  // Handle window resize
  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setViewport({
      width,
      height,
      aspectRatio: width / height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024
    });

    if (cameraRef.current && rendererRef.current) {
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  }, []);

  // Mouse wheel zoom
  const handleMouseWheel = useCallback((event: WheelEvent) => {
    if (!cameraRef.current) return;

    cameraRef.current.position.z = Math.max(
      5,
      Math.min(20, cameraRef.current.position.z + event.deltaY * 0.01)
    );
  }, []);

  // Mouse interaction
  const onDocumentMouseMove = useCallback((event: MouseEvent) => {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    targetRotationRef.current.y = mouseX * 0.5;
    targetRotationRef.current.x = mouseY * 0.2;
  }, []);

  // Animation functions
  const animateTruck = useCallback(() => {
    if (!truckGroupRef.current || !pathRef.current || pathRef.current.length === 0) return;

    const truckGroup = truckGroupRef.current;
    const path = pathRef.current;
    const target = path[pathIndexRef.current];
    
    const dx = target.x - truckGroup.position.x;
    const dz = target.z - truckGroup.position.z;
    
    truckGroup.position.x += dx * 0.02;
    truckGroup.position.z += dz * 0.02;
    
    // Rotate truck to face direction of travel
    truckGroup.rotation.y = Math.atan2(dz, dx) + Math.PI / 2;
    
    if (Math.abs(dx) < 0.1 && Math.abs(dz) < 0.1) {
      pathIndexRef.current = (pathIndexRef.current + 1) % path.length;
    }
  }, []);

  const animateCoins = useCallback(() => {
    if (!coinsRef.current || coinsRef.current.length === 0) return;

    coinsRef.current.forEach(coin => {
      coin.mesh.rotation.y += coin.rotationSpeed;
      coin.mesh.position.y += Math.sin(Date.now() * 0.001) * 0.01;
    });
  }, []);

  const animateBins = useCallback(() => {
    if (!binsRef.current || binsRef.current.length === 0) return;

    binsRef.current.forEach((bin, index) => {
      if (Math.random() > 0.995) {
        const originalY = 0.3;
        const jumpHeight = 0.3;
        const jumpDuration = 500; // ms
        
        const startTime = Date.now();
        
        const jump = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / jumpDuration, 1);
          
          // Simple parabola for jump effect
          const height = originalY + jumpHeight * Math.sin(progress * Math.PI);
          bin.position.y = height;
          
          if (progress < 1) {
            requestAnimationFrame(jump);
          } else {
            bin.position.y = originalY;
          }
        };
        
        jump();
      }
    });
  }, []);

  // Main animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !cityRef.current) return;

    animationFrameIdRef.current = requestAnimationFrame(animate);
    
    // Smooth rotation of city
    const city = cityRef.current;
    city.rotation.y += (targetRotationRef.current.y - city.rotation.y) * 0.05;
    city.rotation.x += (targetRotationRef.current.x - city.rotation.x) * 0.05;
    
    animateTruck();
    animateCoins();
    animateBins();
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [animateBins, animateCoins, animateTruck]);

  // Setup and cleanup
  useEffect(() => {
    if (!mountRef.current) return;

    // Clean up previous scene if it exists
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    if (rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }

    // Reset all refs
    coinsRef.current = [];
    binsRef.current = [];
    pathRef.current = [];
    pathIndexRef.current = 0;

    const config = getSceneConfig();

    // Setup scene
    sceneRef.current = new THREE.Scene();
    
    // Setup camera
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current.position.set(0, config.cameraPosition.y, config.cameraPosition.z);
    
    // Setup renderer
    rendererRef.current = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    mountRef.current.appendChild(rendererRef.current.domElement);

    const scene = sceneRef.current;
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    
    // Helper function to create a city block
    function createCityBlock(x: number, z: number, height: number, color: number) {
      const geometry = new THREE.BoxGeometry(1, height, 1);
      const material = new THREE.MeshPhongMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.8,
        shininess: 30
      });
      const building = new THREE.Mesh(geometry, material);
      building.position.set(x, height/2, z);
      return building;
    }
    
    // Create city grid
    const city = new THREE.Group();
    cityRef.current = city;
    const gridSize = config.gridSize;
    const spacing = config.spacing;
    
    for (let x = -gridSize/2; x < gridSize/2; x++) {
      for (let z = -gridSize/2; z < gridSize/2; z++) {
        const height = Math.random() * config.buildingHeight + 0.5;
        const color = Math.random() > 0.9 ? 0x4CAF50 : 0x444444;
        const building = createCityBlock(x * spacing, z * spacing, height, color);
        city.add(building);
      }
    }
    
    scene.add(city);
    
    // Create trash bins
    const binGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8);
    const binMaterial = new THREE.MeshPhongMaterial({ color: 0x4CAF50 });
    
    for (let i = 0; i < config.numElements.bins; i++) {
      const bin = new THREE.Mesh(binGeometry, binMaterial);
      const x = (Math.random() - 0.5) * gridSize * spacing;
      const z = (Math.random() - 0.5) * gridSize * spacing;
      bin.position.set(x, 0.3, z);
      scene.add(bin);
      binsRef.current.push(bin);
      
      // Add glowing effect to bins
      const glow = new THREE.PointLight(0x4CAF50, 0.5, 1);
      glow.position.copy(bin.position);
      glow.position.y += 0.3;
      scene.add(glow);
    }
    
    // Create virtual coins
    const coinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
    const coinMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700, shininess: 100 });
    
    for (let i = 0; i < config.numElements.coins; i++) {
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      const x = (Math.random() - 0.5) * gridSize * spacing;
      const z = (Math.random() - 0.5) * gridSize * spacing;
      const y = Math.random() * 3 + 1;
      coin.position.set(x, y, z);
      coin.rotation.x = Math.PI / 2;
      scene.add(coin);
      coinsRef.current.push({
        mesh: coin,
        speed: Math.random() * 0.01 + 0.005,
        rotationSpeed: Math.random() * 0.05 + 0.02
      });
    }
    
    // Create a more detailed and beautiful truck
const createDetailedTruck = () => {
    const truckGroup = new THREE.Group();
    
    // Truck body - main container
    const truckBodyGeometry = new THREE.BoxGeometry(1.2, 0.7, 2.2);
    const truckBodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2196F3,
      shininess: 80,
      emissive: 0x0d47a1,
      emissiveIntensity: 0.2
    });
    const truckBody = new THREE.Mesh(truckBodyGeometry, truckBodyMaterial);
    truckBody.position.y = 0.5;
    truckGroup.add(truckBody);
    
    // Truck cab - driver section
    const truckCabGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.8);
    const truckCabMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x1565C0,
      shininess: 90,
      emissive: 0x0d47a1,
      emissiveIntensity: 0.1
    });
    const truckCab = new THREE.Mesh(truckCabGeometry, truckCabMaterial);
    truckCab.position.y = 0.4 + 0.6;
    truckCab.position.z = -0.8;
    truckGroup.add(truckCab);
    
    // Front windshield
    const windshieldGeometry = new THREE.PlaneGeometry(0.8, 0.4);
    const windshieldMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xE3F2FD, 
      transparent: true, 
      opacity: 0.7,
      shininess: 100,
      side: THREE.DoubleSide
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.set(0, 0.8, -0.4);
    windshield.rotation.x = Math.PI * 0.15;
    truckCab.add(windshield);
    
    // Add headlights
    const headlightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const headlightMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFFFCC, 
      emissive: 0xFFFF99,
      emissiveIntensity: 0.5
    });
    
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(0.4, 0.4, -1.3);
    truckGroup.add(leftHeadlight);
    
    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(-0.4, 0.4, -1.3);
    truckGroup.add(rightHeadlight);
    
    // Headlight glow effect
    const leftLight = new THREE.PointLight(0xFFFFCC, 0.8, 3);
    leftLight.position.copy(leftHeadlight.position);
    truckGroup.add(leftLight);
    
    const rightLight = new THREE.PointLight(0xFFFFCC, 0.8, 3);
    rightLight.position.copy(rightHeadlight.position);
    truckGroup.add(rightLight);
    
    // Add waste container on back
    const containerGeometry = new THREE.BoxGeometry(1.1, 0.9, 1.4);
    const containerMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4CAF50,
      shininess: 60
    });
    const container = new THREE.Mesh(containerGeometry, containerMaterial);
    container.position.set(0, 0.6, 0.4);
    truckGroup.add(container);
    
    // Add container details - side strips
    const stripGeometry = new THREE.BoxGeometry(1.15, 0.1, 1.0);
    const stripMaterial = new THREE.MeshPhongMaterial({ color: 0x388E3C });
    
    const topStrip = new THREE.Mesh(stripGeometry, stripMaterial);
    topStrip.position.set(0, 0.9, 0.4);
    truckGroup.add(topStrip);
    
    const bottomStrip = new THREE.Mesh(stripGeometry, stripMaterial);
    bottomStrip.position.set(0, 0.3, 0.4);
    truckGroup.add(bottomStrip);
    
    // Add recycle symbol
    const symbolGeometry = new THREE.CircleGeometry(0.2, 24);
    const symbolMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
    symbol.position.set(0, 0.6, 1.2);
    symbol.rotation.y = Math.PI;
    truckGroup.add(symbol);
    
    // Wheels - more detailed with rims
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x111111,
      shininess: 30 
    });
    
    const rimGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.16, 16);
    const rimMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xCCCCCC,
      shininess: 100
    });
    
    const wheelPositions = [
      { x: 0.65, y: 0.25, z: 0.7 },  // front-right
      { x: -0.65, y: 0.25, z: 0.7 }, // front-left
      { x: 0.65, y: 0.25, z: -0.7 }, // rear-right
      { x: -0.65, y: 0.25, z: -0.7 } // rear-left
    ];
    
    wheelPositions.forEach(pos => {
      // Create wheel group
      const wheelGroup = new THREE.Group();
      
      // Add tire
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheelGroup.add(wheel);
      
      // Add rim
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);
      
      // Position the wheel group
      wheelGroup.position.set(pos.x, pos.y, pos.z);
      truckGroup.add(wheelGroup);
    });
    
    // Position truck at a good starting point
    truckGroup.position.set(5, 0, 0);
    truckGroup.scale.set(1.2, 1.2, 1.2); // Make the truck a bit larger
    
    return truckGroup;
  };
    // Path for truck
    const pathRadius = 8;
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 2;
      pathRef.current.push({
        x: Math.cos(angle) * pathRadius,
        z: Math.sin(angle) * pathRadius
      });
    }
    
    // Event listeners
    document.addEventListener('mousemove', onDocumentMouseMove);
    window.addEventListener('resize', handleResize);
    window.addEventListener('wheel', handleMouseWheel);

    // Start animation loop
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', handleMouseWheel);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of geometries and materials
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            }
          }
        });
      }
    };
  }, [getSceneConfig, handleResize, handleMouseWheel, onDocumentMouseMove, animate]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1 
      }} 
    />
  );
}