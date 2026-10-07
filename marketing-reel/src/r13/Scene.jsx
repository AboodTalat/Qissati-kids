import { useLayoutEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { clothTexture, lerp, pageArtwork, palette, reveal, roundedShape, smooth } from './art';

const { cream, gold, deep } = palette;
const CAMERA = [
  { f: 0, p: [2.5, 2.2, 6.0], t: [0, 1.14, 0] },
  { f: 88, p: [1.55, 2.0, 5.5], t: [0, 1.2, 0] },
  { f: 170, p: [0.65, 2.0, 5.45], t: [0, 1.14, 0] },
  { f: 236, p: [2.1, 3.8, 7.5], t: [0, 0.68, -0.6] },
  { f: 300, p: [0.4, 2.5, 5.5], t: [0, 0.48, -1.3] },
  { f: 360, p: [-0.4, 2.25, 3.35], t: [0, 0.35, -2.5] },
  { f: 421, p: [0.3, 4.5, 3.45], t: [0, 0.32, -2.4] },
  { f: 482, p: [2.4, 3.8, 6.8], t: [0, 0.85, 0.05] },
  { f: 569, p: [2.4, 3.8, 6.8], t: [0, 0.85, 0.05] },
  { f: 599, p: [2.5, 2.2, 6.0], t: [0, 1.14, 0] },
];

function Camera({ frame }) {
  const { camera, scene } = useThree();
  const index = CAMERA.findIndex((pose) => pose.f > frame);
  const a = CAMERA[Math.max(0, index - 1)];
  const b = CAMERA[index < 0 ? CAMERA.length - 1 : index];
  const amount = a === b ? 0 : smooth((frame - a.f) / (b.f - a.f));
  const p = a.p.map((n, i) => lerp(n, b.p[i], amount));
  const t = a.t.map((n, i) => lerp(n, b.t[i], amount));
  useLayoutEffect(() => {
    // Full-frame canvas, with the set centred above Instagram's lower controls.
    camera.setViewOffset(1080, 1920, 0, 120, 1080, 1920);
    camera.updateProjectionMatrix();
    scene.updateMatrixWorld(true);
    const corners = [];
    scene.traverseVisible((object) => {
      if (!object.isMesh || Math.abs(object.matrixWorld.determinant()) < 1e-9) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (!materials.some((material) => !material.transparent || material.opacity > 0.035)) return;
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      const box = object.geometry.boundingBox;
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z).applyMatrix4(object.matrixWorld));
        }
      }
    });
    const target = new THREE.Vector3(...t);
    const ray = new THREE.Vector3(...p).sub(target);
    const projected = new THREE.Vector3();
    const place = (distance) => {
      camera.position.copy(target).addScaledVector(ray, distance);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
    };
    const fits = (distance) => {
      place(distance);
      return corners.every((corner) => {
        projected.copy(corner).project(camera);
        const x = (projected.x + 1) * 540;
        const y = (1 - projected.y) * 960;
        return x >= 200 && x <= 880 && y >= 600 && y <= 1045 && projected.z < 1;
      });
    };
    // Retain the authored dolly/zoom; only pull back further when a mesh would
    // enter the crop margin. Bounds come from the actual frame's geometry.
    let near = 1.24;
    let far = 8;
    if (fits(near)) {
      place(near);
    } else {
      for (let i = 0; i < 15; i++) {
        const middle = (near + far) / 2;
        if (fits(middle)) far = middle;
        else near = middle;
      }
      place(far);
    }
  }, [camera, scene, frame, ...p, ...t]);
  return null;
}

function Thread({ from, to, color = '#e5dcc2', thickness = 0.011 }) {
  const curve = useMemo(() => new THREE.LineCurve3(new THREE.Vector3(...from), new THREE.Vector3(...to)), [from, to]);
  return <mesh><tubeGeometry args={[curve, 1, thickness, 6, false]} /><meshStandardMaterial color={color} roughness={1} /></mesh>;
}

