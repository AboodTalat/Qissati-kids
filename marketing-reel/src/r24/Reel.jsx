import { Fragment } from 'react';
import { Audio } from '@remotion/media';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { R24Scene } from './Scene';
import { brand } from '../brand';

const C={cream:'#fff3d5',gold:'#d4af66',deep:'#0d3735',teal:'#146466'};
const enter=(t,at,d=0.5)=>{const x=Math.max(0,Math.min(1,(t-at)/d));return x*x*(3-2*x);};

function Backdrop({time}) {
  return <svg viewBox="0 0 1080 1920" width="1080" height="1920" style={{position:'absolute',inset:0}} aria-hidden="true">
    <defs>
      <radialGradient id="r24-room" cx="45%" cy="36%" r="75%"><stop stopColor="#32665b"/><stop offset=".55" stopColor="#194e47"/><stop offset="1" stopColor="#082e2d"/></radialGradient>
      <linearGradient id="r24-fold" x1="0" x2="1"><stop stopColor="#183c35"/><stop offset=".5" stopColor="#295747"/><stop offset="1" stopColor="#0e352f"/></linearGradient>
      <filter id="r24-shadow"><feDropShadow dx="0" dy="13" stdDeviation="16" floodColor="#001e1d" floodOpacity=".45"/></filter>
    </defs>
    <rect width="1080" height="1920" fill="url(#r24-room)"/>
    {[810,930,1040].map((r,i)=><circle key={r} cx="540" cy="940" r={r} fill="none" stroke={C.gold} strokeWidth={i?1:2} opacity={0.1-i*0.025} transform={`rotate(${Math.sin(time*0.14)*1.4} 540 940)`}/>)}
    {Array.from({length:26},(_,i)=>{const a=i/26*Math.PI*2;return <path key={i} d={`M${540+Math.cos(a)*795} ${940+Math.sin(a)*795}l${Math.cos(a)*24} ${Math.sin(a)*24}`} stroke={C.gold} strokeWidth="2" opacity=".25"/>;})}
    <g opacity=".15" fill={C.cream}>
      {Array.from({length:33},(_,i)=>{const x=40+(i*193.37)%1000,y=140+(i*297.21)%1600;return <circle key={i} cx={x} cy={y+Math.sin(time*0.28+i)*5} r={i%4?1:2.3}/>;})}
    </g>
    <g filter="url(#r24-shadow)" transform={`translate(0 ${Math.sin(time*0.2)*5})`}>
      <path d="M-90 1440Q210 1330 470 1470T1180 1440V1940H-90Z" fill="#53725a"/>
      <path d="M-90 1450Q210 1340 470 1480T1180 1450" fill="none" stroke={C.gold} opacity=".55"/>
      <path d="M-90 1560Q170 1430 570 1570T1180 1540V1940H-90Z" fill="url(#r24-fold)"/>
      <path d="M-90 1560Q170 1430 570 1570T1180 1540" fill="none" stroke={C.gold} opacity=".45"/>
      <path d="M-90 1710Q250 1540 650 1730T1180 1650V1940H-90Z" fill="#0b322d"/>
    </g>
    {[-1,1].map(side=><g key={side} transform={`translate(${side<0?45:1035} 1550) rotate(${side*17+Math.sin(time*0.3)*0.7})`}>
      <path d="M0 260Q-30 80 0-140" stroke={C.gold} strokeWidth="4" fill="none" opacity=".7"/>
      {[-1,1].map(s=>[0,1,2].map(i=><g key={`${s}-${i}`} transform={`translate(0 ${150-i*95}) rotate(${s*50})`}><path d="M0 0Q-60-65 0-140Q60-65 0 0" fill={i%2?'#456950':'#6c8361'}/><path d="M0 0V-140" stroke={C.gold} opacity=".2"/></g>))}
    </g>)}
  </svg>;
}

function Words({text,time,immediate=false,size=84}) {
  let n=0;
  return <div dir="rtl" lang="ar" style={{fontSize:size,fontWeight:800,lineHeight:1.42,color:C.cream,textAlign:'center'}}>{text.split('\n').map((line,row)=><div key={row} style={{whiteSpace:'nowrap'}}>{line.split(' ').map((word,i,words)=>{const p=immediate?1:enter(time,n++*.07,.4);return <Fragment key={i}><span data-r24-word style={{display:'inline-block',opacity:p,translate:`0 ${(1-p)*14}px`}}>{word}</span>{i<words.length-1?' ':''}</Fragment>;})}</div>)}</div>;
}

