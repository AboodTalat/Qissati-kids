import { useEffect, useLayoutEffect, useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Every surface and every pose is original procedural geometry. The world has
// one clock: the frame Remotion requested, including when seeking backwards.
const C = {
  cream: '#f5eddf', paper: '#fffaf0', edge: '#d9c9aa',
  teal: '#256862', deep: '#123f3d', sage: '#a5ba99',
  mint: '#c7d4b2', gold: '#c5a05c', brass: '#947439',
};
const clamp = (v) => Math.max(0, Math.min(1, v));
const mix = (a, b, p) => a + (b - a) * p;
const ease = (v) => { const p = clamp(v); return p * p * (3 - 2 * p); };
const enter = (t, at, duration) => ease((t - at) / duration);
const fract = (n) => n - Math.floor(n);
const TILE_X = [2.08, 0, -2.08];
const TILE_KINDS = ['place', 'object', 'feeling'];

function cameraPose(time) {
  const arc = enter(time, 7.85, 0.65) * (1 - enter(time, 8.65, 0.90));
  const doorway = enter(time, 9.15, 1.85);
  return {
    position: [Math.sin((time - 7.85) * 2.3) * arc * 1.65, mix(10.4, 7.8, doorway), mix(22.5, 23.5, doorway)],
    target: [0, mix(0.25, 0.43, doorway), -doorway * 0.15],
    offset: 24,
    zoom: 0.94 + doorway * 0.025,
  };
}

function applyCamera(camera, time) {
  const pose = cameraPose(time);
  camera.position.set(...pose.position);
  camera.up.set(0, 1, 0);
  camera.zoom = pose.zoom;
  camera.setViewOffset(1080, 1920, 0, pose.offset, 1080, 1920);
  camera.lookAt(...pose.target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

// The DOM copy can follow the short overhead camera arc without putting Arabic
// into WebGL textures. These are full-frame, unscaled screen coordinates.
export function projectTileLabels(time, contentScale = 1) {
  const camera = new THREE.PerspectiveCamera(35, 1080 / 1920, 0.1, 160);
  applyCamera(camera, time);
  return TILE_X.map((x, index) => {
    const point = new THREE.Vector3(x * contentScale, 0.11 * contentScale, 1.18 * contentScale).project(camera);
    return {
      kind: TILE_KINDS[index], x: (point.x + 1) * 540,
      y: (1 - point.y) * 960 + 18,
      opacity: enter(time, index + 0.95, 0.18) * (1 - enter(time, 8.95, 0.30)),
    };
  });
}

function paperTexture() {
  const size = 256, data = new Uint8Array(size * size * 4);
  let seed = 202020;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const fibre = Math.sin(x * 0.23 + Math.sin(y * 0.071) * 0.7) * 4.8;
    const value = 217 + Math.floor(seed / 4294967296 * 31 + fibre);
    const i = (y * size + x) * 4;
    data[i] = value; data[i + 1] = value; data[i + 2] = value; data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2); texture.needsUpdate = true;
  return texture;
}

function Paper({ color = C.paper, texture, opacity = 1, metalness = 0, glow = 0, side = THREE.FrontSide }) {
  return <meshPhysicalMaterial color={color} roughness={metalness ? 0.27 : 0.88} metalness={metalness}
    clearcoat={metalness ? 0.55 : 0.08} clearcoatRoughness={0.32}
    bumpMap={texture} bumpScale={metalness ? 0.001 : 0.006}
    emissive={color} emissiveIntensity={glow} transparent={opacity < 1}
    opacity={opacity} depthWrite={opacity > 0.95} side={side} />;
}

function Rounded({ size, radius = 0.024, color, texture, opacity = 1, metalness = 0, ...props }) {
  const [w, h, d] = size;
  const geometry = useMemo(() => new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2)), [w, h, d, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} visible={opacity > 0.001} castShadow={opacity > 0.1} receiveShadow>
    <Paper color={color} texture={texture} opacity={opacity} metalness={metalness} />
  </mesh>;
}

function Curve({ points, radius = 0.009, color = C.gold, texture, opacity = 1, metalness = 0, glow = 0, closed = false, ...props }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), Math.max(28, points.length * 3), radius, 6, closed), [points, radius, closed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} visible={opacity > 0.001} castShadow={opacity > 0.1}>
    <Paper color={color} texture={texture} opacity={opacity} metalness={metalness} glow={glow} />
  </mesh>;
}

