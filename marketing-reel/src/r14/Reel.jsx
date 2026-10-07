import { useLayoutEffect, useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import captions from './captions.json';
import plannedCaptions from './captions-planned.json';
import voiceTiming from './voice-timing.json';
import '../brand';

const TEAL = '#146466';
const DEEP = '#0b3033';
const CREAM = '#fdf8f0';
const GOLD = '#f4b740';
const DOORS = [
  { x: 1.48, label: 'القمر', kind: 'moon' },
  { x: 0, label: 'الضحكة', kind: 'laugh' },
  { x: -1.48, label: 'النور', kind: 'light' },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ease = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const mix = (a, b, t) => a + (b - a) * t;

function pose(frame) {
  const overhead = { position: [0, 7.9, 6.25], target: [0, 0.9, 0] };
  const wide = { position: [0, 2.65, 7.0], target: [0, 1.05, 0] };
  const close = (x) => ({ position: [x * 0.94, 2.0, 4.0], target: [x, 1.3, 0] });
  const medium = (x) => ({ position: [x * 0.63, 2.5, 6.0], target: [x * 0.57, 1.16, 0] });
  const blend = (a, b, t) => ({
    position: a.position.map((v, i) => mix(v, b.position[i], t)),
    target: a.target.map((v, i) => mix(v, b.target[i], t)),
  });
  // Each close-up holds exactly 18 frames / 0.6 seconds. Absolute-frame
  // interpolation makes backwards seeking and parallel rendering deterministic.
  const keys = [
    [0, overhead], [60, wide], [81, medium(1.48)],
    [90, close(1.48)], [107, close(1.48)], [120, medium(1.48)],
    [149, medium(1.48)], [180, close(0)], [197, close(0)],
    [209, medium(0)], [240, close(-1.48)], [257, close(-1.48)],
    [269, medium(-1.48)], [300, wide],
    [330, { position: [0.24, 2.72, 7], target: [0, 1.05, 0] }],
    [360, wide], [539, wide], [569, overhead],
  ];
  for (let i = 1; i < keys.length; i++) {
    if (frame <= keys[i][0]) {
      const [from, a] = keys[i - 1];
      const [to, b] = keys[i];
      return blend(a, b, ease((frame - from) / (to - from)));
    }
  }
  return overhead;
}

function CameraRig({ frame }) {
  const { camera } = useThree();
  const { position: [x, y, z], target: [tx, ty, tz] } = pose(frame);
  useLayoutEffect(() => {
    camera.position.set(x, y, z);
    camera.lookAt(tx, ty, tz);
    camera.updateProjectionMatrix();
  }, [camera, x, y, z, tx, ty, tz]);
  return null;
}

function Arch({ width, height, depth, color, z = 0 }) {
  const paper = useMemo(() => {
    const pixels = new Uint8Array(64 * 64 * 4);
    let seed = 14014;
    for (let i = 0; i < pixels.length; i += 4) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = 100 + (seed % 56);
      pixels[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, 64, 64);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 8);
    texture.needsUpdate = true;
    return texture;
  }, []);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const half = width / 2;
    const spring = height - half;
    s.moveTo(-half, 0);
    s.lineTo(half, 0);
    s.lineTo(half, spring);
    s.absarc(0, spring, half, 0, Math.PI, false);
    s.lineTo(-half, 0);
    return s;
  }, [width, height]);
  return <mesh position={[0, 0, z]} castShadow receiveShadow>
    <extrudeGeometry args={[shape, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.025, bevelThickness: 0.025, curveSegments: 18 }]} />
    <meshStandardMaterial color={color} roughness={0.93} metalness={0.02} bumpMap={paper} bumpScale={0.009} />
  </mesh>;
}