function Mark(){return <div data-r24-essential="logo" dir="rtl" style={{position:'absolute',left:370,top:316,width:340,height:80,display:'flex',justifyContent:'center',alignItems:'center',gap:18}}><div style={{width:75,height:74,padding:6,borderRadius:9,background:C.cream}}><Img src={staticFile('brand/logo.png')} style={{width:'100%',height:'100%',objectFit:'contain'}}/></div><span style={{color:C.cream,fontSize:46,fontWeight:850}}>قصتي</span></div>;}

function Title({text,immediate=false,size=84}){const frame=useCurrentFrame(),{fps}=useVideoConfig();return <div data-r24-essential="headline" style={{position:'absolute',left:200,top:442,width:680}}><Words text={text} time={frame/fps} size={size} immediate={immediate}/><div style={{width:105,height:2,background:C.gold,margin:'17px auto 0',opacity:.7}}/></div>;}

function Labels({time,cover=false}){return <div data-r24-essential="world-labels" dir="rtl" lang="ar" style={{position:'absolute',left:210,top:1072,width:660,display:'flex',justifyContent:'space-around',gap:22}}>{[{text:'بحر',at:3.2},{text:'غابة',at:5.2},{text:'فضاء',at:7.2}].map(world=><div key={world.text} style={{width:180,textAlign:'center',fontSize:44,fontWeight:750,color:C.cream,opacity:cover?1:enter(time,world.at,.6)}}>{world.text}</div>)}</div>;}

export function R24Reel({music=true,sfx=true,safeAreaPreview=false}){
  const frame=useCurrentFrame(),{fps,durationInFrames}=useVideoConfig(),time=frame/fps;
  return <AbsoluteFill data-r24-canvas style={{background:C.deep,fontFamily:'Cairo',overflow:'hidden'}}>
    <Backdrop time={time}/><Sequence name="3D · compass → sea · forest · space" durationInFrames={durationInFrames} premountFor={fps}><R24Scene/></Sequence><Mark/>
    <Sequence name="Hook · لو الحكاية بإيدكم" durationInFrames={3*fps} premountFor={fps} layout="none"><Title text={'لو الحكاية\nبإيدكم…'} immediate size={86}/></Sequence>
    <Sequence name="Three worlds · بحر غابة فضاء" from={3*fps} durationInFrames={9*fps} premountFor={fps} layout="none"><Title text={'بحر؟ غابة؟\nولا فضاء؟'} size={82}/></Sequence>
    <Sequence name="Choice · اختاروا المغامرة" from={12*fps} durationInFrames={8*fps} premountFor={fps} layout="none"><Title text="اختاروا المغامرة" size={73} immediate/></Sequence>
    <div data-r24-essential="question" dir="rtl" lang="ar" style={{position:'absolute',left:210,top:638,width:660,color:C.gold,textAlign:'center',fontSize:40,fontWeight:600,opacity:enter(time,12.3,.5)}}>إنتو وين بتودّوها؟</div>
    <Labels time={time}/>
    <div data-r24-essential="comment" dir="rtl" lang="ar" style={{position:'absolute',left:210,top:1162,width:660,textAlign:'center',color:C.cream,fontSize:44,fontWeight:600,lineHeight:1.5,opacity:enter(time,15.5,.5)}}>اكتبوا: بحر، غابة، أو فضاء</div>
    {music&&<Audio name="Music · original compass adventure score" src={staticFile('r24/music.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={.85}/>}
    {sfx&&<Audio name="SFX · compass · waves · leaves · star chimes" src={staticFile('r24/sfx.wav')} durationInFrames={durationInFrames} premountFor={fps} volume={.92}/>}
    {safeAreaPreview&&<div style={{position:'absolute',left:180,top:300,width:720,height:930,border:'2px dashed #d4af66',pointerEvents:'none'}}/>}
  </AbsoluteFill>;
}

export function R24Cover(){return <AbsoluteFill style={{background:C.deep,fontFamily:'Cairo',overflow:'hidden'}}><Backdrop time={13}/><R24Scene stillFrame={390}/><Mark/><div data-r24-essential="cover-hook" style={{position:'absolute',left:200,top:442,width:680}}><Words text={'وين بتودّوا\nالحكاية؟'} time={1} size={88} immediate/></div><Labels time={13} cover/><div dir="ltr" style={{position:'absolute',left:240,top:1180,width:600,color:C.gold,fontSize:27,textAlign:'center'}}>{brand.instagram}</div></AbsoluteFill>;}