function leafGeometry(width, height, fold = 0.15) {
  const positions = [], uvs = [], indices = [], rows = 18;
  for (let row = 0; row <= rows; row++) {
    const v = row / rows, half = Math.sin(v * Math.PI) ** 0.78 * width / 2;
    for (let col = 0; col <= 4; col++) {
      const u = col / 4 * 2 - 1;
      positions.push(half * u, height * v, Math.abs(u) * fold * Math.sin(v * Math.PI) + Math.sin(v * Math.PI) * height * 0.05);
      uvs.push(col / 4, v);
      if (row < rows && col < 4) {
        const a = row * 5 + col;
        indices.push(a, a + 1, a + 5, a + 1, a + 6, a + 5);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function Leaf({ width = 0.26, height = 0.67, color = C.teal, texture, opacity = 1, fold = 0.06, ...props }) {
  const geometry = useMemo(() => leafGeometry(width, height, fold), [width, height, fold]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const vein = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const p = i / 11;
    return new THREE.Vector3(0, p * height, Math.sin(p * Math.PI) * height * 0.05 + 0.008);
  }), [height]);
  return <group {...props} visible={opacity > 0.001}>
    <mesh geometry={geometry} castShadow={opacity > 0.1} receiveShadow>
      <Paper color={color} texture={texture} opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
    <Curve points={vein} radius={0.0028} color={color === C.paper ? C.edge : '#a5bca0'} opacity={opacity * 0.65} />
  </group>;
}

function Sprig({ time, phase = 0, texture, opacity = 1, color = C.teal, ...props }) {
  const sway = Math.sin(time * 0.7 + phase) * 0.018;
  const stem = useMemo(() => [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.015, 0.35, 0), new THREE.Vector3(-0.04, 0.74, -0.035), new THREE.Vector3(0.03, 1.08, -0.025)], []);
  return <group {...props} visible={opacity > 0.001}>
    <group rotation={[0.04, 0, sway]}>
      <Curve points={stem} radius={0.009} color={C.brass} opacity={opacity} />
      {[-1, 1].map((side) => [0, 1, 2].map((i) => <Leaf key={`${side}-${i}`} position={[side * 0.01, 0.16 + i * 0.245, 0.012]}
        rotation={[0.07 + i * 0.03, side * 0.15, side * (-0.92 + i * 0.1)]}
        width={0.19 - i * 0.015} height={0.37 - i * 0.035} color={i === 1 ? C.sage : color} texture={texture} opacity={opacity} />))}
      <Leaf position={[0.02, 0.85, -0.025]} rotation={[0, 0.1, -0.1]} width={0.15} height={0.31} color={color} texture={texture} opacity={opacity} />
    </group>
  </group>;
}

function Garden({ time, reveal, texture, opacity = 1, compact = false, ...props }) {
  const shown = Math.max(0.001, reveal), finalOpacity = opacity * reveal;
  const path = useMemo(() => [new THREE.Vector3(0.13, 0.032, 0.53), new THREE.Vector3(-0.11, 0.035, 0.20), new THREE.Vector3(0.08, 0.035, -0.13), new THREE.Vector3(-0.04, 0.04, -0.51)], []);
  return <group {...props} visible={finalOpacity > 0.001}>
    <group scale={[1, shown, 1]}>
      <mesh scale={[1, 1, 0.85]} receiveShadow castShadow>
        <cylinderGeometry args={[compact ? 0.67 : 0.68, compact ? 0.72 : 0.73, 0.065, 64]} />
        <Paper color={C.sage} texture={texture} opacity={finalOpacity} />
      </mesh>
      <mesh scale={[1, 1, 0.85]} position={[0, 0.041, 0]}>
        <cylinderGeometry args={[compact ? 0.66 : 0.67, compact ? 0.66 : 0.67, 0.012, 64]} />
        <Paper color={C.mint} texture={texture} opacity={finalOpacity} />
      </mesh>
      <Curve points={path} radius={0.064} color={C.paper} texture={texture} opacity={finalOpacity} />
      <Sprig position={[-0.34, 0.05, -0.16]} scale={0.86} rotation={[0.08, 0.08, 0.14]} time={time} phase={0.8} texture={texture} opacity={finalOpacity} />
      <Sprig position={[0.35, 0.05, -0.32]} scale={0.66} rotation={[0, -0.17, -0.18]} time={time} phase={1.8} texture={texture} opacity={finalOpacity} color={C.sage} />
      <Leaf position={[0.39, 0.05, 0.18]} rotation={[0.2, -0.3, -0.85]} width={0.22} height={0.46} color={C.teal} texture={texture} opacity={finalOpacity} />
      <Leaf position={[-0.42, 0.05, 0.23]} rotation={[0.13, 0.2, 0.68]} width={0.18} height={0.37} color={C.paper} texture={texture} opacity={finalOpacity} />
      {[[-0.24, 0.30], [0.36, -0.04]].map(([x, z], i) => <group key={i} position={[x, 0.07, z]}>
        <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.007, 0.007, 0.28, 8]} /><Paper color={C.teal} opacity={finalOpacity} /></mesh>
        {[0, 1, 2, 3, 4].map((petal) => <mesh key={petal} position={[Math.cos(petal / 5 * Math.PI * 2) * 0.040, 0.29 + Math.sin(petal / 5 * Math.PI * 2) * 0.040, 0]} scale={[0.7, 1.08, 0.26]} rotation={[0, 0, -petal / 5 * Math.PI * 2]}>
          <sphereGeometry args={[0.034, 12, 8]} /><Paper color={C.paper} opacity={finalOpacity} />
        </mesh>)}
        <mesh position={[0, 0.29, 0.012]}><sphereGeometry args={[0.024, 12, 8]} /><Paper color={C.gold} metalness={0.35} opacity={finalOpacity} /></mesh>
      </group>)}
      {/* A small folded bench makes the garden read as a place, even at 9:16. */}
      <Rounded size={[0.27, 0.032, 0.11]} position={[0.13, 0.13, -0.13]} color={C.paper} texture={texture} opacity={finalOpacity} radius={0.008} />
      {[-0.1, 0.1].map((x) => <Rounded key={x} size={[0.024, 0.12, 0.08]} position={[0.13 + x, 0.078, -0.13]} color={C.teal} texture={texture} opacity={finalOpacity} radius={0.004} />)}
    </group>
  </group>;
}

