import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Skeleton, message } from 'antd';
import { ArrowLeftOutlined, LinkOutlined, ShareAltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { announcements as api } from '../api';

export default function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get(id)
      .then(r => setItem(r.announcement))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Estimate read time at ~220 words / minute. Even rough numbers feel
  // newsroom-y compared with no signal at all.
  const readTime = useMemo(() => {
    if (!item?.body) return null;
    const words = item.body.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 220));
  }, [item]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: item?.title, url }); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      message.success('Холбоосыг хууллаа');
    } catch {
      message.info(url);
    }
  };

  if (loading) {
    return (
      <div className="news-detail">
        <div className="news-detail-topbar">
          <Skeleton.Button active size="small" style={{ width: 120 }} />
          <Skeleton.Button active size="small" style={{ width: 100 }} />
        </div>
        <Skeleton.Image style={{ width: '100%', height: 360 }} active />
        <div style={{ height: 28 }} />
        <Skeleton active paragraph={{ rows: 2 }} />
        <div style={{ height: 16 }} />
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }
  if (notFound || !item) {
    return (
      <div className="news-detail">
        <Empty description="Мэдээ олдсонгүй" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button onClick={() => navigate('/')}>Нүүр хуудас руу буцах</Button>
        </div>
      </div>
    );
  }

  return (
    <article className="news-detail">
      <div className="news-detail-topbar">
        <Link to="/" className="news-detail-back">
          <ArrowLeftOutlined /> Нүүр хуудас
        </Link>
        <button type="button" className="news-detail-share" onClick={handleShare}>
          <ShareAltOutlined /> Хуваалцах
        </button>
      </div>

      {item.imageUrl && (
        <div className="news-detail-hero" style={{ backgroundImage: `url(${item.imageUrl})` }} />
      )}

      <header className="news-detail-head">
        <div className="news-detail-meta">
          <span className="pill">Мэдээ</span>
          <span className="date">{dayjs(item.publishedAt).format('YYYY оны MM сарын DD')}</span>
          {readTime && (
            <>
              <span className="dot" aria-hidden />
              <span className="read-time">{readTime} мин уншина</span>
            </>
          )}
        </div>
        <h1>{item.title}</h1>
        {item.subtitle && <p className="lede">{item.subtitle}</p>}
      </header>

      {item.body && (
        <div className="news-detail-body">
          {item.body.split('\n').map((line, i) => (
            line.trim() ? <p key={i}>{line}</p> : <br key={i} />
          ))}
        </div>
      )}

      {item.link && (
        <div className="news-detail-cta">
          <span className="source-note">Эх сурвалжаас дэлгэрэнгүйг уншина уу.</span>
          <Button
            type="primary"
            size="large"
            icon={<LinkOutlined />}
            onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
            style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}
          >
            {item.ctaText || 'Эх сурвалж нээх'}
          </Button>
        </div>
      )}

      <div className="news-detail-footer-back">
        <Link to="/"><ArrowLeftOutlined /> Бусад мэдээ үзэх</Link>
      </div>
    </article>
  );
}
