import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ShiuliPetals3D({ count = 60, speed = 1.0 }) {
  const meshRef = useRef();

  // Create single Shiuli flower petal geometry: white oval blade with subtle curve
  const petalGeometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(0.35, 0.45, 2, 2);
    return geom;
  }, []);

  // Material with double sided rendering & soft flower translucency
  const whitePetalMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFFDF9'),
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92
    });
  }, []);

  // Randomized particle positions, velocities, and rotation speeds
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 26,
        y: Math.random() * 22 - 2,
        z: (Math.random() - 0.5) * 14,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        speedY: (0.012 + Math.random() * 0.02) * speed,
        speedRotX: (Math.random() - 0.5) * 0.03,
        speedRotY: (Math.random() - 0.5) * 0.03,
        speedRotZ: (Math.random() - 0.5) * 0.02,
        swaySpeed: 0.5 + Math.random() * 1.5,
        swayAmount: 0.008 + Math.random() * 0.015,
        scale: 0.65 + Math.random() * 0.7
      });
    }
    return temp;
  }, [count, speed]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    particles.forEach((p, i) => {
      // Fall down
      p.y -= p.speedY * (delta * 60);

      // Sway horizontally like a floating petal
      p.x += Math.sin(time * p.swaySpeed + i) * p.swayAmount;
      p.z += Math.cos(time * p.swaySpeed * 0.8 + i) * (p.swayAmount * 0.6);

      // Rotate naturally in 3D
      p.rotX += p.speedRotX;
      p.rotY += p.speedRotY;
      p.rotZ += p.speedRotZ;

      // Wrap boundary
      if (p.y < -12) {
        p.y = 12 + Math.random() * 4;
        p.x = (Math.random() - 0.5) * 26;
        p.z = (Math.random() - 0.5) * 14;
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rotX, p.rotY, p.rotZ);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[petalGeometry, whitePetalMaterial, count]}
      frustumCulled={false}
    />
  );
}