function KeyModel({ time, reveal = 1, opacity = 1, ...props }) {
  const shown = Math.max(0.001, reveal), alpha = opacity * reveal;
  return <group {...props} visible={alpha > 0.001}>
    <group scale={shown} rotation={[0.08, Math.sin(time * 0.7) * 0.13, -0.28 + Math.sin(time * 0.8) * 0.018]}>
      <mesh position={[0, 0.89, 0]} castShadow><torusGeometry args={[0.242, 0.053, 12, 56]} /><Paper color={C.gold} metalness={0.84} opacity={alpha} /></mesh>
      <mesh position={[0, 0.89, 0.012]}><torusGeometry args={[0.151, 0.009, 8, 48]} /><Paper color={C.brass} metalness={0.8} opacity={alpha} /></mesh>
      <Rounded size={[0.091, 0.64, 0.092]} radius={0.019} position={[0, 0.39, 0]} color={C.gold} metalness={0.84} opacity={alpha} />
      <Rounded size={[0.28, 0.102, 0.10]} radius={0.014} position={[0.10, 0.18, 0]} color={C.gold} metalness={0.84} opacity={alpha} />
      <Rounded size={[0.11, 0.13, 0.10]} radius={0.011} position={[0.19, 0.26, 0]} color={C.gold} metalness={0.84} opacity={alpha} />
      <Rounded size={[0.19, 0.084, 0.10]} radius={0.012} position={[0.061, 0.36, 0]} color={C.gold} metalness={0.84} opacity={alpha} />
      <mesh position={[0, 0.89, 0.048]} rotation={[0, 0, 0.6]}><octahedronGeometry args={[0.062, 0]} /><Paper color={C.paper} metalness={0.25} opacity={alpha} /></mesh>
    </group>
  </group>;
}

function Curiosity({ time, reveal, texture, opacity = 1, ...props }) {
  const points = useMemo(() => [
    new THREE.Vector3(-0.19, 0.88, 0), new THREE.Vector3(-0.09, 1.04, 0),
    new THREE.Vector3(0.16, 1.04, 0), new THREE.Vector3(0.25, 0.86, 0),
    new THREE.Vector3(0.14, 0.69, 0), new THREE.Vector3(0, 0.61, 0), new THREE.Vector3(0, 0.44, 0),
  ], []);
  const alpha = reveal * opacity;
  return <group {...props} visible={alpha > 0.001}>
    <group scale={Math.max(0.001, reveal)} rotation={[0, Math.sin(time * 0.6) * 0.12, 0.08]}>
      <Curve points={points} radius={0.052} color={C.gold} metalness={0.74} opacity={alpha} />
      <mesh position={[0, 0.25, 0]} castShadow><sphereGeometry args={[0.069, 24, 16]} /><Paper color={C.gold} metalness={0.74} opacity={alpha} /></mesh>
      {[[-0.34, 0.63, -0.02, 0.075], [0.36, 0.46, 0.02, 0.095], [0.27, 1.23, -0.04, 0.052]].map(([x, y, z, size], i) => <mesh key={i} position={[x, y + Math.sin(time * 1.2 + i) * 0.025, z]} rotation={[0.15, 0, Math.PI / 4 + time * 0.06]} scale={[1, 1.6, 0.34]} castShadow>
        <octahedronGeometry args={[size, 0]} /><Paper color={i === 1 ? C.paper : C.gold} texture={texture} metalness={i === 1 ? 0 : 0.4} opacity={alpha} />
      </mesh>)}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.33, 0.007, 8, 48]} /><Paper color={C.gold} metalness={0.3} opacity={alpha * 0.7} /></mesh>
    </group>
  </group>;
}

