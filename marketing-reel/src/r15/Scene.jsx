import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useRemotionEnvironment } from 'remotion';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { cues, enter, ease, mix } from './timing';

export const TEAL = '#146466';
export const CREAM = '#fdf8f0';
export const GOLD = '#c69b56';
export const INK = '#173c3f';

export function cameraPose(frame) {
  const wide = { position: [0, 2.9, 7.7], target: [0, 0.78, 0] };
  const boot = { position: [-2.4, 1.95, 4.5], target: [-1.4, 0.82, 0] };
  const stone = { position: [-0.48, 1.83, 4.65], target: [0, 0.68, -0.16] };
  const key = { position: [2.5, 1.95, 4.7], target: [1.36, 0.87, -0.1] };
  const orbit = { position: [0.52, 3.02, 7.55], target: [0, 0.78, 0] };
  const keys = [[0, wide], [42, wide], [72, boot], [cues.boot + 12, boot],
    [cues.stone - 8, stone], [cues.stone + 18, stone],
    [cues.key - 8, key], [cues.key + 18, key], [300, wide],
    [330, orbit], [390, wide], [570, wide], [629, wide]];
  for (let i = 1; i < keys.length; i++) {
    if (frame <= keys[i][0]) {
      const [from, a] = keys[i - 1]; const [to, b] = keys[i];
      const t = ease((frame - from) / Math.max(1, to - from));
      return { position: a.position.map((n, j) => mix(n, b.position[j], t)), target: a.target.map((n, j) => mix(n, b.target[j], t)) };
    }
  }
  return wide;
}

function Lens({ frame, contentScale }) {
  const { camera, gl, scene, size, advance } = useThree();
  const { isRendering } = useRemotionEnvironment();
  const lens = useRef(null);
  const { position: [x, y, z], target: [tx, ty, tz] } = cameraPose(frame);
  useLayoutEffect(() => {
    // Hook the renderer's one requested render, rather than installing an
    // autonomous useFrame animation. Export and backwards seeking use the same
    // render path; composer time is fixed at zero.
    const render = gl.render.bind(gl);
    const target = new THREE.WebGLRenderTarget(size.width, size.height, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(gl, target);
    const bokeh = new BokehPass(scene, camera, { focus: 7, aperture: 0.0035, maxblur: 0.009 });
    // Preserve transparent canvas edges while using the genuine depth buffer.
    bokeh.materialBokeh.fragmentShader = bokeh.materialBokeh.fragmentShader.replace('gl_FragColor.a = 1.0;', '');
    const output = new OutputPass();
    // Blur mixes premultiplied edge samples. Convert their straight color,
    // then premultiply the result for the transparent WebGL canvas; this avoids
    // a bright cutout fringe against the cream DOM background.
    output.material.fragmentShader = output.material.fragmentShader
      .replace('gl_FragColor = texture2D( tDiffuse, vUv );', 'gl_FragColor = texture2D( tDiffuse, vUv ); gl_FragColor.rgb /= max(gl_FragColor.a, 0.0001);')
      .replace(/\n\s*}\s*$/, '\n gl_FragColor.rgb *= gl_FragColor.a;\n}');
    composer.setSize(size.width, size.height);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bokeh);
    composer.addPass(output);
    lens.current = bokeh;
    let compositing = false;
    gl.render = (s, c) => {
      if (compositing || s !== scene) return render(s, c);
      compositing = true;
      try { composer.render(0); } finally { compositing = false; }
    };
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const reflection = pmrem.fromScene(room, 0.04);
    scene.environment = reflection.texture;
    room.dispose(); pmrem.dispose();
    return () => {
      gl.render = render; scene.environment = null; lens.current = null;
      bokeh.dispose(); output.dispose(); composer.dispose(); reflection.dispose();
    };
  }, [gl, scene, camera, size.width, size.height]);
  useLayoutEffect(() => {
    // Expand the authored 720×660 stage into the entire vertical canvas before
    // applying the editorial framing scale. The plinth can bleed naturally
    // during the macro shots instead of ending at a smaller canvas rectangle.
    // Zoom the projection, rather than shrinking a clipped WebGL rectangle.
    // Shift its principal point so 3D and DOM scale around the same 540,960
    // frame centre, leaving real scene pixels available beyond the old crop.
    const centreY = 960 + (848 - 960) * contentScale;
    camera.zoom = contentScale;
    camera.setViewOffset(720, 660, -180, 330 - centreY, 1080, 1920);
    camera.position.set(x, y, z); camera.lookAt(tx, ty, tz); camera.updateProjectionMatrix();
    if (lens.current) {
      lens.current.uniforms.focus.value = camera.position.distanceTo(new THREE.Vector3(tx, ty, tz));
      lens.current.uniforms.aperture.value = (frame < 300 ? 0.0035 : 0.0013) * contentScale;
      lens.current.uniforms.maxblur.value = 0.009 * contentScale;
    }
  }, [camera, frame, contentScale, x, y, z, tx, ty, tz]);
  useEffect(() => {
    // Studio can pause requestAnimationFrame in an unfocused preview. Render
    // each authored frame explicitly so a seek never leaves stale 3D pixels.
    // Export is already advanced by ThreeCanvas's ManualFrameRenderer.
    if (!isRendering) advance(0);
  }, [advance, frame, isRendering]);
  return null;
}

