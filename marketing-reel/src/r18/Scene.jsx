import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import audioCues from './audio-cues.json';

const PAPER = '#f5ead5';
const PAPER_EDGE = '#d8c9a9';
const GOLD = '#c9983b';
const DEEP = '#174f52';
const TEAL = '#3e817e';
const lerp = (a, b, t) => a + (b - a) * t;
// Zero acceleration at each end gives the folds and the short rewind a softer
// handoff than a cubic ease, while remaining identical on every frame seek.
const smooth = (t) => { const p = Math.max(0, Math.min(1, t)); return p * p * p * (p * (p * 6 - 15) + 10); };
const cue = (time, from, duration) => smooth((time - from) / duration);

function gardenClock(time) {
  // Integrate the velocity envelope: taper to rest, hold the actual choice,
  // and accelerate from the same phase after it. No breeze/light phase jumps.
  const integral = (t) => t ** 6 - 3 * t ** 5 + 2.5 * t ** 4;
  if (time <= 11.2) return time;
  if (time < 12) {
    const p = (time - 11.2) / 0.8;
    return 11.2 + 0.8 * (p - integral(p));
  }
  if (time <= 15) return 11.6;
  if (time < 15.8) return 11.6 + 0.8 * integral((time - 15) / 0.8);
  if (time < 16.2) return time - 3.8;
  if (time < 17) {
    const p = (time - 16.2) / 0.8;
    return 12.4 + 0.8 * (p - integral(p));
  }
  return 12.8;
}

/** A single absolute-frame clock owns all 3D movement, including the rewind. */
export function paperForkState(frame, fps = 30) {
  const seconds = frame / fps;
  const rewind = seconds >= 19.6 ? smooth((frame - 19.6 * fps) / (20 * fps - 1 - 19.6 * fps)) : 0;
  const time = rewind ? 19.6 * (1 - rewind) : seconds;
  const poseTime = gardenClock(time);
  const cameraTime = time >= 12 && time < 15 ? 12 : time >= 17 ? 17 : time;
  const wordFrame = (word, plannedFrame) => Number.isFinite(audioCues.voiceWordFrames?.[word]) ? audioCues.voiceWordFrames[word] : plannedFrame;
  const forkAt = wordFrame('fork', 2 * fps) / fps;
  const bridgeAt = wordFrame('bridge', audioCues.bridgeFrame) / fps;
  const lanternAt = wordFrame('lantern', audioCues.lanternFrame) / fps;
  const beaconAt = wordFrame('beacon', audioCues.beaconFrame) / fps;
  const leftAt = wordFrame('firstChoice', audioCues.leftSelectionFrame) / fps;
  const rightAt = wordFrame('secondChoice', audioCues.rightSelectionFrame) / fps;
  return {
    time, poseTime, cameraTime, cameraTimes: cameraCueTimes(fps), rewind,
    fork: cue(time, forkAt, 0.85),
    bridge: cue(time, bridgeAt, 0.85),
    lantern: cue(time, lanternAt, 0.8),
    beacon: cue(time, beaconAt, 0.8),
    leftTrace: cue(time, leftAt, 0.92),
    rightTrace: cue(time, rightAt, 0.92),
    leftAt, rightAt,
    curl: cue(time, 16, 0.82),
    split: seconds >= 9 && seconds < 11,
    splitEnvelope: cue(seconds, 9, 0.4) * (1 - cue(seconds, 10.6, 0.4)),
    lift: cue(time, 15, 0.95),
  };
}

function paperTexture() {
  const pixels = new Uint8Array(96 * 96 * 4);
  let seed = 180018;
  for (let i = 0; i < pixels.length; i += 4) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const grain = 174 + Math.floor(seed / 4294967296 * 65);
    pixels[i] = grain; pixels[i + 1] = grain; pixels[i + 2] = grain; pixels[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, 96, 96);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.needsUpdate = true;
  return texture;
}

function PaperMaterial({ color = PAPER, texture, ...props }) {
  return <meshStandardMaterial color={color} roughness={0.9} bumpMap={texture} bumpScale={0.013} side={THREE.DoubleSide} {...props} />;
}

function Block({ size, color = PAPER, texture, ...props }) {
  return <mesh castShadow receiveShadow {...props}>
    <boxGeometry args={size} />
    <PaperMaterial color={color} texture={texture} />
  </mesh>;
}

