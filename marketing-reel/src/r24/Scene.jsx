import { useEffect, useLayoutEffect, useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const P = { teal: '#267a70', deep: '#0d3735', cream: '#fff3d5', gold: '#d4af66', sage: '#a6bd91', mint: '#d3dfb9', brass: '#9a7536' };
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const enter = (t, at, d = 0.7) => ease((t - at) / d);

function Material({ color = P.cream, metal = 0, opacity = 1, glow = 0 }) {
  return <meshPhysicalMaterial color={color} metalness={metal} roughness={metal ? 0.26 : 0.85} clearcoat={metal ? 0.5 : 0.08}
    transparent={opacity < 1} opacity={opacity} depthWrite={opacity > 0.95} emissive={color} emissiveIntensity={glow} side={THREE.DoubleSide} />;
}

function Line({ points, color = P.gold, radius = 0.009, opacity = 1, metal = 0, ...props }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 44, radius, 7, false), [points, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} castShadow><Material color={color} metal={metal} opacity={opacity} /></mesh>;
}

function Star({ radius = 0.15, ...props }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    for (let n = 0; n < 10; n++) {
      const a = n * Math.PI / 5 + Math.PI / 2, r = n % 2 ? radius * 0.42 : radius;
      if (!n) s.moveTo(Math.cos(a) * r, Math.sin(a) * r); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath(); return s;
  }, [radius]);
  return <mesh {...props} castShadow><extrudeGeometry args={[shape, { depth: 0.026, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.014, bevelSegments: 2 }]} /><Material color={P.gold} metal={0.55} /></mesh>;
}

function Leaf({ width = 0.22, height = 0.55, color = P.sage, ...props }) {
  const geometry = useMemo(() => {
    const vertices = [], indices = [];
    for (let row = 0; row <= 16; row++) {
      const v = row / 16, half = Math.sin(v * Math.PI) ** 0.8 * width / 2;
      for (let col = 0; col < 3; col++) vertices.push((col - 1) * half, v * height, (col === 1 ? 0 : 0.065) * Math.sin(v * Math.PI));
      if (row < 16) for (let col = 0; col < 2; col++) {
        const a = row * 3 + col; indices.push(a, a + 1, a + 3, a + 1, a + 4, a + 3);
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
  }, [width, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props} geometry={geometry} castShadow receiveShadow><Material color={color} /></mesh>;
}

function Compass({ time }) {
  const out = 1 - enter(time, 2.9, 1.1), reveal = 0.92 + enter(time, 0, 0.7) * 0.08;
  const needle = Math.PI * 4 * enter(time, 0.55, 2.3) - Math.PI / 2;
  return <group visible={out > 0.001} position={[0, 0.42 - (1 - out) * 0.3, 0]} scale={Math.max(0.001, out * reveal)} rotation={[0.06, time * 0.07, 0]}>
    <mesh castShadow receiveShadow><cylinderGeometry args={[1.19, 1.23, 0.14, 96]} /><Material color={P.brass} metal={0.65} /></mesh>
    <mesh position={[0, 0.079, 0]} receiveShadow><cylinderGeometry args={[1.10, 1.10, 0.025, 96]} /><Material color={P.cream} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}><torusGeometry args={[1.085, 0.024, 10, 96]} /><Material color={P.gold} metal={0.7} /></mesh>
    {Array.from({ length: 32 }, (_, n) => {
      const a = n / 32 * Math.PI * 2;
      return <mesh key={n} position={[Math.cos(a) * 0.96, 0.104, Math.sin(a) * 0.96]} rotation={[0, -a, 0]}><boxGeometry args={[n % 4 ? 0.065 : 0.14, 0.008, 0.013]} /><Material color={n % 4 ? P.brass : P.teal} /></mesh>;
    })}
    {[0, 1, 2, 3].map((n) => <Star key={n} radius={0.12} position={[Math.cos(n * Math.PI / 2) * 0.7, 0.112, Math.sin(n * Math.PI / 2) * 0.7]} rotation={[-Math.PI / 2, 0, n * Math.PI / 2]} />)}
    <group rotation={[0, needle, 0]} position={[0, 0.15, 0]}>
      <mesh position={[0, 0, -0.3]} rotation={[Math.PI, 0, Math.PI / 4]} scale={[0.19, 0.055, 0.68]}><octahedronGeometry args={[1, 0]} /><Material color={P.teal} metal={0.35} /></mesh>
      <mesh position={[0, 0, 0.3]} rotation={[0, 0, Math.PI / 4]} scale={[0.19, 0.055, 0.68]}><octahedronGeometry args={[1, 0]} /><Material color={P.gold} metal={0.6} /></mesh>
    </group>
    <mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.09, 24, 16]} /><Material color={P.gold} metal={0.75} /></mesh>
    <mesh position={[0, 0, -1.35]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.18, 0.036, 12, 40]} /><Material color={P.gold} metal={0.8} /></mesh>
  </group>;
}