function dropPose(time, index) {
  const age = time - (0.60 + index);
  if (age < 0) return { y: 4.2, rotation: 0.24, visible: false };
  const falling = clamp(age / 0.40), after = Math.max(0, age - 0.40);
  const bounce = Math.sin(after * 15.5) * Math.exp(-after * 9.5) * 0.16;
  return {
    y: 0.12 + (1 - falling ** 2) * 1.48 + Math.abs(bounce),
    rotation: (1 - ease(falling)) * (index % 2 ? -0.23 : 0.21) + Math.sin(after * 17) * Math.exp(-after * 9) * 0.035,
    visible: true,
  };
}

function Tile({ index, time, texture }) {
  const pose = dropPose(time, index), transmute = enter(time, 9.0 + index * 0.08, 1.35);
  const opacity = 1 - enter(time, 10.30, 0.75);
  const modelAway = 1 - enter(time, 9.0, 0.70);
  const postX = index === 1 ? 0 : index === 0 ? 1.11 : -1.11;
  const postY = index === 1 ? 2.14 : 1.09;
  const scale = index === 1 ? [mix(1, 1.38, transmute), 1, mix(1, 0.23, transmute)] : [mix(1, 0.25, transmute), 1, mix(1, 1.03, transmute)];
  const yaw = (index - 1) * -0.06 * (1 - enter(time, 3.85, 0.5));
  const pulseAge = time - (1.00 + index), pulse = clamp(pulseAge / 0.75);
  return <>
    <group position={[mix(TILE_X[index], postX, transmute), mix(pose.y, postY, transmute), mix(0, -0.28, transmute)]}
      rotation={[transmute * Math.PI / 2, yaw * (1 - transmute), pose.rotation * (1 - transmute)]} scale={scale}
      visible={pose.visible && opacity > 0.001}>
      {/* The alternating cut edges make these unmistakably thick paper tiles. */}
      <Rounded size={[1.64, 0.115, 1.94]} color="#c6ae84" texture={texture} opacity={opacity} radius={0.037} position={[0, -0.046, 0]} />
      <Rounded size={[1.63, 0.019, 1.935]} color={C.paper} texture={texture} opacity={opacity} radius={0.008} position={[0, -0.088, 0]} />
      <Rounded size={[1.63, 0.019, 1.935]} color="#bba88a" texture={texture} opacity={opacity} radius={0.008} position={[0, -0.065, 0]} />
      <Rounded size={[1.64, 0.044, 1.94]} color={C.paper} texture={texture} opacity={opacity} radius={0.018} position={[0, 0.022, 0]} />
      <Rounded size={[1.35, 0.006, 0.014]} color={C.gold} metalness={0.38} opacity={opacity * 0.7} radius={0.002} position={[0, 0.048, 0.73]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.050, -0.13]}>
        <ringGeometry args={[0.61, 0.616, 72]} /><Paper color={index === 0 ? C.sage : C.gold} opacity={opacity * 0.45} />
      </mesh>
      <group position={[0, 0.09, -0.18]}>
        {index === 0 ? <Garden time={time} reveal={enter(time, 5.03, 0.5)} texture={texture} opacity={modelAway} scale={0.82} /> : null}
        {index === 1 ? <KeyModel time={time} reveal={enter(time, 6.03, 0.45)} opacity={modelAway} rotation={[0, -0.12, 0]} /> : null}
        {index === 2 ? <Curiosity time={time} reveal={enter(time, 7.02, 0.48)} texture={texture} opacity={modelAway} /> : null}
      </group>
    </group>
    <mesh position={[TILE_X[index], 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.03, 1]} visible={pulseAge > 0 && pulse < 1}>
      <ringGeometry args={[mix(0.60, 1.19, pulse), mix(0.61, 1.20, pulse), 72]} />
      <meshBasicMaterial color={C.gold} transparent opacity={Math.sin(pulse * Math.PI) * 0.32} depthWrite={false} />
    </mesh>
  </>;
}