function RibbonGeometry(curve, width, progress, thickness = 0.043, segments = 96) {
  const vertices = [];
  const indices = [];
  // Four vertices at each cross section make the cream paper's cut edge real.
  for (let i = 0; i <= segments; i++) {
    const t = i / segments * Math.max(0.001, progress);
    const p = curve(t);
    const before = curve(Math.max(0, t - 0.001));
    const after = curve(Math.min(1, t + 0.001));
    const dx = after[0] - before[0], dz = after[2] - before[2];
    const length = Math.hypot(dx, dz) || 1;
    const sx = -dz / length * width / 2, sz = dx / length * width / 2;
    vertices.push(p[0] + sx, p[1], p[2] + sz, p[0] - sx, p[1], p[2] - sz);
    vertices.push(p[0] + sx, p[1] - thickness, p[2] + sz, p[0] - sx, p[1] - thickness, p[2] - sz);
    if (i < segments) {
      const a = i * 4, b = a + 4;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
      indices.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);
      indices.push(a, a + 2, b, a + 2, b + 2, b);
      indices.push(a + 1, b + 1, a + 3, a + 3, b + 1, b + 3);
    }
  }
  const end = segments * 4;
  indices.push(0, 1, 2, 1, 3, 2, end, end + 2, end + 1, end + 1, end + 2, end + 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function mainCurve(t, curl = 0) {
  // The foreground tip lifts into a small curl; the fork itself stays attached.
  const angle = t * Math.PI * 1.42;
  return [curl * Math.pow(t, 2) * 0.55 * Math.sin(angle), 0.455 + curl * Math.pow(t, 3) * 0.82, 0.63 + 2.65 * t - curl * Math.pow(t, 2) * 0.72];
}

function leftCurve(t, bridge = 1) {
  return [-2.7 * (t * t * (3 - 2 * t)), 0.455 + Math.sin(Math.PI * t) * 0.37 * bridge, 0.65 - 2.60 * t];
}

function rightCurve(t) {
  return [2.75 * (t * t * (3 - 2 * t)), 0.455 + Math.sin(Math.PI * t) * 0.055, 0.65 - 2.65 * t];
}

function Ribbon({ type, progress = 1, bridge = 1, curl = 0, texture }) {
  const geometry = useMemo(() => RibbonGeometry(type === 'stem' ? (t) => mainCurve(t, curl) : type === 'left' ? (t) => leftCurve(t, bridge) : rightCurve, type === 'stem' ? 0.78 : 0.64, progress), [type, progress, bridge, curl]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow>
    <PaperMaterial texture={texture} />
  </mesh>;
}

function Trace({ curve, progress, radius = 0.019, opacity = 1 }) {
  const geometry = useMemo(() => {
    const points = Array.from({ length: 65 }, (_, i) => {
      const p = curve(i / 64 * Math.max(progress, 0.0001));
      return new THREE.Vector3(p[0], p[1] + 0.024, p[2]);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, radius, 5, false);
  }, [curve, progress, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}>
    <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.68} roughness={0.48} metalness={0.28} transparent opacity={opacity} />
  </mesh>;
}

function Island({ texture }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 3.62);
    shape.bezierCurveTo(2.35, 3.7, 4.43, 2.33, 4.30, 0.4);
    shape.bezierCurveTo(4.52, -1.8, 2.74, -3.61, 0.48, -3.53);
    shape.bezierCurveTo(-1.72, -3.80, -4.12, -2.42, -4.35, -0.65);
    shape.bezierCurveTo(-4.77, 1.37, -2.55, 3.64, 0, 3.62);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.11, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.03, bevelThickness: 0.023, curveSegments: 60 });
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group>
    {[
      [-0.05, 1.05, '#245f62'],
      [0.065, 1.03, '#598f85'],
      [0.18, 1.013, '#b9c9b3'],
      [0.28, 1, TEAL],
    ].map(([y, scale, color], i) => <mesh key={i} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} scale={[scale, scale, 1]} receiveShadow castShadow>
      <PaperMaterial color={color} texture={texture} />
    </mesh>)}
    {/* Small cut-paper details make the terrace read as a made object. */}
    {[[-3.5, 1.3, 0.33], [-3.15, 2.05, 0.25], [3.43, 1.72, 0.34], [2.8, 2.88, 0.26], [0.68, -3.10, 0.45]].map(([x, z, size], i) => <mesh key={i} position={[x, 0.43, z]} rotation={[0, i * 0.7, 0]} castShadow receiveShadow>
      <dodecahedronGeometry args={[size, 0]} />
      <PaperMaterial color={i % 2 ? '#659991' : '#78a598'} texture={texture} />
    </mesh>)}
  </group>;
}