function Plush({ frame, texture }) {
  const world = reveal(frame, 205, 50);
  const finish = reveal(frame, 435, 50);
  const reset = reveal(frame, 570, 29);
  const bookFocus = reveal(frame, 340, 48) * (1 - finish);
  const tilt = Math.sin(reveal(frame, 112, 55) * Math.PI) * -0.12;
  const x = lerp(-1.6 * world + bookFocus * 0.35, -1.46, finish) * (1 - reset);
  const z = lerp(-0.2 * world, 0.24, finish) * (1 - reset);
  const scale = lerp(1 - world * 0.4 - bookFocus * 0.28, 0.87, finish) + reset * 0.13;
  const glint = Math.exp(-(((frame - 72) / 10) ** 2));
  const cloth = (color) => <meshPhysicalMaterial color={color} roughness={0.97} bumpMap={texture} bumpScale={0.025} sheen={0.95} sheenColor="#dce9d9" sheenRoughness={0.84} />;
  return <group position={[x, 0.025, z]} rotation={[0, -0.09 + Math.sin(frame / 599 * Math.PI * 4) * 0.018, tilt]} scale={scale}>
    {[-1, 1].map((side) => <group key={`arm-${side}`} position={[side * 0.55, 1.05, 0]} rotation={[0, 0, side * (0.2 + (side === 1 ? Math.sin(reveal(frame, 120, 52) * Math.PI) * 0.19 : 0))]}>
      <mesh position={[side * 0.08, -0.22, 0.04]} scale={[0.23, 0.43, 0.26]} castShadow>
        <sphereGeometry args={[1, 40, 28]} />{cloth('#66998e')}
      </mesh>
    </group>)}
    {[-1, 1].map((side) => <mesh key={`foot-${side}`} position={[side * 0.32, 0.21, 0.19]} rotation={[0, side * 0.12, 0]} scale={[0.32, 0.22, 0.39]} castShadow>
      <sphereGeometry args={[1, 40, 28]} />{cloth('#59887e')}
    </mesh>)}
    <mesh position={[0, 0.89, 0]} scale={[0.6, 0.74, 0.44]} castShadow>
      <sphereGeometry args={[1, 64, 48]} />{cloth('#6f9f92')}
    </mesh>
    <mesh position={[0, 0.88, 0.43]} scale={[0.38, 0.53, 0.055]} castShadow>
      <sphereGeometry args={[1, 48, 32]} />{cloth('#e3dcc2')}
    </mesh>
    {Array.from({ length: 28 }, (_, i) => {
      const angle = i / 28 * Math.PI * 2;
      const x1 = Math.cos(angle) * 0.344;
      const y1 = 0.88 + Math.sin(angle) * 0.483;
      return <Thread key={`belly-${i}`} from={[x1, y1, 0.479]} to={[x1 * 0.97, y1 + 0.019, 0.48]} color="#ac996d" thickness={0.006} />;
    })}
    {[-1, 1].map((side) => <group key={`ear-${side}`} position={[side * 0.46, 2.05, 0.06]} rotation={[0, 0, side * -0.28]}>
      <mesh scale={[0.225, 0.41, 0.21]} castShadow><sphereGeometry args={[1, 40, 28]} />{cloth('#83ac9f')}</mesh>
      <mesh position={[0, 0.015, 0.177]} scale={[0.13, 0.27, 0.034]}><sphereGeometry args={[1, 32, 24]} />{cloth('#c5d3b9')}</mesh>
    </group>)}
    <mesh position={[0, 1.64, 0.08]} rotation={[0, 0, -0.025]} scale={[0.61, 0.56, 0.44]} castShadow>
      <sphereGeometry args={[1, 64, 48]} />{cloth('#83ac9f')}
    </mesh>
    <Thread from={[-0.245, 1.74, 0.501]} to={[-0.155, 1.65, 0.516]} color={deep} thickness={0.015} />
    <Thread from={[-0.245, 1.65, 0.501]} to={[-0.155, 1.74, 0.516]} color={deep} thickness={0.015} />
    <mesh position={[0.19, 1.7, 0.513]} scale={[0.037, 0.056, 0.017]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color={deep} roughness={0.96} /></mesh>
    <mesh position={[0, 1.48, 0.508]} scale={[0.074, 0.039, 0.023]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color="#305854" roughness={1} /></mesh>
    <Thread from={[-0.08, 1.41, 0.49]} to={[0, 1.385, 0.497]} color="#406864" thickness={0.008} />
    <Thread from={[0, 1.385, 0.497]} to={[0.08, 1.41, 0.49]} color="#406864" thickness={0.008} />
    {Array.from({ length: 10 }, (_, i) => <Thread key={`head-${i}`} from={[-0.008, 1.9 - i * 0.043, 0.41 + Math.sin(i / 9 * Math.PI) * 0.1]} to={[0.02, 1.89 - i * 0.043, 0.41 + Math.sin(i / 9 * Math.PI) * 0.1]} thickness={0.005} color="#a5beab" />)}
    <mesh position={[-0.2, 1.71, 0.537]} scale={glint * 0.075}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color="#ffe4a6" /></mesh>
    <pointLight position={[-0.2, 1.73, 0.75]} intensity={glint * 0.8} color={gold} distance={1.5} />
  </group>;
}

function Alcove({ frame }) {
  const vanish = reveal(frame, 195, 45) * (1 - reveal(frame, 570, 29));
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.72, 0); s.lineTo(1.72, 0); s.lineTo(1.72, 1.24);
    s.absarc(0, 1.24, 1.72, 0, Math.PI, false); s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-1.59, 0.06); hole.lineTo(-1.59, 1.24);
    hole.absarc(0, 1.24, 1.59, Math.PI, 0, true); hole.lineTo(1.59, 0.06); hole.closePath();
    s.holes.push(hole);
    return s;
  }, []);
  return <mesh position={[0, -vanish * 1.3, -0.74]} scale={1 - vanish * 0.3} visible={vanish < 0.999} castShadow={vanish < 0.95}>
    <extrudeGeometry args={[shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 3, curveSegments: 48 }]} />
    <meshStandardMaterial color="#e0d5b9" transparent opacity={1 - vanish} roughness={0.91} />
  </mesh>;
}