function archedPath(width, height, path = new THREE.Shape(), bottom = 0) {
  const radius = width / 2, shoulder = height - radius;
  path.moveTo(-radius, bottom);
  path.lineTo(-radius, shoulder);
  path.absarc(0, shoulder, radius, Math.PI, 0, true);
  path.lineTo(radius, bottom);
  path.closePath();
  return path;
}

function Arch({ width, height, border, depth = 0.07, color = C.paper, texture, opacity = 1, gold = false, openBottom = false, ...props }) {
  const geometry = useMemo(() => {
    let shape;
    if (openBottom) {
      const outer = width / 2, inner = outer - border, spring = height - outer;
      shape = new THREE.Shape();
      shape.moveTo(-outer, 0); shape.lineTo(-outer, spring);
      shape.absarc(0, spring, outer, Math.PI, 0, true);
      shape.lineTo(outer, 0); shape.lineTo(inner, 0); shape.lineTo(inner, spring);
      shape.absarc(0, spring, inner, 0, Math.PI, false);
      shape.lineTo(-inner, 0); shape.closePath();
    } else {
      shape = archedPath(width, height);
      shape.holes.push(archedPath(width - border * 2, height - border, new THREE.Path(), border));
    }
    return new THREE.ExtrudeGeometry(shape, { depth, curveSegments: 40, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.009, bevelThickness: 0.009 });
  }, [width, height, border, depth, openBottom]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} castShadow={opacity > 0.1} receiveShadow visible={opacity > 0.001}>
    <Paper color={color} texture={texture} opacity={opacity} metalness={gold ? 0.72 : 0} />
  </mesh>;
}

function PortalBackdrop({ texture, opacity }) {
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(archedPath(2.26, 2.62), { depth: 0.038, curveSegments: 40, bevelEnabled: false }), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={[0, 0.035, -2.02]} receiveShadow>
    <Paper color={C.teal} texture={texture} opacity={opacity} />
  </mesh>;
}

function PaperHill({ index, texture, opacity }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape(), width = 2.04 - index * 0.10;
    shape.moveTo(-width / 2, 0); shape.lineTo(-width / 2, 0.14);
    shape.bezierCurveTo(-0.85, 0.56 + index * 0.12, -0.49, 0.02, -0.06, 0.29 + index * 0.13);
    shape.bezierCurveTo(0.27, 0.58 + index * 0.08, 0.60, 0.18, width / 2, 0.36);
    shape.lineTo(width / 2, 0); shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.032, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2, curveSegments: 32 });
  }, [index]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={[0, 0.09, -1.34 - index * 0.22]} castShadow receiveShadow>
    <Paper color={[C.sage, '#749d85', '#467d70'][index]} texture={texture} opacity={opacity} />
  </mesh>;
}

