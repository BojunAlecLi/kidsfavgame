import React from 'react';

const baseColors = {
  peach: '#f8c9a5',
  cocoa: '#d7a07a',
  honey: '#f0b884',
  cloud: '#f5d7c2',
  rose: '#f2b6c1',
  lilac: '#d8c2f5',
};

const hairColors = {
  night: '#3b2a3f',
  chestnut: '#6a3e2f',
  gold: '#b7852b',
  blush: '#c5698a',
  teal: '#2b6a6e',
};

const outfitColors = {
  petal: '#ff8ab1',
  mint: '#7fe3c2',
  sky: '#7ab7ff',
  sunshine: '#ffd166',
  violet: '#b494ff',
};

const accessoryColors = {
  glow: '#ffe66d',
  leaf: '#8bdc6c',
  sparkle: '#f7b2ff',
  moon: '#c6e4ff',
};

export default function AvatarPreview({ avatar }) {
  const base = baseColors[avatar.base] || baseColors.peach;
  const hair = hairColors[avatar.hair] || hairColors.night;
  const outfit = outfitColors[avatar.outfit] || outfitColors.petal;
  const accessory = accessoryColors[avatar.accessory] || accessoryColors.glow;

  return (
    <div className="avatar-card">
      <div className="avatar-stage">
        <div className="avatar-base" style={{ background: base }}>
          <div className="avatar-hair" style={{ background: hair }} />
          <div className="avatar-face">
            <span className="avatar-eye" />
            <span className="avatar-eye" />
            <span className="avatar-smile" />
          </div>
          <div className="avatar-outfit" style={{ background: outfit }} />
          <div className="avatar-accessory" style={{ background: accessory }} />
        </div>
      </div>
      <div className="avatar-companion">
        <div className={`companion companion-${avatar.companion || 'fox'}`} />
        <span>{avatar.companionLabel || 'Star Fox'}</span>
      </div>
    </div>
  );
}
