import React from 'react';
import bounds from './poopBounds.json';
import { placementStyle } from './placements.js';
import './seated-poop.css';

// Mount directly against the same box as the background. No HUD/flex offsets.
export default function SeatedPoop({ toiletId, poopId, name, clicking, onClick, children, feedback }) {
  return <div className={`seat-layer ${clicking ? 'is-pressed' : ''}`} style={placementStyle(toiletId, bounds[poopId] || bounds[8])}>
    <span className="seat-contact-shadow" aria-hidden="true" />
    <button className="seat-poop-button" aria-label={`${name} 터치해서 영양분 얻기`} onClick={onClick}>
      <span className="seat-poop-body">{children}</span>
    </button>
    {clicking && <span className="seat-click-feedback" aria-hidden="true">+{feedback} ✨</span>}
  </div>;
}
