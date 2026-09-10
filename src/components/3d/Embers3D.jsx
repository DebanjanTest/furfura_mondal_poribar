import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Embers3D({ count = 80 }) {
  const pointsRef = useRef();

  const [geometry, positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = Math.random() * 20 - 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return [geom, pos];
  }, [count]);

  const emberMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: new THREE.Color('#FFB300'),
      size: 0.2,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !pointsRef.current.geometry) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    if (!posAttr || !posAttr.array) return;
    const arr = posAttr.array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      // Float upwards gently
      arr[i * 3 + 1] += (0.01 + (i % 5) * 0.003) * (delta * 60);
      arr[i * 3] += Math.sin(time + i) * 0.005;

      // Wrap if above boundary
      if (arr[i * 3 + 1] > 12) {
        arr[i * 3 + 1] = -10;
        arr[i * 3] = (Math.random() - 0.5) * 24;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={emberMaterial} />
  );
}