function SailBoat({ time }) {
  const hull = useMemo(() => {
    const s = new THREE.Shape();s.moveTo(-0.4, 0.01);s.quadraticCurveTo(-0.33,-0.23,-0.08,-0.23);s.lineTo(0.2,-0.23);s.quadraticCurveTo(0.36,-0.18,0.44,0.01);s.closePath();return s;
  }, []);
  const sail = useMemo(() => {const s=new THREE.Shape();s.moveTo(-0.015,0);s.lineTo(-0.015,0.71);s.quadraticCurveTo(-0.24,0.47,-0.32,0.04);s.closePath();return s;},[]);
  const sailSmall = useMemo(() => {const s=new THREE.Shape();s.moveTo(0.035,0.04);s.lineTo(0.035,0.57);s.lineTo(0.31,0.04);s.closePath();return s;},[]);
  return <group position={[Math.sin(time * 0.7) * 0.08, 0.31 + Math.sin(time * 1.5) * 0.025, 0.13]} rotation={[0, 0.16 + Math.sin(time * 0.6) * 0.07, Math.sin(time * 1.2) * 0.035]}>
    <mesh position={[0, 0.04, -0.09]} castShadow><extrudeGeometry args={[hull,{depth:0.18,bevelEnabled:true,bevelSize:0.022,bevelThickness:0.02,bevelSegments:2}]} /><Material color={P.cream} /></mesh>
    <mesh position={[0,0.48,0.02]} castShadow><cylinderGeometry args={[0.012,0.014,0.91,12]} /><Material color={P.gold} metal={0.5} /></mesh>
    <mesh position={[0,0.13,0.025]} castShadow><extrudeGeometry args={[sail,{depth:0.012,bevelEnabled:false}]} /><Material color={P.gold} /></mesh>
    <mesh position={[0,0.13,0.027]} castShadow><extrudeGeometry args={[sailSmall,{depth:0.012,bevelEnabled:false}]} /><Material color={P.mint} /></mesh>
    <Star radius={0.052} position={[0,0.99,0.02]} />
  </group>;
}

function Sea({ time }) {
  return <>
    <mesh position={[0,0.13,0]} receiveShadow><cylinderGeometry args={[0.59,0.59,0.024,64]} /><Material color={P.teal} /></mesh>
    {[0,1,2].map((n) => <Line key={n} points={Array.from({length:15},(_,i)=>{
      const x=(i/14-0.5)*0.95;return new THREE.Vector3(x,0.16+Math.sin(i*0.6+time*1.25+n)*0.008,(n-1)*0.24+Math.sin(i*0.6+time*0.9)*0.035);
    })} color={n%2?P.mint:P.cream} radius={0.019} opacity={0.65} />)}
    <SailBoat time={time} />
  </>;
}

function Tree({ time, ...props }) {
  return <group {...props} rotation={[0,0,Math.sin(time*0.6)*0.016]}>
    <mesh position={[0,0.44,0]} castShadow><cylinderGeometry args={[0.026,0.041,0.86,12]} /><Material color={P.brass} /></mesh>
    {[0,1,2].map(n=><group key={n} position={[0,0.25+n*0.22,0]}>
      <Leaf width={0.32-n*0.03} height={0.56-n*0.05} color={n%2?P.mint:P.teal} rotation={[0.05,-0.15,-0.84]} />
      <Leaf width={0.29-n*0.03} height={0.51-n*0.04} color={n%2?P.sage:P.mint} rotation={[0.08,0.08,0.87]} />
    </group>)}
    <Leaf position={[0,0.7,0]} width={0.22} height={0.46} color={P.teal} />
  </group>;
}

function Forest({ time }) {
  const path=useMemo(()=>[new THREE.Vector3(0.12,0.153,0.5),new THREE.Vector3(-0.09,0.153,0.15),new THREE.Vector3(0.1,0.153,-0.21),new THREE.Vector3(0,0.153,-0.48)],[]);
  return <>
    <mesh position={[0,0.13,0]} receiveShadow><cylinderGeometry args={[0.59,0.59,0.024,64]} /><Material color={P.sage} /></mesh>
    <Line points={path} color={P.cream} radius={0.052} />
    <Tree time={time} position={[-0.2,0.15,-0.12]} scale={0.82} />
    <Tree time={time+1} position={[0.27,0.15,-0.27]} scale={0.64} />
    <group position={[0.28+Math.sin(time*0.75)*0.12,0.85+Math.cos(time*1.2)*0.07,0.24]}>
      {[-1,1].map(side=><mesh key={side} position={[side*0.045,0,0]} rotation={[0,side*(0.5+Math.sin(time*6)*0.25),side*-0.4]} scale={[1,1.2,0.1]}><sphereGeometry args={[0.065,16,10]} /><Material color={P.gold} /></mesh>)}
    </group>
  </>;
}

