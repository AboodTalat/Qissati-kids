import { useEffect, useLayoutEffect, useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { enter, mix, palette as C } from './timing';

// Original, seek-safe miniatures. Paper gores, folded pocket, brass star and
// hinged folios are actual geometry. Arabic stays in the surrounding DOM.
const tau = Math.PI * 2;
const fract = (value) => value - Math.floor(value);

function paperTexture() {
  const size = 128, data = new Uint8Array(size * size * 4); let seed = 210614;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const value = 224 + Math.floor(seed / 4294967296 * 27 + Math.sin(x * .7 + y * .04) * 3);
    const i = (y * size + x) * 4; data[i] = value; data[i + 1] = value; data[i + 2] = value; data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2); texture.needsUpdate = true; return texture;
}

function Surface({ color = C.paper, texture, metalness = 0, opacity = 1, glow = 0 }) {
  return <meshPhysicalMaterial color={color} roughness={metalness ? .27 : .88} metalness={metalness}
    bumpMap={texture} bumpScale={metalness ? .001 : .007} clearcoat={metalness ? .48 : .05}
    emissive={color} emissiveIntensity={glow} transparent={opacity < 1} opacity={opacity}
    depthWrite={opacity > .95} side={THREE.DoubleSide} />;
}

function Box({ size, radius = .025, color, texture, metalness = 0, opacity = 1, ...props }) {
  const [w, h, d] = size;
  const geometry = useMemo(() => new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2)), [w, h, d, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} visible={opacity > .001} castShadow receiveShadow><Surface color={color} texture={texture} metalness={metalness} opacity={opacity} /></mesh>;
}

function Curve({ points, radius = .012, color = C.brass, opacity = 1, metalness = 0, ...props }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(24, points.length * 4), radius, 7, false), [points, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} visible={opacity > .001} castShadow><Surface color={color} opacity={opacity} metalness={metalness} /></mesh>;
}

function Star({ time = 0, size = .45, opacity = 1, ...props }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + i / 10 * tau, r = i % 2 ? .43 : 1;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: .22, bevelEnabled: true, bevelSize: .065, bevelThickness: .055, bevelSegments: 3, steps: 1, curveSegments: 8 });
    geo.translate(0, 0, -.11); return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group {...props} scale={size} visible={opacity > .001}>
    <mesh geometry={geometry} castShadow rotation={[.04, Math.sin(time * .7) * .19, 0]}><Surface color={C.brass} metalness={.88} opacity={opacity} /></mesh>
    <mesh position={[0, .06, .184]}><sphereGeometry args={[.065, 16, 12]} /><Surface color="#ffe8ad" metalness={.68} opacity={opacity} glow={.12} /></mesh>
  </group>;
}

