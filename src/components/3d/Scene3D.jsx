import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ShiuliPetals3D } from './ShiuliPetals3D.jsx';
import { Embers3D } from './Embers3D.jsx';
import { useUI } from '../../context/UIContext.jsx';

class CanvasErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('3D Canvas encountered an issue, falling back gracefully:', err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function Scene3D() {
  const { effectiveVibe } = useUI();

  const isNightTime = effectiveVibe === 'sunset' || effectiveVibe === 'night' || effectiveVibe === 'midnight';

  const lightColor = effectiveVibe === 'early-morning' ? '#FFD4B2' :
                     effectiveVibe === 'morning' ? '#FFF3D6' :
                     effectiveVibe === 'afternoon' ? '#FFE8BD' :
                     effectiveVibe === 'sunset' ? '#FF7A45' :
                     '#9E86FF';

  const ambientIntensity = isNightTime ? 0.35 : 0.7;

  return (
    <CanvasErrorBoundary>
      <div
        className="scene-3d-root"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 4,
          overflow: 'hidden'
        }}
        aria-hidden="true"
      >
        <Canvas
          camera={{ position: [0, 0, 10], fov: 60 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight color={lightColor} intensity={ambientIntensity} />
          <directionalLight position={[5, 10, 5]} intensity={isNightTime ? 0.4 : 1.0} color={lightColor} />

          <Suspense fallback={null}>
            {!isNightTime && <ShiuliPetals3D count={55} speed={1.0} />}

            {isNightTime && (
              <>
                <ShiuliPetals3D count={25} speed={0.7} />
                <Embers3D count={70} />
              </>
            )}
          </Suspense>
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}

export default Scene3D;