function Hills({ texture }) {
  const geometries = useMemo(() => [0, 1, 2].map((layer) => {
    const shape = new THREE.Shape();
    shape.moveTo(-4.2, 0);
    shape.bezierCurveTo(-3.5, 0.95 - layer * 0.1, -2.9, 1.20 - layer * 0.12, -2.1, 0.45);
    shape.bezierCurveTo(-1.2, 0.10, -0.9, 1.1 - layer * 0.1, 0, 0.84);
    shape.bezierCurveTo(0.9, 0.70, 1.2, 1.26 - layer * 0.1, 2.1, 0.57);
    shape.bezierCurveTo(3, 0.20, 3.55, 0.9, 4.2, 0.18);
    shape.lineTo(4.2, -0.25); shape.lineTo(-4.2, -0.25); shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 0.029, bevelEnabled: false, curveSegments: 36 });
  }), []);
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);
  return <group position={[0, 0.40, -2.66]}>
    {geometries.map((geometry, i) => <mesh key={i} geometry={geometry} position={[0, 0, -i * 0.27]} rotation={[-0.08 + i * 0.035, 0, 0]} castShadow receiveShadow>
      <PaperMaterial color={['#74a297', '#4b8986', '#2b6b6d'][i]} texture={texture} />
    </mesh>)}
    {/* Visible book-fold scores connect the landscape to paper craft. */}
    {[-2.1, 0, 2.1].map((x, i) => <Block key={x} size={[0.018, 0.50 + i * 0.08, 0.012]} position={[x, 0.26 + i * 0.04, 0.032]} rotation={[0, 0, i === 1 ? -0.18 : 0.14]} color="#9bbbad" texture={texture} />)}
  </group>;
}

function Leaf({ height = 0.42, width = 0.22, color = '#9ebdae', texture, ...props }) {
  const geometry = useMemo(() => {
    const positions = [0, 0, 0, -width, height * 0.48, 0.025, 0, height, 0, width, height * 0.48, 0.025, 0, height * 0.5, 0.12];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]);
    geo.computeVertexNormals();
    return geo;
  }, [height, width]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow {...props}>
    <PaperMaterial color={color} texture={texture} />
  </mesh>;
}

function Plant({ position, scale = 1, texture, angle = 0, time = 0, phase = 0 }) {
  const sway = (Math.sin(time * 0.74 + phase) - Math.sin(phase)) * 0.038;
  return <group position={position} scale={scale} rotation={[sway * 0.45, angle, sway]}>
    <Block size={[0.035, 0.76, 0.035]} position={[0, 0.37, 0]} color="#b3baa0" texture={texture} />
    {[0, 1, 2].map((i) => <group key={i} position={[0, 0.20 + i * 0.19, 0]} rotation={[sway * (i + 1) * 0.20, 0, sway * (i + 1) * 0.22]}>
      <Leaf texture={texture} height={0.40 - i * 0.035} width={0.19} rotation={[0.1, 0.14, 0.82]} color={i === 1 ? '#b7cbb4' : '#79a697'} />
      <Leaf texture={texture} height={0.39 - i * 0.025} width={0.19} rotation={[-0.12, 0.2, -0.82]} color={i === 1 ? '#93b29f' : '#c8d5b9'} />
    </group>)}
    <Leaf texture={texture} height={0.4} width={0.16} position={[0, 0.61, 0]} color="#b9ccae" />
  </group>;
}

function Bridge({ unfold, texture }) {
  return <group visible={unfold > 0.001}>
    {/* This bridge rests on solid teal ground; no river, cliff or hazard. */}
    {[0, 1].map((side) => <group key={side}>
      {[0.14, 0.28, 0.42, 0.56, 0.70, 0.84].map((t, i) => {
        const p = leftCurve(t, unfold);
        const tangent = leftCurve(t + 0.01, unfold);
        const angle = Math.atan2(tangent[0] - p[0], tangent[2] - p[2]);
        const offset = side ? 0.27 : -0.27;
        return <group key={t} position={[p[0] + Math.cos(angle) * offset, p[1], p[2] - Math.sin(angle) * offset]} scale={[1, Math.max(0.001, unfold), 1]}>
          <Block size={[0.038, 0.29, 0.038]} position={[0, 0.14, 0]} color={PAPER_EDGE} texture={texture} />
          <mesh position={[0, 0.29, 0]}><sphereGeometry args={[0.026, 10, 6]} /><PaperMaterial color={GOLD} /></mesh>
          {i < 5 ? <Block size={[0.026, 0.024, 0.52]} position={[Math.sin(angle) * -0.18, 0.225, Math.cos(angle) * -0.18]} rotation={[0, angle, 0]} color={PAPER_EDGE} texture={texture} /> : null}
        </group>;
      })}
    </group>)}
    {[0.24, 0.49, 0.74].map((t) => {
      const p = leftCurve(t, unfold);
      return <Block key={t} size={[0.35, Math.max(0.01, (p[1] - 0.37) * unfold), 0.12]} position={[p[0], (p[1] + 0.37) / 2 - 0.02, p[2]]} rotation={[0, -0.8, 0]} color="#b4c2a7" texture={texture} />;
    })}
  </group>;
}