function Leaf({ width = .4, height = 1, color = C.teal, texture, ...props }) {
  const geometry = useMemo(() => {
    const positions = [], uvs = [], indices = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, w = Math.sin(t * Math.PI) ** .8 * width / 2;
      for (let j = 0; j < 3; j++) {
        const x = (j - 1) * w; positions.push(x, t * height, Math.abs(j - 1) * .08 * Math.sin(t * Math.PI)); uvs.push(j / 2, t);
        if (i < 16 && j < 2) { const a = i * 3 + j; indices.push(a, a + 1, a + 3, a + 1, a + 4, a + 3); }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals(); return g;
  }, [width, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} castShadow receiveShadow><Surface color={color} texture={texture} /></mesh>;
}

function Pocket({ time, texture }) {
  const fade = 1 - enter(time, 3.65, .65), flap = enter(time, .3, 1);
  return <group position={[0, .12, .65]} rotation={[-.04, -.08, -.055]} scale={1 - enter(time, 3.65, .65) * .35} visible={fade > .001}>
    <Box size={[2.18, 1.22, .075]} position={[0, .61, -.06]} color={C.teal} texture={texture} opacity={fade} />
    <Box size={[2.18, .86, .09]} position={[0, .43, .12]} color="#2e7970" texture={texture} opacity={fade} />
    <group position={[0, 1.14, -.025]} rotation={[mix(0, -2.4, flap), 0, 0]}>
      <mesh rotation={[0, 0, Math.PI]} position={[0, -.32, .04]} castShadow><coneGeometry args={[1.1, .67, 3, 1]} /><Surface color={C.teal} texture={texture} opacity={fade} /></mesh>
    </group>
    {[-1, 1].map((side) => <Box key={side} size={[.022, .82, .015]} position={[side * 1.045, .45, .182]} color={C.brass} metalness={.6} opacity={fade} />)}
    <Box size={[1.98, .022, .015]} position={[0, .11, .185]} color={C.brass} metalness={.6} opacity={fade} />
    <mesh position={[0, .53, .183]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.10, .10, .022, 32]} /><Surface color={C.brass} metalness={.8} opacity={fade} /></mesh>
  </group>;
}

function goreGeometry(index) {
  const positions = [], uvs = [], indices = [], rows = 28, cols = 8;
  const a0 = index / 8 * tau - Math.PI / 8;
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    const radius = .18 + Math.sin(v * Math.PI) ** .72 * .63;
    const y = .16 + v * 1.74;
    for (let col = 0; col <= cols; col++) {
      const u = col / cols, a = a0 + u * Math.PI / 4;
      const rib = 1 + Math.sin(u * Math.PI) * .035;
      positions.push(Math.cos(a) * radius * rib, y, Math.sin(a) * radius * rib); uvs.push(u, v);
      if (row < rows && col < cols) { const n = row * (cols + 1) + col; indices.push(n, n + 1, n + cols + 1, n + 1, n + cols + 2, n + cols + 1); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals(); return g;
}

function Gore({ index, time, texture }) {
  const geometry = useMemo(() => goreGeometry(index), [index]);
  const line = useMemo(() => Array.from({ length: 25 }, (_, n) => {
    const t = n / 24, r = .18 + Math.sin(t * Math.PI) ** .72 * .63, a = index / 8 * tau - Math.PI / 8;
    return new THREE.Vector3(Math.cos(a) * r * 1.006, .16 + t * 1.74, Math.sin(a) * r * 1.006);
  }), [index]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const reveal = enter(time, 4.2 + index * .14, .85), a = index / 8 * tau;
  return <group position={[(1 - reveal) * Math.cos(a) * 1.55, (1 - reveal) * .25, (1 - reveal) * Math.sin(a) * 1.55]} rotation={[0, (1 - reveal) * .7, 0]} visible={reveal > .001}>
    <mesh geometry={geometry} castShadow receiveShadow><Surface color={index % 2 ? '#559387' : C.teal} texture={texture} opacity={reveal} /></mesh>
    <Curve points={line} radius={.008} color={C.brass} metalness={.4} opacity={reveal} />
  </group>;
}

function balloonPose(time) {
  const flight = enter(time, 6.2, 5.4), exit = enter(time, 13.0, 1.6);
  return {
    x: Math.sin(flight * tau - .3) * .77 * (1 - exit),
    y: 1.36 + Math.sin(flight * Math.PI) * .17 - exit * 1.45,
    z: -.1 - Math.sin(flight * Math.PI) * .48,
    scale: (1 - exit * .67) * .91,
    opacity: 1 - enter(time, 13.8, .75),
  };
}

function Balloon({ time, texture }) {
  const pose = balloonPose(time), rig = enter(time, 5.15, .95), a = enter(time, 6.2, 5.4);
  return <group position={[pose.x, pose.y, pose.z]} scale={pose.scale} rotation={[Math.sin(time * .8) * .025 * (1 - enter(time, 16, 1)), a * .5 - .18, Math.sin(a * tau) * -.085]} visible={pose.opacity > .001}>
    {Array.from({ length: 8 }, (_, index) => <Gore key={index} index={index} time={time} texture={texture} />)}
    <mesh position={[0, 1.9, 0]} scale={[1, .38, 1]}><sphereGeometry args={[.185, 24, 12]} /><Surface color={C.brass} texture={texture} opacity={rig * pose.opacity} metalness={.6} /></mesh>
    <group scale={[1, Math.max(.001, rig), 1]}>
      <mesh position={[0, .16, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.18, .024, 8, 36]} /><Surface color={C.brass} metalness={.75} opacity={rig * pose.opacity} /></mesh>
      {[-1, 1].map((x) => [-1, 1].map((z) => <Box key={`${x}-${z}`} size={[.022, .58, .022]} position={[x * .19, -.16, z * .14]} rotation={[0, 0, x * -.12]} color={C.brass} opacity={rig * pose.opacity} />))}
      <Box size={[.61, .38, .45]} position={[0, -.59, 0]} color="#bc9c62" texture={texture} radius={.06} opacity={rig * pose.opacity} />
      <Box size={[.66, .062, .50]} position={[0, -.394, 0]} color={C.brass} texture={texture} opacity={rig * pose.opacity} />
      {Array.from({ length: 7 }, (_, n) => <Box key={n} size={[.008, .30, .014]} position={[(n - 3) * .073, -.58, .234]} color="#88764f" opacity={rig * pose.opacity} />)}
      {[0, 1, 2, 3].map((n) => <Box key={n} size={[.57, .01, .014]} position={[0, -.47 - n * .07, .24]} color="#e5c891" opacity={rig * pose.opacity} />)}
    </group>
  </group>;
}

function VoyageStar({ time }) {
  const lift = enter(time, .65, 1.7), route = enter(time, 2.6, 2.9), ride = enter(time, 5.45, 1), land = enter(time, 13.5, 1.1);
  const balloon = balloonPose(time);
  const x = mix(Math.sin(route * Math.PI) * 1.3, balloon.x, ride);
  const y = mix(.72 + lift * 1.42 - route * .15, balloon.y - .52, ride);
  const z = mix(.76, balloon.z + .30, ride);
  return <Star time={time} size={mix(.42, .23, ride) * mix(1, .72, land)} position={[mix(x, .62, land), mix(y, 1.98, land), mix(z, .75, land)]}
    rotation={[.12 + route * .22, route * tau + ride * .12, (1 - lift) * -.3 + Math.sin(time) * .04 * (1 - land)]} />;
}

function GoldenRoute({ time }) {
  const reveal = enter(time, 2.6, 2.2), fade = 1 - enter(time, 7.4, .8);
  const points = useMemo(() => Array.from({ length: 61 }, (_, n) => {
    const t = n / 60 * reveal;
    return new THREE.Vector3(Math.sin(t * Math.PI) * 1.3, 2.12 + Math.sin(t * tau) * .28, .70 - t * .85);
  }), [reveal]);
  return <group visible={reveal > .01 && fade > .001}><Curve points={points} radius={.013} color={C.brass} metalness={.75} opacity={fade * .8} />
    {Array.from({ length: 10 }, (_, n) => {
      const p = n / 9, show = enter(time, 2.8 + p * 1.8, .2) * fade;
      return <mesh key={n} position={[Math.sin(p * Math.PI) * 1.3, 2.12 + Math.sin(p * tau) * .28, .7 - p * .85]} scale={show}><sphereGeometry args={[.026, 10, 8]} /><Surface color={C.brass} metalness={.7} /></mesh>;
    })}
  </group>;
}

function pageArtTexture(right) {
  const size = 512, canvas = globalThis.document.createElement('canvas'); canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff8e7'; ctx.fillRect(0, 0, size, size);
  // Original wordless story illustration: a miniature balloon over a desert
  // garden. It is illustrative world art, never an invented product sample.
  ctx.fillStyle = '#e9dfc2'; ctx.fillRect(24, 24, 464, 464); ctx.fillStyle = '#f8f1df'; ctx.fillRect(31, 31, 450, 450);
  ctx.fillStyle = '#d4c59b'; ctx.beginPath(); ctx.arc(375, 117, 50, 0, tau); ctx.fill();
  ['#cfdbbb', '#b2c5a3', '#7ea58d'].forEach((color, layer) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(31, 340 + layer * 35);
    ctx.bezierCurveTo(140, 210 + layer * 45, 330, 410 - layer * 18, 481, 280 + layer * 50); ctx.lineTo(481, 481); ctx.lineTo(31, 481); ctx.fill();
  });
  const x = right ? 244 : 272, y = right ? 182 : 165;
  ctx.strokeStyle = '#ac9458'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 25, y + 61); ctx.lineTo(x - 18, y + 107); ctx.moveTo(x + 25, y + 61); ctx.lineTo(x + 18, y + 107); ctx.stroke();
  ctx.fillStyle = '#b3945d'; ctx.fillRect(x - 27, y + 101, 54, 33);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#4d8d7c' : '#1d6c64'; ctx.beginPath(); ctx.ellipse(x + (i - 2) * 18, y, 24 - Math.abs(i - 2) * 4, 73, 0, 0, tau); ctx.fill(); }
  [[105, 393], [397, 410], [155, 445]].forEach(([lx, ly], n) => {
    ctx.strokeStyle = '#447f66'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 5, ly - 70); ctx.stroke();
    [-1, 1].forEach((side) => { ctx.fillStyle = n % 2 ? '#e8d9ac' : '#39795f'; ctx.beginPath(); ctx.ellipse(lx + side * 18, ly - 38, 12, 27, side * .65, 0, tau); ctx.fill(); });
  });
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture;
}

function Folio({ side, time, texture, art }) {
  const opening = enter(time, 11.4, 2.2), angle = side * mix(Math.PI * .48, .035, opening);
  return <group rotation={[0, 0, angle]}>
    <Box size={[2.0, .11, 2.4]} position={[side * 1.0, 0, 0]} color={C.teal} texture={texture} radius={.035} />
    <Box size={[1.9, .085, 2.27]} position={[side * .99, .10, -.015]} color="#e2d8bc" texture={texture} radius={.02} />
    {[0, 1, 2].map((n) => <Box key={n} size={[1.87, .016, 2.23]} position={[side * .99, .15 + n * .022, -.015]} color={C.paper} texture={texture} radius={.008} />)}
    <mesh position={[side * .99, .218, -.015]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[1.72, 2.06]} /><meshStandardMaterial map={art} roughness={.89} /></mesh>
    <group position={[side * .99, .20, -.015]} rotation={[0, 0, side * mix(.3, .0, enter(time, 12.6, 1))]} visible={time > 12.1}>
      <mesh position={[0, .018, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.78, 2.13]} /><meshStandardMaterial map={art} roughness={.9} transparent opacity={.25 * (1 - enter(time, 13, .6))} depthWrite={false} side={THREE.DoubleSide} /></mesh>
    </group>
  </group>;
}

function Book({ time, texture, leftArt, rightArt }) {
  const reveal = enter(time, 10.95, .8), settled = enter(time, 14.6, 1.4);
  return <group visible={reveal > .001} position={[0, 1.02 + .63 * enter(time, 13.2, 1.4) - (1 - reveal) * .52, .55]} rotation={[.45, mix(-.3, -.045, settled), 0]} scale={.90 * Math.max(.001, reveal)}>
    <Folio side={-1} time={time} texture={texture} art={leftArt} />
    <Folio side={1} time={time} texture={texture} art={rightArt} />
    <Box size={[.13, .22, 2.46]} position={[0, .05, 0]} color={C.teal} texture={texture} radius={.045} />
    <Box size={[.085, .025, .7]} position={[.04, .21, .94]} color={C.brass} texture={texture} radius={.006} />
    <group position={[-.52, .23, -.35]} scale={enter(time, 13.65, .9)}>
      <Leaf width={.30} height={.65} color={C.teal} texture={texture} rotation={[.05, -.3, -.4]} />
      <Leaf width={.26} height={.52} color={C.sage} texture={texture} rotation={[.10, .3, .5]} />
    </group>
  </group>;
}

function Landscape({ time, texture }) {
  const landShapes = useMemo(() => [0, 1, 2].map((n) => {
    const shape = new THREE.Shape(); shape.moveTo(-13, -.8); shape.lineTo(-13, .4 + n * .45);
    shape.bezierCurveTo(-8, 3.1 - n * .45, -3, -1.5 + n * .2, 2, 1.2 + n * .15);
    shape.bezierCurveTo(5, 2.9 - n * .25, 10, 1 + n * .7, 13, 2.6); shape.lineTo(13, -1.3); shape.lineTo(-13, -1.3);
    return new THREE.ExtrudeGeometry(shape, { depth: .07, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 2, steps: 1, curveSegments: 48 });
  }), []);
  useEffect(() => () => landShapes.forEach((g) => g.dispose()), [landShapes]);
  return <>
    <mesh position={[0, -.65, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[160, 160]} /><Surface color={C.cream} texture={texture} /></mesh>
    {landShapes.map((geometry, n) => <mesh key={n} geometry={geometry} position={[-.7 + n * .5, -.6, -8.6 + n * 1.05]} receiveShadow castShadow><Surface color={['#e7dfc8', '#ced7b9', '#bdcbb0'][n]} texture={texture} /></mesh>)}
    {[-1, 1].map((side) => <group key={side} position={[side * 4.2, -.58, 2.5]} rotation={[.04, side * -.4, side * -.45]} scale={1.5}>
      {[0, 1, 2, 3].map((n) => <Leaf key={n} position={[side * n * .05, n * .02, -.06 * n]} width={.50 - n * .055} height={1.8 - n * .19} color={[C.teal, C.sage, C.paper, C.brass][n]} texture={texture} rotation={[.08, side * n * .22, side * (-.45 + n * .32) + Math.sin(time * .45 + n) * .014]} />)}
    </group>)}
    {[-1, 1].map((side) => <group key={side} position={[side * 3.4, -.57, -1.9]} rotation={[0, side * .6, side * .2]}>
      {[0, 1, 2].map((n) => <Leaf key={n} width={.45} height={1.25 - n * .15} color={[C.sage, C.teal, C.paper][n]} texture={texture} rotation={[.1, n * .2, side * (-.6 + n * .5)]} />)}
    </group>)}
    {Array.from({ length: 18 }, (_, n) => {
      const side = n % 2 ? 1 : -1, x = side * (3.8 + fract(n * .617) * 4);
      return <mesh key={n} position={[x, 1.5 + fract(n * .719) * 6 + Math.sin(time * .45 + n) * .07, -2.5 - fract(n * .423) * 5]} rotation={[n * .5, n + time * .04, n]} scale={[1, 2, .3]}>
        <octahedronGeometry args={[.025 + n % 3 * .008, 0]} /><Surface color={n % 4 ? '#f7ecd3' : C.brass} opacity={.45} />
      </mesh>;
    })}
    <mesh position={[-4.3, 6.5, -12.8]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.4, 1.4, .045, 72]} /><Surface color="#ddc894" texture={texture} /></mesh>
    <mesh position={[-4.3, 6.5, -12.7]}><torusGeometry args={[1.63, .015, 6, 80]} /><Surface color={C.brass} opacity={.45} metalness={.3} /></mesh>
  </>;
}

function Reflection() {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const room = new RoomEnvironment(), generator = new THREE.PMREMGenerator(gl), map = generator.fromScene(room, .025);
    scene.environment = map.texture; scene.environmentIntensity = .45;
    return () => { scene.environment = null; map.dispose(); generator.dispose(); room.dispose(); };
  }, [gl, scene]); return null;
}