function Shelf({ frame }) {
  const fold = reveal(frame, 204, 50) * (1 - reveal(frame, 438, 45));
  const bookFocus = reveal(frame, 340, 48) * (1 - reveal(frame, 438, 45));
  const panelOpacity = reveal(frame, 204, 20) * (1 - reveal(frame, 458, 25));
  const crease = (1 - fold) * Math.PI / 2;
  const shape = useMemo(() => roundedShape(5.1, 2.35, 0.19), []);
  const panel = (i) => <mesh position={[0, 0, -0.665]} receiveShadow castShadow={panelOpacity > 0.5}>
    <boxGeometry args={[4.96 - i * 0.35, 0.04, 1.33]} />
    <meshStandardMaterial color={i === 1 ? '#e9e1cd' : cream} roughness={0.96} transparent opacity={panelOpacity} />
  </mesh>;
  return <group>
    <group position={[0, 0, -bookFocus * 0.5]} scale={[1, 1, 1 - bookFocus * 0.3]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.17, 0.15]} receiveShadow castShadow>
      <extrudeGeometry args={[shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 24 }]} />
      <meshStandardMaterial color={cream} roughness={0.92} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, 0.15]}>
      <extrudeGeometry args={[shape, { depth: 0.025, bevelEnabled: false }]} /><meshStandardMaterial color="#bb9c60" roughness={0.82} />
    </mesh>
    </group>
    <group visible={fold > 0.001} position={[0, -0.03, -1.01]} rotation={[crease, 0, 0]}>
      {panel(0)}
      <group position={[0, 0, -1.33]} rotation={[-crease * 2, 0, 0]}>
        {panel(1)}
        <group position={[0, 0, -1.33]} rotation={[crease * 2, 0, 0]}>{panel(2)}</group>
      </group>
    </group>
  </group>;
}

