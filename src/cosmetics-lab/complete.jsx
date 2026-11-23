import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { characters } from './fitting-data';
import FittingAvatar from './FittingAvatar';
import pudding from './assets/complete-skins/pudding-royal.png';
import muscle from './assets/complete-skins/muscle-royal.png';
import volcano from './assets/complete-skins/volcano-royal.png';
import geometry from './assets/complete-skins/geometry.json';
import './complete.css';

const skins = [
  {key:'pudding',id:6,image:pudding,title:'낮고 넓은 푸딩',description:'몸 양옆을 감싸며 내려오는 망토. 길어진 몸통을 한 차례 낮춰 다듬었어요.'},
  {key:'muscle',id:10,image:muscle,title:'팔이 있는 근육똥',description:'두 팔을 드러내고, 어깨 뒤에서 팔 아래로 망토가 이어져요.'},
  {key:'volcano',id:13,image:volcano,title:'연기가 있는 화산똥',description:'분화구를 감싸는 열린 왕관. 가운데로 연기가 올라가요.'},
];
function CompleteSprite({skin}) {
  const geo=geometry[skin.key], [left,top,right,bottom]=geo.bounds;
  const w=right-left,h=bottom-top,scale=Math.min(354/w,286/h);
  // Fit the full costume without stretching and align its bottom in each card.
  return <svg className="complete-sprite" viewBox="0 0 400 350" role="img" aria-label={`${characters[skin.id].name} 완성형 왕관 망토 의상`}><svg x={(400-w*scale)/2} y={310-h*scale} width={w*scale} height={h*scale} viewBox={`${left} ${top} ${w} ${h}`} overflow="visible"><image href={skin.image} width={geo.width} height={geo.height}/></svg></svg>;
}
function Comparison({skin,dark,onClose}) {
  const ref=useRef(null);
  useEffect(()=>{ref.current.showModal();return()=>ref.current?.close();},[]);
  const character=characters[skin.id];
  return <dialog ref={ref} className={`complete-dialog ${dark?'is-dark':''}`} onCancel={onClose} onClick={event=>{if(event.target===ref.current)onClose();}}><header><div><p className="complete-eyebrow">BEFORE / AFTER</p><h2>{character.name}</h2></div><button autoFocus onClick={onClose}>닫기 ×</button></header><div className="before-after"><figure><FittingAvatar character={character} costume="royal" mode="original"/><figcaption>기본 모습</figcaption></figure><figure><FittingAvatar character={character} costume="royal" mode="fitted"/><figcaption>조립 의상 · 체형 보정</figcaption></figure><figure className="new-skin"><CompleteSprite skin={skin}/><figcaption>새 완성형 의상</figcaption></figure></div><p className="dialog-note">{skin.description}</p><p className="comparison-limit">각 그림 전체가 보이도록 맞춘 비교입니다. 원본과의 픽셀 단위 일치 검사는 아닙니다.</p></dialog>;
}
function CompleteSkins() {
  const [dark,setDark]=useState(false),[moving,setMoving]=useState(false),[small,setSmall]=useState(false),[selected,setSelected]=useState(null);
  return <main className="complete-lab">
    <header className="complete-header"><div><p className="complete-eyebrow">ROYAL COLLECTION / 3 CHARACTERS</p><h1>이번엔, 제대로 입었어요.</h1><p>같은 왕관과 망토를 세 체형에 맞춰 통째로 그렸어요.</p></div><a href="/cosmetics-fitting.html">20종 피팅으로 ↗</a></header>
    <div className="complete-toolbar"><span>완성형 스킨 · 첫 비교</span><div><button aria-pressed={dark} onClick={()=>setDark(!dark)}>어두운 배경</button><button aria-pressed={small} onClick={()=>setSmall(!small)}>작게 보기</button><button aria-pressed={moving} onClick={()=>setMoving(!moving)}>움직임</button></div></div>
    <section className={`complete-grid ${dark?'is-dark':''} ${small?'is-small':''}`} aria-label="완성형 의상 3종">{skins.map((skin,i)=><article key={skin.key}><div className="skin-title"><span>0{i+1}</span><h2>{characters[skin.id].name}</h2></div><div className="complete-stage"><div className={moving?'complete-moving':''}><CompleteSprite skin={skin}/></div></div><div className="skin-info"><h3>{skin.title}</h3><p>{skin.description}</p><button onClick={()=>setSelected(skin)} aria-label={`${characters[skin.id].name} 조립 방식과 비교`}>조립 방식과 비교 <span>↗</span></button><a href={skin.image} download={`${skin.key}-royal.png`}>투명 PNG 받기 ↓</a></div></article>)}</section>
    <div className="complete-note"><strong>이번에 볼 것</strong><p>망토가 옷처럼 보이는지, 얼굴과 고유 특징이 유지되는지, 작아져도 의상이 읽히는지 비교해주세요.</p><small>디자인 후보 3종 · 본 게임 미적용 · 원본과 세부 선·얼굴·비율에는 차이가 있어요.</small></div>
    {selected&&<Comparison skin={selected} dark={dark} onClose={()=>setSelected(null)}/>}
  </main>;
}
const root=import.meta.hot?.data.root??createRoot(document.getElementById('root'));
if(import.meta.hot)import.meta.hot.data.root=root;
root.render(<CompleteSkins/>);