function Lantern({ reveal, time, texture, selected }) {
  return <group position={[-2.71, 0.42, -1.97]} scale={Math.max(0.001, reveal)} rotation={[0, (1 - reveal) * -0.35, 0]}>
    <mesh position={[0, 0.055, 0]} receiveShadow castShadow><cylinderGeometry args={[0.49, 0.54, 0.10, 48]} /><PaperMaterial color="#9fb9a3" texture={texture} /></mesh>
    <mesh position={[0, 0.14, 0]} receiveShadow castShadow><cylinderGeometry args={[0.31, 0.34, 0.08, 8]} /><PaperMaterial color={GOLD} texture={texture} /></mesh>
    <mesh position={[0, 0.48, 0]}><cylinderGeometry args={[0.265, 0.265, 0.62, 8, 1, true]} /><meshStandardMaterial color="#ffe4a4" emissive="#ffe7ab" emissiveIntensity={0.65 + selected * 0.24} transparent opacity={0.86} roughness={0.54} side={THREE.DoubleSide} /></mesh>
    {Array.from({ length: 8 }, (_, i) => <Block key={i} size={[0.031, 0.68, 0.031]} position={[Math.cos(i * Math.PI / 4) * 0.272, 0.48, Math.sin(i * Math.PI / 4) * 0.272]} color={GOLD} texture={texture} />)}
    <mesh position={[0, 0.84, 0]} castShadow><coneGeometry args={[0.39, 0.25, 8]} /><PaperMaterial color={PAPER} texture={texture} /></mesh>
    <mesh position={[0, 0.73, 0]} castShadow><cylinderGeometry args={[0.34, 0.35, 0.038, 8]} /><PaperMaterial color={GOLD} texture={texture} /></mesh>
    <mesh position={[0, 1.015, 0]} rotation={[0, 0, 0]} castShadow><torusGeometry args={[0.104, 0.017, 8, 24, Math.PI]} /><PaperMaterial color={GOLD} texture={texture} /></mesh>
    <mesh position={[0, 0.49, 0]}><sphereGeometry args={[0.115, 20, 12]} /><meshBasicMaterial color="#fff0c2" toneMapped={false} /></mesh>
    <pointLight color="#ffe2a0" position={[0, 0.52, 0.13]} intensity={reveal * (3.6 + selected * 1.1 + Math.sin(time * 0.65) * 0.08)} distance={3.1} decay={2} />
    {/* A folded paper petal, warm enough to read as welcoming at reel scale. */}
    <Leaf height={0.33} width={0.10} texture={texture} position={[0.32, 0.11, 0.23]} rotation={[0.5, 0.2, -0.68]} color={PAPER} />
  </group>;
}

function HelperBeacon({ reveal, time, selected, texture }) {
  return <group position={[2.75, 0.42, -2.00]} scale={Math.max(0.001, reveal)} rotation={[0, (1 - reveal) * 0.4, 0]}>
    <mesh position={[0, 0.05, 0]} receiveShadow castShadow><cylinderGeometry args={[0.65, 0.69, 0.1, 48]} /><PaperMaterial color="#adc3aa" texture={texture} /></mesh>
    <Block size={[0.84, 0.065, 0.67]} position={[0, 0.14, 0.035]} texture={texture} />
    {[-0.37, 0.37].map((x) => <Block key={x} size={[0.065, 0.75, 0.065]} position={[x, 0.53, 0.20]} color={PAPER} texture={texture} />)}
    <Block size={[0.81, 0.55, 0.06]} position={[0, 0.44, -0.26]} color="#88aba0" texture={texture} />
    {/* One folded sheet forms a little open, caring shelter. */}
    <group position={[0, 0.985, 0]}>
      <Block size={[0.57, 0.045, 0.80]} position={[-0.23, 0, 0]} rotation={[0, 0, 0.43]} color={TEAL} texture={texture} />
      <Block size={[0.57, 0.045, 0.80]} position={[0.23, 0, 0]} rotation={[0, 0, -0.43]} color="#528e88" texture={texture} />
      <Block size={[0.026, 0.04, 0.84]} position={[0, 0.123, 0]} color={PAPER_EDGE} texture={texture} />
      {[-0.49, 0.49].map((x) => <Block key={x} size={[0.027, 0.04, 0.84]} position={[x, -0.10, 0]} color={PAPER} texture={texture} />)}
    </group>
    <Block size={[0.034, 0.37, 0.034]} position={[0, 1.30, -0.02]} color={GOLD} texture={texture} />
    <mesh position={[0, 1.49, -0.02]}><sphereGeometry args={[0.13, 24, 16]} /><meshStandardMaterial color="#fff0c2" emissive="#ffdf97" emissiveIntensity={1.15 + selected * 0.30} roughness={0.45} /></mesh>
    <mesh position={[0, 1.49, -0.02]} rotation={[Math.PI / 2, 0, time * 0.055]}><torusGeometry args={[0.27, 0.019, 8, 44]} /><PaperMaterial color={GOLD} /></mesh>
    <mesh position={[0, 1.49, -0.02]} rotation={[Math.PI / 2.65, 0.15, -0.22]}><torusGeometry args={[0.23, 0.012, 8, 44]} /><PaperMaterial color={PAPER} /></mesh>
    <mesh position={[0, 0.54, -0.09]}><sphereGeometry args={[0.10, 20, 12]} /><meshBasicMaterial color="#ffedbd" toneMapped={false} /></mesh>
    <pointLight position={[0, 0.80, 0.12]} color="#ffe5aa" intensity={reveal * (2.3 + selected * 1.1)} distance={3} decay={2} />
    <Leaf height={0.37} width={0.15} texture={texture} position={[-0.41, 0.13, 0.12]} rotation={[0, 0, 0.5]} color={PAPER} />
  </group>;
}

