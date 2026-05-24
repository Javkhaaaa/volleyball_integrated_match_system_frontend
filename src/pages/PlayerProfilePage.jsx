import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Empty, Card, Tabs, Skeleton, Statistic, Tag, Avatar, Table } from 'antd';
import { UserOutlined, FireOutlined, TrophyOutlined, CalendarOutlined, BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { players as api } from '../api';
import StatRadarChart from '../components/StatRadarChart';
import StatBarChart from '../components/StatBarChart';

const POSITION_LABEL = {
  OH: 'Outside Hitter', OPP: 'Opposite', MB: 'Middle Blocker',
  S: 'Setter', L: 'Libero', DS: 'Defensive Specialist',
};

const pct = (num, den) => den > 0 ? Math.min(100, (num / den) * 100) : 0;

export default function PlayerProfilePage() {
  const { id } = useParams();
  const [career, setCareer] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [matchLog, setMatchLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.careerStats(id).catch(() => null),
      api.tournamentStats(id).catch(() => ({ tournamentStats: [] })),
      api.matchLog(id, 30).catch(() => ({ matchLog: [] })),
    ]).then(([c, t, m]) => {
      setCareer(c);
      setTournaments(t?.tournamentStats || []);
      setMatchLog(m?.matchLog || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <Skeleton avatar active paragraph={{ rows: 3 }} />
        <div style={{ height: 24 }} />
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }
  if (!career?.player) return <Empty description="Тоглогч олдсонгүй" />;

  const player = career.player;
  const c = career.career;

  return (
    <div>
      {/* HERO */}
      <div className="profile-hero">
        <div
          className="avatar"
          style={player.photoUrl ? { backgroundImage: `url(${player.photoUrl})`, backgroundSize: 'cover' } : {}}
        >
          {!player.photoUrl && (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
              <UserOutlined />
            </span>
          )}
        </div>
        <div>
          <div className="meta-row">
            <span className="pill accent" style={{ fontSize: 14, padding: '6px 14px' }}>#{player.jerseyNumber}</span>
            {player.position && <span className="pill primary">{POSITION_LABEL[player.position] || player.position}</span>}
            {player.isLibero && <span className="pill warning">LIBERO</span>}
            {player.Team && (
              <Link to={`/teams/${player.Team.id}`} className="pill muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {player.Team.logoUrl && <img src={player.Team.logoUrl} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />}
                {player.Team.name}
              </Link>
            )}
          </div>
          <h1>{player.fullName}</h1>
          <div className="muted" style={{ fontSize: 16, marginBottom: 4 }}>
            {c ? `${c.matchesPlayed} тоглолт · ${c.tournamentsPlayed} тэмцээн` : 'Хараахан тоглолтод оролцоогүй'}
          </div>
          {player.spotlightNote && (
            <div style={{ marginTop: 14, padding: '10px 16px', background: 'var(--accent)',
              borderRadius: 12, color: '#fff',
              fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 20px rgba(255, 87, 68, 0.30)' }}>
              <FireOutlined /> {player.spotlightNote}
            </div>
          )}
        </div>
      </div>

      {!c && (
        <Empty
          style={{ margin: '40px 0' }}
          description="Энэ тоглогчийн статистик хараахан бүртгэгдээгүй байна."
        />
      )}

      {c && (
        <>
          {/* Headline stat blocks (career totals) */}
          <div className="stat-blocks">
            <div className="stat-block accent">
              <div className="label">Career оноо</div>
              <div className="value">{c.totalPoints}</div>
            </div>
            <div className="stat-block">
              <div className="label">Довтолгоо kills</div>
              <div className="value">{c.attackSuccesses}</div>
            </div>
            <div className="stat-block">
              <div className="label">Хаалт stuffs</div>
              <div className="value">{c.blockSuccesses}</div>
            </div>
            <div className="stat-block">
              <div className="label">Aces</div>
              <div className="value" style={{ color: 'var(--success)' }}>{c.serveSuccesses}</div>
            </div>
            <div className="stat-block">
              <div className="label">Хамгаалалт</div>
              <div className="value">{c.digSuccesses}</div>
            </div>
            <div className="stat-block">
              <div className="label">Үр ашгийн хувь</div>
              <div className="value">{(c.efficiencyRate * 100).toFixed(1)}%</div>
            </div>
          </div>

          <Tabs
            defaultActiveKey="charts"
            items={[
              {
                key: 'charts',
                label: <span><BarChartOutlined /> График</span>,
                children: <ChartsTab career={c} />,
              },
              {
                key: 'tournaments',
                label: <span><TrophyOutlined /> Тэмцээнүүд ({tournaments.length})</span>,
                children: <TournamentsTab rows={tournaments} />,
              },
              {
                key: 'matches',
                label: <span><CalendarOutlined /> Тоглолтын лог ({matchLog.length})</span>,
                children: <MatchLogTab rows={matchLog} />,
              },
              {
                key: 'breakdown',
                label: 'Дэлгэрэнгүй',
                children: <BreakdownTab career={c} />,
              },
            ]}
          />
        </>
      )}
    </div>
  );
}

// ---- Charts tab (radar + bar) ---------------------------------------------

function ChartsTab({ career }) {
  // Normalise totals into 0–100 axes for the radar — comparison against
  // typical max values seen in a club season (best-effort).
  const ceiling = {
    attack: 200, block: 80, serve: 60, reception: 250, dig: 200, set: 200,
  };
  const radarData = [
    Math.min(100, (career.attackSuccesses / ceiling.attack) * 100),
    Math.min(100, (career.blockSuccesses / ceiling.block) * 100),
    Math.min(100, (career.serveSuccesses / ceiling.serve) * 100),
    Math.min(100, (career.receptionSuccesses / ceiling.reception) * 100),
    Math.min(100, (career.digSuccesses / ceiling.dig) * 100),
  ].map(v => Math.round(v));

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
      <Card title="Career skill radar">
        <StatRadarChart
          primary={{
            name: 'Career',
            categories: ['Довтолгоо', 'Хаалт', 'Серв', 'Хүлээн авалт', 'Хамгаалалт'],
            data: radarData,
          }}
        />
      </Card>
      <Card title="Нийт онооны эх үүсвэр">
        <StatBarChart
          categories={['Career']}
          series={[
            { name: 'Довтолгоо', data: [career.attackSuccesses], color: '#1A3E8C' },
            { name: 'Хаалт', data: [career.blockSuccesses], color: '#FFD000' },
            { name: 'Серв', data: [career.serveSuccesses], color: '#FF6645' },
          ]}
        />
      </Card>
    </div>
  );
}

// ---- Per-tournament accordion --------------------------------------------

function TournamentsTab({ rows }) {
  if (rows.length === 0) {
    return <Empty description="Аль ч тэмцээний статистик бүртгэгдээгүй байна." />;
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
        { title: 'Тоглолт', dataIndex: 'matchesPlayed', width: 80, align: 'right' },
        { title: 'Сет', dataIndex: 'setsPlayed', width: 60, align: 'right' },
        { title: 'Оноо', dataIndex: 'totalPoints', width: 80, align: 'right',
          render: v => <strong style={{ color: 'var(--accent)' }}>{v}</strong> },
        { title: 'Kills', dataIndex: 'attackSuccesses', width: 70, align: 'right' },
        { title: 'Stuff', dataIndex: 'blockSuccesses', width: 70, align: 'right' },
        { title: 'Aces', dataIndex: 'serveSuccesses', width: 70, align: 'right' },
        { title: 'Үр ашиг', dataIndex: 'efficiencyRate', width: 90, align: 'right',
          render: v => `${(v * 100).toFixed(1)}%` },
      ]}
      dataSource={rows}
    />
  );
}

// ---- Per-match log ---------------------------------------------------------

function MatchLogTab({ rows }) {
  if (rows.length === 0) {
    return <Empty description="Хараахан ямар нэг тоглолтод бүртгэгдээгүй байна." />;
  }
  return (
    <Table
      rowKey={(r) => r.id}
      pagination={{ pageSize: 10 }}
      size="middle"
      columns={[
        {
          title: 'Огноо',
          width: 120,
          render: (_, r) => r.Match?.scheduledAt
            ? dayjs(r.Match.scheduledAt).format('YYYY-MM-DD')
            : '—',
        },
        {
          title: 'Тоглолт',
          render: (_, r) => {
            if (!r.Match) return '—';
            const home = r.Match.homeTeam?.shortName || r.Match.homeTeam?.name || '—';
            const away = r.Match.awayTeam?.shortName || r.Match.awayTeam?.name || '—';
            return (
              <Link to={`/matches/${r.Match.id}`} style={{ fontWeight: 600 }}>
                {home} vs {away}
              </Link>
            );
          },
        },
        {
          title: 'Тэмцээн',
          render: (_, r) => r.Match?.Tournament?.name || <span className="muted">—</span>,
        },
        { title: 'Оноо', dataIndex: 'totalPoints', width: 80, align: 'right',
          render: v => <strong style={{ color: 'var(--accent)' }}>{v}</strong> },
        { title: 'K', dataIndex: 'attackSuccesses', width: 50, align: 'right' },
        { title: 'B', dataIndex: 'blockSuccesses', width: 50, align: 'right' },
        { title: 'A', dataIndex: 'serveSuccesses', width: 50, align: 'right' },
        { title: 'Алдаа', dataIndex: 'errors', width: 70, align: 'right',
          render: v => <span style={{ color: v > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{v}</span> },
      ]}
      dataSource={rows}
    />
  );
}

// ---- Detailed breakdown (legacy view) -------------------------------------

function BreakdownTab({ career }) {
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
      <Card size="small" title="Довтолгоо">
        <StatRow label="Амжилттай (kills)" value={career.attackSuccesses} accent />
        <StatRow label="Оролдлого" value={career.attackAttempts} />
        <StatRow label="Hit %" value={`${pct(career.attackSuccesses, career.attackAttempts).toFixed(1)}%`} />
      </Card>
      <Card size="small" title="Серв">
        <StatRow label="Aces" value={career.serveSuccesses} accent />
        <StatRow label="Оролдлого" value={career.serveAttempts} />
        <StatRow label="Ace %" value={`${pct(career.serveSuccesses, career.serveAttempts).toFixed(1)}%`} />
      </Card>
      <Card size="small" title="Хаалт">
        <StatRow label="Stuffs" value={career.blockSuccesses} accent />
        <StatRow label="Оролдлого" value={career.blockAttempts} />
      </Card>
      <Card size="small" title="Хамгаалалт / Хүлээн авалт">
        <StatRow label="Dig good" value={career.digSuccesses} />
        <StatRow label="Dig attempts" value={career.digAttempts} />
        <StatRow label="Reception good" value={career.receptionSuccesses} />
        <StatRow label="Reception attempts" value={career.receptionAttempts} />
      </Card>
      <Card size="small" title="Нийт алдаа">
        <StatRow label="Нийт алдаа" value={career.errors} danger />
        <StatRow label="Тоглолт" value={career.matchesPlayed} />
        <StatRow label="Сет" value={career.setsPlayed} />
        <StatRow label="Үр ашгийн хувь" value={`${(career.efficiencyRate * 100).toFixed(1)}%`} />
      </Card>
    </div>
  );
}

function StatRow({ label, value, accent, danger }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="muted" style={{ fontSize: 13 }}>{label}</span>
      <strong style={{
        color: danger ? 'var(--danger)' : (accent ? 'var(--accent)' : 'var(--text)'),
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</strong>
    </div>
  );
}
