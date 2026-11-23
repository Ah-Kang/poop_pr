import React, { useId } from 'react';
import body from './assets/pudding-body.png';
import faces from './assets/expressions.png';
import outfits from './assets/outfits.png';
import original from '../assets/PoopImage/pudding-poop.png';

export const materials = [
  { id: 'custard', name: '기본 푸딩', color: '#ffd778' },
  { id: 'mint', name: '민트 크림', color: '#96ded4' },
  { id: 'berry', name: '딸기 크림', color: '#f3a5b4' },
];
export const expressions = [
  { id: 'happy', name: '방긋', box: '270 135 704 210' },
  { id: 'wink', name: '윙크', box: '270 531 704 210' },
  { id: 'sleepy', name: '졸려', box: '270 945 704 210' },
];
export const costumes = [
  { id: 'none', name: '그대로' },
  { id: 'royal', name: '작은 임금님' },
  { id: 'ribbon', name: '분홍 리본' },
];

// Each atlas keeps its original PNG. SVG viewBoxes select regions without
// resampling or creating a full image for every combination.
function Piece({ source, box, x, y, width, height, ...props }) {
  return <svg x={x} y={y} width={width} height={height} viewBox={box} overflow="hidden" {...props}>
    <image href={source} width="1254" height="1254" />
  </svg>;
}

export default function Avatar({ material = 'custard', expression = 'happy', costume = 'none', isOriginal = false, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const filterId = `${uid}-tint`;
  const caramelId = `${uid}-caramel`;
  const selectedFace = expressions.find(item => item.id === expression) ?? expressions[0];
  const mint = material === 'mint';
  return <svg className={`modular-avatar ${className}`} viewBox="0 0 1000 860" aria-hidden="true" focusable="false">
    {isOriginal ? <Piece source={original} box="273 391 694 497" x="170" y="250" width="660" height="473"/> : <>
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncR type="table" tableValues={mint ? '0.08 0.20 0.50 0.92' : '0.25 0.65 0.90 1'}/>
            <feFuncG type="table" tableValues={mint ? '0.16 0.48 0.78 1' : '0.09 0.28 0.59 0.94'}/>
            <feFuncB type="table" tableValues={mint ? '0.13 0.43 0.72 0.96' : '0.10 0.35 0.65 0.95'}/>
          </feComponentTransfer>
        </filter>
      </defs>
      {costume === 'royal' && <Piece source={outfits} box="50 807 522 298" x="105" y="425" width="790" height="335" preserveAspectRatio="none"/>}
      <svg x="170" y="250" width="660" height="473" viewBox="273 391 694 497" overflow="hidden">
        <defs>
          <clipPath id={caramelId}>
            <path d="M 340 380 H 900 V 502 L 856 524 Q 838 531 829 548 L 829 565 Q 834 589 812 595 Q 791 602 779 582 Q 772 567 778 552 Q 663 577 554 552 Q 507 538 482 550 Q 481 585 462 607 Q 437 635 411 608 Q 394 587 407 558 L 405 524 L 370 510 Z"/>
          </clipPath>
        </defs>
        <image href={body} width="1254" height="1254" filter={material === 'custard' ? undefined : `url(#${filterId})`}/>
        {material !== 'custard' && <image href={body} width="1254" height="1254" clipPath={`url(#${caramelId})`}/>}
      </svg>
      <Piece source={faces} box={selectedFace.box} x="292" y="478" width="416" height="124"/>
      {costume === 'royal' && <>
        <Piece source={outfits} box="687 888 507 136" x="151" y="589" width="698" height="170"/>
        <ellipse cx="500" cy="284" rx="89" ry="14" fill="#7e450e" opacity=".15"/>
        <Piece source={outfits} box="148 196 356 251" x="385" y="130" width="230" height="162"/>
      </>}
      {costume === 'ribbon' && <>
        <ellipse cx="715" cy="308" rx="49" ry="10" fill="#7e450e" opacity=".16" transform="rotate(24 715 308)"/>
        <Piece source={outfits} box="739 209 393 267" x="616" y="215" width="205" height="139" transform="rotate(14 718 284)"/>
      </>}
    </>}
  </svg>;
}
