import { useEffect, useLayoutEffect, useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useLoader, useThree } from '@react-three/fiber';
import { staticFile, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { palette, paperTexture, treeSVG, castleSVG, trailSVG, citySVG } from './art';
import { enter, mix, smooth } from './timing';

const { teal, deep, cream, gold, stone, light } = palette;

// One continuous stage. These are authored cinematic poses, not geographic
// coordinates. Camera reaches 1.15 world units at child-eye height at second 4.
export function cameraPose(frame) {
  const poses = [
    [0, [9, 11, 16], [0, 1.05, -1.5]],
    [45, [7.2, 9, 14], [0, 1.0, -1.5]],
    [90, [1.4, 4.0, 12], [0, 1.0, -1.4]],
    [132, [0.1, 1.15, 10], [0, 1.2, -2.2]],
    [180, [0.1, 1.15, 9.6], [0, 1.2, -2.2]],
    [240, [0.8, 1.35, 9.3], [0, 1.6, -2.4]],
    [300, [0.4, 1.9, 9.3], [0, 1.9, -2.4]],
    [335, [-1.2, 2.2, 8.8], [0, 1.9, -2.4]],
    [360, [-0.5, 2.8, 10.4], [0, 1.5, -2]],
    [405, [0, 6.5, 11.8], [0, 1, -1.7]],
    [450, [0, 3.3, 12], [0, 1, -1.7]],
    [629, [0, 3.3, 12], [0, 1, -1.7]],
    [659, [9, 11, 16], [0, 1.05, -1.5]],
  ];
  const index = poses.findIndex(([f]) => f > frame);
  const a = poses[Math.max(0, index - 1)];
  const b = poses[index < 0 ? poses.length - 1 : index];
  const t = a === b ? 0 : smooth((frame - a[0]) / (b[0] - a[0]));
  return { position: a[1].map((v, i) => mix(v, b[1][i], t)), target: a[2].map((v, i) => mix(v, b[2][i], t)) };
}

function Camera({ frame, contentScale }) {
  const { camera } = useThree();
  const { position: [x, y, z], target: [tx, ty, tz] } = cameraPose(frame);
  useLayoutEffect(() => {
    // Keep WebGL full-frame while pulling the projection back around 540,960.
    // The offset clears the fixed title/caption stack above the city, and
    // scales with the lens so 3D and DOM share the same editing zoom centre.
    camera.zoom = contentScale;
    camera.setViewOffset(1080, 1920, 0, -115 * contentScale, 1080, 1920);
    camera.position.set(x, y, z); camera.lookAt(tx, ty, tz);
    camera.updateProjectionMatrix();
  }, [camera, contentScale, x, y, z, tx, ty, tz]);
  return null;
}

function FrameCommit({ frame, contentScale }) {
  const { camera, scene, gl } = useThree();
  // Draw after the complete stage commits, including its first async texture
  // load. This also supplements ThreeCanvas's manual export frame renderer.
  useEffect(() => {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    gl.render(scene, camera);
  }, [camera, scene, gl, frame, contentScale]);
  return null;
}

function Block({ size, color = stone, paper, opacity = 1, overlay = false, ...props }) {
  const [w, h, d] = size;
  const geometry = useMemo(() => new RoundedBoxGeometry(w, h, d, 2, Math.min(0.025, h / 5)), [w, h, d]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} castShadow={!overlay} receiveShadow={!overlay} renderOrder={overlay ? 100 : 0}>
    {overlay ? <meshBasicMaterial color={color} toneMapped={false} transparent opacity={opacity} depthTest={false} depthWrite={false} />
      : <meshStandardMaterial color={color} roughness={0.94} bumpMap={paper} bumpScale={0.028} transparent opacity={opacity} depthWrite={opacity > 0.95} />}
  </mesh>;
}

function PaperCutout({ svg, opacity = 1, paper, fold = 1, glow = 0, overlay = false, ...props }) {
  const pieces = useMemo(() => new SVGLoader().parse(svg).paths.flatMap((path) => {
    const style = path.userData.style;
    const filled = style.fill === 'none' ? [] : SVGLoader.createShapes(path).map((shape) => ({
      geometry: new THREE.ExtrudeGeometry(shape, { depth: 3.5, bevelEnabled: false, curveSegments: 16 }), color: path.color,
    }));
    // Open trail and stair strokes must stay strokes. Filling an open SVG
    // subpath would invent a broad triangular sheet across the treasure route.
    const strokes = !style.stroke || style.stroke === 'none' ? [] : path.subPaths.flatMap((subpath) => {
      const geometry = SVGLoader.pointsToStroke(subpath.getPoints(80), style);
      if (!geometry) return [];
      geometry.translate(0, 0, 4);
      return [{ geometry, color: new THREE.Color(style.stroke) }];
    });
    return [...filled, ...strokes];
  }), [svg]);
  useEffect(() => () => pieces.forEach((p) => p.geometry.dispose()), [pieces]);
  return <group {...props}>
    {pieces.map((piece, i) => <group key={i} position={[0, 0, i * 0.8]} rotation={[0, (1 - fold) * (i % 2 ? 1 : -1) * Math.PI / 2, 0]}>
      <mesh geometry={piece.geometry} castShadow={!overlay} receiveShadow={!overlay} renderOrder={overlay ? 102 : 0}>
        {overlay ? <meshBasicMaterial color={piece.color} toneMapped={false} side={THREE.DoubleSide} transparent opacity={opacity} depthTest={false} depthWrite={false} />
          : <meshStandardMaterial color={piece.color} side={THREE.DoubleSide} roughness={0.92} bumpMap={paper} bumpScale={0.015} transparent opacity={opacity} depthWrite={opacity > 0.95} emissive={i === 5 ? '#f4d88e' : '#000000'} emissiveIntensity={i === 5 ? glow : 0} />}
      </mesh>
    </group>)}
  </group>;
}

function House({ x, y, z, index, frame, opacity, paper }) {
  const h = 0.75 + (index % 4) * 0.16;
  const w = 0.72 + (index % 3) * 0.12;
  const lit = enter(frame, 330, 24);
  return <group position={[x, y, z]} rotation={[0, ((index % 3) - 1) * 0.045, 0]}>
    <Block size={[w, h, 0.87]} position={[0, h / 2, 0]} paper={paper} opacity={opacity} color={index % 3 ? stone : light} />
    <Block size={[w + 0.06, 0.07, 0.94]} position={[0, h + 0.035, 0]} paper={paper} opacity={opacity} color={cream} />
    {[-0.2, 0.2].map((wx) => <mesh key={wx} position={[wx, h * 0.61, 0.444]}>
      <planeGeometry args={[0.16, 0.23]} />
      <meshStandardMaterial color={teal} emissive={gold} emissiveIntensity={lit * 0.9} transparent opacity={opacity} depthWrite={opacity > 0.95} />
    </mesh>)}
    <Block size={[0.2, 0.36, 0.02]} position={[0, 0.19, 0.445]} color={deep} opacity={opacity} />
    {index % 4 === 0 && <mesh position={[0.1, h + 0.17, -0.15]} castShadow>
      <cylinderGeometry args={[0.12, 0.12, 0.25, 16]} /><meshStandardMaterial color={cream} roughness={0.8} transparent opacity={opacity} />
    </mesh>}
  </group>;
}

function Hillside({ frame, paper }) {
  const page = enter(frame, 360, 48);
  const loop = enter(frame, 630, 29);
  const opacity = Math.max(1 - page, loop * 0.13);
  const unfold = enter(frame, 150, 50);
  const castle = enter(frame, 270, 30);
  const broad = 1 + enter(frame, 240, 30) * 0.1;
  const houses = [];
  for (let row = 0; row < 4; row++) for (let column = -3; column <= 3; column++) {
    if (column === 0) continue;
    const index = row * 7 + column + 3;
    houses.push({ x: column * 1.06 + Math.sin(row * 2 + column) * 0.07, y: 0.15 + row * 0.34, z: -row * 1.14 - 0.9, index });
  }
  return <group visible={opacity > 0.002}>
    {[0, 1, 2, 3].map((row) => <Block key={row} size={[7.7 - row * 0.8, 0.43, 1.8]} position={[0, row * 0.34 - 0.1, -row * 1.1 - 0.5]} paper={paper} opacity={opacity} color={row % 2 ? '#d9c5a3' : '#e6d5b8'} />)}
    {houses.map((house) => <House key={house.index} {...house} frame={frame} opacity={opacity} paper={paper} />)}
    {Array.from({ length: 17 }, (_, i) => {
      const t = i / 16;
      const x = Math.sin(t * Math.PI * 2.1) * unfold * 0.65;
      return <group key={i} position={[x, 0.07 + t * 1.16, mix(1.55 - i * 0.28, 2.1 - i * 0.35, unfold)]} rotation={[0, Math.cos(t * Math.PI * 2.1) * unfold * -0.28, 0]}>
        <Block size={[mix(0.83, 0.73, unfold), 0.11, 0.33]} color={new THREE.Color(light).lerp(new THREE.Color('#e8c574'), unfold)} opacity={opacity} paper={paper} />
        <Block size={[0.62, 0.018, 0.028]} position={[0, 0.06, 0.1]} color={gold} opacity={opacity * unfold} />
      </group>;
    })}
    <PaperCutout svg={trailSVG} paper={paper} opacity={opacity * enter(frame, 180, 25) * 0.9} scale={[0.0045, -0.007, 0.0045]} rotation={[-Math.PI / 2, 0, 0]} position={[-0.72, 0.24, -1.5]} />
    <group position={[0, 1.17, -3.5]}>
      <PaperCutout svg={treeSVG} paper={paper} opacity={opacity * (1 - castle)} position={[-1.12 * broad, 2.66, 0]} scale={[0.007 * broad, -0.007, 0.007]} />
      {/* Towers fold from the same tree footprint and share its trunk/gate axis. */}
      <PaperCutout svg={castleSVG} paper={paper} opacity={opacity * castle} fold={castle} glow={enter(frame, 330, 25) * 0.9} position={[-1.12, 2.66, 0.01]} scale={[0.007, -0.007, 0.007]} />
      <PaperCutout svg={castleSVG} paper={paper} opacity={opacity * castle * 0.45} fold={castle} position={[-1.09, 2.69, -0.08]} scale={[0.007, -0.007, 0.007]} />
    </group>
    {Array.from({ length: 12 }, (_, i) => {
      const t = (frame - 180 - i * 3) / 100;
      const show = enter(frame, 180 + i * 3, 15) * (1 - page);
      return <mesh key={i} position={[Math.sin(i * 2.4) * 0.7, 0.5 + i * 0.09 + Math.sin(t * 2 + i) * 0.08, 1.3 - i * 0.34]} rotation={[0, 0, Math.PI / 4 + Math.sin(frame / 45 + i) * 0.1]} scale={0.033 + (i % 3) * 0.014}>
        <octahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#f3da92" emissive={gold} emissiveIntensity={0.7} transparent opacity={show * opacity} />
      </mesh>;
    })}
  </group>;
}

function StoryIllustration({ opacity, texture }) {
  const aspect = texture.image.width / texture.image.height;
  const width = Math.min(4.7, 3.25 * aspect);
  return <mesh position={[0, 0, 0.085]} renderOrder={103}>
    <planeGeometry args={[width, width / aspect]} />
    <meshBasicMaterial map={texture} toneMapped={false} transparent opacity={opacity} depthTest={false} depthWrite={false} />
  </mesh>;
}

function Book({ frame, paper, storyTexture }) {
  const open = enter(frame, 360, 42);
  const turn = enter(frame, 420, 30);
  const illustration = enter(frame, 390, 24);
  const pose = cameraPose(frame);
  const eye = new THREE.Vector3(...pose.position);
  const target = new THREE.Vector3(...pose.target);
  const orientation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(eye, target, new THREE.Vector3(0, 1, 0)));
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(orientation);
  // Settle between the caption plate and CTA in the authored safe rectangle.
  const heldCentre = eye.clone().addScaledVector(target.clone().sub(eye).normalize(), 18).addScaledVector(up, 0.8);
  const centre = new THREE.Vector3(0, 0.9, -1.65).lerp(heldCentre, turn);
  const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -0.03)).slerp(orientation, turn);
  // The original city motif develops into the requested fictional story art.
  // Story copy and branding remain in the separate, readable RTL DOM layer.
  return <group visible={open > 0.002} position={centre} scale={mix(mix(0.7, 1, open), 0.74, turn)} quaternion={tilt}>
    <Block overlay size={[5.15, 3.85, 0.11]} position={[0, 0, -0.095]} color={teal} paper={paper} opacity={open} />
    {[0, 1, 2, 3].map((i) => <Block key={i} overlay size={[5.01 - i * 0.018, 3.7 - i * 0.018, 0.017]} position={[0, 0, -0.02 + i * 0.015]} color={i % 2 ? '#e9dfcb' : cream} paper={paper} opacity={open} />)}
    <Block overlay size={[0.035, 3.6, 0.018]} position={[0, 0, 0.062]} color="#ddd0b4" opacity={open} />
    <PaperCutout overlay svg={citySVG} paper={paper} opacity={open * (1 - illustration)} position={[-2.25, 1.5, 0.06]} scale={[0.007, -0.007, 0.007]} />
    <StoryIllustration opacity={open * illustration} texture={storyTexture} />
    {/* A narrow translucent fold keeps the painted spread attached to the book. */}
    <mesh position={[0, 0, 0.1]} renderOrder={104}>
      <planeGeometry args={[0.026, 3.58]} />
      <meshBasicMaterial color="#173c3f" toneMapped={false} transparent opacity={open * illustration * 0.22} depthTest={false} depthWrite={false} />
    </mesh>
  </group>;
}

