import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Environment, ContactShadows } from '@react-three/drei';
import type { Mesh, Group } from 'three';

interface IceCreamTubProps {
  color: string;
}

function IceCreamTub({ color }: IceCreamTubProps) {
  const groupRef = useRef<Group>(null);
  const lidRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Tub body - cylinder */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.0, 1.6, 32]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Tub rim */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[1.22, 1.22, 0.08, 32]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>

      {/* Lid */}
      <mesh ref={lidRef} position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[1.25, 1.25, 0.12, 32]} />
        <meshPhysicalMaterial
          color="#0ea5e9"
          roughness={0.2}
          metalness={0.3}
          clearcoat={1}
        />
      </mesh>

      {/* Label band */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.201, 1.001, 0.5, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      {/* Ice cream swirl on top (decorative) */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.2}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.2}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0, 1.52, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.2}
          clearcoat={1}
        />
      </mesh>

      {/* Cherry on top */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>
    </group>
  );
}

function IceCreamCone({ color }: { color: string }) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Cone */}
      <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.7, 1.4, 24]} />
        <meshStandardMaterial color="#d4a574" roughness={0.8} />
      </mesh>

      {/* Ice cream scoop 1 */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshPhysicalMaterial color={color} roughness={0.2} clearcoat={1} />
      </mesh>

      {/* Ice cream scoop 2 */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshPhysicalMaterial color={color} roughness={0.2} clearcoat={0.8} />
      </mesh>

      {/* Cherry */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>
    </group>
  );
}

function IceCreamBar({ color }: { color: string }) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Bar body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.5, 0.3]} />
        <meshPhysicalMaterial color={color} roughness={0.2} clearcoat={1} />
      </mesh>

      {/* Stick */}
      <mesh position={[0, -0.7, 0]} castShadow>
        <boxGeometry args={[0.1, 0.8, 0.08]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
    </group>
  );
}

interface Viewer3DProps {
  color: string;
  shape: 'tub' | 'cone' | 'bar';
}

function SceneContent({ color, shape }: Viewer3DProps) {
  const model = useMemo(() => {
    if (shape === 'tub') return <IceCreamTub color={color} />;
    if (shape === 'cone') return <IceCreamCone color={color} />;
    return <IceCreamBar color={color} />;
  }, [color, shape]);

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
      {model}
    </Float>
  );
}

export default function Viewer3D({ color, shape }: Viewer3DProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 5], fov: 45 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />

      <SceneContent color={color} shape={shape} />

      <ContactShadows
        position={[0, -1.8, 0]}
        opacity={0.3}
        scale={6}
        blur={2}
        far={4}
      />
      <Environment preset="apartment" />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}