function Crescent({ accent }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const outerAngle = Math.acos(0.065 / 0.28);
    const innerAngle = Math.acos(-0.065 / 0.28);
    s.absarc(0, 0, 0.28, outerAngle, Math.PI * 2 - outerAngle, false);
    s.absarc(0.13, 0, 0.28, Math.PI * 2 - innerAngle, innerAngle, true);
    s.closePath();
    return s;
  }, []);
  return <mesh position={[0, 1.43, 0.31]} rotation={[0, 0, -0.18]} castShadow>
    <extrudeGeometry args={[shape, { depth: 0.045, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 36 }]} />
    <meshStandardMaterial color={CREAM} roughness={0.8} emissive="#b9dbd5" emissiveIntensity={0.25 + accent * 0.65} />
  </mesh>;
}

function Laugh({ accent }) {
  const curves = useMemo(() => [
    new THREE.CatmullRomCurve3([new THREE.Vector3(-0.31, 1.28, 0.31), new THREE.Vector3(0, 1.05, 0.31), new THREE.Vector3(0.31, 1.28, 0.31)]),
    new THREE.CatmullRomCurve3([new THREE.Vector3(-0.22, 1.55, 0.31), new THREE.Vector3(-0.18, 1.65, 0.31), new THREE.Vector3(-0.12, 1.71, 0.31)]),
    new THREE.CatmullRomCurve3([new THREE.Vector3(0.12, 1.71, 0.31), new THREE.Vector3(0.18, 1.65, 0.31), new THREE.Vector3(0.22, 1.55, 0.31)]),
  ], []);
  return <group>{curves.map((curve, i) => <mesh key={i} rotation={[0, 0, (i - 1) * accent * 0.028]}>
    <tubeGeometry args={[curve, 24, i === 0 ? 0.035 : 0.025, 8, false]} />
    <meshStandardMaterial color={CREAM} roughness={0.85} emissive={GOLD} emissiveIntensity={0.26 + accent * 0.36} />
  </mesh>)}</group>;
}

function Door({ x, kind, frame }) {
  const softGlow = useMemo(() => {
    const size = 64;
    const pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      const radius = Math.hypot((x + 0.5) / size * 2 - 1, (y + 0.5) / size * 2 - 1);
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
      pixels[offset + 3] = Math.round(Math.max(0, 1 - radius) ** 2 * 255);
    }
    const texture = new THREE.DataTexture(pixels, size, size);
    texture.needsUpdate = true;
    return texture;
  }, []);
  const pulse = kind === 'moon' ? 132 : kind === 'laugh' ? 192 : 252;
  const accent = Math.max(0, 1 - Math.abs(frame - pulse) / 18);
  const loopReturn = 1 - ease((frame - 539) / 30);
  const illuminate = ease((frame - 60) / 24) * loopReturn;
  const alternate = frame >= 300 && frame < 330 ? Math.sin((frame - 300) / 30 * Math.PI) ** 2 * (0.12 + 0.12 * Math.cos((frame - 300) * Math.PI / 15 + x * 2)) : 0;
  const glow = 0.25 + illuminate * 0.18 + 0.34 * Math.exp(-(((frame - pulse) / 13) ** 2)) + alternate + 0.2 * ease((frame - 420) / 30) * loopReturn;
  return <group position={[x, 0.18, 0]}>
    <Arch width={1.22} height={2.48} depth={0.18} color="#a58653" z={-0.12} />
    <Arch width={1.08} height={2.35} depth={0.16} color={kind === 'light' ? '#235659' : '#175154'} z={0.07} />
    <mesh position={[0, 0.07, 0.267]}>
      <boxGeometry args={[0.91, 0.025, 0.025]} />
      <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={glow * 1.5} />
    </mesh>
    <mesh position={[0.34, 1.0, 0.28]}>
      <sphereGeometry args={[0.035, 12, 12]} />
      <meshStandardMaterial color={GOLD} metalness={0.65} roughness={0.2} />
    </mesh>
    <group position={[0, 1.35, 0]} scale={[1 + accent * 0.07, 1 + accent * 0.07, 1]}>
      <group position={[0, -1.35, 0]}>
        {kind === 'moon' && <Crescent accent={accent} />}
        {kind === 'laugh' && <Laugh accent={accent} />}
      </group>
    </group>
    {kind === 'light' && <>
      <mesh position={[0, 1.31, 0.29]} scale={[1 + accent * 0.14, 1 + accent * 0.07, 1]}>
        <boxGeometry args={[0.075, 0.79, 0.025]} />
        <meshStandardMaterial color="#ffe6a2" emissive={GOLD} emissiveIntensity={1.1 + glow} />
      </mesh>
      <mesh position={[0, 1.31, 0.301]}>
        <boxGeometry args={[0.25, 0.91, 0.012]} />
        <meshBasicMaterial map={softGlow} color={GOLD} transparent opacity={glow * 0.36} depthWrite={false} />
      </mesh>
    </>}
    <mesh position={[0, 0.008, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.98, 1.1]} />
      <meshBasicMaterial map={softGlow} color={GOLD} transparent opacity={glow * 0.75} depthWrite={false} />
    </mesh>
    <pointLight position={[0, 0.33, 0.48]} color={GOLD} intensity={glow * 1.5} distance={2.2} />
  </group>;
}

