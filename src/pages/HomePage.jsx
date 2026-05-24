import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Skeleton } from 'antd';
import { ArrowRightOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  announcements as annApi, matches as matchesApi, tournaments as tournApi,
  players as playersApi, teams as teamsApi, sponsors as sponsorsApi,
  siteSettings as settingsApi, siteStats as statsApi,
} from '../api';
import { useCountUp, useInView } from '../utils/hooks';

export default function HomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    hero: [], news: [], live: [], upcoming: [], recent: [],
    featuredTournaments: [], featuredPlayers: [], featuredTeams: [],
    sponsors: [], settings: {}, stats: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const safe = (p) => p.catch(() => null);
      try {
        const [
          hero, news, live, upcoming, recent,
          featTourn, featPlayers, featTeams,
          sponsorsRes, settings, stats,
        ] = await Promise.all([
          safe(annApi.publicList('HERO', 6)),
          safe(annApi.publicList('NEWS', 9)),
          safe(matchesApi.list({ status: 'LIVE' })),
          safe(matchesApi.list({ status: 'SCHEDULED', limit: 6 })),
          safe(matchesApi.list({ status: 'FINISHED', limit: 8 })),
          safe(tournApi.list({ featured: 'true' })),
          safe(playersApi.list({ featured: 'true', limit: 8 })),
          safe(teamsApi.list({ featured: 'true' })),
          safe(sponsorsApi.publicList()),
          safe(settingsApi.publicMap()),
          safe(statsApi.get()),
        ]);
        if (cancelled) return;
        setData({
          hero: hero?.announcements || [],
          news: news?.announcements || [],
          live: live?.matches || [],
          upcoming: upcoming?.matches || [],
          recent: recent?.matches || [],
          featuredTournaments: featTourn?.tournaments || [],
          featuredPlayers: featPlayers?.players || [],
          featuredTeams: featTeams?.teams || [],
          sponsors: sponsorsRes?.sponsors || [],
          settings: settings?.settings || {},
          stats: stats?.stats || {},
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const heroSlides = useMemo(() => {
    if (data.hero.length > 0) return data.hero;
    return [{
      id: 'fallback',
      title: data.settings.homeHeroTitle || 'ЭНЭ БОЛ ВОЛЕЙБОЛ',
      subtitle: data.settings.homeHeroLede || 'Бодит цагийн оноо, статистик, баг тоглогчийн мэдээлэл нэг дор.',
      kind: 'HERO',
      imageUrl: null,
    }];
  }, [data.hero, data.settings]);

  return (
    <div className="home">
      <HeroSection slides={heroSlides} settings={data.settings} primaryLive={data.live[0]} primaryUpcoming={data.upcoming[0]} navigate={navigate} loading={loading} />

      {/* Quick stats - sits over hero bottom */}
      <QuickStats stats={data.stats} loading={loading} />

      <div className="page-container">
        {/* Live now */}
        <Reveal as="section" className="section">
          <h2 className="section-title">
            Шууд явагдаж байгаа
            <Link to="/matches" className="more">Бүгдийг харах →</Link>
          </h2>
          {loading ? (
            <CardsSkeleton count={3} />
          ) : data.live.length === 0 ? (
            <div className="empty-card">Одоогоор шууд тоглолт алга байна</div>
          ) : (
            <div className="cards-grid">
              {data.live.map((m) => (
                <LiveMatchCard key={m.id} match={m} onClick={() => navigate(`/matches/${m.id}`)} />
              ))}
            </div>
          )}
        </Reveal>

        {/* Featured tournaments */}
        {data.featuredTournaments.length > 0 && (
          <Reveal as="section" className="section">
            <h2 className="section-title">
              Онцлох тэмцээн
              <Link to="/tournaments" className="more">Бүх тэмцээн →</Link>
            </h2>
            <div style={{
              display: 'grid', gap: 16,
              gridTemplateColumns: data.featuredTournaments.length > 1
                ? 'repeat(auto-fit, minmax(360px, 1fr))'
                : '1fr',
            }}>
              {data.featuredTournaments.slice(0, 4).map((t) => (
                <FeaturedTournamentCard key={t.id} t={t} onClick={() => navigate(`/tournaments/${t.id}`)} />
              ))}
            </div>
          </Reveal>
        )}

        {/* Upcoming */}
        {data.upcoming.length > 0 && (
          <Reveal as="section" className="section">
            <h2 className="section-title">
              Дараагийн тоглолтууд
              <Link to="/matches" className="more">Хуанли →</Link>
            </h2>
            <div className="cards-grid">
              {data.upcoming.map((m) => (
                <UpcomingMatchCard key={m.id} match={m} onClick={() => navigate(`/matches/${m.id}`)} />
              ))}
            </div>
          </Reveal>
        )}

        {/* Recent results */}
        {data.recent.length > 0 && (
          <Reveal as="section" className="section">
            <h2 className="section-title">Сүүлийн үр дүн</h2>
            <div className="results-list">
              {data.recent.map((m) => (
                <RecentResultRow key={m.id} match={m} onClick={() => navigate(`/matches/${m.id}`)} />
              ))}
            </div>
          </Reveal>
        )}

        {/* Players spotlight */}
        {data.featuredPlayers.length > 0 && (
          <Reveal as="section" className="section">
            <h2 className="section-title">Онцлох тоглогчид</h2>
            <div className="player-grid">
              {data.featuredPlayers.map((p) => (
                <article key={p.id} className="player-card" onClick={() => navigate(`/players/${p.id}`)}>
                  <div className="photo" style={p.photoUrl ? { backgroundImage: `url(${p.photoUrl})` } : {}}>
                    {!p.photoUrl && <span>#{p.jerseyNumber}</span>}
                  </div>
                  <div className="info">
                    <span className="jersey">#{p.jerseyNumber}</span>
                    <span className="name">{p.fullName}</span>
                    {p.Team && <span className="team">{p.Team.name}</span>}
                    {p.spotlightNote && <span className="note">{p.spotlightNote}</span>}
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        )}

        {/* Featured teams */}
        {data.featuredTeams.length > 0 && (
          <Reveal as="section" className="section">
            <h2 className="section-title">
              Онцлох багууд
              <Link to="/teams" className="more">Бүх баг →</Link>
            </h2>
            <div className="team-grid">
              {data.featuredTeams.map((t) => (
                <div key={t.id} className="team-tile" onClick={() => navigate(`/teams/${t.id}`)}>
                  {t.logoUrl
                    ? <img src={t.logoUrl} alt="" />
                    : <div className="logo-stub" />}
                  <div>
                    <div className="name">{t.name}</div>
                    {t.shortName && <div className="sub">{t.shortName}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* Sponsors */}
        {data.sponsors.length > 0 && (
          <Reveal as="section" className="section">
            <h2 className="section-title">Ивээн тэтгэгчид</h2>
            <div className="sponsors">
              {data.sponsors.map((s) => (
                <a key={s.id} className="sponsor" href={s.websiteUrl || '#'} target="_blank" rel="noreferrer" title={s.name}>
                  {s.logoUrl ? <img src={s.logoUrl} alt={s.name} /> : <span>{s.name}</span>}
                </a>
              ))}
            </div>
          </Reveal>
        )}
      </div>

      {/* News — full-bleed dark blue panel, hero-style */}
      {data.news.length > 0 && (
        <Reveal as="section" className="news-panel">
          <div className="news-panel-orb news-panel-orb-1" />
          <div className="news-panel-orb news-panel-orb-2" />
          <div className="page-container">
            <h2 className="section-title">Мэдээ, мэдээлэл</h2>
            <div className="news-layout">
              {data.news[0] && (() => {
                const lead = data.news[0];
                return (
                  <article
                    className="news-lead"
                    onClick={() => {
                      if (lead.link) window.open(lead.link, '_blank', 'noopener,noreferrer');
                      else navigate(`/news/${lead.id}`);
                    }}
                  >
                    <div className="lead-image" style={lead.imageUrl ? { backgroundImage: `url(${lead.imageUrl})` } : {}}>
                      <span className="lead-badge">Гол мэдээ</span>
                    </div>
                    <div className="lead-body">
                      <div className="date">{dayjs(lead.publishedAt).format('YYYY оны MM сарын DD')}</div>
                      <h3>{lead.title}</h3>
                      {lead.subtitle && <p>{lead.subtitle}</p>}
                      <span className="read-more">Дэлгэрэнгүй <span aria-hidden>→</span></span>
                    </div>
                  </article>
                );
              })()}
              {data.news.length > 1 && (
                <div className="news-grid">
                  {data.news.slice(1).map((n) => (
                    <article key={n.id} className="news-card"
                      onClick={() => {
                        if (n.link) window.open(n.link, '_blank', 'noopener,noreferrer');
                        else navigate(`/news/${n.id}`);
                      }}
                      style={{ cursor: 'pointer' }}>
                      <div className="image" style={n.imageUrl ? { backgroundImage: `url(${n.imageUrl})` } : {}} />
                      <div className="body">
                        <div className="date">{dayjs(n.publishedAt).format('YYYY · MM · DD')}</div>
                        <h3>{n.title}</h3>
                        {n.subtitle && <p>{n.subtitle}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Reveal>
      )}

    </div>
  );
}

// Wraps any block so it animates in (opacity + translateY) the first time
// it scrolls into view. Used liberally on the homepage to add subtle
// motion as the reader scrolls.
function Reveal({ as: Tag = 'div', children, className = '', ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Tag ref={ref} className={`reveal ${inView ? 'is-visible' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

// ---------- subcomponents ---------------------------------------------

function HeroSection({ slides, settings, primaryLive, primaryUpcoming, navigate, loading }) {
  const safeSlides = slides.length > 0 ? slides : [{
    id: 'fallback',
    title: settings.homeHeroTitle || 'Энэ бол волейбол',
    subtitle: settings.homeHeroLede || 'Бодит цагийн оноо, статистик, баг тоглогчийн мэдээлэл нэг дор.',
    kind: 'HERO',
    imageUrl: null,
  }];
  const total = safeSlides.length;
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset when slide list changes (e.g. after async load).
  useEffect(() => { setActiveIdx(0); }, [total]);

  // Auto-advance every 5 seconds. Paused while the user hovers the
  // coverflow so they can read the side titles.
  useEffect(() => {
    if (total <= 1 || paused) return undefined;
    const handle = setInterval(() => setActiveIdx(i => (i + 1) % total), 5000);
    return () => clearInterval(handle);
  }, [total, paused]);

  const active = safeSlides[activeIdx];
  const isFallback = active?.id === 'fallback';

  const onPrev = () => setActiveIdx(i => (i - 1 + total) % total);
  const onNext = () => setActiveIdx(i => (i + 1) % total);

  return (
    <Reveal as="section" className="home-hero">
      <div className="home-hero-bg" />

      <HeroCoverflow
        slides={safeSlides}
        activeIdx={activeIdx}
        onPrev={onPrev}
        onNext={onNext}
        goTo={setActiveIdx}
        onHover={setPaused}
        navigate={navigate}
      />

      {!active.imageOnly && (
        <div className="hero-text-overlay">
          {active.publishedAt && (
            <span className="kicker">
              {dayjs(active.publishedAt).format('YYYY.MM.DD')}
            </span>
          )}
          {active.title && <h1>{active.title}</h1>}
          {active.subtitle && <p className="lede">{active.subtitle}</p>}
          {active.link && (
            <div className="hero-cta">
              <Button size="large" type="primary"
                onClick={() => window.open(active.link, '_blank', 'noopener,noreferrer')}
                style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}>
                {active.ctaText || 'Дэлгэрэнгүй'} <ArrowRightOutlined />
              </Button>
            </div>
          )}
        </div>
      )}

      {!isFallback && total > 1 && (
        <div className="hero-dots">
          {safeSlides.map((_, i) => (
            <button
              key={i}
              aria-label={`Слайд ${i + 1}`}
              className={i === activeIdx ? 'is-active' : ''}
              onClick={() => setActiveIdx(i)}
            />
          ))}
        </div>
      )}
    </Reveal>
  );
}

// Slide-width / gap (in vw) per breakpoint. Must match the values in
// global.css for .coverflow-slide flex-basis and .cf-track gap — the JS
// uses these to compute the track's translateX offset and CSS uses them
// to size the slides.
function getSlideMetrics() {
  if (typeof window === 'undefined') return { width: 60, gap: 1.2 };
  const w = window.innerWidth;
  if (w <= 720)  return { width: 92, gap: 2 };
  if (w <= 1100) return { width: 66, gap: 1.4 };
  return { width: 60, gap: 1.2 };
}

// Filmstrip coverflow with infinite-loop clones. The visible track holds
// `[lastClone, ...slides, firstClone]` so both edges always peek with real
// content. The active track position is derived from (activeIdx, phase)
// rather than stored as state — this prevents the position from drifting
// across rotations even if a setTimeout misses.
//
// phase: 'idle' = normal, slide at (activeIdx + 1).
//        'wrapping-forward'  = we just wrapped N-1 → 0, animate to the
//                              firstClone slot (total + 1) then snap.
//        'wrapping-backward' = we just wrapped 0 → N-1, animate to the
//                              lastClone slot (0) then snap.
function HeroCoverflow({ slides, activeIdx, onPrev, onNext, goTo, onHover, navigate }) {
  const total = slides.length;
  const hasMultiple = total > 1;
  const [metrics, setMetrics] = useState(() => getSlideMetrics());
  const [transitionOn, setTransitionOn] = useState(true);
  const [phase, setPhase] = useState('idle');
  const prevActiveRef = useRef(activeIdx);

  // Re-read slide metrics on viewport resize.
  useEffect(() => {
    const handler = () => setMetrics(getSlideMetrics());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Reset state when the slide list length changes.
  useEffect(() => {
    setPhase('idle');
    prevActiveRef.current = activeIdx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // Detect wrap on activeIdx change and flip into the appropriate phase.
  useEffect(() => {
    if (!hasMultiple) {
      prevActiveRef.current = activeIdx;
      return;
    }
    const prev = prevActiveRef.current;
    prevActiveRef.current = activeIdx;
    if (prev === activeIdx) return;

    const delta = activeIdx - prev;
    if (delta === -(total - 1)) {
      setPhase('wrapping-forward');
    } else if (delta === total - 1) {
      setPhase('wrapping-backward');
    } else {
      setPhase('idle');
    }
  }, [activeIdx, hasMultiple, total]);

  // After landing in a wrapping phase, wait for the transition to finish
  // then snap (no animation) back to the matching real-slide position.
  useEffect(() => {
    if (phase === 'idle') return undefined;
    const t = setTimeout(() => {
      setTransitionOn(false);
      setPhase('idle');
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionOn(true));
      });
      // best-effort cleanup if unmount races with the snap
      return () => cancelAnimationFrame(raf);
    }, 700);
    return () => clearTimeout(t);
  }, [phase]);

  // Build the displayed list with clones at both ends. For a single slide
  // we just render it once.
  const tracked = hasMultiple
    ? [slides[total - 1], ...slides, slides[0]]
    : slides;

  // Compute the live track index purely from (activeIdx, phase). No
  // independent displayIdx state to fall out of sync.
  let displayIdx;
  if (!hasMultiple) {
    displayIdx = 0;
  } else if (phase === 'wrapping-forward') {
    displayIdx = total + 1; // firstClone slot
  } else if (phase === 'wrapping-backward') {
    displayIdx = 0;          // lastClone slot
  } else {
    displayIdx = activeIdx + 1;
  }

  // Translate the track so the slide at `displayIdx` is centred at 50vw.
  const { width: slideW, gap } = metrics;
  const step = slideW + gap;
  const offsetVw = hasMultiple
    ? 50 - slideW / 2 - displayIdx * step
    : 50 - slideW / 2;

  return (
    <div className="hero-coverflow-wrap">
      <div
        className={`hero-coverflow count-${Math.min(total, 5)}`}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      >
        <div
          className={`cf-track ${transitionOn ? '' : 'no-transition'}`}
          style={{ transform: `translateX(${offsetVw}vw)` }}
        >
          {tracked.map((s, ti) => {
            // Map track index back to the real slides[] index. Index 0 is
            // a clone of the last slide; total+1 is a clone of the first.
            const realIdx = !hasMultiple
              ? ti
              : ti === 0 ? total - 1
              : ti === total + 1 ? 0
              : ti - 1;
            const isCenter = hasMultiple ? ti === displayIdx : ti === 0;
            const linkable = isCenter && (s.link || (s.id && s.id !== 'fallback'));
            let interactive = false;
            let onClick;
            if (isCenter) {
              if (s.link) {
                interactive = true;
                onClick = () => window.open(s.link, '_blank', 'noopener,noreferrer');
              } else if (s.id && s.id !== 'fallback') {
                interactive = true;
                onClick = () => navigate(`/news/${s.id}`);
              }
            } else {
              interactive = true;
              onClick = () => goTo(realIdx);
            }
            return (
              <div
                key={`t${ti}-${s.id}`}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : -1}
                onClick={onClick}
                onKeyDown={(e) => {
                  if (interactive && (e.key === 'Enter' || e.key === ' ')) onClick();
                }}
                className={`coverflow-slide ${isCenter ? 'is-center' : 'is-side'} ${linkable ? 'is-linkable' : ''}`}
                aria-label={linkable && s.link ? `${s.title} — линк нээх` : undefined}
              >
                <div
                  className="cf-bg"
                  style={s.imageUrl ? { backgroundImage: `url(${s.imageUrl})` } : {}}
                >
                  {!s.imageUrl && <div className="cf-bg-fallback" />}
                </div>
                <div className="cf-tint" />
              </div>
            );
          })}
        </div>
        {hasMultiple && (
          <>
            <button
              type="button"
              className="cf-arrow cf-arrow-prev"
              aria-label="Өмнөх слайд"
              onClick={onPrev}
            >‹</button>
            <button
              type="button"
              className="cf-arrow cf-arrow-next"
              aria-label="Дараагийн слайд"
              onClick={onNext}
            >›</button>
          </>
        )}
      </div>
    </div>
  );
}

function QuickStats({ stats, loading }) {
  if (loading) {
    return (
      <div className="quick-stats">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton active paragraph={false} title={{ width: 60 }} />
          </div>
        ))}
      </div>
    );
  }
  if (stats.tournaments == null) return null;
  return (
    <div className="quick-stats">
      <StatCard num={stats.liveMatches} label="Шууд тоглолт" highlight />
      <StatCard num={stats.tournaments} label="Тэмцээн" />
      <StatCard num={stats.teams} label="Баг" />
      <StatCard num={stats.players} label="Тоглогч" />
      <StatCard num={stats.matches} label="Нийт тоглолт" />
    </div>
  );
}

function StatCard({ num, label, highlight }) {
  const target = num ?? 0;
  const isLive = highlight && target > 0;
  const animated = useCountUp(target, 1200);
  return (
    <div className={`stat-card ${isLive ? 'live' : ''}`}>
      <div className="num">{animated}</div>
      <div className="label">{label}</div>
    </div>
  );
}

function CardsSkeleton({ count = 3 }) {
  return (
    <div className="cards-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="match-card">
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      ))}
    </div>
  );
}

function LiveMatchCard({ match, onClick }) {
  const live = match.sets?.find(s => s.status === 'LIVE');
  return (
    <div className="match-card" onClick={onClick}>
      <div className="match-meta">
        <span className="pill live">Live · Set {match.currentSetNumber || 1}</span>
        {match.venue && <span>{match.venue}</span>}
      </div>
      <div className="teams">
        <div className="team">
          {match.homeTeam?.logoUrl
            ? <img className="logo" src={match.homeTeam.logoUrl} alt="" />
            : <div className="logo" />}
          <div className="name">{match.homeTeam?.name || 'Home'}</div>
        </div>
        <div className="score">{match.setsWonHome}–{match.setsWonAway}</div>
        <div className="team right">
          {match.awayTeam?.logoUrl
            ? <img className="logo" src={match.awayTeam.logoUrl} alt="" />
            : <div className="logo" />}
          <div className="name">{match.awayTeam?.name || 'Away'}</div>
        </div>
      </div>
      {match.sets?.length > 0 && (
        <div className="sets-row">
          {match.sets.map(s => (
            <span
              key={s.setNumber}
              className={`set-pill ${live && s.setNumber === live.setNumber ? 'win' : ''}`}
              title={`Set ${s.setNumber}`}
            >
              {s.scoreHome}-{s.scoreAway}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingMatchCard({ match, onClick }) {
  return (
    <div className="match-card" onClick={onClick}>
      <div className="match-meta">
        <span className="pill muted">
          <CalendarOutlined style={{ marginRight: 4 }} />
          {match.scheduledAt ? dayjs(match.scheduledAt).format('MM.DD HH:mm') : 'TBD'}
        </span>
        {match.tournamentId && <span>Тэмцээн #{match.tournamentId}</span>}
      </div>
      <div className="teams">
        <div className="team">
          {match.homeTeam?.logoUrl
            ? <img className="logo" src={match.homeTeam.logoUrl} alt="" />
            : <div className="logo" />}
          <div className="name">{match.homeTeam?.name || 'Home'}</div>
        </div>
        <div className="vs">VS</div>
        <div className="team right">
          {match.awayTeam?.logoUrl
            ? <img className="logo" src={match.awayTeam.logoUrl} alt="" />
            : <div className="logo" />}
          <div className="name">{match.awayTeam?.name || 'Away'}</div>
        </div>
      </div>
      {match.venue && <div className="venue"><EnvironmentOutlined /> {match.venue}</div>}
    </div>
  );
}

function FeaturedTournamentCard({ t, onClick }) {
  return (
    <div
      className="featured-tournament"
      style={t.bannerUrl ? { backgroundImage: `url(${t.bannerUrl})` } : {}}
      onClick={onClick}
    >
      <div className="ft-body">
        <span className="pill accent">Онцлох тэмцээн</span>
        <h3>{t.name}</h3>
        <div className="meta">
          {t.startDate && dayjs(t.startDate).format('YYYY.MM.DD')}
          {t.endDate && ` — ${dayjs(t.endDate).format('YYYY.MM.DD')}`}
          {t.location && <> · <EnvironmentOutlined /> {t.location}</>}
        </div>
      </div>
    </div>
  );
}

function RecentResultRow({ match, onClick }) {
  const homeWon = match.winnerSide === 'HOME';
  const awayWon = match.winnerSide === 'AWAY';
  return (
    <div className="result-row" onClick={onClick}>
      <div className={`team ${homeWon ? 'winner' : awayWon ? 'loser' : ''}`}>
        {match.homeTeam?.logoUrl
          ? <img src={match.homeTeam.logoUrl} alt="" />
          : <div style={{ width: 28, height: 28, background: 'var(--bg-raised)', borderRadius: 6 }} />}
        <span className="name">{match.homeTeam?.name || '—'}</span>
      </div>
      <div className="score-mid">{match.setsWonHome}–{match.setsWonAway}</div>
      <div className={`team right ${awayWon ? 'winner' : homeWon ? 'loser' : ''}`}>
        <span className="name">{match.awayTeam?.name || '—'}</span>
        {match.awayTeam?.logoUrl
          ? <img src={match.awayTeam.logoUrl} alt="" />
          : <div style={{ width: 28, height: 28, background: 'var(--bg-raised)', borderRadius: 6 }} />}
      </div>
      <div className="when">{match.finishedAt ? dayjs(match.finishedAt).format('MM.DD HH:mm') : ''}</div>
    </div>
  );
}