function Rounded({ dimensions, radius = 0.05, color, ...props }) {
  const [w, h, d] = dimensions;
  const geometry = useMemo(() => new RoundedBoxGeometry(w, h, d, 4, radius), [w, h, d, radius]);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.73} /></mesh>;
}

function bootShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.33, 0.08); s.lineTo(0.37, 0.08);
  s.bezierCurveTo(0.64, 0.09, 0.68, 0.31, 0.44, 0.4);
  s.lineTo(0.08, 0.45); s.lineTo(0.08, 1.36);
  s.quadraticCurveTo(-0.12, 1.42, -0.33, 1.36); s.closePath(); return s;
}

// A half-turn travels around the book before the objects settle on its pages.
// Positions depend only on the current frame, never on previous positions.
function objectPose(frame, index, initial) {
  const t = enter(frame, cues.orbit, 54);
  const angle = index * Math.PI * 2 / 3 + t * Math.PI;
  const radius = Math.sin(t * Math.PI) * 0.94;
  const destinations = [[-0.58, 0.14, 0.12], [0.03, 0.2, -0.1], [0.6, 0.15, 0.06]];
  return {
    position: initial.map((v, i) => mix(v, destinations[index][i], t) + (i === 0 ? Math.cos(angle) * radius : i === 1 ? Math.sin(t * Math.PI) * 0.72 : Math.sin(angle) * radius * 0.6)),
    rotation: t * Math.PI * 2 / 3,
    scale: mix(1, 0.47, t) * (1 - enter(frame, 497, 18)),
  };
}

function ContactShadows({ frame }) {
  const texture = useMemo(() => {
    const pixels = new Uint8Array(128 * 128 * 4);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const r = ((x - 63.5) / 32) ** 2 + ((y - 63.5) / 32) ** 2;
      const i = (y * 128 + x) * 4;
      pixels[i] = 18; pixels[i + 1] = 46; pixels[i + 2] = 44;
      pixels[i + 3] = Math.round(Math.max(0, Math.exp(-r * 1.6) - 0.002) * 255);
    }
    const t = new THREE.DataTexture(pixels, 128, 128);
    t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
  }, []);
  useLayoutEffect(() => () => texture.dispose(), [texture]);
  const stone = enter(frame, Math.min(cues.stone - 30, 150), 28);
  const key = enter(frame, Math.min(cues.key - 30, 210), 25);
  const initial = [[-1.45, 0, 0.22], [mix(-2.65, 0, stone), 0.28, 0.12], [mix(2.5, 1.4, key), -0.12, 0.13]];
  return <>{initial.map((position, index) => {
    const p = objectPose(frame, index, position);
    const height = Math.max(0, p.position[1] - position[1]);
    const show = [1, stone, key][index];
    return <mesh key={index} position={[p.position[0] + (index === 1 ? 0 : 0.14 * p.scale), 0.007, p.position[2] + (index === 0 ? 0.18 : 0.06)]} rotation={[-Math.PI / 2, 0, 0]} scale={p.scale * (1 + height * 0.35)}>
      <planeGeometry args={[[1.65, 1.18], [1.85, 1.3], [0.78, 0.75]][index]} />
      <meshBasicMaterial map={texture} transparent opacity={show * 0.38 * Math.exp(-height * 2.5)} depthWrite={false} />
    </mesh>;
  })}</>;
}