function ForkPath({ state, texture }) {
  const stemTraceCurve = useMemo(() => (t) => mainCurve(1 - t, state.curl), [state.curl]);
  const leftTraceCurve = useMemo(() => (t) => leftCurve(t, state.bridge), [state.bridge]);
  const rightTraceCurve = useMemo(() => rightCurve, []);
  const leftTip = leftCurve(state.leftTrace, state.bridge);
  const rightTip = rightCurve(state.rightTrace);
  // Each branch owns its light. The first light softly settles into its
  // endpoint before the second is lit at the fork, avoiding a visible teleport.
  const leftLight = cue(state.time, state.leftAt, 0.16) * (1 - cue(state.time, state.rightAt - 0.32, 0.32));
  const rightLight = cue(state.time, state.rightAt, 0.16) * (1 - cue(state.time, 10.6, 0.4));
  return <group>
    <Ribbon type="stem" curl={state.curl} texture={texture} />
    <Ribbon type="left" progress={state.fork} bridge={state.bridge} texture={texture} />
    <Ribbon type="right" progress={state.fork} texture={texture} />
    <mesh position={[0, 0.457, 0.64]} rotation={[-Math.PI / 2, 0, 0]} scale={Math.max(0.001, state.fork)} receiveShadow>
      <circleGeometry args={[0.38, 48]} /><PaperMaterial texture={texture} />
    </mesh>
    <Bridge unfold={state.bridge} texture={texture} />
    <Trace curve={stemTraceCurve} progress={cue(state.time, 0.2, 2.1)} radius={0.015} opacity={0.86} />
    <Trace curve={leftTraceCurve} progress={state.leftTrace} opacity={state.leftTrace > 0 ? 0.94 : 0} />
    <Trace curve={rightTraceCurve} progress={state.rightTrace} opacity={state.rightTrace > 0 ? 0.94 : 0} />
    {[[leftTip, leftLight], [rightTip, rightLight]].map(([p, light], i) => <group key={i}>
      <mesh position={[p[0], p[1] + 0.062, p[2]]} scale={Math.max(0.001, light)}>
        <sphereGeometry args={[0.068, 20, 12]} /><meshBasicMaterial color="#ffdf91" toneMapped={false} />
      </mesh>
      <pointLight position={[p[0], p[1] + 0.38, p[2]]} color="#f7d58f" intensity={light * 2.0} distance={1.9} />
    </group>)}
    {/* Gold inlaid endpoint rings remain on both caring choices. */}
    {[[-2.71, -1.97, state.lantern, state.leftTrace], [2.75, -2, state.beacon, state.rightTrace]].map(([x, z, reveal, selected], i) => <mesh key={i} position={[x, 0.449, z]} rotation={[-Math.PI / 2, 0, 0]} scale={Math.max(0.001, reveal)}>
      <torusGeometry args={[i ? 0.74 : 0.59, 0.022, 8, 80]} /><meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={selected * 0.40} metalness={0.22} roughness={0.50} />
    </mesh>)}
  </group>;
}

const CAMERA_KEYS = [
  { t: 0, p: [0.18, 13.4, 25.8], aim: [0, 0.54, 0.30], zoom: 0.83 },
  { t: 2.0, p: [0.18, 12.7, 24.9], aim: [0, 0.49, 0.12], zoom: 0.84 },
  { t: 3.0, p: [-0.30, 12.8, 25.6], aim: [-0.18, 0.54, -0.02], zoom: 0.83 },
  { t: 4.4, p: [-2.45, 12.0, 25.8], aim: [-0.55, 0.58, -0.22], zoom: 0.85 },
  { t: 6.0, p: [2.15, 12.4, 26.0], aim: [0.53, 0.62, -0.15], zoom: 0.85 },
  { t: 7.5, p: [0.35, 13.5, 25.8], aim: [0, 0.55, 0.10], zoom: 0.84 },
  { t: 12, p: [0.20, 13.7, 26.2], aim: [0, 0.55, 0.10], zoom: 0.84 },
  { t: 15, p: [0.20, 13.7, 26.2], aim: [0, 0.55, 0.10], zoom: 0.84 },
  { t: 17, p: [0.20, 14.5, 26.4], aim: [0, 0.58, 0.08], zoom: 0.85 },
  { t: 19.6, p: [0.20, 14.5, 26.4], aim: [0, 0.58, 0.08], zoom: 0.85 },
];

