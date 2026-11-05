import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, Float, ContactShadows } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// Brand palette for the 3D canvas (WebGL can't read CSS tokens directly).
const ORANGE = "#f07a2a";
const CARD = "#c98a52";
const TAPE = "#e9c08a";
const GROUND = "#f4ede6";
const GREEN = "#2fa36b";

const START = new THREE.Vector3(-2.4, 0, 0.6);
const END = new THREE.Vector3(2.4, 0, -0.6);

function useArc() {
  return useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(START, new THREE.Vector3(0, 1.8, 0), END),
    [],
  );
}

function Pin({ position, color }: { position: THREE.Vector3; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.13, 0.35, 32]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.22, 0.32, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function Parcel({ progress }: { progress: number | null }) {
  const curve = useArc();
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    t.current += dt;
    if (!ref.current) return;
    // Idle: loop along the route. Tracked: ease toward the real progress.
    const target = progress === null ? (t.current * 0.12) % 1 : progress;
    const cur = ref.current.userData["p"] ?? 0;
    const p = progress === null ? target : cur + (target - cur) * (1 - Math.exp(-3 * dt));
    ref.current.userData["p"] = p;
    const pos = curve.getPointAt(Math.min(Math.max(p, 0), 1));
    ref.current.position.set(pos.x, pos.y + 0.35 + Math.sin(t.current * 2) * 0.05, pos.z);
    ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group ref={ref}>
      <RoundedBox args={[0.6, 0.45, 0.6]} radius={0.05} castShadow>
        <meshStandardMaterial color={CARD} roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.226, 0]}>
        <boxGeometry args={[0.16, 0.005, 0.61]} />
        <meshStandardMaterial color={TAPE} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Route({ progress }: { progress: number | null }) {
  const curve = useArc();
  const full = useMemo(() => new THREE.TubeGeometry(curve, 80, 0.025, 8), [curve]);
  const done = useMemo(() => {
    const p = Math.max(progress ?? 0, 0.02);
    const pts = curve.getPoints(80).slice(0, Math.max(2, Math.round(80 * p) + 1));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.04, 10);
  }, [curve, progress]);
  return (
    <>
      <mesh geometry={full}>
        <meshStandardMaterial color="#d9cfc6" />
      </mesh>
      {progress !== null && (
        <mesh geometry={done}>
          <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.25} />
        </mesh>
      )}
    </>
  );
}

export default function Track3D({
  progress = null,
  delivered = false,
  className = "",
}: {
  progress?: number | null;
  delivered?: boolean;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 3.6, 6], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={1} color="#ffd9b8" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <group position={[0, -0.2, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[3.1, 64]} />
            <meshStandardMaterial color={GROUND} roughness={1} />
          </mesh>
          <Route progress={progress} />
          <Pin position={START} color={ORANGE} />
          <Pin position={END} color={delivered ? GREEN : "#3a3530"} />
          <Float speed={1} rotationIntensity={0} floatIntensity={0}>
            <Parcel progress={progress} />
          </Float>
          <ContactShadows position={[0, 0.02, 0]} opacity={0.35} scale={8} blur={2.4} far={3} />
        </group>
      </Canvas>
    </div>
  );
}