function Space({ time }) {
  const bob = Math.sin(time*1.2)*0.035;
  return <>
    <mesh position={[0,0.13,0]} receiveShadow><cylinderGeometry args={[0.59,0.59,0.024,64]} /><Material color={P.mint} /></mesh>
    {[[-0.31,0.26],[0.35,-0.22],[-0.16,-0.3]].map(([x,z],i)=><mesh key={i} position={[x,0.15,z]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[0.058+i*0.012,0.012,8,24]} /><Material color={P.sage} /></mesh>)}
    <group position={[-0.07,0.45+bob,0.12]} rotation={[0,0.2,-0.17]}>
      <mesh castShadow receiveShadow><cylinderGeometry args={[0.12,0.14,0.53,40]} /><Material color={P.cream} metal={0.18} /></mesh>
      <mesh position={[0,0.365,0]} castShadow><coneGeometry args={[0.122,0.2,40]} /><Material color={P.gold} metal={0.6} /></mesh>
      <mesh position={[0,-0.29,0]}><cylinderGeometry args={[0.11,0.08,0.07,24]} /><Material color={P.brass} metal={0.7} /></mesh>
      <mesh position={[0,0.075,0.13]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.065,0.015,12,32]} /><Material color={P.gold} metal={0.75} /></mesh>
      <mesh position={[0,0.075,0.138]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.05,0.05,0.012,32]} /><Material color={P.teal} metal={0.1} /></mesh>
      {[-1,1].map(side=><mesh key={side} position={[side*0.14,-0.18,0]} rotation={[0,0,side*-0.32]} scale={[0.09,0.18,0.06]} castShadow><octahedronGeometry args={[1,0]} /><Material color={P.teal} /></mesh>)}
    </group>
    <group position={[0.33,0.89,-0.12]} rotation={[0.2,time*0.08,-0.32]}>
      <mesh><sphereGeometry args={[0.16,28,20]} /><Material color={P.gold} metal={0.25} /></mesh>
      <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.26,0.022,10,48]} /><Material color={P.cream} metal={0.15} /></mesh>
    </group>
    <Star radius={0.064} position={[-0.39,1.05+Math.sin(time)*0.025,0]} rotation={[0,0,time*0.08]} />
  </>;
}

function Island({ index, time }) {
  const at=3.2+index*2, shown=enter(time,at,0.85), x=[1.55,0,-1.55][index];
  const move=enter(time,at,0.9), turn=(1-move)*(index%2?-0.45:0.45);
  const select=enter(time,9+index*0.8,0.3)*(1-enter(time,9.6+index*0.8,0.4));
  return <group visible={shown>0.001} position={[x*move,-0.13+(1-move)*0.5+select*0.1,0]} scale={Math.max(0.001,shown)} rotation={[0,turn,0]}>
    <mesh castShadow receiveShadow><cylinderGeometry args={[0.64,0.65,0.18,72]} /><Material color={P.cream} /></mesh>
    <mesh position={[0,0.05,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[0.635,0.018,9,72]} /><Material color={P.gold} metal={0.6} glow={select*0.3} /></mesh>
    {index===0?<Sea time={time}/>:index===1?<Forest time={time}/>:<Space time={time}/>}
  </group>;
}

function CameraAndPaint({ time, frame }) {
  const {camera,scene,gl}=useThree();
  useLayoutEffect(()=>{
    const arc=enter(time,8.6,0.5)*(1-enter(time,10.9,1));
    camera.position.set(Math.sin((time-8.6)*1.6)*arc*0.42,5.4,19.8);
    camera.lookAt(0,0.3,0);camera.setViewOffset(1080,1920,0,38,1080,1920);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  },[camera,time]);
  useEffect(()=>{scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);gl.render(scene,camera);},[scene,camera,gl,frame]);
  return null;
}

function Reflections() {
  const {gl,scene}=useThree();
  useLayoutEffect(()=>{const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(gl),map=pmrem.fromScene(room,0.04);scene.environment=map.texture;scene.environmentIntensity=0.55;return()=>{scene.environment=null;map.dispose();room.dispose();pmrem.dispose();};},[gl,scene]);
  return null;
}

export function R24Scene({stillFrame}) {
  const current=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const frame=stillFrame??current,time=frame/(stillFrame===undefined?fps:30);
  return <ThreeCanvas name="3D · a compass and three possible worlds" showInTimeline width={width} height={height} frameloop="never" dpr={1}
    style={{position:'absolute',inset:0}} camera={{fov:34,near:0.1,far:100,position:[0,5.4,19.8]}}
    gl={{alpha:true,antialias:true,toneMapping:THREE.NeutralToneMapping}} shadows={{type:THREE.PCFShadowMap}}>
    <ambientLight color="#fff0d2" intensity={0.5}/>
    <hemisphereLight args={['#fff4df','#173b34',1.1]}/>
    <directionalLight position={[-5,9,7]} intensity={2.5} color="#fff6df" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-bias={-0.0002}/>
    <directionalLight position={[5,3,-4]} intensity={1} color="#c3d7ba"/>
    <Reflections/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.235,0]} receiveShadow><planeGeometry args={[50,50]}/><shadowMaterial transparent opacity={0.3}/></mesh>
    <Compass time={time}/>
    <Island index={0} time={time}/><Island index={1} time={time}/><Island index={2} time={time}/>
    <CameraAndPaint time={time} frame={frame}/>
  </ThreeCanvas>;
}
