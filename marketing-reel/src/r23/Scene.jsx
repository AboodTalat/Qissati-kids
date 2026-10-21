import { useEffect, useLayoutEffect, useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clamp, enter, mix, palette as C } from './timing';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function paperTexture(fabric = false) {
  const size = 256, bytes = new Uint8Array(size * size * 4);
  let seed = fabric ? 23072 : 23019;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const weave = fabric ? Math.sin(x * Math.PI / 2) * 12 + Math.sin(y * Math.PI / 2) * 10 : Math.sin(x * .22 + Math.sin(y * .09)) * 5;
    const value = 218 + seed / 4294967296 * 24 + weave, index = (y * size + x) * 4;
    bytes[index] = bytes[index + 1] = bytes[index + 2] = value; bytes[index + 3] = 255;
  }
  const texture = new THREE.DataTexture(bytes, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(3, 3); texture.needsUpdate = true;
  return texture;
}

function Material({ color = C.paper, texture, metal = false, fabric = false, opacity = 1, side = THREE.FrontSide }) {
  return <meshPhysicalMaterial color={color} roughness={metal ? .24 : fabric ? .55 : .82} metalness={metal ? .72 : 0}
    clearcoat={metal ? .5 : .05} clearcoatRoughness={.32} sheen={fabric ? .7 : 0} sheenRoughness={.6}
    sheenColor={C.sage} bumpMap={texture} bumpScale={metal ? .001 : fabric ? .008 : .005} side={side}
    transparent={opacity < 1} opacity={opacity} depthWrite={opacity > .95} />;
}

function Box({ size, radius = .025, color = C.paper, texture, opacity = 1, metal = false, ...props }) {
  const [w, h, d] = size;
  const geometry = useMemo(() => new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2)), [w, h, d, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} visible={opacity > .001} castShadow receiveShadow><Material color={color} texture={texture} opacity={opacity} metal={metal} /></mesh>;
}

function Tube({ points, radius = .009, color = C.gold, opacity = 1, metal = true, ...props }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(24, points.length * 3), radius, 7, false), [points, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} {...props} visible={opacity > .001} castShadow><Material color={color} metal={metal} opacity={opacity} /></mesh>;
}

