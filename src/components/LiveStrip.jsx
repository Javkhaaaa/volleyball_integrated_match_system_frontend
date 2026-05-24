import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { matches as matchesApi } from '../api';

// Sticky strip pinned to the bottom of the viewport that shows any matches
// currently in progress. Click rotates through them (or jumps to the one
// match if there's a single live match). Polls every 25s so the score
// stays roughly fresh even without socket-level updates on every page.
export default function LiveStrip() {
  const [live, setLive] = useState([]);
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const r = await matchesApi.list({ status: 'LIVE' });
        if (!cancelled) setLive(r.matches || []);
      } catch { /* ignore */ }
    };
    fetchLive();
    const t = setInterval(fetchLive, 25000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // Rotate display every 6s when more than one live match.
  useEffect(() => {
    if (live.length <= 1) return undefined;
    const t = setInterval(() => setIdx(i => (i + 1) % live.length), 6000);
    return () => clearInterval(t);
  }, [live.length]);

  // Hide on the scoreboard pages themselves — would just duplicate info.
  const onMatchPage = location.pathname.startsWith('/matches/');
  if (onMatchPage || dismissed || live.length === 0) return null;

  const m = live[idx] || live[0];
  const currentSet = m.sets?.find(s => s.setNumber === m.currentSetNumber);

  return (
    <div className="live-strip" role="region" aria-label="Шууд тоглолт">
      <button
        type="button"
        className="ls-body"
        onClick={() => navigate(`/matches/${m.id}`)}
      >
        <span className="ls-tag">
          <span className="ls-dot" /> LIVE
        </span>
        <span className="ls-teams">
          <strong>{m.homeTeam?.name || 'Home'}</strong>
          <span className="ls-score">{m.setsWonHome}–{m.setsWonAway}</span>
          <strong>{m.awayTeam?.name || 'Away'}</strong>
        </span>
        {currentSet && (
          <span className="ls-set">
            Set {currentSet.setNumber}: {currentSet.scoreHome}-{currentSet.scoreAway}
          </span>
        )}
        <span className="ls-cta">Үзэх →</span>
      </button>
      {live.length > 1 && (
        <div className="ls-dots">
          {live.map((_, i) => (
            <span key={i} className={i === idx ? 'is-active' : ''} />
          ))}
        </div>
      )}
      <button
        type="button"
        className="ls-close"
        aria-label="Хаах"
        onClick={() => setDismissed(true)}
      >×</button>
    </div>
  );
}