function Theater({ frame }) {
  const settle = ease((frame - 270) / 100) * (1 - ease((frame - 539) / 30));
  return <ThreeCanvas width={720} height={600} style={{ position: 'absolute', left: 180, top: 480 }} camera={{ fov: 40, near: 0.1, far: 100, position: [0, 6.7, 7.25] }} shadows gl={{ antialias: true, alpha: true }}>
    <CameraRig frame={frame} />
    <ambientLight color="#e0e8dc" intensity={0.68} />
    <directionalLight position={[-3 + settle * 0.5, 7, 5]} intensity={2.05 - settle * 0.18} color="#fff1cf" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-normalBias={0.02} />
    <pointLight position={[2.6, 3.1, 3]} intensity={0.85 + settle * 0.25} color={GOLD} distance={10} />
    <mesh position={[0, -0.08, 0.05]} receiveShadow>
      <boxGeometry args={[5.45, 0.22, 2.2]} />
      <meshStandardMaterial color="#20494b" roughness={0.96} />
    </mesh>
    <mesh position={[0, -0.19, 0.12]} receiveShadow>
      <boxGeometry args={[5.8, 0.12, 2.42]} />
      <meshStandardMaterial color="#af915e" roughness={0.9} />
    </mesh>
    <mesh position={[0, 1.52, -0.38]} receiveShadow>
      <boxGeometry args={[5.3, 3.1, 0.13]} />
      <meshStandardMaterial color="#123c3e" roughness={0.93} />
    </mesh>
    {[-2.6, 2.6].map((x) => <mesh key={x} position={[x, 1.55, 0]} castShadow>
      <cylinderGeometry args={[0.12, 0.17, 3.1, 12]} />
      <meshStandardMaterial color="#a88954" roughness={0.85} />
    </mesh>)}
    {DOORS.map((door) => <Door key={door.kind} {...door} frame={frame} />)}
  </ThreeCanvas>;
}

function Words({ text, frame, start, size = 53, color = CREAM }) {
  const words = text.split(' ');
  return <div data-r14-safe="headline" dir="rtl" style={{ position: 'absolute', top: 408, left: 200, width: 680, textAlign: 'center', fontSize: size, lineHeight: 1.35, fontWeight: 800, color, whiteSpace: 'nowrap' }}>
    {words.map((word, index) => <span key={`${word}-${index}`}><span style={{ display: 'inline-block', opacity: ease((frame - start - index * 3) / 7), translate: `0 ${(1 - ease((frame - start - index * 3) / 7)) * 12}px` }}>{word}</span>{index < words.length - 1 ? ' ' : ''}</span>)}
  </div>;
}

