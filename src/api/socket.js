import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io({ withCredentials: true, autoConnect: true });
  }
  return socket;
}

export function subscribeMatch(matchId, onUpdate) {
  const s = getSocket();
  s.emit('match:subscribe', matchId);
  s.on('scoreboard:update', onUpdate);
  return () => {
    s.emit('match:unsubscribe', matchId);
    s.off('scoreboard:update', onUpdate);
  };
}

// Subscribe to all "stats-changed" notifications inside a tournament —
// emitted whenever any of its matches gets a new event or finishes. Used by
// the Tournament detail page to live-refresh standings / leaderboard
// without polling.
export function subscribeTournament(tournamentId, onChange) {
  const s = getSocket();
  s.emit('tournament:subscribe', tournamentId);
  s.on('tournament:stats-changed', onChange);
  return () => {
    s.emit('tournament:unsubscribe', tournamentId);
    s.off('tournament:stats-changed', onChange);
  };
}
