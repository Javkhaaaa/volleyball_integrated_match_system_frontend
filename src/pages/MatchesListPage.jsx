import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Select, Input, message, Tag, Space, DatePicker,
  Avatar, Segmented, Skeleton, Empty, Popconfirm,
} from 'antd';
import {
  PlusOutlined, AppstoreOutlined, UnorderedListOutlined, CalendarOutlined,
  EnvironmentOutlined, UserOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { matches as api, teams as teamsApi, tournaments as tournApi, admin as adminApi } from '../api';
import PageBanner from '../components/PageBanner';
import { isAdmin, canRecordMatch } from '../utils/permissions';

const STATUS_TAG = {
  SCHEDULED: { color: 'default',    label: 'Хуанлид' },
  LIVE:      { color: 'red',        label: 'LIVE' },
  FINISHED:  { color: 'success',    label: 'Дууссан' },
  CANCELLED: { color: 'orange',     label: 'Цуцалсан' },
};

export default function MatchesListPage() {
  const user = useSelector(s => s.auth.user);
  const admin = isAdmin(user);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tourns, setTourns] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tournFilter, setTournFilter] = useState('ALL');

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [m, t, tt, st] = await Promise.all([
        api.list(),
        teamsApi.list(),
        tournApi.list(),
        admin
          ? adminApi.listUsers({ role: 'STATISTICIAN' }).catch(() => ({ users: [] }))
          : Promise.resolve({ users: [] }),
      ]);
      setItems(m.matches);
      setTeams(t.teams);
      setTourns(tt.tournaments);
      setStats(st.users || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [admin]);

  const filtered = useMemo(() => {
    return items.filter(m => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (tournFilter !== 'ALL' && m.tournamentId !== tournFilter) return false;
      return true;
    });
  }, [items, statusFilter, tournFilter]);

  const onCreate = async () => {
    setBusy(true);
    try {
      const v = await form.validateFields();
      await api.create({
        ...v,
        scheduledAt: v.scheduledAt ? v.scheduledAt.toISOString() : null,
      });
      message.success('Тоглолт төлөвлөгдлөө');
      setOpen(false); form.resetFields(); reload();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const onAssignStat = async (matchId, statisticianId) => {
    try {
      await api.setStatistician(matchId, statisticianId);
      message.success(statisticianId ? 'Статистикч оноосон' : 'Статистикч хасагдсан');
      reload();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Алдаа');
    }
  };

  const statOptions = stats.map(s => ({
    value: s.id,
    label: <Space>{s.picture ? <Avatar size={18} src={s.picture} /> : <Avatar size={18}>{s.name?.[0]}</Avatar>}{s.name}</Space>,
  }));

  const cols = [
    { title: '#', dataIndex: 'id', width: 60, render: (id) => <span className="dim">#{id}</span> },
    {
      title: 'Тоглолт', render: (_, r) => (
        <a onClick={() => navigate(`/matches/${r.id}`)} style={{ color: 'var(--text)' }}>
          <Space>
            <strong>{r.homeTeam?.name || '—'}</strong>
            <span className="dim">vs</span>
            <strong>{r.awayTeam?.name || '—'}</strong>
          </Space>
        </a>
      ),
    },
    { title: 'Тэмцээн', dataIndex: 'tournamentId', width: 180,
      render: (tid) => {
        const t = tourns.find(x => x.id === tid);
        return t ? <Tag>{t.name}</Tag> : <span className="dim">—</span>;
      },
    },
    { title: 'Сетүүд', width: 90,
      render: (_, r) => <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{r.setsWonHome} – {r.setsWonAway}</strong>,
    },
    { title: 'Эхлэх', dataIndex: 'scheduledAt', width: 150,
      render: d => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : <span className="dim">—</span>,
    },
    { title: 'Төлөв', dataIndex: 'status', width: 110,
      render: s => <Tag color={STATUS_TAG[s]?.color}>{STATUS_TAG[s]?.label || s}</Tag>,
    },
    {
      title: 'Статистикч', dataIndex: 'statisticianId', width: 220,
      render: (sid, r) => admin ? (
        <Select
          allowClear showSearch
          placeholder="Сонгох"
          value={sid || undefined}
          onChange={(v) => onAssignStat(r.id, v ?? null)}
          options={statOptions}
          optionFilterProp="label"
          filterOption={(input, opt) => {
            const s = stats.find(x => x.id === opt.value);
            return (s?.name || '').toLowerCase().includes(input.toLowerCase());
          }}
          style={{ width: '100%' }} size="small"
        />
      ) : (sid ? <Tag>{stats.find(s => s.id === sid)?.name || `#${sid}`}</Tag> : <span className="dim">—</span>),
    },
    {
      title: '', width: 200,
      render: (_, r) => {
        const canRecord = canRecordMatch(user, r) && r.status !== 'FINISHED';
        return (
          <Space size={4}>
            <Button onClick={() => navigate(`/matches/${r.id}`)}>Үзэх</Button>
            {canRecord && (
              <Button type="primary" onClick={() => navigate(`/matches/${r.id}/stat-entry`)}>
                Бүртгэх
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <PageBanner
        kicker="Live статистик"
        title="Тоглолтууд"
        lede="Бүх тоглолтын хуанли, шууд тоглолт, дууссаны үр дүн."
        actions={
          <>
            <Segmented value={statusFilter} onChange={setStatusFilter}
              options={[
                { value: 'ALL',       label: 'Бүгд' },
                { value: 'LIVE',      label: 'Шууд' },
                { value: 'SCHEDULED', label: 'Хуанли' },
                { value: 'FINISHED',  label: 'Дууссан' },
              ]} />
            <Select
              value={tournFilter}
              onChange={setTournFilter}
              style={{ width: 220 }}
              popupMatchSelectWidth={false}
              showSearch
              optionFilterProp="label"
              options={[
                { value: 'ALL', label: 'Бүх тэмцээн' },
                ...tourns.map(t => ({ value: t.id, label: t.name })),
              ]}
              optionRender={(opt) => (
                <span title={opt.label} style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {opt.label}
                </span>
              )}
            />
            <Button.Group>
              <Button icon={<AppstoreOutlined />} type={view === 'grid' ? 'primary' : 'default'} onClick={() => setView('grid')} />
              <Button icon={<UnorderedListOutlined />} type={view === 'table' ? 'primary' : 'default'} onClick={() => setView('table')} />
            </Button.Group>
            {admin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}
                style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}>
                Шинэ тоглолт
              </Button>
            )}
          </>
        }
      />

      {loading ? (
        <div className="cards-grid">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i}><Skeleton active /></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-card">
          <Empty description="Тохирох тоглолт алга" />
          {admin && (
            <div style={{ marginTop: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}
                style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}>
                Эхний тоглолт үүсгэх
              </Button>
            </div>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="cards-grid">
          {filtered.map(m => (
            <MatchCard
              key={m.id} m={m}
              onClick={() => navigate(`/matches/${m.id}`)}
              canRecord={canRecordMatch(user, m) && m.status !== 'FINISHED'}
              onRecord={() => navigate(`/matches/${m.id}/stat-entry`)}
            />
          ))}
        </div>
      ) : (
        <Card><Table rowKey="id" columns={cols} dataSource={filtered} pagination={{ pageSize: 12 }} /></Card>
      )}

      <Modal title="Шинэ тоглолт" open={open} onCancel={() => setOpen(false)}
        onOk={onCreate} okText="Хадгалах" cancelText="Цуцлах" confirmLoading={busy} width={560}>
        <Form form={form} layout="vertical">
          <Form.Item name="tournamentId" label="Тэмцээн">
            <Select
              allowClear showSearch optionFilterProp="label"
              popupMatchSelectWidth={false}
              options={tourns.map(t => ({ value: t.id, label: t.name }))}
              optionRender={(opt) => (
                <span title={opt.label} style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {opt.label}
                </span>
              )}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="homeTeamId" label="Гэрийн баг" rules={[{ required: true }]}>
              <Select options={teams.map(t => ({ value: t.id, label: t.name }))} optionFilterProp="label" showSearch />
            </Form.Item>
            <Form.Item name="awayTeamId" label="Зочид баг" rules={[{ required: true }]}>
              <Select options={teams.map(t => ({ value: t.id, label: t.name }))} optionFilterProp="label" showSearch />
            </Form.Item>
          </div>
          <Form.Item name="statisticianId" label="Хариуцах статистикч">
            <Select allowClear placeholder="Сонголт хийгээгүй бол анх start дарсан статистикчид оноогдоно"
              options={statOptions} optionFilterProp="label" showSearch />
          </Form.Item>
          <Form.Item name="venue" label="Талбай / газар">
            <Input prefix={<EnvironmentOutlined />} placeholder="Жнь: Бөмбөгийн ордон" />
          </Form.Item>
          <Form.Item name="scheduledAt" label="Эхлэх цаг">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар">
            <Input.TextArea rows={2} maxLength={300} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function MatchCard({ m, onClick, canRecord, onRecord }) {
  const isLive = m.status === 'LIVE';
  const isDone = m.status === 'FINISHED';
  return (
    <div className="match-card" onClick={onClick}>
      <div className="match-meta">
        {isLive
          ? <span className="pill live">Live · Set {m.currentSetNumber || 1}</span>
          : <span className={`pill ${isDone ? 'success' : 'muted'}`}>
              {STATUS_TAG[m.status]?.label || m.status}
            </span>}
        {m.scheduledAt && <span><CalendarOutlined /> {dayjs(m.scheduledAt).format('MM.DD HH:mm')}</span>}
      </div>
      <div className="teams">
        <div className="team">
          {m.homeTeam?.logoUrl ? <img className="logo" src={m.homeTeam.logoUrl} alt="" /> : <div className="logo" />}
          <div className="name">{m.homeTeam?.name || 'Home'}</div>
        </div>
        <div className="score">{(isLive || isDone) ? `${m.setsWonHome}–${m.setsWonAway}` : 'VS'}</div>
        <div className="team right">
          {m.awayTeam?.logoUrl ? <img className="logo" src={m.awayTeam.logoUrl} alt="" /> : <div className="logo" />}
          <div className="name">{m.awayTeam?.name || 'Away'}</div>
        </div>
      </div>
      {m.venue && <div className="venue"><EnvironmentOutlined /> {m.venue}</div>}
      {canRecord && (
        <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); onRecord(); }}>
          Бүртгэлд орох
        </Button>
      )}
    </div>
  );
}