function Copy({ frame }) {
  const cue = frame < 90 ? { text: '٣ أبواب. اختيار واحد.', start: -20, end: 999, size: 54 }
    : frame < 360 ? { text: 'القمر / الضحكة / النور', start: 90, end: 360, size: 48 }
      : frame < 480 ? { text: 'أي باب؟', start: 360, end: 480, size: 62 }
        : { text: 'اكتبوا اختياركم', start: 480, end: 570, size: 57 };
  return <>
    <div data-r14-safe="logo" style={{ position: 'absolute', top: 308, left: 380, width: 320, height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: CREAM }} dir="rtl">
      <Img src={staticFile('brand/logo.png')} style={{ width: 67, height: 67, objectFit: 'contain' }} />
      <span style={{ fontSize: 43, fontWeight: 800, lineHeight: 1 }}>قصتي</span>
    </div>
    <Words {...cue} frame={frame} />
    <div data-r14-safe="options" dir="rtl" style={{ position: 'absolute', top: 1066, left: 200, width: 680, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {DOORS.map((door) => <div key={door.kind} style={{ borderTop: '2px solid rgba(244,183,64,0.55)', paddingTop: 10, textAlign: 'center', fontSize: 40, fontWeight: 750, color: CREAM }}>{door.label}</div>)}
    </div>
  </>;
}

function Subtitles({ frame, aligned }) {
  const words = aligned ? captions : plannedCaptions;
  const time = frame / 30 * 1000;
  let page = [];
  for (const word of words) {
    page.push(word);
    if (word.pageBreakAfter) {
      if (time >= page[0].startMs && time < word.endMs) break;
      page = [];
    }
  }
  if (!page.length || time < page[0].startMs || time >= page.at(-1).endMs) return null;
  return <div data-r14-safe="subtitles" dir="rtl" style={{ position: 'absolute', top: 1156, left: 200, width: 680, fontSize: 39, lineHeight: 1.45, fontWeight: 650, textAlign: 'center', color: CREAM }}>
    {page.map((word, i) => <span key={word.startMs}><span style={{ display: 'inline-block', color: time >= word.startMs ? GOLD : CREAM, opacity: time >= word.startMs ? 1 : 0.55 }}>{word.text.trim()}</span>{i < page.length - 1 ? ' ' : ''}</span>)}
  </div>;
}

function Grain() {
  return <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.11, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 180 180\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.68\' numOctaves=\'3\' seed=\'14\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '180px 180px', mixBlendMode: 'soft-light' }} />;
}

export function R14Reel({ voice = false, previewCaptions = true }) {
  const frame = useCurrentFrame();
  if (voice && !voiceTiming.aligned) throw new Error('R14 narration is pending. Prepare the final ElevenLabs WAV and measured captions with scripts/prepare-r14-voice.mjs before enabling voice.');
  const narrationEnd = Math.ceil((voiceTiming.finalWordEndMs ?? 17000) / 1000 * 30);
  const musicVolume = voice ? 0.18 + ease((frame - narrationEnd) / 15) * 0.18 : 0.43;
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 43%, ${TEAL} 0%, ${DEEP} 67%, #061e21 100%)`, fontFamily: 'Cairo', overflow: 'hidden' }}>
    <Theater frame={frame} />
    <Grain />
    <Copy frame={frame} />
    {(voice || previewCaptions) && <Subtitles frame={frame} aligned={voiceTiming.aligned} />}
    <Sequence name="Music · original score" layout="none" durationInFrames={570}>
      <Audio src={staticFile('r14/music.wav')} volume={musicVolume} />
    </Sequence>
    <Sequence name="SFX · bell / laugh motif / shimmer / cue" layout="none" durationInFrames={570}>
      <Audio src={staticFile('r14/sfx.wav')} volume={voice ? 0.3 : 0.58} />
    </Sequence>
    {voice && <Sequence name="Voice · final ElevenLabs WAV" layout="none" durationInFrames={510}>
      <Audio src={staticFile('r14/voice.wav')} volume={1} />
    </Sequence>}
  </AbsoluteFill>;
}