function ribbonGeometry(points, width, roll = 0) {
  const curve = new THREE.CatmullRomCurve3(points), columns = 92, rows = 8;
  const positions = [], uvs = [], indices = [];
  for (let col = 0; col <= columns; col++) {
    const u = col / columns, point = curve.getPoint(u), tangent = curve.getTangent(u).normalize();
    const normal = V(0, 0, 1).cross(tangent).normalize();
    if (normal.length() < .01) normal.set(1, 0, 0);
    normal.applyAxisAngle(tangent, Math.sin(u * Math.PI * 2) * roll);
    const binormal = tangent.clone().cross(normal).normalize();
    for (let row = 0; row <= rows; row++) {
      const v = row / rows * 2 - 1;
      const p = point.clone().addScaledVector(normal, v * width / 2).addScaledVector(binormal, Math.cos(v * Math.PI / 2) * .035);
      positions.push(p.x, p.y, p.z); uvs.push(u * 4, row / rows);
      if (col < columns && row < rows) { const a = col * (rows + 1) + row, b = a + rows + 1; indices.push(a, a + 1, b, a + 1, b + 1, b); }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function Ribbon({ points, width = .3, roll = .35, texture, opacity = 1, color = C.teal, ...props }) {
  const geometry = useMemo(() => ribbonGeometry(points, width, roll), [points, width, roll]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} {...props} visible={opacity > .001} castShadow receiveShadow><Material color={color} texture={texture} fabric opacity={opacity} side={THREE.DoubleSide} /></mesh>;
}

function GiftRibbon({ time, fabric }) {
  const pull = enter(time, 1, 2.8), away = enter(time, 3.3, 1.1), alpha = 1 - enter(time, 3.45, .7);
  const centre = useMemo(() => [V(0, 1.155, -1.3), V(0, 1.165, -.5), V(0, 1.18, .6), V(0, 1.10, 1.29), V(0, .45, 1.31), V(.07, .02, 1.35)], []);
  const waist = useMemo(() => [V(-1.67, .9, .04), V(-1.45, 1.16, .04), V(0, 1.17, .04), V(1.45, 1.16, .04), V(1.68, .85, .04)], []);
  const left = useMemo(() => [V(0, 1.22, .08), V(-.4 - pull * .4, 1.65 + pull * .2, .08), V(-.95 - pull * .25, 1.52, -.02), V(-.8, 1.24, -.04), V(0, 1.23, .08)], [pull]);
  const right = useMemo(() => [V(0, 1.22, .08), V(.4 + pull * .6, 1.73 + pull * .2, -.02), V(1.02 + pull * .3, 1.54, -.14), V(.75 + pull * .2, 1.22, .02), V(0, 1.23, .08)], [pull]);
  const tail = useMemo(() => [V(0, 1.23, .12), V(.4 + pull * .75, 1.28, .45), V(.7 + pull * 1.1, .86 + pull * .3, .84), V(.8 + pull * 1.2, .15 + pull * .75, 1.25 - pull * .6)], [pull]);
  return <group position={[away * .60, -1.05 + away * .65, -away * .5]} rotation={[away * -.22, away * .5, away * -.4]}>
    <Ribbon points={centre} width={.32} roll={.14} texture={fabric} opacity={alpha} />
    <Ribbon points={waist} width={.29} roll={.13} texture={fabric} opacity={alpha} />
    <Ribbon points={left} width={.28 - pull * .09} roll={.7} texture={fabric} opacity={alpha} />
    <Ribbon points={right} width={.28 - pull * .09} roll={-.75} texture={fabric} opacity={alpha} />
    <Ribbon points={tail} width={.29} roll={1.3} texture={fabric} opacity={alpha} />
    <Box size={[.31, .21, .25]} color={C.teal} position={[0, 1.25, .11]} radius={.065} opacity={alpha} />
    <Box size={[.042, .215, .255]} color={C.gold} metal position={[.04, 1.25, .11]} opacity={alpha} />
  </group>;
}

function GoldFrame({ width, depth, y = 0, opacity = 1 }) {
  return <group position={[0, y, 0]}>
    {[-1, 1].map((side) => <group key={side}><Box size={[width, .018, .018]} position={[0, 0, side * depth / 2]} color={C.gold} metal radius={.005} opacity={opacity} /><Box size={[.018, .018, depth]} position={[side * width / 2, 0, 0]} color={C.gold} metal radius={.005} opacity={opacity} /></group>)}
  </group>;
}

function GiftBox({ time, paper, fabric }) {
  const lift = enter(time, 4, 1.5), recede = enter(time, 5.7, 2), settle = enter(time, 14.4, 1.3);
  const lidOpacity = 1 - enter(time, 6.2, 1.3) * .62;
  return <group position={[0, -.05 + settle * -.12, 0]}>
    <Box size={[3.35, .16, 2.66]} position={[0, .08, 0]} color={C.edge} texture={paper} radius={.04} />
    <Box size={[3.20, .04, 2.50]} position={[0, .17, 0]} color={C.teal} texture={fabric} radius={.008} />
    {[-1, 1].map((side) => <group key={side}>
      <Box size={[3.35, .82, .115]} position={[0, .54, side * 1.275]} texture={paper} />
      <Box size={[.115, .82, 2.55]} position={[side * 1.62, .54, 0]} texture={paper} />
      <Box size={[3.16, .42, .015]} position={[0, .67, side * 1.211]} color="#d6dfca" texture={paper} radius={.003} />
    </group>)}
    <GoldFrame width={3.33} depth={2.65} y={.94} />
    <GoldFrame width={3.33} depth={2.65} y={.19} />
    {/* A closed lid lifts as a separate solid object, then rests behind the book. */}
    <group position={[recede * .14, 1.02 + lift * 1.55 - recede * 2.15, -recede * 1.9]} rotation={[-lift * .16 - recede * .65, recede * .12, recede * -.07]}>
      <Box size={[3.51, .19, 2.82]} texture={paper} radius={.05} opacity={lidOpacity} />
      <Box size={[3.18, .06, 2.49]} position={[0, -.11, 0]} color="#e4d7bc" texture={paper} radius={.015} opacity={lidOpacity} />
      <GoldFrame width={3.48} depth={2.79} y={.04} opacity={lidOpacity} />
      <GiftRibbon time={time} fabric={fabric} />
    </group>
  </group>;
}

function pageGeometry(width, depth, curl = .025) {
  const positions = [], uvs = [], indices = [], columns = 24, rows = 12;
  for (let col = 0; col <= columns; col++) for (let row = 0; row <= rows; row++) {
    const u = col / columns, v = row / rows;
    positions.push(u * width, Math.sin(u * Math.PI) * curl + u * u * curl * .32, (v - .5) * depth);
    uvs.push(u, v);
    if (col < columns && row < rows) { const a = col * (rows + 1) + row, b = a + rows + 1; indices.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function Page({ curl = .025, paper, ...props }) {
  const geometry = useMemo(() => pageGeometry(1.72, 2.22, curl), [curl]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} castShadow receiveShadow><Material color={C.paper} texture={paper} side={THREE.DoubleSide} /></mesh>;
}

function Leaf({ width = .20, length = .55, color = C.sage, paper, ...props }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.bezierCurveTo(-width, length * .35, -width * .6, length * .8, 0, length); shape.bezierCurveTo(width * .6, length * .8, width, length * .35, 0, 0);
    return new THREE.ExtrudeGeometry(shape, { depth: .016, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .005, bevelThickness: .005, curveSegments: 12 });
  }, [width, length]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} castShadow receiveShadow><Material color={color} texture={paper} /></mesh>;
}

function Palm({ paper, ...props }) {
  const trunk = useMemo(() => [V(0, 0, 0), V(.04, .55, 0), V(.02, 1.12, -.04)], []);
  return <group {...props}>
    <Tube points={trunk} radius={.026} color={C.gold} metal={false} />
    {[0, 1, 2, 3, 4, 5, 6].map((index) => {
      const angle = index / 7 * Math.PI * 2;
      return <group key={index} position={[.02, 1.1, -.04]} rotation={[.9, angle, .12]}><Leaf length={.65} width={.16} paper={paper} color={index % 2 ? C.teal : C.sage} rotation={[0, 0, -.18]} /><Tube points={[V(0, 0, .022), V(-.035, .3, .028), V(0, .62, .022)]} radius={.003} color="#d1c5a1" metal={false} /></group>;
    })}
    {[0, 1, 2, 3].map((index) => <mesh key={index} position={[0, .15 + index * .20, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.029, .0035, 5, 16]} /><Material color={C.edge} /></mesh>)}
  </group>;
}

function Terrace({ paper, unfold, ...props }) {
  const door = useMemo(() => {
    const shape = new THREE.Shape(); shape.moveTo(-.17, 0); shape.lineTo(.17, 0); shape.lineTo(.17, .31); shape.absarc(0, .31, .17, 0, Math.PI); shape.lineTo(-.17, 0);
    return new THREE.ExtrudeGeometry(shape, { depth: .022, bevelEnabled: false, curveSegments: 18 });
  }, []);
  useEffect(() => () => door.dispose(), [door]);
  return <group {...props}>
    <group rotation={[-Math.PI / 2 * (1 - unfold), 0, 0]}>
      <Box size={[1.05, .78, .10]} position={[0, .39, 0]} color="#e5d7b8" texture={paper} radius={.016} />
      <Box size={[1.08, .065, .19]} position={[0, .80, .025]} color={C.paper} texture={paper} radius={.012} />
      <mesh geometry={door} position={[.21, .02, .065]} castShadow><Material color={C.teal} /></mesh>
      <Box size={[.24, .30, .025]} position={[-.29, .49, .070]} color={C.teal} radius={.045} />
      <Box size={[.018, .29, .018]} position={[-.29, .49, .089]} color={C.gold} metal radius={.004} />
      <Box size={[.23, .018, .018]} position={[-.29, .49, .089]} color={C.gold} metal radius={.004} />
      <Box size={[.37, .045, .23]} position={[-.28, .28, .11]} color={C.paper} texture={paper} />
      {[-.43, -.28, -.13].map((x, index) => <Leaf key={index} position={[x, .29, .17]} width={.045} length={.17 + index * .025} rotation={[0, 0, (index - 1) * -.3]} paper={paper} />)}
      <Box size={[.42, .045, .25]} position={[.24, .025, .14]} color={C.paper} texture={paper} />
      <Box size={[.47, .035, .30]} position={[.24, -.014, .19]} color={C.edge} texture={paper} />
      {[0, 1, 2, 3, 4].map((index) => <Box key={index} size={[.035, .16, .035]} position={[-.44 + index * .22, .90, .075]} color={C.teal} radius={.006} />)}
      <Box size={[1.0, .035, .035]} position={[0, .99, .075]} color={C.teal} radius={.009} />
    </group>
  </group>;
}

function Castle({ paper, unfold, ...props }) {
  return <group {...props}>
    <group rotation={[0, 0, Math.PI / 2 * (1 - unfold)]}>
      <Box size={[.68, .57, .08]} position={[0, .285, 0]} color={C.sage} texture={paper} radius={.008} />
      {[-1, 1].map((side) => <group key={side} position={[side * .39, 0, .015]}>
        <Box size={[.22, .81, .12]} position={[0, .405, 0]} color={C.paper} texture={paper} radius={.009} />
        <mesh position={[0, .94, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[.18, .29, 4]} /><Material color={C.teal} texture={paper} /></mesh>
        <Box size={[.08, .18, .02]} position={[0, .61, .071]} color={C.teal} radius={.03} />
      </group>)}
      {[0, 1, 2, 3].map((index) => <Box key={index} size={[.11, .12, .08]} position={[-.28 + index * .19, .62, 0]} color={C.sage} texture={paper} radius={.005} />)}
      <Box size={[.17, .29, .025]} position={[0, .15, .055]} color={C.teal} radius={.055} />
      <Box size={[.035, .35, .035]} position={[.02, 1.0, -.01]} color={C.gold} metal />
      <mesh position={[.14, 1.12, -.01]} rotation={[0, 0, -.18]}><planeGeometry args={[.21, .13]} /><Material color={C.gold} side={THREE.DoubleSide} /></mesh>
    </group>
  </group>;
}

function PopUpWorld({ time, paper, open }) {
  const unfold = enter(time, 11.7, 2.1), palm = enter(time, 12.2, 1.7), castle = enter(time, 12.75, 1.6);
  const path = useMemo(() => [V(-1.45, .026, .58), V(-.55, .028, .4), V(.25, .029, .65), V(1.45, .03, .26)], []);
  return <group visible={open > .70} scale={[1, Math.max(.001, unfold), 1]}>
    <Box size={[3.23, .022, 1.83]} position={[0, .013, 0]} color="#d4ddc0" texture={paper} radius={.045} />
    <Tube points={path} radius={.055} color={C.paper} metal={false} />
    <Terrace position={[.82, .04, -.40]} paper={paper} unfold={unfold} rotation={[0, -.1, 0]} />
    <Castle position={[-.88, .04, -.48]} paper={paper} unfold={castle} scale={.83} rotation={[0, .12, 0]} />
    <Palm position={[1.36, .04, -.53]} paper={paper} scale={.72} rotation={[0, -.35, -.08 * (1 - palm)]} />
    <Palm position={[-1.45, .04, -.12]} paper={paper} scale={.57} rotation={[0, .55, .1]} />
    {[-1, 1].map((side) => <group key={side} position={[side * .66, .04, .64]} rotation={[0, side * .3, 0]}>
      {[0, 1, 2].map((index) => <Leaf key={index} width={.07} length={.29 + index * .07} rotation={[.1, 0, (index - 1) * .65]} paper={paper} color={index % 2 ? C.teal : C.sage} />)}
    </group>)}
    <mesh position={[.01, .06, .08]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.19, .023, 8, 40]} /><Material color={C.gold} metal /></mesh>
    <mesh position={[.01, .055, .08]}><cylinderGeometry args={[.17, .17, .018, 40]} /><Material color="#82b9ae" /></mesh>
    {Array.from({ length: 8 }, (_, index) => <mesh key={index} position={[Math.cos(index * 2.4) * 1.3, .08 + index % 3 * .018, .68 + Math.sin(index * 2.4) * .12]} rotation={[0, index, 0]}><sphereGeometry args={[.025, 12, 8]} /><Material color={index % 2 ? C.gold : C.paper} metal={index % 2 === 1} /></mesh>)}
  </group>;
}

function Book({ time, paper }) {
  const rise = enter(time, 6, 2.5), open = enter(time, 9, 2.7), settle = enter(time, 14.4, 1.5), opacity = enter(time, 6, .5);
  const fan = Math.sin(Math.PI * open) * .10;
  const coverArc = useMemo(() => Array.from({ length: 48 }, (_, index) => { const a = Math.PI * .08 + index / 47 * Math.PI * .84; return V(.87 + Math.cos(a) * .41, .073, -.02 + Math.sin(a) * .41); }), []);
  return <group position={[-.88 * (1 - open), .38 + rise * 1.50 - settle * .69, .1 - rise * .04]} rotation={[0, -.14 + open * .06, 0]} scale={.94} visible={opacity > .001}>
    <group position={[0, .035, 0]}>
      <Box size={[1.85, .12, 2.40]} position={[.925, 0, 0]} color={C.teal} texture={paper} opacity={opacity} />
      <Box size={[1.73, .14, 2.25]} position={[.872, .12, 0]} color={C.edge} texture={paper} opacity={opacity} radius={.01} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => <Box key={index} size={[1.727, .004, 2.24]} position={[.87, .06 + index * .017, .002]} color={index % 2 ? C.paper : '#d6cab2'} opacity={opacity} radius={.001} />)}
      <Page paper={paper} position={[.01, .203, 0]} curl={.035} />
      <group position={[.925, 0, 0]}><GoldFrame width={1.77} depth={2.32} y={-.01} opacity={opacity} /></group>
    </group>
    {/* The front cover and each leaf share a real spine hinge. */}
    <group position={[0, .257, 0]} rotation={[0, 0, open * Math.PI * .996]}>
      <Box size={[1.85, .125, 2.40]} position={[.925, 0, 0]} color={C.teal} texture={paper} opacity={opacity} />
      <Box size={[1.74, .016, 2.27]} position={[.91, -.073, 0]} color={C.paper} texture={paper} opacity={opacity} radius={.006} />
      <group position={[.925, .071, 0]}><GoldFrame width={1.62} depth={2.13} opacity={opacity} /></group>
      <Tube points={coverArc} radius={.012} opacity={opacity} />
      <mesh position={[.87, .082, -.03]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.13, 40]} /><Material color={C.gold} metal opacity={opacity} /></mesh>
      {[-1, 1].map((side) => <Box key={side} size={[.54, .014, .014]} position={[.87, .078, side * .69]} color={C.gold} metal opacity={opacity} radius={.003} />)}
    </group>
    {[0, 1, 2, 3, 4].map((index) => <group key={index} position={[0, .215 - index * .009, 0]} rotation={[0, 0, open * Math.PI * (.985 - index * .002) - fan * index * .10]}><Page paper={paper} curl={.025 + fan * (index + 1) * .15} /></group>)}
    <Box size={[.11, .25, 2.41]} position={[-.018, .11, 0]} color={C.teal} texture={paper} opacity={opacity} radius={.03} />
    <group position={[0, .29, 0]}><PopUpWorld time={time} paper={paper} open={open} /></group>
  </group>;
}

function Background({ time, paper, fabric }) {
  const motion = mix(time, 16, enter(time, 15.5, .5));
  const sweepL = useMemo(() => [V(-8, -.2, 8), V(-5.2, .35, 5), V(-5.4, 1.5, -.8), V(-6.3, 3.2, -4.7), V(-3.5, 5.6, -7)], []);
  const sweepR = useMemo(() => [V(8.0, -.1, 9), V(5.8, .1, 5), V(4.9, 1.6, .0), V(5.9, 3.9, -4.5), V(4.3, 6.5, -8)], []);
  const foreground = useMemo(() => [V(-9, -.1, 8.8), V(-3.8, .65, 10), V(.3, .12, 11.3), V(4.2, .7, 10.5), V(9, -.1, 8.4)], []);
  const foil = useMemo(() => Array.from({ length: 80 }, (_, index) => { const a = index / 79 * Math.PI; return V(Math.cos(a) * 6.6, .017, 5.7 + Math.sin(a) * 2.4); }), []);
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.018, 0]} receiveShadow><planeGeometry args={[240, 240]} /><Material color={C.cream} texture={paper} /></mesh>
    <Ribbon points={sweepL} position={[-2.5, 0, 0]} width={2.05} roll={.65} texture={fabric} rotation={[0, 0, Math.sin(motion * .24) * .007]} />
    <Ribbon points={sweepR} position={[2.5, 0, 0]} width={1.65} roll={-.5} texture={fabric} color="#b3bea1" rotation={[0, 0, Math.sin(motion * .22 + 1) * .009]} />
    <Ribbon points={foreground} width={2.4} roll={.6} texture={paper} color={C.teal} />
    <Tube points={foil} radius={.013} opacity={.55} />
    <group position={[0, -.03, -3.9]}>
      {[0, 1, 2].map((index) => <mesh key={index} position={[0, 3.3, -index * .14]} scale={[1, 1.14, .06]}><torusGeometry args={[5.4 + index * .22, index === 0 ? .025 : .052, 8, 100, Math.PI]} /><Material color={index === 0 ? C.gold : '#e4d8bf'} metal={index === 0} /></mesh>)}
    </group>
    {Array.from({ length: 16 }, (_, index) => {
      const side = index % 2 ? 1 : -1, x = side * (3.2 + index % 4 * .56), z = -3 + index % 5 * 1.7;
      return <mesh key={index} position={[x, .24 + (index % 3) * .2 + Math.sin(motion * .23 + index) * .025, z]} rotation={[.2, index, .4]} scale={[1, 1.5, .25]}><octahedronGeometry args={[.025, 0]} /><Material color={index % 4 ? C.paper : C.gold} metal={index % 4 === 0} opacity={.5} /></mesh>;
    })}
  </>;
}