function cameraCueTimes(fps) {
  const beats = [['fork', 0.85], ['bridge', 0], ['lantern', 0.8], ['beacon', 0.8], ['question', 0.5]];
  let previous = 0;
  return beats.map(([word, offset], i) => {
    const frame = audioCues.voiceWordFrames?.[word];
    const desired = Number.isFinite(frame) ? frame / fps + offset : CAMERA_KEYS[i + 1].t;
    // A replacement take cannot invert two shots or run into the fixed 12s
    // choice hold. Keep at least 0.35s between keys and 1.2s for the settle.
    const latest = 10.8 - (beats.length - i - 1) * 0.35;
    const time = Math.max(previous + 0.35, Math.min(latest, desired));
    previous = time;
    return time;
  });
}

function cameraPose(time, cameraTimes) {
  const keys = CAMERA_KEYS.map((key, i) => i > 0 && i <= cameraTimes.length ? { ...key, t: cameraTimes[i - 1] } : key);
  const clock = Math.max(0, Math.min(19.6, time));
  const index = Math.max(0, keys.findIndex((key, i) => i < keys.length - 1 && clock >= key.t && clock <= keys[i + 1].t));
  const a = keys[index], b = keys[index + 1];
  const t = (clock - a.t) / (b.t - a.t);
  const tangent = (keyIndex, field, component) => {
    if (keyIndex === 0 || keyIndex >= keys.length - 1 || keys[keyIndex].t >= 12) return 0;
    const before = keys[keyIndex - 1], key = keys[keyIndex], after = keys[keyIndex + 1];
    const value = (item) => component === undefined ? item[field] : item[field][component];
    const incoming = (value(key) - value(before)) / (key.t - before.t);
    const outgoing = (value(after) - value(key)) / (after.t - key.t);
    // A shared time-aware tangent carries velocity across shots. Flatten true
    // direction changes so the camera cannot overshoot an authored close-up.
    return incoming * outgoing <= 0 ? 0 : (incoming + outgoing) * 0.30;
  };
  const hermite = (field, component) => {
    const from = component === undefined ? a[field] : a[field][component];
    const to = component === undefined ? b[field] : b[field][component];
    const duration = b.t - a.t;
    return (2 * t ** 3 - 3 * t ** 2 + 1) * from + (t ** 3 - 2 * t ** 2 + t) * duration * tangent(index, field, component)
      + (-2 * t ** 3 + 3 * t ** 2) * to + (t ** 3 - t ** 2) * duration * tangent(index + 1, field, component);
  };
  return { p: a.p.map((_, i) => hermite('p', i)), aim: a.aim.map((_, i) => hermite('aim', i)), zoom: hermite('zoom') };
}

function Camera({ state }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    // A full-frame projection keeps the background continuous, placing the
    // made-paper stage between the reserved headline and subtitle bands.
    const finalPose = cameraPose(19.6, state.cameraTimes), openingPose = cameraPose(0, state.cameraTimes);
    const pose = state.rewind ? {
      p: finalPose.p.map((n, i) => lerp(n, openingPose.p[i], state.rewind)),
      aim: finalPose.aim.map((n, i) => lerp(n, openingPose.aim[i], state.rewind)),
      zoom: lerp(finalPose.zoom, openingPose.zoom, state.rewind),
    } : cameraPose(state.cameraTime, state.cameraTimes);
    camera.position.set(...pose.p);
    camera.zoom = pose.zoom;
    camera.setViewOffset(1080, 1920, 0, 132, 1080, 1920);
    camera.lookAt(...pose.aim);
    camera.updateProjectionMatrix();
  }, [camera, state.cameraTime, state.cameraTimes, state.rewind]);
  return null;
}

