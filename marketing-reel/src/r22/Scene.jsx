import { useEffect, useLayoutEffect, useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { enter, mix, palette as C, r22Cues } from './timing';

function fibreTexture() {
  const n = 128, data = new Uint8Array(n * n * 4);
  let seed = 220122;
  for (let i = 0; i < n * n; i++) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const v = 222 + Math.floor(seed / 4294967296 * 30 + Math.sin(i % n * .18) * 2);
    data.set([v, v, v, 255], i * 4);
  }
  const texture = new THREE.DataTexture(data, n, n);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2); texture.needsUpdate = true;
  return texture;
}

function Paper({ color = C.paper, texture, metalness = 0, glow = 0, opacity = 1 }) {
  return <meshPhysicalMaterial color={color} roughness={metalness ? .31 : .85} metalness={metalness}
    clearcoat={metalness ? .5 : .04} bumpMap={texture} bumpScale={metalness ? .001 : .008}
    side={THREE.DoubleSide} emissive={color} emissiveIntensity={glow}
    transparent={opacity < 1} opacity={opacity} depthWrite={opacity > .95} />;
}

function Box({ size, radius = .035, color, texture, metalness = 0, ...props }) {
  const [w, h, d] = size;
  const geometry = useMemo(() => new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2)), [w, h, d, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow {...props}><Paper color={color} texture={texture} metalness={metalness} /></mesh>;
}

function Tube({ points, radius = .012, color = C.gold, metalness = .65, texture, ...props }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 72, radius, 7, false), [points, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow {...props}><Paper color={color} texture={texture} metalness={metalness} /></mesh>;
}

function Crescent({ texture, ...props }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(.27, .62);
    shape.bezierCurveTo(-.72, .73, -.85, -.58, .04, -.69);
    shape.bezierCurveTo(.47, -.73, .71, -.48, .74, -.15);
    shape.bezierCurveTo(.12, -.47, -.26, .11, .27, .62);
    return new THREE.ExtrudeGeometry(shape, { depth: .095, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .025, bevelThickness: .018, curveSegments: 32 });
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow {...props}><Paper color={C.gold} texture={texture} metalness={.42} glow={.06} /></mesh>;
}

function Star({ size = .1, texture, color = C.gold, ...props }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    for (let j = 0; j < 10; j++) {
      const a = Math.PI / 2 + j * Math.PI / 5;
      const r = j % 2 ? size * .43 : size;
      if (j === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: true, bevelSize: .008, bevelThickness: .008, bevelSegments: 1, steps: 1 });
  }, [size]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow {...props}><Paper color={color} texture={texture} metalness={.22} glow={.12} /></mesh>;
}