function ReflectionEnvironment() {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const room = new RoomEnvironment(), generator = new THREE.PMREMGenerator(gl), map = generator.fromScene(room, .03);
    scene.environment = map.texture; scene.environmentIntensity = .55;
    return () => { scene.environment = null; map.dispose(); generator.dispose(); room.dispose(); };
  }, [gl, scene]);
  return null;
}

// Screen fitting follows the physical cover as it rises on its spine. The
// camera moves back and reframes; the book never sinks into the gift box.
function Camera({ time }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const rise = enter(time, 6, 2.5), open = enter(time, 9, 2.7), settle = enter(time, 14.4, 1.5);
    const cameraRise = enter(time, 5.7, 3), arc = Math.sin(Math.PI * clamp((time - 8) / 7)) * .4;
    const offset = 30 + cameraRise * 15 - settle * 10;
    camera.position.set(3.0 - cameraRise * 1.4 + arc, 10.3 + open * .5, 22.0 + open * .3);
    camera.up.set(0, 1, 0); camera.zoom = 1.03 - open * .025;
    camera.setViewOffset(1080, 1920, 0, offset, 1080, 1920);
    camera.lookAt(0, .35 + cameraRise * .30 - settle * .12, 0);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);

    const root = new THREE.Object3D(); root.rotation.y = -.09;
    const points = [];
    const addBounds = (parent, min, max) => {
      for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
        points.push({ parent, point: V(x, y, z) });
      }
    };
    addBounds(root, [-1.70, -.05 - settle * .12, -1.34], [1.70, .93 - settle * .12, 1.34]);
    if (time < 4.15) {
      const pull = enter(time, 1, 2.8), release = enter(time, 3.45, .7);
      addBounds(root, [-1.75, .1, -1.4], [mix(1.75 + pull * .8, 1.70, release), mix(1.72 + pull * .55, .93, release), mix(1.45, 1.34, release)]);
    }
    const lid = new THREE.Object3D(), lift = enter(time, 4, 1.5), recede = enter(time, 5.7, 2);
    lid.position.set(recede * .14, .97 + lift * 1.55 - recede * 2.15 - settle * .12, -recede * 1.9);
    lid.rotation.set(-lift * .16 - recede * .65, recede * .12, recede * -.07); root.add(lid);
    addBounds(lid, [-1.76, -.16, -1.42], [1.76, .11, 1.42]);
    if (time >= 6) {
      const book = new THREE.Object3D();
      book.position.set(-.88 * (1 - open), .38 + rise * 1.50 - settle * .69, .1 - rise * .04);
      book.rotation.y = -.14 + open * .06; book.scale.setScalar(.94); root.add(book);
      addBounds(book, [-.08, -.05, -1.21], [1.86, .30, 1.21]);
      const cover = new THREE.Object3D(); cover.position.y = .257; cover.rotation.z = open * Math.PI * .996; book.add(cover);
      addBounds(cover, [0, -.08, -1.21], [1.86, .08, 1.21]);
      if (time >= 11.7) addBounds(book, [-1.7, .29, -1.08], [1.72, .29 + enter(time, 11.7, 2.1) * 1.12, .96]);
    }
    root.updateMatrixWorld(true);
    const screenBounds = () => {
      const projected = points.map(({ parent, point }) => point.clone().applyMatrix4(parent.matrixWorld).project(camera));
      const xs = projected.map(p => (p.x + 1) * 540), ys = projected.map(p => (1 - p.y) * 960);
      return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
    };
    const bounds = screenBounds();
    const fit = Math.min(1, 660 / (bounds.right - bounds.left), 370 / (bounds.bottom - bounds.top));
    camera.zoom *= fit; camera.updateProjectionMatrix();
    const fitted = screenBounds();
    camera.setViewOffset(1080, 1920, (fitted.left + fitted.right) / 2 - 540,
      offset + (fitted.top + fitted.bottom) / 2 - 895, 1080, 1920);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  }, [camera, time]);
  return null;
}

