import { useEffect, useLayoutEffect, useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { mix, enter, palette, roomState } from './timing';

const { cream, deep, gold, wall } = palette;

function plasterTexture() {
  const data = new Uint8Array(128 * 128 * 4);
  let seed = 170018;
  for (let i = 0; i < data.length; i += 4) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const v = 140 + Math.floor(seed / 4294967296 * 85);
    data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, 128, 128);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4); texture.needsUpdate = true;
  return texture;
}

function Block({ size, color = wall, texture, glow = 0, ...props }) {
  return <mesh {...props} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={0.94} bumpMap={texture} bumpScale={0.012} emissive={color} emissiveIntensity={glow} />
  </mesh>;
}

function Camera({ state }) {
  const { camera } = useThree();
  const { approach } = state;
  useLayoutEffect(() => {
    // Keep the small door between the question and the subtitles below it.
    // Full-frame view offset preserves continuous room walls and floor.
    camera.zoom = 0.66;
    camera.setViewOffset(1080, 1920, 0, 100, 1080, 1920);
    camera.position.set(mix(0.15, 0.38, approach), 2.08, mix(12.6, 11.95, approach));
    camera.lookAt(0, 2.03, 0);
    camera.updateProjectionMatrix();
  }, [camera, approach]);
  return null;
}

function Star({ size = 0.1, color = cream, ...props }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 ? size * 0.44 : size;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.018, bevelEnabled: false });
  }, [size]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} castShadow>
    <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.82} emissive={color} emissiveIntensity={0.16} />
  </mesh>;
}

function PaperRibbon({ layer, time }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.5, 0);
    shape.bezierCurveTo(-0.8, 0.25 + layer * 0.03, 0.35, -0.05, 1.5, 0.48);
    shape.lineTo(1.5, -0.6); shape.lineTo(-1.5, -0.6); shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false, curveSegments: 40 });
  }, [layer]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={[0, 1.18 + layer * 0.09, -0.65 - layer * 0.48]} rotation={[0, 0, Math.sin(time * 0.15 + layer) * 0.014]}>
    <meshStandardMaterial color={['#e5d5b3', '#c1d8cb', '#5a9490', '#296b6b'][layer]} roughness={0.95} side={THREE.DoubleSide} />
  </mesh>;
}

function PaperWorld({ time, state }) {
  const drift = enter(time, 7, 2) * (1 - enter(time, 15, 2.6));
  return <group>
    <Block size={[5.2, 5, 0.08]} position={[0, 2.2, -5]} color={deep} />
    <pointLight position={[0.25, 2.4, -0.6]} color={cream} intensity={1.7 + state.open * 2.5} distance={6} />
    <pointLight position={[-0.5, 3.0, -1.2]} color={gold} intensity={3.5} distance={5} />
    {[0, 1, 2, 3].map((layer) => <PaperRibbon key={layer} layer={layer} time={time} />)}
    {Array.from({ length: 29 }, (_, i) => {
      // Fixed positions and absolute-time drift: seeking never changes the field.
      const x = Math.sin(i * 13.71) * 1.1;
      const y = 1.5 + (Math.sin(i * 9.3) * 0.5 + 0.5) * 1.6;
      const z = -0.5 - (i % 6) * 0.55;
      return <group key={i} position={[x + Math.sin(time * 0.21 + i) * 0.035 * drift, y + Math.sin(time * 0.18 + i * 1.7) * 0.035 * drift, z]} rotation={[0.05 * Math.sin(i), Math.sin(time * 0.13 + i) * 0.11 * drift, i * 0.37]}>
        <Star size={i % 7 === 0 ? 0.13 : 0.048 + (i % 4) * 0.014} color={i % 5 === 0 ? gold : cream} />
      </group>;
    })}
    {/* A paper crescent, rather than a photographic night sky. */}
    <mesh position={[-0.37, 2.74, -1.7]} rotation={[0.1, 0.1, 0.35]}>
      <torusGeometry args={[0.19, 0.025, 10, 40, Math.PI * 1.45]} />
      <meshStandardMaterial color={cream} emissive={cream} emissiveIntensity={0.5} />
    </mesh>
  </group>;
}

