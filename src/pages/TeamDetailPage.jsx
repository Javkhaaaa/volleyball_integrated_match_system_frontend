import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Empty, Tabs, Tag, Skeleton, Card, Avatar, Statistic, Select, Table, Button } from 'antd';
import {
  UserOutlined, TrophyOutlined, CalendarOutlined, BarChartOutlined, EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { teams as api, tournaments as tournApi } from '../api';
import StatRadarChart from '../components/StatRadarChart';
import StatBarChart from '../components/StatBarChart';
import { isAdmin, canManageTeam } from '../utils/permissions';

const POSITION_LABEL = {
  OH: 'Outside Hitter', OPP: 'Opposite', MB: 'Middle Blocker',
  S:  'Setter',         L:   'Libero',   DS:  'Defensive Specialist',
};

export default function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);
  const admin = isAdmin(user);
  const [searchParams] = useSearchParams();
  // When the user navigates here from a Tournament page we receive
  // ?tournament=ID so we can scope matches + show a context badge.
  const filterTournamentId = searchParams.get('tournament');

  const [team, setTeam] = useState(null);
  const [career, setCareer] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [contextTournament, setContextTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.careerStats(id).catch(() => null),
      api.tournamentStats(id).catch(() => ({ tournamentStats: [] })),
      api.matches(id).catch(() => ({ matches: [] })),
    ]).then(async ([c, t, m]) => {
      if (cancelled) return;
      setTeam(c?.team || null);
      setCareer(c?.career || null);
      setTournaments(t?.tournamentStats || []);
      setMatches(m?.matches || []);
      // Resolve tournament context — prefer the URL param, fall back to
      // the team's "home" tournament if set on the entity.
      const tid = filterTournamentId || c?.team?.tournamentId;
      if (tid) {
        tournApi.get(tid).then(d => { if (!cancelled) setContextTournament(d.tournament); }).catch(() => {});
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, filterTournamentId]);

  // Filter matches by tournament context when present, otherwise show all.
  const filteredMatches = useMemo(() => {
    if (!filterTournamentId) return matches;
    return matches.filter(m => String(m.tournamentId) === String(filterTournamentId));
  }, [matches, filterTournamentId]);

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 3 }} />
        <div style={{ height: 24 }} />
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }
  if (!team) return <Empty description="Баг олдсонгүй" />;

  return (
    <div>
      {canManageTeam(user, team) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/teams?team=${team.id}`)}
            style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}
          >
            {admin ? 'Багаа засах' : 'Бүрэлдэхүүн засах'}
          </Button>
        </div>
      )}
      {/* HERO */}
      <div className="profile-hero">
        <div className="avatar" style={{
          background: team.logoUrl ? `url(${team.logoUrl}) center/cover` : team.color || 'var(--bg-raised)',
        }}>
          {!team.logoUrl && (team.shortName || team.name || '?').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="meta-row">
            {team.color && (
              <span className="pill primary">
                <span className="color-swatch" style={{ background: team.color }} />
                Багийн өнгө
              </span>
            )}
            {contextTournament && (
              <Link to={`/tournaments/${contextTournament.id}`} className="pill accent">
                <TrophyOutlined /> {contextTournament.name}
              </Link>
            )}
            {filterTournamentId && (
              <Tag color="orange" style={{ marginLeft: 4 }}>
                Зөвхөн энэ тэмцээний хүрээнд
              </Tag>
            )}
          </div>
          <h1>{team.name}</h1>
          {team.shortName && <div className="muted" style={{ marginBottom: 8, fontSize: 16 }}>{team.shortName}</div>}
          {team.coach && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', background: 'var(--bg-raised)', borderRadius: 12, marginTop: 8 }}>
              <Avatar size={28} src={team.coach.picture} icon={!team.coach.picture && <UserOutlined />} />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Дасгалжуулагч</div>
                <strong>{team.coach.name}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Headline stats — career totals from TeamCareerStatistic */}
      {career && (
        <div className="stat-blocks">
          <div className="stat-block accent">
            <div className="label">Тоглолт</div>
            <div className="value">{career.matchesPlayed}</div>
          </div>
          <div className="stat-block">
            <div className="label">Хож</div>
            <div className="value" style={{ color: 'var(--success)' }}>{career.matchesWon}</div>
          </div>
          <div className="stat-block">
            <div className="label">Хож алдсан</div>
            <div className="value" style={{ color: 'var(--text-muted)' }}>{career.matchesLost}</div>
          </div>
          <div className="stat-block">
            <div className="label">Нийт оноо</div>
            <div className="value">{career.totalPoints}</div>
          </div>
          <div className="stat-block">
            <div className="label">Attack %</div>
            <div className="value">{career.attackPercentage.toFixed(1)}%</div>
          </div>
          <div className="stat-block">
            <div className="label">Side-out %</div>
            <div className="value">{career.sideOutPercentage.toFixed(1)}%</div>
          </div>
        </div>
      )}

      <Tabs
        defaultActiveKey="roster"
        items={[
          {
            key: 'roster',
            label: <span><UserOutlined /> Бүрэлдэхүүн ({team.players?.length || 0})</span>,
            children: <RosterTab players={team.players || []} />,
          },
          {
            key: 'matches',
            label: <span><CalendarOutlined /> Тоглолтууд ({filteredMatches.length})</span>,
            children: <MatchesTab matches={filteredMatches} teamId={team.id} navigate={navigate} />,
          },
          {
            key: 'tournaments',
            label: <span><TrophyOutlined /> Тэмцээн ({tournaments.length})</span>,
            children: <TournamentsTab rows={tournaments} />,
          },
          {
            key: 'charts',
            label: <span><BarChartOutlined /> График</span>,
            children: <ChartsTab career={career} tournaments={tournaments} />,
          },
        ]}
      />
    </div>
  );
}

function RosterTab({ players }) {
  if (!players.length) return <Empty description="Тоглогч бүртгэгдээгүй байна" />;
  return (
    <div className="player-grid">
      {players.map((p) => (
        <Link key={p.id} to={`/players/${p.id}`} className="player-card" style={{ color: 'var(--text)' }}>
          <div className="photo" style={p.photoUrl ? { backgroundImage: `url(${p.photoUrl})` } : {}}>
            {!p.photoUrl && <span>#{p.jerseyNumber}</span>}
          </div>
          <div className="info">
            <span className="jersey">#{p.jerseyNumber}</span>
            <span className="name">{p.fullName}</span>
            <span className="team">
              {p.position && (POSITION_LABEL[p.position] || p.position)}
              {p.isLibero && ' · Libero'}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function MatchesTab({ matches, teamId, navigate }) {
  if (!matches.length) return <Empty description="Тоглолт алга" />;
  return (
    <div className="results-list">
      {matches.map(m => {
        const isHome = m.homeTeamId === teamId;
        const won = (isHome && m.winnerSide === 'HOME') || (!isHome && m.winnerSide === 'AWAY');
        const lost = (isHome && m.winnerSide === 'AWAY') || (!isHome && m.winnerSide === 'HOME');
        return (
          <div key={m.id} className="result-row" onClick={() => navigate(`/matches/${m.id}`)}>
            <div className={`team ${won ? 'winner' : (lost ? 'loser' : '')}`}>
              {m.homeTeam?.logoUrl
                ? <img src={m.homeTeam.logoUrl} alt="" />
                : <div style={{ width: 28, height: 28, background: 'var(--bg-raised)', borderRadius: 6 }} />}
              <span className="name">{m.homeTeam?.name}</span>
            </div>
            <div className="score-mid">
              {m.status === 'FINISHED' || m.status === 'LIVE' ? `${m.setsWonHome}–${m.setsWonAway}` : 'VS'}
            </div>
            <div className={`team right ${won ? 'winner' : (lost ? 'loser' : '')}`}>
              <span className="name">{m.awayTeam?.name}</span>
              {m.awayTeam?.logoUrl
                ? <img src={m.awayTeam.logoUrl} alt="" />
                : <div style={{ width: 28, height: 28, background: 'var(--bg-raised)', borderRadius: 6 }} />}
            </div>
            <div className="when">
              {m.status === 'LIVE' && <Tag color="red">LIVE</Tag>}
              {m.status === 'FINISHED' && m.finishedAt && dayjs(m.finishedAt).format('MM.DD HH:mm')}
              {m.status === 'SCHEDULED' && m.scheduledAt && dayjs(m.scheduledAt).format('MM.DD HH:mm')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Tournament aggregates ------------------------------------------------

function TournamentsTab({ rows }) {
  if (rows.length === 0) {
    return <Empty description="Хараахан ямар нэг тэмцээний статистик бүртгэгдээгүй байна." />;
  }
  return (
    <Table
      rowKey={(r) => r.id}
      pagination={false}
      size="middle"
      columns={[
        {
          title: 'Тэмцээн',
          render: (_, r) => r.Tournament ? (
            <Link to={`/tournaments/${r.Tournament.id}`} style={{ fontWeight: 600 }}>
              {r.Tournament.name}
            </Link>
          ) : '—',
        },
        { title: 'P', dataIndex: 'matchesPlayed', width: 60, align: 'right' },
        { title: 'W', dataIndex: 'matchesWon', width: 60, align: 'right',
          render: v => <strong style={{ color: 'var(--success)' }}>{v}</strong> },
        { title: 'L', dataIndex: 'matchesLost', width: 60, align: 'right',
          render: v => <span className="muted">{v}</span> },
        { title: 'Pts', dataIndex: 'totalPoints', width: 80, align: 'right' },
        { title: 'Block pts', dataIndex: 'blockPoints', width: 90, align: 'right' },
        { title: 'Serve pts', dataIndex: 'servePoints', width: 90, align: 'right' },
        { title: 'Attack %', dataIndex: 'attackPercentage', width: 90, align: 'right',
          render: v => `${v.toFixed(1)}%` },
        { title: 'Side-out %', dataIndex: 'sideOutPercentage', width: 100, align: 'right',
          render: v => `${v.toFixed(1)}%` },
      ]}
      dataSource={rows}
    />
  );
}

// ---- Charts tab (radar + bar) ---------------------------------------------

function ChartsTab({ career, tournaments }) {
  if (!career) {
    return <Empty description="График зурахад статистик хүрэлцэхгүй байна." />;
  }
  // Normalise team metrics for radar.
  const radarData = [
    Math.min(100, career.attackPercentage),
    Math.min(100, (career.blockPoints / Math.max(career.matchesPlayed, 1)) * 5),
    Math.min(100, (career.servePoints / Math.max(career.matchesPlayed, 1)) * 5),
    Math.min(100, career.sideOutPercentage),
    Math.min(100, 100 - Math.min(100, (career.totalErrors / Math.max(career.matchesPlayed, 1)) * 4)),
  ].map(v => Math.round(v));

  const top5 = tournaments.slice(0, 5);

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
      <Card title="Career skill radar">
        <StatRadarChart
          primary={{
            name: 'Career',
            categories: ['Довтолгоо', 'Хаалт', 'Серв', 'Side-out', 'Алдаа багасгах'],
            data: radarData,
          }}
        />
      </Card>
      {top5.length > 0 && (
        <Card title="Тэмцээн бүрийн онооны эх үүсвэр">
          <StatBarChart
            categories={top5.map(t => t.Tournament?.name || `#${t.tournamentId}`)}
            series={[
              { name: 'Total points', data: top5.map(t => t.totalPoints), color: '#1A3E8C' },
              { name: 'Block pts', data: top5.map(t => t.blockPoints), color: '#FFD000' },
              { name: 'Serve pts', data: top5.map(t => t.servePoints), color: '#FF6645' },
            ]}
            height={Math.max(220, top5.length * 50)}
          />
        </Card>
      )}
    </div>
  );
}