function AmmanStage({ frame, paper, contentScale }) {
  // Resolve the artwork before committing the stage, so direct seeks and
  // first-frame captures cannot draw a partially loaded book or blank set.
  const storyTexture = useLoader(THREE.TextureLoader, staticFile('r16/story-illustration.png'));
  useLayoutEffect(() => {
    storyTexture.colorSpace = THREE.SRGBColorSpace;
    storyTexture.anisotropy = 8;
    storyTexture.needsUpdate = true;
  }, [storyTexture]);
  const magical = enter(frame, 150, 80);
  const page = enter(frame, 360, 60);
  return <>
    <Camera frame={frame} contentScale={contentScale} />
    <ambientLight intensity={1.0 + page * 0.25} color={cream} />
    <hemisphereLight args={[cream, '#548477', 1.3]} />
    <directionalLight castShadow intensity={2.8 - page * 0.8} color={new THREE.Color('#fff0d4').lerp(new THREE.Color('#f8d490'), magical)} position={[mix(-5, -2.5, magical), 8, 5]} shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-bias={-0.0005} />
    <pointLight position={[0, 2.3, -2.8]} color={gold} intensity={magical * (1 - page) * 8} distance={8} decay={2} />
    <Hillside frame={frame} paper={paper} />
    <Book frame={frame} paper={paper} storyTexture={storyTexture} />
    <FrameCommit frame={frame} contentScale={contentScale} />
  </>;
}

export function AmmanScene({ frame, contentScale = 1 }) {
  const { width, height } = useVideoConfig();
  const paper = useMemo(() => paperTexture(), []);
  useEffect(() => () => paper.dispose(), [paper]);
  return <ThreeCanvas name="Amman · child-eye descent · paper transformations" showInTimeline width={width} height={height} frameloop="never" dpr={1} style={{ position: 'absolute', inset: 0 }} camera={{ fov: 42, near: 0.1, far: 80, position: [9, 11, 16] }} shadows={{ type: THREE.PCFSoftShadowMap }} gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}>
    <AmmanStage frame={frame} paper={paper} contentScale={contentScale} />
  </ThreeCanvas>;
}