function RainBoot({ frame }) {
  const shape = useMemo(bootShape, []);
  const p = objectPose(frame, 0, [-1.45, 0, 0.22]);
  const show = enter(frame, 30, 22);
  return <group position={p.position} scale={p.scale * show} rotation={[0, mix(-0.56, 0.28, enter(frame, 90, 30)) + p.rotation, 0]}>
    <mesh castShadow receiveShadow>
      <extrudeGeometry args={[shape, { depth: 0.36, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 5, curveSegments: 28 }]} />
      <meshPhysicalMaterial color={TEAL} roughness={0.52} clearcoat={0.25} clearcoatRoughness={0.5} />
    </mesh>
    <Rounded dimensions={[0.99, 0.12, 0.46]} position={[0.14, 0.065, 0.19]} color="#26494a" radius={0.05} />
    <Rounded dimensions={[0.44, 0.09, 0.46]} position={[-0.125, 1.35, 0.18]} color={GOLD} radius={0.025} />
    <Rounded dimensions={[0.32, 0.024, 0.32]} position={[-0.125, 1.4, 0.18]} color="#093b3d" radius={0.01} />
    {[0, 1, 2].map((i) => <mesh key={i} position={[-0.07 + i * 0.065, 0.91 + i * 0.037, 0.429]} rotation={[0, 0, -0.3]}>
      <boxGeometry args={[0.014, 0.085, 0.012]} /><meshStandardMaterial color="#a0b6a6" roughness={1} />
    </mesh>)}
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[-0.19 + i * 0.14, 0.011, 0.19]}>
      <boxGeometry args={[0.032, 0.024, 0.42]} /><meshStandardMaterial color="#0c3335" roughness={1} />
    </mesh>)}
  </group>;
}

function Stone({ frame }) {
  const arrive = enter(frame, Math.min(cues.stone - 30, 150), 28);
  const p = objectPose(frame, 1, [mix(-2.65, 0, arrive), 0.28, 0.12]);
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.56, 48, 32);
    const vertices = geo.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
      const n = 1 + 0.045 * Math.sin(x * 9 + y * 3) * Math.cos(z * 7 - y * 4);
      vertices.setXYZ(i, x * n * 1.05, y * n * 0.58, z * n * 0.77);
    }
    geo.computeVertexNormals(); return geo;
  }, []);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  return <group position={p.position} scale={arrive * p.scale} rotation={[0.1, 0.32 + p.rotation + enter(frame, 180, 60) * 0.22, -0.12]}>
    <mesh geometry={geometry} castShadow receiveShadow><meshPhysicalMaterial color="#93a99b" roughness={0.39} clearcoat={0.16} clearcoatRoughness={0.7} /></mesh>
  </group>;
}

function BrassKey({ frame }) {
  const arrive = enter(frame, Math.min(cues.key - 30, 210), 25);
  const p = objectPose(frame, 2, [mix(2.5, 1.4, arrive), -0.12, 0.13]);
  return <group position={p.position} scale={arrive * p.scale} rotation={[0, -0.16 + p.rotation, mix(-0.26, 0.05, arrive)]}>
    <mesh position={[0, 1.05, 0.16]} castShadow><torusGeometry args={[0.245, 0.069, 20, 64]} /><meshPhysicalMaterial color={GOLD} metalness={0.92} roughness={0.25} /></mesh>
    <mesh position={[0, 0.59, 0.16]} castShadow><cylinderGeometry args={[0.058, 0.07, 0.74, 32]} /><meshPhysicalMaterial color={GOLD} metalness={0.9} roughness={0.28} /></mesh>
    <mesh position={[0.12, 0.31, 0.16]} castShadow><boxGeometry args={[0.3, 0.09, 0.14]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} /></mesh>
    <mesh position={[0.16, 0.18, 0.16]} castShadow><boxGeometry args={[0.21, 0.09, 0.14]} /><meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} /></mesh>
  </group>;
}

