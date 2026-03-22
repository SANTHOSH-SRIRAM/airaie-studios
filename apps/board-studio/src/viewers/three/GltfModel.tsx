import React from 'react';
import { Center, useGLTF } from '@react-three/drei';

interface GltfModelProps {
  url: string;
}

export const GltfModel: React.FC<GltfModelProps> = ({ url }) => {
  const { scene } = useGLTF(url);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
};

export default GltfModel;
