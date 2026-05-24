import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Empty, Row, Col, Tabs, Button, Space, Tag, Skeleton } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { matches as api } from '../api';
import { subscribeMatch } from '../api/socket';
import LiveScoreboard from '../components/LiveScoreboard';
import ActionLog from '../components/ActionLog';
import MatchStatsTable from '../components/MatchStatsTable';
import { canRecordMatch } from '../utils/permissions';

export default function MatchScoreboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);

  const [snap, setSnap] = useState(null);
  const [rallies, setRallies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const reload = async () => {
    try {
      const [s, p, st] = await Promise.all([
        api.get(id),
        api.playByPlay(id),
        api.stats(id).catch(() => null),
      ]);
      setSnap(s);
      setRallies(p.rallies || []);
      setStats(st);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    reload();
    const matchId = parseInt(id, 10);
    const off = subscribeMatch(matchId, (next) => {
      setSnap(next);
      Promise.all([api.playByPlay(id), api.stats(id).catch(() => null)])
        .then(([p, st]) => { setRallies(p.rallies || []); setStats(st); })
        .catch(() => {});
    });
    return off;
  }, [id]);

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 4 }} />
        <div style={{ height: 24 }} />
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }
  if (!snap) return <Empty description="Тоглолт олдсонгүй" />;

  const canRecord = canRecordMatch(user, snap.match) && snap.match.status !== 'FINISHED';

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/matches')}>
          Тоглолтын жагсаалт
        </Button>
        <Space wrap>
          {canRecord && (
            <Button type="primary" icon={<EditOutlined />}
              onClick={() => navigate(`/matches/${id}/stat-entry`)}
              style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}>
              Stat entry
            </Button>
          )}
          <Button icon={<FilePdfOutlined />} href={api.reportPdfUrl(id)} target="_blank">PDF тайлан</Button>
          <Button icon={<FileExcelOutlined />} href={api.reportXlsxUrl(id)}>Excel тайлан</Button>
        </Space>
      </div>

      <LiveScoreboard snap={snap} />

      <Tabs
        activeKey={tab} onChange={setTab}
        items={[
          { key: 'overview', label: 'Тойм',
            children: <OverviewTab snap={snap} rallies={rallies} /> },
          { key: 'stats', label: 'Box score',
            children: <StatsTab stats={stats} /> },
          { key: 'pbp', label: 'Play by play',
            children: <PbpTab rallies={rallies} /> },
        ]}
      />
    </div>
  );
}

function OverviewTab({ snap, rallies }) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={14}>
        <Card title="Сетийн дэлгэрэнгүй" size="small">
          {snap.sets?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {snap.sets.map(s => {
                const homeWon = s.winnerSide === 'HOME';
                const awayWon = s.winnerSide === 'AWAY';
                return (
                  <div key={s.setNumber} style={{
                    display: 'grid', gridTemplateColumns: '60px 1fr auto auto', gap: 12, alignItems: 'center',
                    padding: '12px 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <strong>Set {s.setNumber}</strong>
                    <div className="dim">
                      {s.status === 'LIVE' && <Tag color="red">LIVE</Tag>}
                      {s.status === 'FINISHED' && <Tag color="success">Дууссан</Tag>}
                      {s.status === 'PENDING' && <Tag>Хүлээгдэж буй</Tag>}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ color: homeWon ? 'var(--accent)' : 'var(--text)' }}>{s.scoreHome}</span>
                      {' – '}
                      <span style={{ color: awayWon ? 'var(--accent)' : 'var(--text)' }}>{s.scoreAway}</span>
                    </div>
                    {s.winnerSide && <Tag color="gold">{s.winnerSide}</Tag>}
                  </div>
                );
              })}
            </div>
          ) : <Empty description="Сет эхлээгүй" />}
        </Card>

        {snap.rally && (
          <Card title={`Идэвхтэй rally #${snap.rally.rallyNumber}`} size="small" style={{ marginTop: 16 }}>
            <div className="muted" style={{ marginBottom: 8 }}>Эхэнд серв: <Tag>{snap.rally.servingSideAtStart}</Tag></div>
            <ol style={{ paddingLeft: 20, margin: 0, color: 'var(--text-subtle)' }}>
              {snap.rally.events?.map((e, i) => (
                <li key={i} style={{ padding: '4px 0' }}>
                  <strong>{e.type}</strong>{' '}
                  <span className="muted">({e.result})</span>{' '}
                  · <Tag color={e.actorSide === 'HOME' ? 'blue' : 'orange'}>{e.actorSide}</Tag>
                  #{e.playerId}
                </li>
              ))}
            </ol>
          </Card>
        )}
      </Col>
      <Col xs={24} md={10}>
        <Card title="Үйл явдлын лог" size="small">
          <ActionLog rallies={rallies} />
        </Card>
      </Col>
    </Row>
  );
}

function StatsTab({ stats }) {
  if (!stats) return <Empty description="Статистик ачааллаагүй" />;
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <MatchStatsTable
        players={stats.homePlayers}
        teamTotals={stats.teamTotals.home}
        label={`${stats.match.homeTeam?.name || 'Home'} (${stats.match.setsWonHome})`}
      />
      <MatchStatsTable
        players={stats.awayPlayers}
        teamTotals={stats.teamTotals.away}
        label={`${stats.match.awayTeam?.name || 'Away'} (${stats.match.setsWonAway})`}
      />
    </Space>
  );
}

function PbpTab({ rallies }) {
  return <ActionLog rallies={rallies} />;
}