function contour(points, count = 96) {
  const closed = [...points, points[0]];
  const lengths = closed.slice(1).map((p, i) => Math.hypot(p[0] - closed[i][0], p[1] - closed[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  return Array.from({ length: count }, (_, j) => {
    let distance = j / count * total; let i = 0;
    while (i < lengths.length - 1 && distance > lengths[i]) { distance -= lengths[i]; i++; }
    const t = distance / lengths[i]; return [mix(closed[i][0], closed[i + 1][0], t), mix(closed[i][1], closed[i + 1][1], t)];
  });
}
const ellipse = (rx, ry) => Array.from({ length: 96 }, (_, i) => { const a = i / 96 * Math.PI * 2; return [Math.cos(a) * rx, Math.sin(a) * ry]; });
const bootOutline = contour(bootShape().getPoints(24).map((p) => [p.x, p.y - 0.65]));
const mountain = contour([[-0.74, -0.38], [-0.29, 0.53], [0.04, 0.07], [0.31, 0.33], [0.76, -0.38]]);
const arch = contour([[-0.43, -0.58], [0.43, -0.58], [0.43, 0.17], ...Array.from({ length: 25 }, (_, i) => { const a = i / 24 * Math.PI; return [Math.cos(a) * 0.43, 0.17 + Math.sin(a) * 0.43]; })]);
const keyOutline = contour([[0.07, -0.62], [0.28, -0.62], [0.28, -0.51], [0.08, -0.51], [0.08, -0.32], [0.29, -0.32], [0.29, -0.23], [0.08, -0.23], [0.08, 0.2], ...Array.from({ length: 40 }, (_, i) => { const a = -Math.PI / 2 + i / 39 * Math.PI * 2; return [Math.cos(a) * 0.29, 0.44 + Math.sin(a) * 0.29]; }), [-0.08, 0.2], [-0.08, -0.62]]);

function Morph({ from, to, progress, color, opacity }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    from.forEach((p, i) => { const x = mix(p[0], to[i][0], progress), y = mix(p[1], to[i][1], progress); if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); });
    s.closePath(); return s;
  }, [from, to, progress]);
  return <mesh><shapeGeometry args={[shape]} /><meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} /></mesh>;
}

function ShadowStories({ frame }) {
  const overlap = enter(frame, 270, 42), fold = enter(frame, 360, 54);
  const puddle = enter(frame, cues.boot, 27), hill = enter(frame, cues.stone, 27), door = enter(frame, cues.key, 27);
  const shadows = 1 - enter(frame, 432, 22);
  return <group position={[0, mix(0.81, 0.27, fold), mix(-0.66, 0.46, fold)]} scale={mix(1, 0.62, fold)} rotation={[fold * -Math.PI / 2, 0, 0]}>
    <group position={[mix(-0.66, -0.48, overlap), -puddle * 0.25, 0.004]}>
      <Morph from={bootOutline} to={ellipse(0.71, 0.25)} progress={puddle} color={TEAL} opacity={enter(frame, 64, 26) * shadows * 0.48} />
      {[0.32, 0.57].map((r, i) => <mesh key={i} position={[0, 0, 0.008]} scale={[1, 0.34, 1]}><ringGeometry args={[r - 0.014, r, 64]} /><meshBasicMaterial color="#bad2ca" transparent opacity={puddle * shadows * 0.85} depthWrite={false} /></mesh>)}
    </group>
    <group position={[mix(0.5, 0, overlap), 0.02, 0.014]}>
      <Morph from={ellipse(0.56, 0.29)} to={mountain} progress={hill} color="#305952" opacity={enter(frame, 160, 20) * shadows * 0.7} />
      <mesh position={[-0.28, 0.34, 0.012]} scale={hill}><shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-0.1, -0.04), new THREE.Vector2(0, 0.18), new THREE.Vector2(0.13, -0.06), new THREE.Vector2(0.02, -0.015)])]} /><meshBasicMaterial color={CREAM} transparent opacity={shadows * 0.72} /></mesh>
    </group>
    <group position={[mix(2.02, 0.47, overlap), 0.05, 0.025]}>
      <Morph from={keyOutline} to={arch} progress={door} color={INK} opacity={enter(frame, 219, 18) * shadows * 0.67} />
      <group scale={[door * 0.73, door * 0.86, 1]} position={[0, -0.04, 0.008]}><Morph from={arch} to={arch} progress={1} color={GOLD} opacity={door * shadows * 0.8} /></group>
      <mesh position={[0, -0.56, 0.018]} scale={[door, 1, 1]}><planeGeometry args={[0.85, 0.018]} /><meshBasicMaterial color={GOLD} transparent opacity={door * shadows} /></mesh>
    </group>
  </group>;
}