function Door({ state, texture }) {
  const { open, outline, moon } = state;
  return <group position={[0, 2.05, 0]}>
    <Block size={[0.065, 1.96, 0.13]} position={[-0.64, 0, 0.02]} color="#4b7775" texture={texture} />
    <Block size={[0.065, 1.96, 0.13]} position={[0.64, 0, 0.02]} color="#4b7775" texture={texture} />
    <Block size={[1.34, 0.065, 0.13]} position={[0, 0.96, 0.02]} color="#4b7775" texture={texture} />
    <Block size={[1.34, 0.05, 0.13]} position={[0, -0.96, 0.02]} color="#6b8277" texture={texture} />
    {[[-0.69, 0, 0.015, 2.04], [0.69, 0, 0.015, 2.04], [0, 1.02, 1.395, 0.015]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, 0.095]}>
      <boxGeometry args={[w, h, 0.01]} />
      <meshBasicMaterial color={cream} transparent opacity={outline * 0.65} toneMapped={false} />
    </mesh>)}
    <group position={[-0.605, 0, 0.09]} rotation={[0, -open, 0]}>
      <Block size={[1.21, 1.875, 0.065]} position={[0.605, 0, 0]} color={wall} texture={texture} />
      <Block size={[1.06, 1.70, 0.012]} position={[0.605, 0, 0.041]} color="#1b5355" texture={texture} />
      <mesh position={[1.075, -0.06, 0.068]}>
        <sphereGeometry args={[0.033, 24, 16]} />
        <meshStandardMaterial color={gold} metalness={0.6} roughness={0.35} emissive={gold} emissiveIntensity={moon * 0.5 + outline * 0.55} />
      </mesh>
      {[[0.07, 0, 0.009, 1.71], [1.14, 0, 0.009, 1.71], [0.605, 0.855, 1.07, 0.009], [0.605, -0.855, 1.07, 0.009]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, 0.051]}>
        <boxGeometry args={[w, h, 0.005]} />
        <meshBasicMaterial color={cream} transparent opacity={outline * 0.13} />
      </mesh>)}
    </group>
  </group>;
}

function FrameCommit({ frame }) {
  const { scene, camera, gl } = useThree();
  useEffect(() => {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); gl.render(scene, camera);
  }, [scene, camera, gl, frame]);
  return null;
}

function Room({ frame, time, texture }) {
  const state = roomState(time);
  return <>
    <Camera state={state} />
    <ambientLight color={cream} intensity={0.43 + state.moon * 0.1} />
    <hemisphereLight args={['#c3d8ca', '#092d30', 0.65]} />
    <directionalLight position={[-4, 6, 6]} color={cream} intensity={1.0 + state.moon * 0.42} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-bias={-0.0002} />
    <spotLight position={[-3.8, 5, 4]} target-position={[0, 2, 0]} color={cream} intensity={25 + state.moon * 25} angle={0.29} penumbra={0.95} distance={18} />
    <pointLight position={[0.1, 1.3, 0.7]} color={gold} intensity={state.open * 1.6} distance={3.0} />
    <PaperWorld time={time} state={state} />
    {/* Four wall pieces leave a real opening. No screen-space fake door. */}
    <Block size={[7, 12, 0.18]} position={[-4.16, 2.05, -0.06]} texture={texture} />
    <Block size={[7, 12, 0.18]} position={[4.16, 2.05, -0.06]} texture={texture} />
    <Block size={[1.33, 7, 0.18]} position={[0, 6.50, -0.06]} texture={texture} />
    <Block size={[1.33, 5, 0.18]} position={[0, -1.40, -0.06]} texture={texture} />
    <Block size={[16, 0.12, 12]} position={[0, 1.03, 5.2]} color="#123f42" texture={texture} />
    <Block size={[0.14, 12, 15]} position={[-4.1, 4, 5]} color="#103e42" texture={texture} />
    <Block size={[0.14, 12, 15]} position={[4.1, 4, 5]} color="#103e42" texture={texture} />
    <Block size={[8, 0.07, 0.12]} position={[0, 1.13, 0.12]} color="#355f5f" texture={texture} />
    <Door state={state} texture={texture} />
    <FrameCommit frame={frame} />
  </>;
}

export function MoonlitRoom({ stillFrame }) {
  const currentFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frame = stillFrame ?? currentFrame;
  const texture = useMemo(plasterTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <ThreeCanvas name="Quiet room · moonlit door · paper stars" showInTimeline width={width} height={height} frameloop="never" dpr={1} style={{ position: 'absolute', inset: 0 }} camera={{ fov: 37, near: 0.1, far: 60, position: [0.15, 2.08, 12.6] }} shadows={{ type: THREE.PCFSoftShadowMap }} gl={{ antialias: true, alpha: false, toneMapping: THREE.NeutralToneMapping }}>
    <color attach="background" args={[deep]} />
    <Room frame={frame} time={frame / fps} texture={texture} />
  </ThreeCanvas>;
}