function Hill({ points, x, z, color, progress }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(points[0][0], 0);
    points.forEach(([px, py]) => s.lineTo(px, py));
    s.lineTo(points[points.length - 1][0], 0); s.closePath();
    return s;
  }, [points]);
  return <group position={[x, 0.035, z]} rotation={[-(1 - progress) * Math.PI / 2, 0, 0]} scale={[progress, progress, progress]}>
    <mesh castShadow receiveShadow><shapeGeometry args={[shape]} /><meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={1} /></mesh>
    <mesh position={[0.025, -0.005, -0.025]}><shapeGeometry args={[shape]} /><meshStandardMaterial color="#a89b78" side={THREE.DoubleSide} roughness={1} /></mesh>
  </group>;
}

const HILLS = [
  { x: -1.7, z: -1.5, color: '#8db5a3', points: [[-0.62, 0.05], [-0.3, 0.43], [0.09, 0.77], [0.62, 0.12]] },
  { x: 1.7, z: -1.8, color: '#bccfb1', points: [[-0.65, 0.1], [-0.16, 0.85], [0.23, 0.64], [0.69, 0.09]] },
  { x: -1.65, z: -3.0, color: '#d3dec0', points: [[-0.74, 0.04], [-0.06, 1.22], [0.76, 0.06]] },
  { x: 1.5, z: -3.5, color: '#7aa596', points: [[-0.72, 0.06], [-0.2, 0.53], [0.2, 1.1], [0.75, 0.08]] },
  { x: -0.4, z: -4.7, color: '#e3e6cf', points: [[-1.6, 0.1], [-0.81, 0.83], [-0.25, 0.46], [0.49, 1.19], [1.4, 0.1]] },
];

function PaperWorld({ frame }) {
  const open = reveal(frame, 218, 56) * (1 - reveal(frame, 395, 45));
  const path = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.2, 0.7); s.bezierCurveTo(-0.85, -0.35, 0.82, -1.5, -0.14, -2.4);
    s.bezierCurveTo(-0.75, -3.1, 0.37, -3.7, 0.03, -4.75);
    s.lineTo(0.3, -4.75); s.bezierCurveTo(0.63, -3.7, -0.48, -3.1, 0.17, -2.4);
    s.bezierCurveTo(1.1, -1.5, -0.56, -0.35, 0.12, 0.7); s.closePath();
    return s;
  }, []);
  return <group>
    {HILLS.map((hill, i) => <Hill key={i} {...hill} progress={reveal(frame, 218 + i * 7, 38) * (1 - reveal(frame, 410, 55))} />)}
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} scale={[open, open, open]}><shapeGeometry args={[path, 40]} /><meshStandardMaterial color="#efd393" roughness={1} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0.25, 1.5, -4.5]} scale={open}><circleGeometry args={[0.32, 48]} /><meshBasicMaterial color="#f1d797" /></mesh>
  </group>;
}

