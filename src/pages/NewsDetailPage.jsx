import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Skeleton, message } from 'antd';
import {
  ArrowLeftOutlined, LinkOutlined, ShareAltOutlined,
  CalendarOutlined, ClockCircleOutlined, FireOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { announcements as api } from '../api';

export default function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setRelated([]);
    api.get(id)
      .then(r => setItem(r.announcement))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    // Fire-and-forget — sidebar is optional, no need to block the page on it.
    api.publicList('NEWS', 6)
      .then(r => setRelated((r.announcements || []).filter(n => String(n.id) !== String(id)).slice(0, 3)))
      .catch(() => {});
    window.scrollTo({ top: 0, behavior: 'instant' });
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
      <div className="news-article">
        <div className="news-article-hero is-skeleton">
          <div className="page-container">
            <Skeleton.Button active size="small" style={{ width: 120 }} />
            <div style={{ height: 24 }} />
            <Skeleton active paragraph={{ rows: 2 }} title={{ width: '70%' }} />
          </div>
        </div>
        <div className="page-container">
          <div className="news-article-body-grid">
            <Skeleton active paragraph={{ rows: 10 }} />
          </div>
        </div>
      </div>
    );
  }
  if (notFound || !item) {
    return (
      <div className="page-container" style={{ padding: '32px 0 60px' }}>
        <Empty description="Мэдээ олдсонгүй" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button onClick={() => navigate('/')}>Нүүр хуудас руу буцах</Button>
        </div>
      </div>
    );
  }

  const dateStr = dayjs(item.publishedAt).format('YYYY оны MM сарын DD');
  const hasImage = !!item.imageUrl;

  return (
    <article className="news-article">
      {/* Immersive hero: title + meta overlaid on the image (or a colored
          band if there's no image). Replaces the previous plain page top. */}
      <header
        className={`news-article-hero ${hasImage ? 'has-image' : 'no-image'}`}
        style={hasImage ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
      >
        <div className="news-article-hero-overlay" />
        <div className="page-container news-article-hero-inner">
          <Link to="/" className="news-article-back">
            <ArrowLeftOutlined /> Нүүр хуудас
          </Link>

          <div className="news-article-meta-row">
            <span className="pill"><FireOutlined /> Мэдээ</span>
            <span className="meta-item"><CalendarOutlined /> {dateStr}</span>
            {readTime && (
              <span className="meta-item"><ClockCircleOutlined /> {readTime} мин уншина</span>
            )}
          </div>

          <h1>{item.title}</h1>
          {item.subtitle && <p className="lede">{item.subtitle}</p>}
        </div>
      </header>

      <div className="page-container">
        <div className="news-article-body-grid">
          <div className="news-article-main">
            {item.body && (
              <div className="news-detail-body">
                {item.body.split('\n').map((line, i) => (
                  line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                ))}
              </div>
            )}

            {item.link && (
              <div className="news-article-cta-card">
                <div className="cta-card-text">
                  <div className="cta-card-eyebrow">Эх сурвалж</div>
                  <div className="cta-card-line">Дэлгэрэнгүйг анхны эх сурвалжаас үзнэ үү</div>
                </div>
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
          </div>

          <aside className="news-article-aside">
            <div className="news-aside-card">
              <div className="aside-label">Энэ мэдээ</div>
              <ul className="aside-list">
                <li>
                  <CalendarOutlined />
                  <div>
                    <div className="k">Нийтэлсэн</div>
                    <div className="v">{dateStr}</div>
                  </div>
                </li>
                {readTime && (
                  <li>
                    <ClockCircleOutlined />
                    <div>
                      <div className="k">Унших хугацаа</div>
                      <div className="v">~{readTime} минут</div>
                    </div>
                  </li>
                )}
              </ul>
              <button type="button" className="aside-share" onClick={handleShare}>
                <ShareAltOutlined /> Хуваалцах
              </button>
            </div>

            {related.length > 0 && (
              <div className="news-aside-card">
                <div className="aside-label">Холбоотой мэдээ</div>
                <ul className="aside-related">
                  {related.map(n => (
                    <li key={n.id}>
                      <Link to={`/news/${n.id}`}>
                        {n.imageUrl ? (
                          <div className="thumb" style={{ backgroundImage: `url(${n.imageUrl})` }} />
                        ) : (
                          <div className="thumb is-empty" />
                        )}
                        <div className="rel-body">
                          <div className="rel-date">{dayjs(n.publishedAt).format('MM.DD')}</div>
                          <div className="rel-title">{n.title}</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        <div className="news-article-footer">
          <Link to="/" className="footer-back-btn">
            <ArrowLeftOutlined /> Бусад мэдээ үзэх
          </Link>
        </div>
      </div>
    </article>
  );
}