function Leaf({ texture, color = C.sage, ...props }) {
  const geometry = useMemo(() => {
    const pos = [], indices = [];
    for (let i = 0; i <= 12; i++) {
      const v = i / 12, w = Math.sin(v * Math.PI) * .14;
      pos.push(-w, v * .6, .045 * Math.sin(v * Math.PI), 0, v * .6, -.035 * Math.sin(v * Math.PI), w, v * .6, .045 * Math.sin(v * Math.PI));
      if (i < 12) { const a = i * 3; indices.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow {...props}><Paper color={color} texture={texture} /></mesh>;
}

function Boat({ t, texture }) {
  const fold = enter(t, r22Cues.boat, .8);
  const sail = enter(t, r22Cues.sail, 2.4);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-.58, .08, 0, .58, .08, 0, 0, -.22, .23, -.58, .08, 0, 0, -.22, -.23, .58, .08, 0, -.58, .08, 0, 0, .16, .23, 0, -.22, .23, .58, .08, 0, 0, -.22, .23, 0, .16, .23, -.58, .08, 0, 0, -.22, -.23, 0, .16, -.23, .58, .08, 0, 0, .16, -.23, 0, -.22, -.23], 3));
    g.computeVertexNormals(); return g;
  }, []);
  const sailGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, .12, 0, 0, .88, 0, -.45, .18, .035, .02, .16, 0, .02, .74, 0, .34, .16, .025], 3));
    g.computeVertexNormals(); return g;
  }, []);
  useEffect(() => () => { geometry.dispose(); sailGeometry.dispose(); }, [geometry, sailGeometry]);
  return <group visible={fold > .001} position={[mix(-1.4, 1.15, sail), .64 + sail * 1.05 + Math.sin(sail * Math.PI) * .65, 1.35 - sail * .12]} rotation={[.07 * Math.sin(t), -.18 + sail * .52, Math.sin(t * 1.1) * .025]} scale={mix(.01, .78, fold)}>
    <mesh geometry={geometry} castShadow receiveShadow><Paper texture={texture} color={C.cream} /></mesh>
    <group rotation={[mix(Math.PI / 2, 0, fold), 0, 0]}>
      <mesh geometry={sailGeometry} castShadow><Paper texture={texture} color={C.paper} /></mesh>
      <Box size={[.022, .86, .022]} position={[0, .45, 0]} texture={texture} color={C.bronze} />
    </group>
    <Star size={.075} position={[-.15, .38, .045]} texture={texture} />
  </group>;
}

function MoonGarden({ t, texture, closing }) {
  const unfold = enter(t, r22Cues.garden, 2.2);
  const orbit = useMemo(() => Array.from({ length: 91 }, (_, i) => { const a = i / 90 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * 1.92, .03, Math.sin(a) * 1.08); }), []);
  return <group scale={[1 - closing * .54, 1 - closing * .50, 1 - closing * .54]} position={[0, closing * .16, 0]}>
    <group position={[0, .18, .03]} scale={[unfold, unfold, unfold]}>
      <mesh receiveShadow castShadow><cylinderGeometry args={[1.67, 1.75, .12, 80]} /><Paper texture={texture} color="#6d9c86" /></mesh>
      <mesh position={[0, .08, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.54, 1.56, 80]} /><Paper color={C.gold} metalness={.5} /></mesh>
      <Tube points={orbit} radius={.01} texture={texture} />
      {Array.from({ length: 8 }, (_, i) => <Box key={i} size={[.66, .11, .29]} position={[-.67 + i * .13, .14 + i * .105, .78 - i * .23]} rotation={[0, .16, 0]} texture={texture} color={i % 2 ? C.cream : C.paper} />)}
      {[-1, 1].map((side) => <group key={side} position={[side * 1.12, .1, -.13]} rotation={[0, side * .5, side * -.18]} scale={[1, enter(t, 4.5 + (side + 1) * .15, 1.3), 1]}>
        <Box size={[.035, 1.04, .035]} position={[0, .48, 0]} color={C.bronze} texture={texture} />
        {[0, 1, 2].map((i) => <group key={i} position={[0, .2 + i * .24, 0]}><Leaf color={i === 2 ? C.paper : C.sage} texture={texture} rotation={[0, .2, -.85]} /><Leaf color={i === 1 ? C.teal : C.sage} texture={texture} rotation={[0, -.2, .85]} /></group>)}
      </group>)}
      <Boat t={t} texture={texture} />
    </group>
    {[[-1.53, 2.65, -.2], [.98, 2.8, -.35], [1.65, 1.8, .04], [-.83, 2.0, -.25], [.48, 1.6, -.3]].map((p, i) => {
      const q = enter(t, 5.1 + i * .3, .65);
      return <group key={i} position={[p[0], p[1] + Math.sin(t * .65 + i) * .045, p[2]]} scale={q} rotation={[0, Math.sin(t * .4 + i) * .16, Math.sin(t * .5 + i) * .05]}><Star size={i < 3 ? .16 : .10} texture={texture} /></group>;
    })}
  </group>;
}

