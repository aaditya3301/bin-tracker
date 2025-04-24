import * as THREE from 'three';
import { CoinObject, PathPoint } from '../types/three.types';

export const setupScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  
  scene.add(ambientLight);
  scene.add(directionalLight);
  
  return scene;
};

export const createTruckPath = (radius: number, points: number): PathPoint[] => {
  const path: PathPoint[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    path.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius
    });
  }
  return path;
};