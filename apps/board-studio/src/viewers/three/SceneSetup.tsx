import React from 'react';
import { OrbitControls, Stage } from '@react-three/drei';

interface SceneSetupProps {
  children: React.ReactNode;
}

export const SceneSetup: React.FC<SceneSetupProps> = ({ children }) => (
  <>
    <OrbitControls
      enableDamping
      dampingFactor={0.1}
      enablePan
      enableZoom
      makeDefault
    />
    <Stage environment="city" intensity={0.5}>
      {children}
    </Stage>
  </>
);

export default SceneSetup;