function makeSplitCompositor() {
  const target = (width, height) => new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 });
  const main = target(1080, 1920), left = target(342, 414), right = target(342, 414);
  const material = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: {
      mainImage: { value: main.texture }, leftImage: { value: left.texture }, rightImage: { value: right.texture },
      envelope: { value: 0 }, paperTeal: { value: new THREE.Color(DEEP) }, edgeTeal: { value: new THREE.Color('#2b6868') },
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D mainImage, leftImage, rightImage;
      uniform float envelope;
      uniform vec3 paperTeal, edgeTeal;
      varying vec2 vUv;
      float cardMask(vec2 pixel, vec2 center, vec2 halfSize) {
        vec2 q = abs(pixel - center) - halfSize + 14.0;
        float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - 14.0;
        return 1.0 - smoothstep(-1.0, 1.0, d);
      }
      void main() {
        vec2 pixel = vec2(vUv.x * 1080.0, (1.0 - vUv.y) * 1920.0);
        vec4 base = texture2D(mainImage, vUv);
        // RGB in a transparent render target is premultiplied. Keep it so
        // through the blend and only unpremultiply for the final color output.
        vec4 color = base * (1.0 - envelope);
        float scale = mix(0.92, 1.0, envelope);
        vec2 halfSize = vec2(171.0, 207.0) * scale;
        vec2 leftCenter = vec2(351.0 - 34.0 * (1.0 - envelope), 843.0 + 18.0 * (1.0 - envelope));
        vec2 rightCenter = vec2(729.0 + 34.0 * (1.0 - envelope), 843.0 + 18.0 * (1.0 - envelope));
        vec2 leftUv = (pixel - leftCenter) / (halfSize * 2.0) + 0.5;
        vec2 rightUv = (pixel - rightCenter) / (halfSize * 2.0) + 0.5;
        leftUv.y = 1.0 - leftUv.y; rightUv.y = 1.0 - rightUv.y;
        vec4 leftSample = texture2D(leftImage, clamp(leftUv, 0.0, 1.0));
        vec4 rightSample = texture2D(rightImage, clamp(rightUv, 0.0, 1.0));
        float leftMix = cardMask(pixel, leftCenter, halfSize) * envelope;
        float rightMix = cardMask(pixel, rightCenter, halfSize) * envelope;
        vec3 leftBg = mix(paperTeal, edgeTeal, smoothstep(0.0, 1.0, leftUv.y) * 0.8);
        vec3 rightBg = mix(paperTeal, edgeTeal, smoothstep(0.0, 1.0, rightUv.y) * 0.8);
        vec4 leftColor = vec4(leftSample.rgb + leftBg * (1.0 - leftSample.a), 1.0);
        vec4 rightColor = vec4(rightSample.rgb + rightBg * (1.0 - rightSample.a), 1.0);
        color = mix(color, leftColor, leftMix);
        color = mix(color, rightColor, rightMix);
        color.rgb /= max(color.a, 0.0001);
        gl_FragColor = color;
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        gl_FragColor.rgb *= gl_FragColor.a;
      }
    `,
  });
  const screen = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false; screen.add(quad);
  return { main, left, right, material, screen, lens: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), dispose: () => {
    main.dispose(); left.dispose(); right.dispose(); material.dispose(); quad.geometry.dispose();
  } };
}

function FrameCommit({ frame, state }) {
  const { scene, camera, gl } = useThree();
  const clock = useRef(state);
  const compositor = useMemo(makeSplitCompositor, []);
  const splitCameras = useMemo(() => [new THREE.PerspectiveCamera(35, 342 / 414, 0.1, 60), new THREE.PerspectiveCamera(35, 342 / 414, 0.1, 60)], []);
  useLayoutEffect(() => { clock.current = state; }, [state]);
  useLayoutEffect(() => {
    const render = gl.render.bind(gl);
    let composing = false;
    // Hook Remotion's requested render too, so its manual advance cannot
    // overwrite a split composite with a stale central image in Studio.
    gl.render = (renderScene, renderCamera) => {
      if (composing || renderScene !== scene || renderCamera !== camera) return render(renderScene, renderCamera);
      composing = true;
      const requested = clock.current;
      const previousTarget = gl.getRenderTarget();
      const previousClear = gl.getClearColor(new THREE.Color());
      const previousAlpha = gl.getClearAlpha();
      try {
        scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
        gl.setScissorTest(false); gl.setClearColor(0x000000, 0);
        gl.setRenderTarget(compositor.main); gl.setViewport(0, 0, 1080, 1920);
        render(scene, camera);
        if (requested.splitEnvelope > 0) {
          const localTime = Math.max(0, Math.min(2, requested.time - 9));
          splitCameras.forEach((lens, i) => {
            const x = i ? 2.75 : -2.71;
            const drift = smooth(localTime / 2);
            lens.position.set(x + (i ? -0.60 : 0.75) + (i ? 1 : -1) * drift * 0.07, 2.9 + drift * 0.12, 3.80);
            lens.lookAt(x, i ? 0.97 : 0.75, -1.45);
            lens.updateProjectionMatrix(); lens.updateMatrixWorld(true);
            gl.setRenderTarget(i ? compositor.right : compositor.left);
            gl.setViewport(0, 0, 342, 414); render(scene, lens);
          });
        }
        compositor.material.uniforms.envelope.value = requested.splitEnvelope;
        gl.setRenderTarget(previousTarget); gl.setViewport(0, 0, 1080, 1920);
        render(compositor.screen, compositor.lens);
      } finally {
        gl.setRenderTarget(previousTarget); gl.setViewport(0, 0, 1080, 1920);
        gl.setClearColor(previousClear, previousAlpha); composing = false;
      }
    };
    return () => { gl.render = render; compositor.dispose(); };
  }, [scene, camera, gl, compositor, splitCameras]);
  useEffect(() => {
    // Explicit paused/backwards-seek commit; all scene matrices and shader
    // uniforms come from the current requested frame, never elapsed wall time.
    gl.render(scene, camera);
  }, [scene, camera, gl, frame, state]);
  return null;
}

function PaperWorld({ frame, state, texture }) {
  const breeze = Math.sin(state.poseTime * 0.38) * 0.32;
  return <>
    <Camera state={state} />
    <ambientLight color={PAPER} intensity={0.75} />
    <hemisphereLight args={['#d9e3ce', '#123e43', 1.05]} />
    <directionalLight position={[-7 + breeze, 11, 8 - breeze * 0.7]} color="#fff0d5" intensity={2.05 + breeze * 0.12} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-near={0.1} shadow-camera-far={40} shadow-bias={-0.00035} shadow-normalBias={0.035} />
    <directionalLight position={[6 - breeze * 0.4, 7, -5]} color="#bdded0" intensity={0.86} />
    <mesh position={[0, -0.31, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[300, 300]} /><shadowMaterial color="#052d30" opacity={0.19} />
    </mesh>
    <group>
      <Island texture={texture} />
      <Hills texture={texture} />
      <ForkPath state={state} texture={texture} />
      <Lantern reveal={state.lantern} time={state.poseTime} selected={state.leftTrace} texture={texture} />
      <HelperBeacon reveal={state.beacon} time={state.poseTime} selected={state.rightTrace} texture={texture} />
      <Plant position={[-3.74, 0.43, -1.14]} scale={0.83} angle={0.18} texture={texture} time={state.poseTime} phase={0.2} />
      <Plant position={[3.66, 0.43, -0.64]} scale={0.68} angle={-0.3} texture={texture} time={state.poseTime} phase={1.4} />
      <Plant position={[-3.14, 0.43, 2.28]} scale={0.45} angle={-0.18} texture={texture} time={state.poseTime} phase={2.1} />
      <Plant position={[3.08, 0.43, 2.40]} scale={0.41} angle={0.3} texture={texture} time={state.poseTime} phase={3.0} />
      {[[-1.08, 0.94, -2.38], [1.0, 1.16, -2.67], [-3.37, 0.8, -2.17], [3.48, 0.90, -2.56]].map(([x, y, z], i) => <Leaf key={i} position={[x, y, z]} rotation={[0.14 + (Math.sin(state.poseTime * 0.58 + i) - Math.sin(i)) * 0.042, 0.1, (i % 2 ? -0.42 : 0.38) + (Math.sin(state.poseTime * 0.72 + i) - Math.sin(i)) * 0.026]} height={0.25} width={0.10} color={i % 2 ? PAPER : '#c5ceaa'} texture={texture} />)}
    </group>
    <FrameCommit frame={frame} state={state} />
  </>;
}

export function PaperForkScene({ stillFrame }) {
  const currentFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frame = stillFrame ?? currentFrame;
  // Remotion Stills have their own FPS. A requested stillFrame is a frame on
  // this reel's authored 30fps timeline, so its pose must use that clock.
  const state = paperForkState(frame, stillFrame === undefined ? fps : 30);
  const splitEnvelope = state.splitEnvelope;
  const texture = useMemo(paperTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <>
    <ThreeCanvas name="One paper path · two caring destinations" showInTimeline width={width} height={height} frameloop="never" dpr={1} style={{ position: 'absolute', inset: 0 }} camera={{ fov: 35, near: 0.1, far: 350, position: [0.18, 13.4, 25.8] }} shadows={{ type: THREE.PCFShadowMap }} gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}>
      <PaperWorld frame={frame} state={state} texture={texture} />
    </ThreeCanvas>
    {state.split ? <div style={{ position: 'absolute', left: 180, top: 636, width: 720, height: 414, pointerEvents: 'none', display: 'flex', gap: 36 }}>
      <div style={{ width: 342, height: 414, boxSizing: 'border-box', border: '2px solid rgba(245,234,213,0.44)', borderRadius: 14, opacity: splitEnvelope, scale: lerp(0.92, 1, splitEnvelope), translate: `${-34 * (1 - splitEnvelope)}px ${18 * (1 - splitEnvelope)}px`, boxShadow: '0 14px 20px rgba(7,35,37,0.12)' }} />
      <div style={{ width: 342, height: 414, boxSizing: 'border-box', border: '2px solid rgba(245,234,213,0.44)', borderRadius: 14, opacity: splitEnvelope, scale: lerp(0.92, 1, splitEnvelope), translate: `${34 * (1 - splitEnvelope)}px ${18 * (1 - splitEnvelope)}px`, boxShadow: '0 14px 20px rgba(7,35,37,0.12)' }} />
      <div style={{ position: 'absolute', left: 359, top: (414 - splitEnvelope * 414) / 2, width: 2, height: splitEnvelope * 414, opacity: splitEnvelope * 0.63, background: 'linear-gradient(180deg, transparent, #d6b576 20%, #f5ead5 50%, #d6b576 80%, transparent)' }} />
    </div> : null}
  </>;
}
