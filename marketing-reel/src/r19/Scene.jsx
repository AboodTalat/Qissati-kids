import { useEffect, useLayoutEffect, useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { aligned, audioCues, paperSceneTime, rainAt, stepSeconds, tickSeconds, voiceTiming } from './timing';

const C = {
  deep: '#062d30', teal: '#315d59', paper: '#fdf8f0',
  ivory: '#e9dfcc', gold: '#c5aa74', brass: '#927647',
};
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const mix = (a, b, p) => a + (b - a) * p;
const ease = (v) => { const p = clamp(v); return p * p * (3 - 2 * p); };
const enter = (time, start, duration) => ease((time - start) / duration);
const fract = (v) => v - Math.floor(v);
const openingReturn = (time) => enter(time, 18, 29 / 30);

function stateAt(time) {
  const reset = 1 - openingReturn(time);
  return {
    reveal: enter(time, rainAt + 0.04, 0.88) * reset,
    paper: enter(paperSceneTime(time), 6.05, 2.65) * reset,
    hinge: enter(paperSceneTime(time), 6.16, 1.9) * reset,
    both: enter(time, 11.75, 1.65) * reset,
    fade: 1 - enter(time, 16.4, 2.05),
    reset,
  };
}

function paperTexture() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  let seed = 190019;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const fibre = Math.sin(x * 0.14 + Math.sin(y * 0.07) * 0.4) * 7;
      const value = 205 + Math.floor(seed / 4294967296 * 40 + fibre);
      const i = (y * size + x) * 4;
      data[i] = value; data[i + 1] = value; data[i + 2] = value; data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2); texture.needsUpdate = true;
  return texture;
}

function ReflectionEnvironment() {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(gl);
    const map = generator.fromScene(room, 0.025);
    scene.environment = map.texture;
    scene.environmentIntensity = 0.48;
    return () => {
      scene.environment = null;
      map.dispose(); generator.dispose(); room.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Rounded({ size, radius = 0.025, color = C.paper, texture, opacity = 1, metalness = 0, roughness = 0.76, ...props }) {
  const [w, h, d] = size;
  const geometry = useMemo(() => new RoundedBoxGeometry(w, h, d, 4, Math.min(radius, w / 2, h / 2, d / 2)), [w, h, d, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} visible={opacity > 0.001} castShadow={opacity > 0.1} receiveShadow>
    <meshPhysicalMaterial color={color} roughness={roughness} metalness={metalness} clearcoat={metalness ? 0.35 : 0.15} clearcoatRoughness={0.35} bumpMap={texture} bumpScale={0.004} transparent={opacity < 1} opacity={opacity} />
  </mesh>;
}

function roundedPath(width, height, radius, path = new THREE.Shape()) {
  const x = -width / 2, y = -height / 2, r = Math.min(radius, width / 2, height / 2);
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.quadraticCurveTo(x + width, y, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  path.closePath();
  return path;
}

function Casing({ width, height, border, depth, bevel = 0.008, color, texture, metalness = 0, opacity = 1, ...props }) {
  const geometry = useMemo(() => {
    const shape = roundedPath(width, height, 0.09);
    shape.holes.push(roundedPath(width - border * 2, height - border * 2, 0.07, new THREE.Path()));
    return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 24 });
  }, [width, height, border, depth, bevel]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} visible={opacity > 0.001} castShadow={opacity > 0.1} receiveShadow>
    <meshPhysicalMaterial color={color} metalness={metalness} roughness={metalness ? 0.32 : 0.59} clearcoat={0.28} bumpMap={texture} bumpScale={metalness ? 0.0015 : 0.004} transparent={opacity < 1} opacity={opacity} />
  </mesh>;
}

function Curve({ points, radius = 0.006, color = C.paper, opacity = 1, metalness = 0, glow = 0, closed = false, ...props }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), Math.max(24, points.length * 3), radius, 6, closed), [points, radius, closed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} visible={opacity > 0.001}>
    <meshStandardMaterial color={color} roughness={metalness ? 0.28 : 0.82} metalness={metalness} emissive={color} emissiveIntensity={glow} transparent opacity={opacity} depthWrite={opacity > 0.8} />
  </mesh>;
}