function Camera({ time }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const arc = enter(time, 6.5, 2) * (1 - enter(time, 10.3, 2));
    const settled = enter(time, 14, 2);
    camera.position.set(Math.sin((time - 6.5) * .65) * .8 * arc, 7.2 + arc * .2, 22.5 - arc * .65);
    camera.lookAt(0, 1.85 - settled * .08, 0); camera.zoom = .98 + arc * .015; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  }, [camera, time]); return null;
}

function FrameCommit({ frame }) {
  const { scene, camera, gl } = useThree();
  useEffect(() => { scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); gl.render(scene, camera); }, [scene, camera, gl, frame]); return null;
}

function World({ frame, time, texture, leftArt, rightArt }) {
  return <>
    <color attach="background" args={[C.cream]} /><fog attach="fog" args={[C.cream, 33, 85]} />
    <Camera time={time} /><Reflection />
    <ambientLight color="#fff7e5" intensity={.46} /><hemisphereLight args={['#fff7e6', '#899c7e', .76]} />
    <directionalLight position={[-6, 11, 8]} intensity={2.5} color="#fff2d5" castShadow shadow-mapSize={[2048, 2048]} shadow-radius={4}
      shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={40} shadow-bias={-.0002} shadow-normalBias={.015} />
    <directionalLight position={[6, 5, -4]} intensity={.95} color="#dbe8d5" />
    <Landscape time={time} texture={texture} />
    <group position={[0, .30, 0]}>
      <Pocket time={time} texture={texture} /><GoldenRoute time={time} /><Balloon time={time} texture={texture} />
      <Book time={time} texture={texture} leftArt={leftArt} rightArt={rightArt} /><VoyageStar time={time} />
    </group>
    <FrameCommit frame={frame} />
  </>;
}

export function R21Scene({ stillFrame }) {
  const currentFrame = useCurrentFrame(), { fps, width, height } = useVideoConfig(), frame = stillFrame ?? currentFrame;
  const time = frame / (stillFrame === undefined ? fps : 30);
  const texture = useMemo(paperTexture, []), leftArt = useMemo(() => pageArtTexture(false), []), rightArt = useMemo(() => pageArtTexture(true), []);
  useEffect(() => () => { texture.dispose(); leftArt.dispose(); rightArt.dispose(); }, [texture, leftArt, rightArt]);
  return <ThreeCanvas name="3D · the star voyage · original sculpted paper world" showInTimeline width={width} height={height} frameloop="never" dpr={1}
    style={{ position: 'absolute', inset: 0, background: C.cream }} camera={{ fov: 35, near: .1, far: 160, position: [0, 7.2, 22.5] }}
    shadows={{ type: THREE.PCFShadowMap }} gl={{ antialias: true, alpha: false, toneMapping: THREE.NeutralToneMapping }}>
    <World frame={frame} time={time} texture={texture} leftArt={leftArt} rightArt={rightArt} />
  </ThreeCanvas>;
}
