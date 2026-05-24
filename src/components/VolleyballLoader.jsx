import React from 'react';

// Branded loader: a stylised volleyball that bounces and spins. Drops into
// any place where AntD's Skeleton previously was used.
export default function VolleyballLoader({ label = 'Ачаалж байна', size = 56 }) {
  return (
    <div className="vb-loader" role="status" aria-live="polite">
      <div className="vb-loader-ball" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
          <circle cx="50" cy="50" r="46" fill="#fff" stroke="#0E1230" strokeWidth="3" />
          <path d="M50 4 C 68 28, 68 72, 50 96" fill="none" stroke="#0E1230" strokeWidth="3" />
          <path d="M50 4 C 32 28, 32 72, 50 96" fill="none" stroke="#0E1230" strokeWidth="3" />
          <path d="M4 50 C 28 32, 72 32, 96 50" fill="none" stroke="#0E1230" strokeWidth="3" />
          <path d="M4 50 C 28 68, 72 68, 96 50" fill="none" stroke="#0E1230" strokeWidth="3" />
        </svg>
      </div>
      <div className="vb-loader-shadow" />
      {label && <div className="vb-loader-label">{label}</div>}
    </div>
  );
}