function Window({ t, texture, closing }) {
  const open = enter(t, r22Cues.shutters, 1.2);
  const latch = enter(t, r22Cues.latch, .45);
  const arch = useMemo(() => Array.from({ length: 61 }, (_, i) => { const a = i / 60 * Math.PI; return new THREE.Vector3(Math.cos(a) * 1.05, 2 + Math.sin(a) * 1.05, -.3); }), []);
  const orbit = useMemo(() => Array.from({ length: 111 }, (_, i) => { const a = i / 110 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * 1.76, Math.sin(a) * 1.76, 0); }), []);
  return <group position={[0, .22, -.32]} rotation={[-closing * Math.PI / 2, 0, 0]} scale={1 - closing * .91} visible={closing < .995}>
    <Box size={[2.48, .18, .62]} position={[0, .01, 0]} color={C.paper} texture={texture} />
    <Box size={[.14, 2.0, .23]} position={[-1.05, 1, -.3]} color={C.paper} texture={texture} />
    <Box size={[.14, 2.0, .23]} position={[1.05, 1, -.3]} color={C.paper} texture={texture} />
    <Tube points={arch} radius={.083} color={C.paper} metalness={0} texture={texture} />
    <Tube points={arch} radius={.009} position={[0, .07, .11]} texture={texture} />
    <group position={[-1, 1, -.17]} rotation={[0, -open * 1.7, 0]}>
      <Box size={[.98, 1.92, .08]} position={[.48, 0, 0]} texture={texture} color={C.paper} />
      {[.36, .67].map((x) => <Box key={x} size={[.018, 1.7, .012]} position={[x, 0, .048]} color="#dfcfaa" texture={texture} />)}
      <Box size={[.08, .17, .09]} position={[.85, .02, .07]} rotation={[0, 0, latch * 1.5]} color={C.gold} metalness={.8} texture={texture} />
    </group>
    <group position={[1, 1, -.17]} rotation={[0, open * 1.7, 0]}>
      <Box size={[.98, 1.92, .08]} position={[-.48, 0, 0]} texture={texture} color={C.paper} />
      {[-.36, -.67].map((x) => <Box key={x} size={[.018, 1.7, .012]} position={[x, 0, .048]} color="#dfcfaa" texture={texture} />)}
      <Box size={[.08, .17, .09]} position={[-.85, .02, .07]} color={C.gold} metalness={.8} texture={texture} />
    </group>
    <group position={[0, 2.1, -.7]} rotation={[.15, .1 + Math.sin(t * .42) * .15, -.18 + t * .025]}>
      <Crescent texture={texture} scale={.58} />
    </group>
    <group position={[0, 1.53, -.65]} rotation={[.35, -.36 + t * .075, -.24]}>
      <Tube points={orbit} radius={.014} texture={texture} />
      <mesh position={[1.76, 0, 0]} castShadow><sphereGeometry args={[.085, 20, 16]} /><Paper texture={texture} color={C.gold} metalness={.7} /></mesh>
    </group>
    <pointLight color="#ffe8ac" intensity={1.3 + open * 4} position={[0, 1.35, -.06]} distance={5} decay={2} />
  </group>;
}

function Keepsake({ t, texture }) {
  const shown = enter(t, 12.1, 1.45);
  const opening = enter(t, 12.45, 1.25);
  return <group position={[0, .19, .33]} scale={shown} rotation={[0, -.07, 0]} visible={shown > .001}>
    {[-1, 1].map((side) => <group key={side} rotation={[0, 0, side * mix(1.36, .055, opening)]}>
      <Box size={[1.77, .11, 2.12]} position={[side * .89, .025, 0]} color={C.teal} texture={texture} />
      {[0, 1, 2, 3, 4].map((i) => <Box key={i} size={[1.65, .025, 1.96]} position={[side * .85, .11 + i * .018, -.015]} rotation={[0, 0, side * (4 - i) * .006]} color={i % 2 ? C.cream : C.paper} texture={texture} radius={.009} />)}
      <Box size={[1.4, .008, .012]} position={[side * .85, .22, .7]} color={C.gold} texture={texture} />
    </group>)}
    <Box size={[.12, .12, 2.15]} position={[0, .04, 0]} color={C.gold} texture={texture} />
    <mesh position={[0, .2, 1.18]} rotation={[-.3, 0, 0]}><planeGeometry args={[.12, .48]} /><Paper color={C.gold} texture={texture} /></mesh>
  </group>;
}

