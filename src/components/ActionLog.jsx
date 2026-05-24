import React, { useMemo } from 'react';

const TERMINAL_TYPES_RESULTS = {
  SERVE: ['ACE', 'ERROR'],
  RECEPTION: ['ERROR'],
  SET: ['ERROR'],
  ATTACK: ['KILL', 'ERROR', 'BLOCKED'],
  BLOCK: ['STUFF', 'ERROR'],
  BHE: ['ERROR'],
};

function isTerminal(e) {
  return TERMINAL_TYPES_RESULTS[e.type]?.includes(e.result);
}

const SHORT = {
  SERVE: 'SRV', RECEPTION: 'REC', SET: 'SET', ATTACK: 'ATK',
  BLOCK: 'BLK', DIG: 'DIG', BHE: 'BHE',
};

const LABEL = (e) => {
  if (e.type === 'ATTACK' && e.result === 'KILL') return 'KILL';
  if (e.type === 'ATTACK' && e.result === 'ERROR') return 'ATK ERR';
  if (e.type === 'ATTACK' && e.result === 'BLOCKED') return 'BLOCKED';
  if (e.type === 'SERVE' && e.result === 'ACE') return 'ACE';
  if (e.type === 'SERVE' && e.result === 'ERROR') return 'SRV ERR';
  if (e.type === 'BLOCK' && e.result === 'STUFF') return 'STUFF';
  if (e.type === 'BHE') return 'BHE';
  return SHORT[e.type] || e.type;
};

export default function ActionLog({ rallies = [] }) {
  // Merge events from all rallies, newest first.
  const rows = useMemo(() => {
    const out = [];
    rallies.slice().reverse().forEach((r) => {
      r.events.slice().reverse().forEach((e) => {
        out.push({ ...e, _rally: r.rallyNumber, _set: r.setNumber, _winnerSide: r.winnerSide, _scoreAfter: r.scoreAfter });
      });
      if (r.status === 'CLOSED') {
        out.push({ _kind: 'point', _rally: r.rallyNumber, _set: r.setNumber, _winnerSide: r.winnerSide, _scoreAfter: r.scoreAfter });
      }
    });
    return out;
  }, [rallies]);

  return (
    <div className="action-log">
      {rows.length === 0 && <div style={{ padding: 16, color: '#888' }}>Үйл явдал бүртгэгдээгүй.</div>}
      {rows.map((row, idx) => {
        if (row._kind === 'point') {
          return (
            <div key={idx} className="row terminal" style={{ background: '#fffbe6' }}>
              <span className="badge">POINT</span>
              <span style={{ fontWeight: 600 }}>{row._winnerSide}</span>
              <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                {row._scoreAfter?.home}-{row._scoreAfter?.away} · S{row._set}
              </span>
            </div>
          );
        }
        const term = isTerminal(row);
        return (
          <div key={idx} className={`row ${term ? 'terminal' : ''}`}>
            <span className="badge">{LABEL(row)}</span>
            <span style={{ flex: 1 }}>{row.actorSide} #{row.playerId}</span>
            <span style={{ opacity: 0.6, fontSize: 12 }}>S{row._set}·R{row._rally}·#{row.sequence}</span>
          </div>
        );
      })}
    </div>
  );
}