function cameraPose(time) {
  const s = stateAt(time);
  const window = enter(time, rainAt + 0.12, 1.15) * s.reset;
  const crane = enter(paperSceneTime(time), 7.2, 1.0) * (1 - enter(time, 10.9, 1.1)) * s.reset;
  const quiet = s.both * 0.23;
  return {
    x: mix(0.04, -0.30, window) + s.paper * 0.66 - s.both * 0.22,
    y: 0.12 + window * 0.28 + s.paper * 0.32 + crane * 2.50 + quiet * 2.0,
    z: 11.25 - window * 0.20 + s.paper * 0.45 + crane * 0.20 + s.both * 0.18,
    zoom: 1 - window * 0.018 - crane * 0.085 - quiet * 0.1,
    offset: 120 - s.paper * 20 - crane * 28 - quiet * 18,
    targetY: -0.01 - crane * 0.05,
    targetZ: -s.paper * 0.68 - crane * 0.25 - s.both * 0.04,
    roll: (s.paper * 0.022 - s.both * 0.012) * (1 - crane),
  };
}

function Camera({ time }) {
  const { camera } = useThree();
  const p = cameraPose(time);
  useLayoutEffect(() => {
    camera.zoom = p.zoom;
    camera.setViewOffset(1080, 1920, 0, p.offset, 1080, 1920);
    camera.position.set(p.x, p.y, p.z);
    camera.up.set(Math.sin(p.roll), 1, 0);
    camera.lookAt(0, p.targetY, p.targetZ);
    camera.updateProjectionMatrix();
  }, [camera, p.x, p.y, p.z, p.zoom, p.offset, p.targetY, p.targetZ, p.roll]);
  return null;
}