function Portal({ time, texture }) {
  const reveal = enter(time, 9.6, 1.40), retreat = enter(time, 12.95, 0.75);
  const opacity = reveal * (1 - enter(time, 13.25, 0.65));
  const fold = enter(time, 10.5, 1.1), world = enter(time, 11.35, 1.0);
  const leafGlow = Math.sin(time * 1.1) * 0.06;
  return <group position={[0, 0.01, 0.65 + retreat * 2.3]} scale={mix(0.90, 0.40, retreat)} rotation={[0, (1 - fold) * -0.12 + Math.sin(time * 0.18) * 0.008, 0]} visible={opacity > 0.001}>
    {/* The three paper plinths become a dimensional arched paper theatre. */}
    <group rotation={[(1 - reveal) * -0.08, 0, 0]} scale={[mix(0.87, 1, reveal), mix(0.93, 1, reveal), 1]}>
      <PortalBackdrop texture={texture} opacity={opacity} />
      {[2, 1, 0].map((i) => <Arch key={i} width={2.72 - i * 0.19} height={2.73 - i * 0.10} border={0.165 - i * 0.02} depth={0.09}
        color={[C.paper, '#e5d8bb', C.sage][i]} texture={texture} opacity={opacity * enter(time, 9.6 + i * 0.19, 0.84)}
        position={[0, 0.03, -0.32 - i * mix(0.12, 0.38, fold)]} rotation={[(1 - fold) * (i + 1) * 0.07, 0, 0]} />)}
      <Arch width={2.68} height={2.71} border={0.015} depth={0.012} color={C.gold} gold opacity={opacity} position={[0, 0.03, -0.206]} />
      <Arch width={2.35} height={2.53} border={0.009} depth={0.009} color={C.gold} gold opacity={opacity * 0.80} position={[0, 0.035, -0.225]} />
      <Rounded size={[2.86, 0.11, 0.95]} radius={0.032} position={[0, 0.025, -0.40]} color={C.edge} texture={texture} opacity={opacity} />
      <Rounded size={[2.82, 0.052, 0.96]} radius={0.019} position={[0, 0.104, -0.40]} color={C.paper} texture={texture} opacity={opacity} />
      <Rounded size={[2.59, 0.008, 0.018]} radius={0.002} position={[0, 0.135, 0.022]} color={C.gold} metalness={0.5} opacity={opacity} />
      <group scale={[1, Math.max(0.001, world), 1]}>
        {[2, 1, 0].map((i) => <PaperHill key={i} index={i} texture={texture} opacity={opacity * world} />)}
      </group>
      {/* A miniature world opens behind the threshold. Its flower, path and
          small bench are the same geometry as the place tile. */}
      <Garden time={time} reveal={world} opacity={opacity} texture={texture} scale={1.24} position={[0, 0.15, -1.01]} compact />
      <KeyModel time={time} reveal={enter(time, 11.7, 0.65)} opacity={opacity}
        position={[0.12, 0.70 + Math.sin(time * 1.1) * 0.030, -1.09]} scale={0.58} rotation={[0.02, -0.12 + Math.sin(time * 0.45) * 0.12, -0.17]} />
      <mesh position={[0, 2.11, -1.86]} scale={[1, 1.1, 0.3]}>
        <sphereGeometry args={[0.25, 40, 24]} />
        <meshBasicMaterial color="#e7c78a" transparent opacity={opacity * world * 0.72} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.23, -0.72]} color="#ffdf9c" intensity={world * opacity * (1.0 + leafGlow)} distance={3.0} decay={2} />
    </group>
    <Sprig position={[-1.39, 0.13, -0.20]} scale={0.82} rotation={[0.1, 0.25, 0.19]} time={time} phase={1.4} texture={texture} opacity={opacity * world} />
    <Sprig position={[1.40, 0.12, -0.39]} scale={0.65} rotation={[0.04, -0.34, -0.19]} time={time} phase={0.1} texture={texture} opacity={opacity * world} color={C.sage} />
    {Array.from({ length: 16 }, (_, i) => {
      const birth = 11.40 + i * 0.025, age = Math.max(0, time - birth);
      const p = clamp(age / 2.10), angle = i * 2.399963;
      return <mesh key={i} position={[Math.cos(angle) * (0.3 + p * 1.12), 1.11 + Math.sin(angle) * (0.3 + p * 0.85) + p * 0.16, -0.08 + Math.sin(i * 1.7) * 0.18]}
        rotation={[i, time * 0.32 + i, i * 0.43]} scale={[1, i % 2 ? 1.7 : 1, 0.28]} visible={time >= birth}>
        <octahedronGeometry args={[0.018 + (i % 3) * 0.009, 0]} />
        <Paper color={i % 3 === 0 ? C.paper : C.gold} metalness={0.25} opacity={opacity * Math.sin(p * Math.PI) * 0.8} glow={0.13} />
      </mesh>;
    })}
  </group>;
}

function landscapePoint(u, v, index, time) {
  const x = mix(-8.5, 8.5, u);
  const top = [0.16, 0.48, 0.53, 0.43][index]
    + Math.sin(u * Math.PI * 1.1 + index * 1.25) * [0.50, 0.58, 0.38, 0.72][index]
    + Math.sin(u * Math.PI * 2.2 + index) * 0.13
    + Math.sin(time * 0.25 + index) * 0.035;
  const y = mix(-5.8, top, v);
  const z = [7.65, 8.70, 9.82, 11.08][index] + Math.sin(v * Math.PI) * (0.28 + index * 0.07)
    + Math.sin(u * Math.PI * 2 + index * 0.6) * 0.18
    + Math.abs(Math.sin(u * Math.PI * 3 + index)) ** 14 * 0.07;
  return new THREE.Vector3(x, y, z);
}