function Book({ frame }) {
  const enter = reveal(frame, 350, 52);
  const end = reveal(frame, 438, 45);
  const reset = 1 - reveal(frame, 571, 28);
  const opening = reveal(frame, 384, 54);
  const textures = useMemo(() => [pageArtwork('left'), pageArtwork('right')], []);
  const page = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1.66, 2.15, 24, 28);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      positions.setZ(i, Math.sin((x + 0.83) / 1.66 * Math.PI) * 0.055);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  return <group position={[end * 1.05, 0.095, lerp(-2.7, -0.15, end)]} rotation={[0, -0.08 + end * 0.13, 0]} scale={enter * reset * lerp(1.02, 1.0, end)}>
    {[-1, 1].map((side, i) => <group key={side} rotation={[0, 0, side * lerp(1.34, 0.07, opening)]}>
      <mesh position={[side * 0.855, -0.084, 0]} castShadow receiveShadow><boxGeometry args={[1.77, 0.065, 2.3]} /><meshStandardMaterial color="#176063" roughness={0.82} /></mesh>
      <mesh position={[side * 0.83, -0.025, 0]} castShadow receiveShadow><boxGeometry args={[1.68, 0.065, 2.16]} /><meshStandardMaterial color="#e6d8bb" roughness={1} /></mesh>
      {[0, 1, 2].map((j) => <mesh key={j} position={[side * 0.85, -0.038 + j * 0.015, 1.084]}><boxGeometry args={[1.65, 0.003, 0.007]} /><meshBasicMaterial color="#c9b995" /></mesh>)}
      <mesh geometry={page} position={[side * 0.83, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial map={textures[i]} side={THREE.DoubleSide} roughness={0.99} />
      </mesh>
    </group>)}
    <mesh position={[0, -0.03, 0]}><boxGeometry args={[0.055, 0.09, 2.28]} /><meshStandardMaterial color="#b89c60" roughness={0.85} /></mesh>
    <mesh position={[0.12, 0.014, 1.28]} rotation={[0.16, 0, -0.2]}><boxGeometry args={[0.11, 0.018, 0.44]} /><meshStandardMaterial color={gold} roughness={0.8} /></mesh>
  </group>;
}

function Speech({ frame }) {
  const active = reveal(frame, 150, 16) * (1 - reveal(frame, 233, 25));
  return <group position={[0.66, 1.54, 0.26]}>
    {[0, 1, 2].map((i) => {
      const progress = reveal(frame, 150 + i * 10, 70);
      return <mesh key={i} rotation={[0, -0.18, 0.25]} scale={0.16 + progress * 0.9}>
        <torusGeometry args={[0.34, 0.009, 8, 60, Math.PI * 1.42]} /><meshBasicMaterial color={gold} transparent opacity={active * (1 - progress * 0.75)} depthWrite={false} />
      </mesh>;
    })}
  </group>;
}

function Motes({ frame }) {
  const visible = reveal(frame, 143, 24) * (1 - reveal(frame, 537, 20));
  return <group>{Array.from({ length: 9 }, (_, i) => {
    const phase = frame * 0.009 + i * 1.71;
    return <mesh key={i} position={[Math.sin(phase) * 1.65, 0.8 + (i % 4) * 0.29 + Math.sin(phase * 0.7) * 0.13, Math.cos(phase) * 1.2 - 0.7]} scale={0.014 + i % 3 * 0.004}>
      <octahedronGeometry args={[1, 0]} /><meshBasicMaterial color="#f6d993" transparent opacity={visible * 0.6} />
    </mesh>;
  })}</group>;
}

export function StorySet({ frame }) {
  const texture = useMemo(clothTexture, []);
  const journey = reveal(frame, 210, 160) * (1 - reveal(frame, 570, 29));
  return <ThreeCanvas width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }} camera={{ fov: 87.5, near: 0.1, far: 100, position: CAMERA[0].p }} shadows={{ type: THREE.PCFSoftShadowMap }} gl={{ antialias: true, alpha: true }}>
    <Camera frame={frame} />
    <ambientLight color="#f0f4e5" intensity={1.05} />
    <directionalLight position={[-3.5 + journey, 5.8, 4.1]} intensity={3.1} color="#fff0d6" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-bias={-0.0008} shadow-radius={6} />
    <directionalLight position={[4.5, 2.6, 1.2]} intensity={1.2} color="#b8e3db" />
    <pointLight position={[0.2, 3.4, -2.5]} intensity={2.5 + journey * 2} color="#f8d898" distance={9} decay={2} />
    <Shelf frame={frame} />
    <Alcove frame={frame} />
    <PaperWorld frame={frame} />
    <Book frame={frame} />
    <Plush frame={frame} texture={texture} />
    <Speech frame={frame} />
    <Motes frame={frame} />
  </ThreeCanvas>;
}
