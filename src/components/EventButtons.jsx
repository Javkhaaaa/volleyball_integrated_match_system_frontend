import React from 'react';
import { Button } from 'antd';

// Tablet-first, NCAA-LiveStats-style event entry buttons.
// Two-step interaction: pick action category, then pick result.
const PALETTE = [
  { type: 'ATTACK',    results: ['KILL', 'IN_PLAY', 'BLOCKED', 'ERROR'] },
  { type: 'BLOCK',     results: ['STUFF', 'TOUCH', 'ERROR'] },
  { type: 'SERVE',     results: ['IN', 'ACE', 'ERROR'] },
  { type: 'RECEPTION', results: ['GOOD', 'ERROR'] },
  { type: 'SET',       results: ['GOOD', 'ERROR'] },
  { type: 'DIG',       results: ['GOOD', 'ERROR'] },
  { type: 'BHE',       results: ['ERROR'] },
];

const COLOR = {
  ATTACK: '#1A3E8C',
  BLOCK: '#0d3b66',
  SERVE: '#1d5288',
  RECEPTION: '#1f6f9c',
  SET: '#7c5e1c',
  DIG: '#3a7d44',
  BHE: '#a13a3a',
};

export default function EventButtons({ disabled, onPick, currentType, onResetType }) {
  const [type, setType] = React.useState(null);

  const effectiveType = currentType ?? type;
  const palette = PALETTE.find(p => p.type === effectiveType);

  if (!effectiveType) {
    return (
      <div className="action-buttons-grid">
        {PALETTE.map(p => (
          <Button
            key={p.type}
            type="primary"
            disabled={disabled}
            onClick={() => setType(p.type)}
            style={{ background: COLOR[p.type], borderColor: COLOR[p.type] }}
          >
            {p.type}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={{ color: COLOR[effectiveType] }}>{effectiveType}</strong>
        <Button size="small" onClick={() => { setType(null); onResetType && onResetType(); }}>← Буцах</Button>
      </div>
      <div className="action-buttons-grid">
        {palette.results.map(r => (
          <Button
            key={r}
            disabled={disabled}
            type={['KILL', 'ACE', 'STUFF'].includes(r) ? 'primary' : 'default'}
            danger={['ERROR', 'BLOCKED'].includes(r)}
            onClick={() => { onPick({ type: effectiveType, result: r }); setType(null); }}
          >
            {r}
          </Button>
        ))}
      </div>
    </div>
  );
}
