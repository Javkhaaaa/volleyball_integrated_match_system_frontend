import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'antd';

export default function NotFoundPage() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', textAlign: 'center', padding: 32 }}>
      <div>
        <div style={{
          fontSize: 'clamp(96px, 18vw, 200px)',
          fontWeight: 900, lineHeight: 1,
          letterSpacing: '-0.05em',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}>404</div>
        <h2 style={{ marginTop: 16, fontSize: 24, fontWeight: 800 }}>
          Хайсан хуудас олдсонгүй
        </h2>
        <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
          URL буруу эсвэл устгасан агуулга байж болзошгүй.
        </p>
        <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/"><Button type="primary" size="large">Нүүр хуудас руу буцах</Button></Link>
          <Link to="/matches"><Button size="large">Тоглолт үзэх</Button></Link>
        </div>
      </div>
    </div>
  );
}
