import { useEffect, useRef, useState } from 'react';

// Animated counter that drives a number from 0 to `target` using
// requestAnimationFrame + an ease-out curve. Pass null/undefined to opt out.
export function useCountUp(target, durationMs = 1000) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (target == null || Number.isNaN(target)) {
      setValue(0);
      return undefined;
    }
    // Start from the previous displayed value so subsequent updates
    // animate smoothly between values.
    fromRef.current = value;
    startRef.current = null;
    const step = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (target - fromRef.current) * eased;
      setValue(Math.round(next));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // value intentionally NOT in deps — we read it via ref, not state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}

// IntersectionObserver-driven flag: true once the bound ref scrolls into
// view (and stays true). Used to trigger one-shot fade-in animations.
export function useInView({ rootMargin = '0px 0px -10% 0px', once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(el);
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { rootMargin, threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, once]);

  return [ref, inView];
}
