import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Top progress bar that animates on every route change. Like nprogress —
// climbs to ~80% during transition, then snaps to 100% and fades.
//
// Triggers:
//   1. location.pathname changes (most common: <Link> click)
//   2. external trigger: window.dispatchEvent(new CustomEvent('app:loading', { detail: true|false }))
//      → use this from data-fetching pages if you want extra coverage.
export default function NavigationProgress() {
  const location = useLocation();
  const navType = useNavigationType();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const tickRef = useRef(null);
  const finishRef = useRef(null);

  // animate from `from` toward 80%, slowing as it climbs
  const climb = () => {
    setProgress(p => {
      if (p >= 80) return p;
      const remaining = 80 - p;
      const inc = Math.max(1, remaining * 0.12);
      return Math.min(80, p + inc);
    });
  };

  const start = () => {
    clearTimeout(finishRef.current);
    setVisible(true);
    setProgress(prev => (prev > 0 && prev < 100) ? prev : 8);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(climb, 220);
  };

  const finish = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    setProgress(100);
    finishRef.current = setTimeout(() => { setVisible(false); setProgress(0); }, 420);
  };

  // Trigger on every navigation. We treat the navigation as effectively
  // instant for already-loaded chunks; for lazy chunks the Suspense fallback
  // dispatches `app:loading` and we re-arm.
  useEffect(() => {
    start();
    // After commit + layout, schedule a finish on the next macro-task. If a
    // lazy boundary suspends, the visibility re-arms via the `app:loading`
    // event below, so this is harmless.
    const t = setTimeout(finish, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, navType]);

  // External hook for data-fetching screens that want the bar to keep going.
  useEffect(() => {
    const onEvent = (e) => {
      if (e.detail === true) start();
      else if (e.detail === false) finish();
    };
    window.addEventListener('app:loading', onEvent);
    return () => window.removeEventListener('app:loading', onEvent);
  }, []);

  return (
    <div className={`nav-progress ${visible ? 'is-visible' : ''}`}>
      <div className="nav-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