function waveGeometry(radius, time, phase, width) {
  const segments = 128, bands = 6;
  const positions = [], uvs = [], indices = [];
  for (let b = 0; b <= bands; b++) {
    const v = b / bands;
    const r = radius + (v - 0.5) * width;
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const wobble = Math.sin(angle * 3 + time * 0.55 + phase) * 0.010 + Math.sin(angle * 7 - time * 0.28) * 0.003;
      positions.push(Math.cos(angle) * (r + wobble), Math.sin(angle) * (r + wobble) * 0.47, Math.sin(v * Math.PI) * 0.022 + Math.sin(angle * 4 + phase) * 0.013);
      uvs.push(i / segments, v);
      if (b < bands && i < segments) {
        const a = b * (segments + 1) + i, n = a + segments + 1;
        indices.push(a, n, a + 1, n, n + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function Wave({ radius, time, phase, opacity, width = 0.05 }) {
  const geometry = useMemo(() => waveGeometry(radius, time, phase, width), [radius, time, phase, width]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const rim = useMemo(() => Array.from({ length: 100 }, (_, i) => {
    const a = i / 100 * Math.PI * 2;
    const wobble = Math.sin(a * 3 + time * 0.55 + phase) * 0.010 + Math.sin(a * 7 - time * 0.28) * 0.003;
    return new THREE.Vector3(Math.cos(a) * (radius + wobble), Math.sin(a) * (radius + wobble) * 0.47, 0.038 + Math.sin(a * 4 + phase) * 0.013);
  }), [radius, time, phase]);
  return <group visible={opacity > 0.001}>
    <mesh geometry={geometry}>
      <meshPhysicalMaterial color={C.brass} metalness={0.83} roughness={0.27} clearcoat={1} emissive={C.gold} emissiveIntensity={0.20} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
    <Curve points={rim} radius={0.0045} color="#e2c891" metalness={0.4} glow={0.55} closed opacity={opacity * 0.92} />
    <mesh geometry={geometry} position={[0, -0.075, -0.10]} scale={[1, -1, 1]}>
      <meshBasicMaterial color={C.gold} transparent opacity={opacity * 0.055} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  </group>;
}

function SoundRipples({ time }) {
  const questionAt = aligned ? audioCues.voiceWordFrames.question / 30 : 14;
  const births = [...tickSeconds, questionAt, aligned ? voiceTiming.finalWordEndMs / 1000 + 0.2 : 15.45];
  const closing = 1 - enter(time, 16.5, 1.25);
  const returnProgress = enter(time, 16.9, 2.066666667);
  const final = enter(time, 16.5, 0.6) * (1 - enter(time, 18.78, 0.186666667));
  return <group position={[0, -0.025, 0.34]}>
    {births.map((birth, i) => {
      const age = time - birth, p = clamp(age / (i < 3 ? 2.30 : 2.7));
      const opacity = age >= 0 ? Math.sin(p * Math.PI) * (i < 3 ? 0.84 : 0.34) : 0;
      return <Wave key={birth} radius={mix(0.045, i < 3 ? 1.28 : 1.31, ease(p))} time={time} phase={i * 1.8} opacity={opacity * (i < 3 ? 1 : closing)} width={0.047 + Math.sin(p * Math.PI) * 0.028} />;
    })}
    <Wave radius={mix(1.31, 0.22, returnProgress)} time={time * (1 - returnProgress)} phase={0} opacity={final * 0.62} width={mix(0.07, 0.018, returnProgress)} />
    <mesh scale={[1, 0.48, 1]}>
      <torusGeometry args={[0.22, 0.008, 8, 90]} />
      <meshBasicMaterial color={C.gold} transparent opacity={(1 - enter(time, 0.28, 0.22) + openingReturn(time)) * 0.66} toneMapped={false} />
    </mesh>
    <mesh scale={[1, 0.48, 1]}>
      <sphereGeometry args={[0.016, 20, 12]} />
      <meshBasicMaterial color={C.paper} transparent opacity={(1 - enter(time, 2.65, 0.4) + openingReturn(time)) * 0.82} toneMapped={false} />
    </mesh>
  </group>;
}

function WaveToWindow({ time }) {
  const morph = enter(time, 2.55, 0.98);
  const opacity = enter(time, tickSeconds[2] + 0.03, 0.13) * (1 - enter(time, 3.7, 0.6));
  const points = useMemo(() => Array.from({ length: 96 }, (_, i) => {
    const a = i / 96 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    return new THREE.Vector3(mix(c * 0.71, Math.sign(c) * Math.abs(c) ** 0.16 * 1.235, morph), mix(s * 0.34, Math.sign(s) * Math.abs(s) ** 0.16 * 0.665, morph), 0.04);
  }), [morph]);
  return <Curve points={points} radius={0.009} color={C.gold} closed metalness={0.6} glow={0.3} opacity={opacity} position={[0, 0, 0.14]} />;
}

function RainBeads({ time, opacity }) {
  return <group>
    {Array.from({ length: 34 }, (_, i) => {
      const moving = i % 3 === 0;
      const phase = fract(i * 0.6180339887 + time * (moving ? 0.105 + (i % 4) * 0.023 : 0.007));
      const x = -1.03 + fract(i * 0.754877666) * 2.06;
      const y = 0.57 - phase * 1.12;
      const size = 0.012 + (i % 5) * 0.0024;
      const length = moving ? 0.085 + (i % 4) * 0.03 : 0.024;
      const points = [new THREE.Vector3(0, 0.004, 0), new THREE.Vector3(Math.sin(i) * 0.004, length * 0.45, -0.001), new THREE.Vector3(Math.sin(i * 2.1) * 0.009, length, -0.002)];
      return <group key={i} position={[x + Math.sin(phase * 7 + i) * 0.005, y, 0.048]}>
        <mesh scale={[0.78, moving ? 1.32 : 1.08, 0.44]}>
          <sphereGeometry args={[size, 14, 10]} />
          <meshPhysicalMaterial color="#d7e0d4" metalness={0.12} roughness={0.09} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={1.3} transparent opacity={opacity * 0.77} depthWrite={false} />
        </mesh>
        <mesh position={[-size * 0.22, size * 0.3, size * 0.28]} scale={[0.25, 0.5, 0.2]}>
          <sphereGeometry args={[size, 8, 6]} />
          <meshBasicMaterial color="#fff6dc" transparent opacity={opacity * 0.7} depthWrite={false} />
        </mesh>
        <Curve points={points} radius={moving ? 0.0024 : 0.0014} color="#b5c9bd" opacity={opacity * (moving ? 0.24 : 0.13)} />
      </group>;
    })}
  </group>;
}

function Pane({ side, time, opacity, hinge, texture }) {
  const angle = side * hinge * 1.53;
  return <group position={[side * 1.09, 0, 0.19]} rotation={[0, angle, 0]}>
    <group position={[-side * 0.545, 0, 0]}>
      <Casing width={1.09} height={1.145} border={0.037} depth={0.040} bevel={0.006} color="#345450" texture={texture} opacity={opacity} />
      <Casing width={1.066} height={1.122} border={0.008} depth={0.011} bevel={0.002} color={C.brass} metalness={0.72} opacity={opacity} position={[0, 0, 0.042]} />
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[1.006, 1.060]} />
        <meshPhysicalMaterial color="#a2b7a8" metalness={0.10} roughness={0.08} clearcoat={1} clearcoatRoughness={0.08} transparent opacity={opacity * 0.16} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Rounded size={[1.012, 0.025, 0.030]} radius={0.008} position={[0, -0.028, 0.049]} color={C.brass} metalness={0.68} opacity={opacity} />
      <group scale={[0.49, 0.95, 1]}>
        <RainBeads time={time + (side < 0 ? 0.7 : 0)} opacity={opacity} />
      </group>
      {/* Narrow reflected softbox streaks sit on the glass, not on the frame. */}
      <mesh position={[-0.22, 0.05, 0.040]} rotation={[0, 0, -0.28]}>
        <planeGeometry args={[0.052, 0.88]} />
        <meshBasicMaterial color={C.paper} transparent opacity={opacity * 0.06} depthWrite={false} />
      </mesh>
    </group>
  </group>;
}

function Window({ time, texture }) {
  const s = stateAt(time);
  const windowOpacity = s.reveal * (1 - enter(time, 17.3, 0.85));
  const position = [-s.both * 0.70, 0.015 + s.hinge * 0.10, -s.hinge * 3.05 + s.both * 0.10];
  const scale = mix(1, 0.67, s.hinge) - s.both * 0.01;
  const hinge = s.hinge * (1 - s.both * 0.42);
  return <group position={position} rotation={[s.hinge * -0.045, -0.06 + s.hinge * 0.08 + s.both * 0.09, 0]} scale={scale}>
    <group scale={s.reveal} visible={windowOpacity > 0.001}>
      <Casing width={2.50} height={1.365} border={0.115} depth={0.115} bevel={0.019} color="#1c413f" texture={texture} opacity={windowOpacity} position={[0, 0, -0.09]} />
      <Casing width={2.445} height={1.315} border={0.091} depth={0.090} bevel={0.013} color="#47615a" texture={texture} opacity={windowOpacity} position={[0, 0, 0.025]} />
      <Casing width={2.47} height={1.338} border={0.012} depth={0.018} bevel={0.003} color={C.brass} metalness={0.76} opacity={windowOpacity} position={[0, 0, 0.115]} />
      <Casing width={2.270} height={1.144} border={0.029} depth={0.025} bevel={0.004} color="#efe4ce" texture={texture} opacity={windowOpacity} position={[0, 0, 0.123]} />
      <Rounded size={[2.56, 0.074, 0.30]} radius={0.021} position={[0, -0.700, 0.054]} color="#3b5750" texture={texture} opacity={windowOpacity} />
      <Rounded size={[2.52, 0.011, 0.018]} radius={0.004} position={[0, -0.660, 0.187]} color={C.gold} metalness={0.71} opacity={windowOpacity} />
      <Pane side={-1} time={time} opacity={windowOpacity} hinge={hinge} texture={texture} />
      <Pane side={1} time={time} opacity={windowOpacity} hinge={hinge} texture={texture} />
      <Rounded size={[0.028, 1.10, 0.036]} radius={0.009} position={[0, 0, 0.212]} color={C.brass} metalness={0.7} opacity={windowOpacity * (1 - s.hinge * 0.96)} />
      {/* Tiny hinges and the catch provide scale and precise metal highlights. */}
      {[-1, 1].map((side) => [-0.34, 0.34].map((y) => <group key={`${side}-${y}`} position={[side * 1.085, y, 0.196]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.017, 0.017, 0.075, 16]} />
          <meshStandardMaterial color={C.brass} roughness={0.31} metalness={0.83} transparent opacity={windowOpacity} />
        </mesh>
        <mesh position={[0, 0.038, 0.003]}>
          <sphereGeometry args={[0.018, 12, 8]} />
          <meshStandardMaterial color={C.gold} metalness={0.68} roughness={0.34} transparent opacity={windowOpacity} />
        </mesh>
      </group>))}
      <Rounded size={[0.057, 0.026, 0.037]} radius={0.009} position={[0.055, -0.03, 0.225]} color={C.gold} metalness={0.77} opacity={windowOpacity * (1 - s.hinge * 0.8)} />
    </group>
  </group>;
}

function makeSurface(columns, rows, vertex) {
  const positions = [], uvs = [], indices = [];
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const p = vertex(col / columns, row / rows);
    positions.push(p.x, p.y, p.z); uvs.push(col / columns, row / rows);
    if (row < rows && col < columns) {
      const a = row * (columns + 1) + col, n = a + columns + 1;
      indices.push(a, n, a + 1, n, n + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function ribbonPoint(u, v, open) {
  const w = 2.20 - v * 0.45;
  const edge = Math.abs(u * 2 - 1) ** 10 * 0.037;
  const curl = (1 - enter(v, 0.0, 0.07)) * 0.055;
  const crease = Math.sin(v * Math.PI * 6) ** 8 * 0.010;
  return new THREE.Vector3((u - 0.5) * w, -0.60 + edge + curl + crease + (1 - open) * Math.sin(v * Math.PI) * 0.87, mix(-2.70 + v * 0.15, -0.10 - v * 3.24, open));
}

function FloorRibbon({ open, opacity, texture }) {
  const geometry = useMemo(() => makeSurface(18, 72, (u, v) => ribbonPoint(u, v, open)), [open]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const edges = useMemo(() => [0, 1].map((u) => Array.from({ length: 45 }, (_, i) => ribbonPoint(u, i / 44, open))), [open]);
  const creases = useMemo(() => [1, 2, 3, 4, 5].map((i) => Array.from({ length: 25 }, (_, j) => ribbonPoint(j / 24, i / 6, open).add(new THREE.Vector3(0, 0.003, 0)))), [open]);
  return <group visible={opacity > 0.001}>
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial color="#f2e9d6" roughness={0.97} bumpMap={texture} bumpScale={0.006} side={THREE.DoubleSide} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    <mesh geometry={geometry} position={[0, -0.019, 0]}>
      <meshStandardMaterial color="#bbaf94" roughness={0.97} side={THREE.DoubleSide} transparent opacity={opacity} />
    </mesh>
    {edges.map((points, i) => <Curve key={i} points={points} radius={0.013} color="#eee2c8" opacity={opacity} />)}
    {creases.map((points, i) => <Curve key={i} points={points} radius={0.0019} color="#ac9c7a" opacity={opacity * 0.23} />)}
  </group>;
}

function archPath(width, height, path = new THREE.Shape()) {
  const spring = -height / 2 + height * 0.53;
  path.moveTo(-width / 2, -height / 2);
  path.lineTo(-width / 2, spring);
  path.bezierCurveTo(-width / 2, height / 2 + 0.03, width / 2, height / 2 + 0.03, width / 2, spring);
  path.lineTo(width / 2, -height / 2);
  path.closePath();
  return path;
}

function PaperArch({ index, time, texture }) {
  const width = 2.44 - index * 0.28, height = 1.24 - index * 0.09;
  const geometry = useMemo(() => {
    const shape = archPath(width, height);
    shape.holes.push(archPath(width - 0.24, height - 0.115, new THREE.Path()));
    return new THREE.ExtrudeGeometry(shape, { depth: 0.056, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.007, bevelSegments: 3, curveSegments: 40 });
  }, [width, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const open = enter(paperSceneTime(time), 6.36 + index * 0.22, 1.83);
  const s = stateAt(time), opacity = open * s.fade * s.reset;
  const points = useMemo(() => {
    const path = archPath(width - 0.06, height - 0.03);
    return path.getPoints(60).map((v) => new THREE.Vector3(v.x, v.y, 0.066));
  }, [width, height]);
  return <group position={[0, 0.035 + index * 0.016, -0.38 - index * 1.00]} rotation={[mix(Math.PI / 2, 0, open), 0, (1 - open) * (index - 1) * 0.035]} visible={opacity > 0.001}>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={index === 0 ? '#fff4de' : '#e6dbc4'} roughness={0.92} bumpMap={texture} bumpScale={0.007} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    <Curve points={points} radius={0.003} color="#d1b882" opacity={opacity * 0.53} />
  </group>;
}

function FoldedWall({ side, index, time, texture }) {
  const open = enter(paperSceneTime(time), 6.35 + index * 0.25, 1.52);
  const s = stateAt(time), opacity = open * s.fade * s.reset;
  const geometry = useMemo(() => makeSurface(12, 18, (u, v) => new THREE.Vector3(side * (Math.sin(v * Math.PI) * 0.018 + Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.022), u * 0.63, -v * 0.78)), [side]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group position={[side * (1.11 - index * 0.055), -0.60, -0.14 - index * 0.78]} rotation={[0, 0, side * mix(Math.PI / 2, 0, open)]} visible={opacity > 0.001}>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={side < 0 ? '#e9dfcb' : '#f4ead5'} roughness={0.98} bumpMap={texture} bumpScale={0.007} side={THREE.DoubleSide} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    <Curve points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * 0.015, 0.31, 0), new THREE.Vector3(0, 0.63, 0)]} radius={0.005} color="#ddd0b4" opacity={opacity} />
    <Curve points={[new THREE.Vector3(0, 0.025, -0.008), new THREE.Vector3(side * 0.012, 0.025, -0.39), new THREE.Vector3(0, 0.025, -0.78)]} radius={0.0026} color="#a9946e" opacity={opacity * 0.28} />
  </group>;
}

function RoofFold({ side, index, time, texture }) {
  const open = enter(paperSceneTime(time), 6.70 + index * 0.28, 1.6);
  const s = stateAt(time), opacity = open * s.fade * s.reset;
  const half = 1.0 - index * 0.075;
  const geometry = useMemo(() => makeSurface(26, 16, (u, v) => {
    const angle = u * Math.PI / 2;
    return new THREE.Vector3(-side * half * (1 - Math.cos(angle)), Math.sin(angle) * 0.42, -v * 0.75);
  }), [side, half]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group position={[side * half, 0.029, -1.68 - index * 0.75]} rotation={[0, 0, side * mix(-Math.PI / 2, 0, open)]} visible={opacity > 0.001}>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#efe4cf" roughness={0.96} bumpMap={texture} bumpScale={0.006} side={THREE.DoubleSide} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  </group>;
}

function footprintShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.025, -0.177);
  shape.bezierCurveTo(-0.085, -0.176, -0.094, -0.122, -0.059, -0.051);
  shape.bezierCurveTo(-0.032, 0.004, -0.094, 0.064, -0.073, 0.113);
  shape.bezierCurveTo(-0.055, 0.166, 0.077, 0.159, 0.088, 0.101);
  shape.bezierCurveTo(0.105, 0.037, 0.049, -0.005, 0.046, -0.065);
  shape.bezierCurveTo(0.073, -0.147, 0.031, -0.183, -0.025, -0.177);
  shape.closePath();
  return shape;
}

function Footprint({ index, time, texture }) {
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(footprintShape(), { depth: 0.012, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.003, bevelSegments: 3, curveSegments: 28 }), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const onset = stepSeconds[index] ?? stepSeconds[2] + (index - 2) * 0.7;
  const reveal = enter(time, onset, 0.24);
  const pulse = enter(time, onset, 0.06) * (1 - enter(time, onset + 0.21, 0.43));
  const s = stateAt(time), opacity = reveal * s.fade * s.reset;
  const side = index % 2 ? 1 : -1;
  return <group position={[side * 0.24 + Math.sin(index * 1.6) * 0.015, -0.576 + Math.sin(reveal * Math.PI) * 0.012, -0.33 - index * 0.32]} rotation={[-Math.PI / 2, 0, side * -0.12]} scale={[side * mix(0.75, 1.06, reveal), mix(0.75, 1.06, reveal), 1]} visible={opacity > 0.001}>
    <pointLight position={[0, 0, 0.18]} color="#e4c38a" intensity={pulse * 0.66} distance={0.62} decay={2} />
    <mesh geometry={geometry} position={[0, 0, -0.006]} scale={[1.07, 1.05, 0.45]}>
      <meshStandardMaterial color="#a89362" roughness={0.86} transparent opacity={opacity * 0.74} />
    </mesh>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#dcc195" roughness={0.89} bumpMap={texture} bumpScale={0.004} emissive={C.gold} emissiveIntensity={0.07 + pulse * 0.32} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    {[0, 1, 2, 3, 4].map((toe) => <mesh key={toe} position={[-0.064 + toe * 0.031, 0.173 + Math.sin(toe / 4 * Math.PI) * 0.020, 0.010]} scale={[1, 1.15, 0.37]} castShadow>
      <sphereGeometry args={[0.014 + toe * 0.0017, 12, 8]} />
      <meshStandardMaterial color="#dfc59c" roughness={0.79} emissive={C.gold} emissiveIntensity={pulse * 0.32} transparent={opacity < 1} opacity={opacity} />
    </mesh>)}
  </group>;
}

function PaperCorridor({ time, texture }) {
  const s = stateAt(time), opacity = s.paper * s.fade * s.reset;
  const scale = 1 - s.both * 0.25;
  return <group position={[s.both * 0.39, 0, s.both * 0.025]} rotation={[0, -s.both * 0.065, 0]} scale={scale}>
    <FloorRibbon open={s.paper} opacity={opacity} texture={texture} />
    {[0, 1, 2].map((index) => <PaperArch key={index} index={index} time={time} texture={texture} />)}
    {[-1, 1].map((side) => [0, 1, 2, 3].map((index) => <FoldedWall key={`${side}-${index}`} side={side} index={index} time={time} texture={texture} />))}
    {[-1, 1].map((side) => [0, 1].map((index) => <RoofFold key={`${side}-${index}`} side={side} index={index} time={time} texture={texture} />))}
    <group scale={s.paper}>
      {Array.from({ length: 9 }, (_, i) => <Footprint key={i} index={i} time={time} texture={texture} />)}
    </group>
    {/* A soft window-cross impression continues across the folded floor even
        after the hinged panes have moved clear of its central silhouette. */}
    <group position={[0, -0.588, -1.06]} rotation={[-Math.PI / 2, 0, -0.17]}>
      <mesh>
        <planeGeometry args={[0.020, 1.8]} />
        <meshBasicMaterial color={C.deep} transparent opacity={opacity * 0.13} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.45, 0.001]}>
        <planeGeometry args={[1.54, 0.021]} />
        <meshBasicMaterial color={C.deep} transparent opacity={opacity * 0.11} depthWrite={false} />
      </mesh>
    </group>
  </group>;
}

function ContactShadow({ time }) {
  const s = stateAt(time);
  return <mesh position={[0, -0.805, -1.25]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow visible={s.reveal > 0.001}>
    <planeGeometry args={[4.0, 4.6]} />
    <shadowMaterial transparent opacity={0.12 * s.reveal * (1 - enter(time, 17.3, 0.8))} />
  </mesh>;
}

function PaperMotes({ time }) {
  const s = stateAt(time), opacity = s.reveal * s.fade;
  return <group>
    {Array.from({ length: 14 }, (_, i) => <mesh key={i} position={[Math.sin(i * 13.7) * 1.37 + Math.sin(time * 0.18 + i) * 0.018, Math.sin(i * 8.41) * 0.60 + Math.sin(time * 0.22 + i) * 0.018, -0.65 - (i % 5) * 0.51]} rotation={[i * 0.7, i + time * 0.025, i * 0.4]}>
      <planeGeometry args={[0.009, 0.014]} />
      <meshBasicMaterial color={C.paper} transparent opacity={opacity * 0.16} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>)}
  </group>;
}

function FrameCommit({ frame }) {
  const { scene, camera, gl } = useThree();
  useEffect(() => {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); gl.render(scene, camera);
  }, [scene, camera, gl, frame]);
  return null;
}

function Theatre({ frame, time, texture }) {
  const s = stateAt(time);
  const intercut = enter(time, 10.0, 0.16) * (1 - enter(time, 10.38, 0.25));
  return <>
    <ReflectionEnvironment />
    <Camera time={time} />
    <ambientLight color="#fff0d6" intensity={0.22} />
    <hemisphereLight args={['#f4ecdb', '#082b2b', 0.56]} />
    <directionalLight position={[-3.6, 5.8, 5.7]} color="#fff1d7" intensity={0.87 + s.reveal * 0.40} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={4} shadow-camera-left={-4.5} shadow-camera-right={4.5} shadow-camera-top={4.5} shadow-camera-bottom={-4.5} shadow-bias={-0.00015} shadow-normalBias={0.013} />
    <directionalLight position={[3.4, 2.1, -2.4]} color="#d9e0d1" intensity={0.36 + s.paper * 0.14} />
    <pointLight position={[0.7, 1.4, 2.5]} color="#f4d8a3" intensity={1.3 + s.reveal * 1.3 + intercut * 0.7} distance={6} decay={2} />
    <pointLight position={[-0.5, 0.15, -3.8]} color="#e9dec5" intensity={s.paper * 1.85} distance={5.0} decay={2} />
    <group position={[0, -0.006, 0]} rotation={[0, Math.sin(time * 0.18) * 0.009 * s.reveal, 0]}>
      <ContactShadow time={time} />
      <PaperCorridor time={time} texture={texture} />
      <Window time={time} texture={texture} />
      <WaveToWindow time={time} />
      <SoundRipples time={time} />
      <PaperMotes time={time} />
    </group>
    <FrameCommit frame={frame} />
  </>;
}

export function ListeningScene({ stillFrame }) {
  const currentFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frame = stillFrame ?? currentFrame;
  // A Remotion Still has 1fps; explicit cover frames refer to the 30fps Reel.
  const time = frame / (stillFrame === undefined ? fps : 30);
  const texture = useMemo(paperTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <ThreeCanvas name="Sculpted brass ripples · rain miniature · folded paper corridor" showInTimeline width={width} height={height} frameloop="never" dpr={1} style={{ position: 'absolute', inset: 0 }} camera={{ fov: 37, near: 0.1, far: 60, position: [0.04, 0.12, 11.25] }} shadows={{ type: THREE.PCFShadowMap }} gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}>
    <fog attach="fog" args={[C.deep, 19, 35]} />
    <Theatre frame={frame} time={time} texture={texture} />
  </ThreeCanvas>;
}
