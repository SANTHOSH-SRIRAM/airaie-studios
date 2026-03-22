import React, { useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import type * as THREE from 'three';

interface StlModelProps {
  url: string;
}

export const StlModel: React.FC<StlModelProps> = ({ url }) => {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <Center>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color="#8899aa"
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
    </Center>
  );
};

export default StlModel;