function FrameCommit({ frame }) {
  const { scene, camera, gl } = useThree();
  useEffect(() => { scene.updateMatrixWorld(true); camera.updateMatrixWorld(true); gl.render(scene, camera); }, [scene, camera, gl, frame]);
  return null;
}

function GiftWorld({ time, frame, paper, fabric }) {
  const holdTime = mix(time, 16, enter(time, 15.5, .5));
  return <>
    <color attach="background" args={[C.cream]} /><fog attach="fog" args={[C.cream, 38, 85]} />
    <ReflectionEnvironment /><Camera time={holdTime} />
    <ambientLight intensity={.38} color="#fff8ec" /><hemisphereLight args={['#fff8ed', '#9fa98a', .72]} />
    <directionalLight position={[-6.2, 10.5, 7.0]} color="#fff6e5" intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={4}
      shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={.1} shadow-camera-far={38} shadow-bias={-.0002} shadow-normalBias={.015} />
    <directionalLight position={[6, 7, -4]} color="#e5ebda" intensity={1.1} />
    <Background time={holdTime} paper={paper} fabric={fabric} />
    <group rotation={[0, -.09, 0]}>
      <GiftBox time={holdTime} paper={paper} fabric={fabric} /><Book time={holdTime} paper={paper} />
    </group>
    <pointLight position={[0, 2.2, .1]} color="#ffe6b5" intensity={enter(time, 11.5, 2) * .38} distance={4} decay={2} />
    <FrameCommit frame={frame} />
  </>;
}

export function R23Scene({ stillFrame }) {
  const currentFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frame = stillFrame ?? currentFrame, time = frame / (stillFrame === undefined ? fps : 30);
  const paper = useMemo(() => paperTexture(), []), fabric = useMemo(() => paperTexture(true), []);
  useEffect(() => () => { paper.dispose(); fabric.dispose(); }, [paper, fabric]);
  return <ThreeCanvas name="A gift opens an original paper world" showInTimeline width={width} height={height} frameloop="never" dpr={1}
    style={{ position: 'absolute', inset: 0, background: C.cream }} camera={{ fov: 35, near: .1, far: 160, position: [3, 10.3, 22] }}
    shadows={{ type: THREE.PCFShadowMap }} gl={{ antialias: true, alpha: false, toneMapping: THREE.NeutralToneMapping }}>
    <GiftWorld time={time} frame={frame} paper={paper} fabric={fabric} />
  </ThreeCanvas>;
}