function PaperIllustration({ side, frame }) {
  const opacity = enter(frame, 432, 24);
  return <group position={[side * 0.59, 0.107, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    {side === -1 ? <>
      <group position={[0, 0.09, 0]} scale={0.58}>
        <Morph from={mountain} to={mountain} progress={1} color={TEAL} opacity={opacity} />
      </group>
      <group position={[0.02, -0.32, 0.006]} scale={0.54}>
        <Morph from={ellipse(0.71, 0.25)} to={ellipse(0.71, 0.25)} progress={1} color="#a1c1b1" opacity={opacity} />
        <mesh scale={[1, 0.34, 1]}><ringGeometry args={[0.41, 0.426, 64]} /><meshBasicMaterial color={CREAM} transparent opacity={opacity} depthWrite={false} /></mesh>
      </group>
      <mesh position={[-0.31, 0.43, 0.007]}><circleGeometry args={[0.075, 32]} /><meshBasicMaterial color={GOLD} transparent opacity={opacity} depthWrite={false} /></mesh>
    </> : <>
      <group position={[0.06, 0.07, 0]} scale={0.66}>
        <Morph from={arch} to={arch} progress={1} color={TEAL} opacity={opacity} />
        <group position={[0, -0.04, 0.008]} scale={[0.74, 0.86, 1]}><Morph from={arch} to={arch} progress={1} color={GOLD} opacity={opacity} /></group>
      </group>
      <group position={[-0.27, -0.37, 0.016]} scale={0.24}>
        <Morph from={bootOutline} to={bootOutline} progress={1} color={INK} opacity={opacity} />
      </group>
      <mesh position={[0.1, -0.42, 0.009]}><planeGeometry args={[0.48, 0.018]} /><meshBasicMaterial color={GOLD} transparent opacity={opacity} depthWrite={false} /></mesh>
    </>}
  </group>;
}

function Book({ frame }) {
  const rise = enter(frame, cues.book, 30);
  const close = enter(frame, cues.halfClose, 30);
  const angle = mix(0.07, 0.49, close);
  const end = 1 - enter(frame, 555, 32);
  return <group position={[0, 0.13, 0.46]} scale={rise * end} rotation={[enter(frame, 420, 50) * -0.12, 0, 0]}>
    {[-1, 1].map((side) => <group key={side} rotation={[0, 0, side * angle]}>
      <Rounded dimensions={[1.23, 0.07, 1.39]} color={TEAL} position={[side * 0.61, 0, 0]} radius={0.025} />
      <Rounded dimensions={[1.17, 0.06, 1.32]} color={CREAM} position={[side * 0.59, 0.06, 0]} radius={0.02} />
      <PaperIllustration side={side} frame={frame} />
      {[0, 1, 2].map((i) => <mesh key={i} position={[side * 0.59, 0.046 + i * 0.016, 0.662]}><boxGeometry args={[1.1, 0.003, 0.003]} /><meshBasicMaterial color="#c5bfae" /></mesh>)}
      <mesh position={[side * 1.205, 0.089, 0]}><boxGeometry args={[0.016, 0.006, 1.25]} /><meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.5} /></mesh>
    </group>)}
    <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.034, 0.15, 1.4]} /><meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.45} /></mesh>
  </group>;
}

export function Museum({ frame, contentScale = 1 }) {
  const reset = enter(frame, 600, 29);
  // Return only the small boot in the last second, beneath a held end card.
  const objectFrame = mix(frame, 52, reset);
  const stageOpacity = enter(frame, 0, 24) * mix(1, 0.12, enter(frame, 548, 40));
  return <ThreeCanvas name="Museum · camera · shadow stories" width={1080} height={1920} frameloop="never" style={{ position: 'absolute', inset: 0, opacity: stageOpacity }} shadows={{ type: THREE.PCFShadowMap }} camera={{ fov: 39, near: 0.1, far: 40, position: [0, 2.9, 7.7] }} gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }} dpr={1}>
    <Lens frame={frame} contentScale={contentScale} />
    <ambientLight color={CREAM} intensity={0.55} />
    <directionalLight position={[-3.6 + enter(frame, 330, 60) * 0.65, 5.8, 5]} intensity={2.7} color="#fff4dd" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-3} shadow-normalBias={0.02} shadow-bias={-0.00015} />
    <pointLight position={[3, 2.8, 1.7]} color="#f5d5a0" intensity={1.7 + enter(frame, cues.key - 20, 20) * 0.6} distance={9} />
    <directionalLight position={[1, 2, -2]} intensity={0.65} color="#c2dfd5" />
    <Rounded dimensions={[5.05, 0.23, 2.27]} color="#eee7d9" position={[0, -0.12, 0]} radius={0.07} />
    <Rounded dimensions={[5.02, 0.034, 2.25]} color={GOLD} position={[0, -0.26, 0]} radius={0.014} />
    <Rounded dimensions={[4.71, 0.62, 2.01]} color={TEAL} position={[0, -0.58, -0.02]} radius={0.09} />
    <Rounded dimensions={[4.92, 2.3, 0.052]} color={CREAM} position={[0, 1.15, -0.72]} radius={0.02} />
    <ShadowStories frame={objectFrame} />
    <ContactShadows frame={objectFrame} />
    <RainBoot frame={objectFrame} />
    <Stone frame={objectFrame} />
    <BrassKey frame={objectFrame} />
    <Book frame={frame} />
  </ThreeCanvas>;
}
