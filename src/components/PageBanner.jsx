import React from 'react';

// Compact branded banner shown at the top of list / admin pages — replaces
// the bare `<h1>` heading with something visually anchored. Title is the
// big Oswald headline, optional lede + an optional kicker + right-side
// slot for action buttons (filters, "create new", etc.).
export default function PageBanner({ kicker, title, lede, actions, children }) {
  return (
    <section className="page-banner">
      <div className="page-banner-orb page-banner-orb-1" />
      <div className="page-banner-orb page-banner-orb-2" />
      <div className="page-banner-inner">
        <div className="page-banner-text">
          {kicker && <span className="page-banner-kicker">{kicker}</span>}
          <h1>{title}</h1>
          {lede && <p className="page-banner-lede">{lede}</p>}
        </div>
        {(actions || children) && (
          <div className="page-banner-actions">
            {actions}
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
