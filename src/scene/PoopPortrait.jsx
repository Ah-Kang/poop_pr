import React from 'react';
import bounds from './poopBounds.json';
import './evolution.css';

// Fit the visible character, not the transparent padding around its PNG.
export default function PoopPortrait({ poop, spriteBounds }) {
  const box = spriteBounds || bounds[poop.id];
  const size = box ? Math.max(box.width, box.height) / 0.8 : 0;
  return <span className="poop-portrait">
    <img src={poop.image} alt={poop.name} draggable="false" style={box ? {
      width: `${box.canvasWidth / size * 100}%`,
      height: `${box.canvasHeight / size * 100}%`,
      left: `${50 - (box.left + box.width / 2) / size * 100}%`,
      top: `${50 - (box.top + box.height / 2) / size * 100}%`,
    } : undefined} />
  </span>;
}