function LandscapeFold({ index, time, texture }) {
  const geometry = useMemo(() => {
    const positions = [], uvs = [], indices = [], columns = 100, rows = 14;
    for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
      const p = landscapePoint(col / columns, row / rows, index, time);
      positions.push(p.x, p.y, p.z); uvs.push(col / columns * 4, row / rows * 2);
      if (row < rows && col < columns) {
        const a = row * (columns + 1) + col, next = a + columns + 1;
        indices.push(a, a + 1, next, a + 1, next + 1, next);
      }
    }
    const mesh = new THREE.BufferGeometry();
    mesh.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    mesh.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    mesh.setIndex(indices); mesh.computeVertexNormals();
    return mesh;
  }, [index, time]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const edge = useMemo(() => Array.from({ length: 80 }, (_, i) => landscapePoint(i / 79, 1, index, time).add(new THREE.Vector3(0, 0.005, 0.007))), [index, time]);
  const color = ['#d7dfc2', '#a1b493', '#2f6a60', '#f0e4cb'][index];
  return <group>
    <mesh geometry={geometry} castShadow receiveShadow>
      <Paper color={color} texture={texture} side={THREE.DoubleSide} />
    </mesh>
    <Curve points={edge} radius={index === 2 ? 0.012 : 0.018} color={index === 2 ? C.gold : '#e8d7b7'} metalness={index === 2 ? 0.3 : 0} />
  </group>;
}

function Background({ time, texture }) {
  const floorTexture = useMemo(() => {
    const grain = texture.clone();
    grain.repeat.set(180, 180); grain.needsUpdate = true;
    return grain;
  }, [texture]);
  useEffect(() => () => floorTexture.dispose(), [floorTexture]);
  const goldCurve = useMemo(() => Array.from({ length: 64 }, (_, i) => {
    const a = mix(0.08, Math.PI - 0.08, i / 63);
    return new THREE.Vector3(Math.cos(a) * 7.2, 0.008, 8.7 - Math.sin(a) * 2.75);
  }), []);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]} receiveShadow>
      <planeGeometry args={[240, 240]} /><Paper color={C.cream} texture={floorTexture} />
    </mesh>
    <Curve points={goldCurve} radius={0.007} color={C.gold} metalness={0.15} opacity={0.42} />
    {/* Broad, sculptural set pieces fill the frame margins. Their dimensions
        are deliberately far larger than the small story models: the close
        paper terrain begins below y1300 while its creased leaves frame the
        lower corners, leaving the protected copy rectangle entirely clear. */}
    <group position={[0, -0.20, -4.0]}>
      <Arch width={11.6} height={9.1} border={0.28} depth={0.20} color="#e6dac2" texture={texture} openBottom />
      <Arch width={11.51} height={9.06} border={0.018} depth={0.016} color={C.gold} gold opacity={0.31} position={[0, 0, 0.22]} openBottom />
      <Arch width={12.45} height={9.68} border={0.15} depth={0.13} color="#eee3cd" texture={texture} position={[0, 0, -0.43]} openBottom />
    </group>
    {[0, 1, 2, 3].map((index) => <LandscapeFold key={index} index={index} time={time} texture={texture} />)}
    {[-1, 1].map((side) => <group key={side} position={[side * 3.10, -0.36, 10.80]} rotation={[-0.16, side * -0.18, side * 0.42]} scale={2.58}>
      <Sprig time={time * 0.52} phase={side + 5} texture={texture} color={side < 0 ? C.teal : '#739976'} />
      <Leaf position={[-side * 0.08, 0.11, 0.17]} rotation={[-0.14, side * 0.3, side * 0.77]} width={0.55} height={1.05} color={C.paper} texture={texture} fold={0.14} />
      <Leaf position={[side * 0.04, 0.03, 0.27]} rotation={[-0.22, side * 0.24, side * 1.10]} width={0.53} height={0.97} color={side < 0 ? C.sage : C.teal} texture={texture} fold={0.17} />
      <Leaf position={[side * 0.19, 0.01, -0.02]} rotation={[-0.19, side * -0.29, side * -0.29]} width={0.30} height={0.95} color={C.gold} texture={texture} fold={0.11} />
    </group>)}
    {/* Large corner botanical cutouts live outside the protected text area.
        Their cast shadows, folded veins and slow breath make a tactile set. */}
    {[-1, 1].map((side) => <group key={side} position={[side * 4.83, 0, 4.45]} rotation={[-0.34, side * -0.2, side * -0.52]} scale={1.75}>
      <Sprig time={time * 0.6} phase={side + 2} texture={texture} color={side < 0 ? C.teal : C.sage} />
      <Leaf position={[-side * 0.10, 0.05, 0.24]} rotation={[-0.5, 0.1, side * 0.79]} width={0.51} height={1.05} color={side < 0 ? C.sage : C.teal} texture={texture} fold={0.10} />
      <Leaf position={[side * 0.20, 0.11, 0.05]} rotation={[-0.2, 0.1, side * -0.68]} width={0.39} height={0.85} color={C.paper} texture={texture} fold={0.095} />
    </group>)}
    {[-1, 1].map((side) => <group key={side} position={[side * 5.33, 0, -4.25]} rotation={[0.08, side * 0.4, side * 0.49]} scale={1.7}>
      <Sprig time={time * 0.5} phase={side + 4} texture={texture} color={C.sage} opacity={0.75} />
      <Leaf position={[0.13, 0, 0.2]} rotation={[-0.35, side * 0.8, side * -0.86]} width={0.49} height={0.96} color={C.paper} texture={texture} fold={0.09} />
    </group>)}
    {Array.from({ length: 17 }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const x = side * (3.15 + fract(i * 0.618) * 2.05), y = 0.30 + fract(i * 0.723) * 2.2;
      const z = -3.4 + fract(i * 0.431) * 6.9;
      return <mesh key={i} position={[x + Math.sin(time * 0.31 + i) * 0.045, y + Math.sin(time * 0.43 + i * 1.3) * 0.07, z]}
        rotation={[i * 1.3, i + time * 0.07, i * 0.8]} scale={[1, 1.9, 0.35]}>
        <octahedronGeometry args={[0.012 + (i % 4) * 0.005, 0]} />
        <Paper color={i % 4 ? C.paper : C.gold} opacity={0.28} metalness={0.1} />
      </mesh>;
    })}
  </>;
}

