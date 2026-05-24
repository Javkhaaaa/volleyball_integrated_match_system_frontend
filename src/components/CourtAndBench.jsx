import React from 'react';
import { Tag, Tooltip } from 'antd';

// Renders one team's 6-position court grid + bench.
//
// props:
//   side: 'HOME' | 'AWAY'
//   players: full team roster (id, jerseyNumber, fullName, isLibero)
//   lineup: array of 6 player IDs in court positions 1..6
//   selectedId: highlighted player ID
//   onSelect: (playerId) => void
//   subMode: boolean — when true, clicking a court player marks them for swap
//   onSwap: (courtPlayerId, benchPlayerId) => void
//   subsUsed: number
//   subsLimit: number

export default function CourtAndBench({
  side, players, lineup, selectedId, onSelect, subMode, onSwap, subsUsed, subsLimit, isHome,
}) {
  const playerById = {};
  (players || []).forEach(p => { playerById[p.id] = p; });
  const onCourt = new Set(lineup || []);
  const bench = (players || []).filter(p => !onCourt.has(p.id) && p.isActive !== false);

  const [pendingCourt, setPendingCourt] = React.useState(null);

  const handleCellClick = (pid) => {
    if (subMode) {
      setPendingCourt(pid);
    } else {
      onSelect && onSelect(pid);
    }
  };

  const handleBenchClick = (pid) => {
    if (subMode && pendingCourt) {
      onSwap && onSwap(pendingCourt, pid);
      setPendingCourt(null);
    } else if (!subMode) {
      onSelect && onSelect(pid);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        <strong style={{ color: '#1A3E8C' }}>{side} ({isHome ? 'Гэрийн' : 'Зочид'})</strong>
        <span style={{ fontSize: 12, color: '#666' }}>Sub: {subsUsed}/{subsLimit}</span>
      </div>

      <div className="court-grid" style={subMode ? { boxShadow: '0 0 0 3px #FFD000', borderRadius: 12, padding: 6 } : {}}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const pid = lineup?.[i];
          const p = pid ? playerById[pid] : null;
          const isSelected = selectedId === pid && !subMode;
          const isPending = pendingCourt === pid;
          return (
            <div
              key={i}
              className={`court-cell ${isSelected ? 'selected' : ''}`}
              onClick={() => pid && handleCellClick(pid)}
              style={isPending ? { background: '#FFD000', borderStyle: 'dashed' } : {}}
            >
              <div className="pos-label">P{i + 1}</div>
              {p ? (
                <>
                  <div className="jersey">#{p.jerseyNumber}</div>
                  <div className="name">{p.fullName}</div>
                </>
              ) : (
                <div style={{ color: '#aaa' }}>—</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Bench:</div>
        <div className="bench-list">
          {bench.map((p) => (
            <Tooltip key={p.id} title={p.fullName}>
              <button
                className="ant-btn"
                style={{
                  height: 44,
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  background: subMode ? '#fff7d6' : '#fff',
                  cursor: 'pointer',
                }}
                onClick={() => handleBenchClick(p.id)}
              >
                #{p.jerseyNumber}{p.isLibero ? ' L' : ''}
              </button>
            </Tooltip>
          ))}
          {bench.length === 0 && <span style={{ color: '#aaa' }}>—</span>}
        </div>
      </div>
    </div>
  );
}
