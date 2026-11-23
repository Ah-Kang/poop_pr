import React from 'react';
import outfits from './assets/outfits.png';
import { commonFit } from './fitting-data';

function Part({ box, x, y, w, h, angle = 0 }) {
  return <g transform={`rotate(${angle} ${x + w / 2} ${y + h})`}>
    <svg x={x} y={y} width={w} height={h} viewBox={box} preserveAspectRatio="none" overflow="hidden">
      <image href={outfits} width="1254" height="1254"/>
    </svg>
  </g>;
}

export default function FittingAvatar({ character, costume, mode = 'fitted' }) {
  const b = character.bounds;
  const scale = Math.min(270 / b.width, 228 / b.height);
  const w = b.width * scale, h = b.height * scale;
  const x = (400 - w) / 2, y = 302 - h;
  const f = mode === 'common' ? commonFit : character.fit;
  const [cx, cy, cw, ch] = f.cape;
  const [hx, hy, hw, ha] = f.head;
  const [rx, ry, rw, ra] = f.bow;
  // The original king already contains a costume. Keep it visible as a blocked
  // case rather than pretending that overlapping replacement assets are a fit.
  const show = mode !== 'original' && !(mode === 'fitted' && f.level === 'base' && costume === 'royal');
  const capeX = x + w * (cx - cw / 2), capeY = y + h * cy;
  const capeW = w * cw, capeH = h * ch;
  return <svg className="fitting-avatar" viewBox="0 0 400 350" role="img" aria-label={`${character.name} ${mode === 'original' ? '원본' : mode === 'common' ? '일괄 적용' : '체형별 보정'} ${costume === 'royal' ? '왕관과 망토' : '리본'}`}>
    {show && costume === 'royal' && <Part box="50 807 522 298" x={capeX} y={capeY} w={capeW} h={capeH}/>}
    <svg x={x} y={y} width={w} height={h} viewBox={`${b.left} ${b.top} ${b.width} ${b.height}`} overflow="visible"><image href={character.image} width={b.canvasWidth} height={b.canvasHeight}/></svg>
    {show && costume === 'royal' && <>
      <Part box="687 888 507 136" x={capeX + capeW * .045} y={capeY + capeH * .56} w={capeW * .91} h={capeH * .43}/>
      <Part box="148 196 356 251" x={x + w * hx - w * hw / 2} y={y + h * hy - w * hw * .69} w={w * hw} h={w * hw * .69} angle={ha}/>
    </>}
    {show && costume === 'ribbon' && <Part box="739 209 393 267" x={x + w * rx - w * rw / 2} y={y + h * ry - w * rw * .68} w={w * rw} h={w * rw * .68} angle={ra}/>}
  </svg>;
}