function ReflectionEnvironment() {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const room = new RoomEnvironment(), generator = new THREE.PMREMGenerator(gl);
    const map = generator.fromScene(room, 0.025);
    scene.environment = map.texture; scene.environmentIntensity = 0.42;
    return () => { scene.environment = null; map.dispose(); generator.dispose(); room.dispose(); };
  }, [gl, scene]);
  return null;
}

function Camera({ time }) {
  const { camera } = useThree();
  useLayoutEffect(() => { applyCamera(camera, time); }, [camera, time]);
  return null;
}

function FrameCommit({ frame }) {
  const { scene, camera, gl } = useThree();
  useEffect(() => {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); gl.render(scene, camera);
  }, [scene, camera, gl, frame]);
  return null;
}

function PaperWorld({ frame, time, texture, contentScale }) {
  const light = Math.sin(time * 0.21) * 0.15;
  return <>
    <color attach="background" args={[C.cream]} />
    <fog attach="fog" args={[C.cream, 35, 80]} />
    <ReflectionEnvironment />
    <Camera time={time} />
    <ambientLight color="#fff5e3" intensity={0.42} />
    <hemisphereLight args={['#fff9ef', '#9eaa92', 0.8]} />
    <directionalLight position={[-6.2 + light, 10.5, 7.0]} color="#fff5e1" intensity={2.35} castShadow
      shadow-mapSize={[2048, 2048]} shadow-radius={4} shadow-camera-left={-9} shadow-camera-right={9}
      shadow-camera-top={8} shadow-camera-bottom={-9} shadow-camera-near={0.1} shadow-camera-far={36}
      shadow-bias={-0.0002} shadow-normalBias={0.016} />
    <directionalLight position={[5.5, 5.4, -3.6]} color="#e0e8d4" intensity={0.9} />
    <Background time={time} texture={texture} />
    <group scale={contentScale}>
      {[0, 1, 2].map((index) => <Tile key={index} index={index} time={time} texture={texture} />)}
      <Portal time={time} texture={texture} />
    </group>
    <FrameCommit frame={frame} />
  </>;
}

export function R20Scene({ stillFrame, contentScale = 1 }) {
  const currentFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frame = stillFrame ?? currentFrame;
  // Still compositions report 1fps; explicit poses use the authored reel clock.
  const time = frame / (stillFrame === undefined ? fps : 30);
  const texture = useMemo(paperTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <ThreeCanvas name="Three paper words become a story-world" showInTimeline width={width} height={height}
    frameloop="never" dpr={1} style={{ position: 'absolute', inset: 0, background: C.cream }}
    camera={{ fov: 35, near: 0.1, far: 160, position: [0, 10.4, 22.5] }}
    shadows={{ type: THREE.PCFShadowMap }}
    gl={{ antialias: true, alpha: false, toneMapping: THREE.NeutralToneMapping }}>
    <PaperWorld frame={frame} time={time} texture={texture} contentScale={contentScale} />
  </ThreeCanvas>;
}
