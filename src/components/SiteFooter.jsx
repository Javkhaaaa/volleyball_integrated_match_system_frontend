import React from 'react';
import { Link } from 'react-router-dom';

// Global site footer. Rendered once from App.jsx so every route gets it.
export default function SiteFooter({ settings = {} }) {
  const social = [
    { key: 'socialFacebook', label: 'Facebook' },
    { key: 'socialInstagram', label: 'Instagram' },
    { key: 'socialYoutube', label: 'YouTube' },
    { key: 'socialTwitter', label: 'X' },
  ].filter(s => settings[s.key]);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <div className="brand" style={{ marginBottom: 14 }}>
            {settings.siteLogoUrl
              ? <img className="brand-mark brand-mark-img" src={settings.siteLogoUrl} alt="" />
              : <span className="brand-mark" aria-hidden />}
            <span className="brand-name">{settings.siteName || 'Volley Live'}</span>
          </div>
          <p>{settings.tagline || 'Волейболын тэмцээн live статистик, бодит цагийн оноо.'}</p>
          {settings.contactEmail && (
            <p style={{ marginTop: 10 }}>✉ <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></p>
          )}
          {settings.contactPhone && (
            <p>📞 {settings.contactPhone}</p>
          )}
        </div>
        <div>
          <h4>Системийн модулиуд</h4>
          <Link to="/matches">Тоглолтууд</Link>
          <Link to="/tournaments">Тэмцээнүүд</Link>
        </div>
        <div>
          <h4>Тухай</h4>
          <a href="#">Бидний тухай</a>
          <a href="#">Холбоо барих</a>
          <a href="#">Нууцлалын бодлого</a>
        </div>
        <div>
          <h4>Сошиал сүлжээ</h4>
          {social.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Тохирсон социал линк байхгүй</span>}
          {social.map(s => (
            <a key={s.key} href={settings[s.key]} target="_blank" rel="noreferrer">{s.label}</a>
          ))}
        </div>
      </div>
      <div className="foot-bottom">
        <span>{settings.footerCopyright || `© ${new Date().getFullYear()} Volley Live · All rights reserved`}</span>
      </div>
    </footer>
  );
}