function Environment() {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const room = new RoomEnvironment(), generator = new THREE.PMREMGenerator(gl);
    const env = generator.fromScene(room, .025);
    scene.environment = env.texture; scene.environmentIntensity = .28;
    return () => { scene.environment = null; env.dispose(); generator.dispose(); room.dispose(); };
  }, [gl, scene]);
  return null;
}

function Camera({ t }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const arc = enter(t, 4.2, 2.5) * (1 - enter(t, 10, 2));
    const settle = enter(t, 12, 2);
    camera.position.set(mix(.8 + Math.sin(t * .24) * .65 * arc, .25, settle), mix(5.1, 5.5, settle), 16.6 - arc * .38);
    camera.setViewOffset(1080, 1920, 0, 50, 1080, 1920);
    camera.lookAt(0, 1.14 - settle * .06, 0);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  }, [camera, t]);
  return null;
}

function FrameCommit({ frame }) {
  const { scene, camera, gl } = useThree();
  useEffect(() => { scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); gl.render(scene, camera); }, [scene, camera, gl, frame]);
  return null;
}

export function R22Scene({ stillFrame }) {
  const current = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const frame = stillFrame ?? current, t = frame / (stillFrame === undefined ? fps : 30);
  const closing = enter(t, 12, 1.65);
  const texture = useMemo(fibreTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <ThreeCanvas width={width} height={height} name="Three.js · moon observatory → starboat → keepsake" showInTimeline
    frameloop="never" dpr={1} style={{ position: 'absolute', inset: 0, background: 'transparent' }}
    camera={{ fov: 34, near: .1, far: 100, position: [.8, 5.1, 16.6] }} shadows={{ type: THREE.PCFShadowMap }}
    gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}>
    <Environment /><Camera t={t} />
    <ambientLight color="#f7e7c5" intensity={.62} />
    <hemisphereLight args={['#fff4d5', '#1d4c48', 1.55]} />
    <directionalLight position={[-4.5, 8, 7]} intensity={3.4} color="#fff1cf" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={7} shadow-camera-bottom={-5} shadow-camera-far={30} shadow-normalBias={.012} shadow-bias={-.00015} shadow-radius={3} />
    <directionalLight position={[5, 4, -3]} intensity={1.1} color="#b9d3bc" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.04, 0]} receiveShadow><planeGeometry args={[100, 100]} /><shadowMaterial transparent opacity={.25} /></mesh>
    <group scale={.74} position={[0, closing * .65, 0]} rotation={[0, -.10 + Math.sin(t * .22) * .035 * (1 - closing), 0]}>
      <mesh receiveShadow castShadow position={[0, -.03, .04]}><cylinderGeometry args={[2.03, 2.14, .16, 80]} /><Paper color={C.teal} texture={texture} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .057, .04]}><ringGeometry args={[1.94, 1.965, 96]} /><Paper color={C.gold} metalness={.7} /></mesh>
      <Window t={t} texture={texture} closing={closing} />
      <Keepsake t={t} texture={texture} />
      <MoonGarden t={t} texture={texture} closing={closing} />
      <group position={[-.63, .48 + closing * .8, -.32]} scale={closing * .44} rotation={[0, -.08, -.18]}><Crescent texture={texture} /></group>
    </group>
    <FrameCommit frame={frame} />
  </ThreeCanvas>;
}
