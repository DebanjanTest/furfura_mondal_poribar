import React from 'react';
import { useUI } from '../context/UIContext';

export default function ShankhaRippleHUD() {
  const { shankhaActive } = useUI();

  if (!shankhaActive) return null;

  return (
    <div className="shankha-blast-hud active" id="shankha-blast-hud" aria-hidden="true">
      <div className="shankha-ripple-ring ring-1"></div>
      <div className="shankha-ripple-ring ring-2"></div>
      <div className="shankha-ripple-ring ring-3"></div>
      <div className="shankha-center-emblem">🐚</div>
    </div>
  );
}
