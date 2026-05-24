// All registrations across all tournaments — admin overview & decisions.
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Input, Select, message, Avatar, Space, Segmented, Empty } from 'antd';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { registrations as api } from '../../api';

const STATUS_COLOR = {
  PENDING: 'gold', APPROVED: 'green', REJECTED: 'red', WITHDRAWN: 'default',
};

export default function RegistrationsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const [decideOpen, setDecideOpen] = useState(null);
  const [decideStatus, setDecideStatus] = useState('APPROVED');
  const [adminNote, setAdminNote] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const d = await api.list();
      setItems(d.registrations || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() =>
    statusFilter === 'ALL' ? items : items.filter(r => r.status === statusFilter)
  , [items, statusFilter]);

  const decide = async () => {
    setBusy(true);
    try {
      await api.decide(decideOpen.id, decideStatus, adminNote);
      message.success('Шийдвэр хадгалагдлаа');
      setDecideOpen(null); setAdminNote('');
      reload();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const counts = useMemo(() => ({
    ALL:       items.length,
    PENDING:   items.filter(x => x.status === 'PENDING').length,
    APPROVED:  items.filter(x => x.status === 'APPROVED').length,
    REJECTED:  items.filter(x => x.status === 'REJECTED').length,
    WITHDRAWN: items.filter(x => x.status === 'WITHDRAWN').length,
  }), [items]);

  const cols = [
    { title: 'Тэмцээн', render: (_, r) => (
      <Link to={`/tournaments/${r.tournamentId}`} style={{ color: 'var(--text)', fontWeight: 700 }}>
        {r.Tournament?.name || `#${r.tournamentId}`}
      </Link>
    ) },
    { title: 'Баг', render: (_, r) => (
      <Link to={`/teams/${r.teamId}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
        {r.Team?.logoUrl
          ? <Avatar shape="square" size={28} src={r.Team.logoUrl} />
          : <Avatar shape="square" size={28}>{(r.Team?.shortName || r.Team?.name || '?').slice(0, 2)}</Avatar>}
        <strong>{r.Team?.name}</strong>
      </Link>
    ) },
    { title: 'Хүсэлт гаргасан', width: 200, render: (_, r) =>
      r.coach ? (
        <Space>
          <Avatar size={20} src={r.coach.picture}>{r.coach.name?.[0]}</Avatar>
          {r.coach.name}
        </Space>
      ) : '—',
    },
    { title: 'Тэмдэглэл', dataIndex: 'note', render: (n) => n || <span className="dim">—</span> },
    { title: 'Огноо', dataIndex: 'createdAt', width: 160,
      render: d => dayjs(d).format('YYYY-MM-DD HH:mm') },
    { title: 'Төлөв', dataIndex: 'status', width: 110,
      render: s => <Tag color={STATUS_COLOR[s]}>{s}</Tag> },
    { title: 'Үйлдэл', width: 200, render: (_, r) => r.status === 'PENDING' ? (
      <Space size={4}>
        <Button size="small" type="primary"
          onClick={() => { setDecideOpen(r); setDecideStatus('APPROVED'); setAdminNote(''); }}>
          Зөвшөөрөх
        </Button>
        <Button size="small" danger
          onClick={() => { setDecideOpen(r); setDecideStatus('REJECTED'); setAdminNote(''); }}>
          Татгалзах
        </Button>
      </Space>
    ) : (
      r.adminNote ? <span className="muted" style={{ fontSize: 12 }}>"{r.adminNote}"</span> : ''
    ) },
  ];

  return (
    <>
      <Card size="small" title="Тэмцээний бүртгэлийн хүсэлт"
        extra={
          <Segmented
            value={statusFilter} onChange={setStatusFilter}
            options={[
              { value: 'ALL',      label: `Бүгд (${counts.ALL})` },
              { value: 'PENDING',  label: `Хүлээгдэж (${counts.PENDING})` },
              { value: 'APPROVED', label: `Зөвшөөрсөн (${counts.APPROVED})` },
              { value: 'REJECTED', label: `Татгалзсан (${counts.REJECTED})` },
              { value: 'WITHDRAWN',label: `Цуцалсан (${counts.WITHDRAWN})` },
            ]}
          />
        }
        style={{ marginBottom: 16 }}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Дасгалжуулагчид багаа тэмцээнд бүртгүүлэхээр хүсэлт илгээх боломжтой. Зөвшөөрсний дараа баг автоматаар тэмцээнд оруулагдана.
        </p>
      </Card>
      <Table
        rowKey="id" loading={loading} columns={cols} dataSource={filtered}
        pagination={{ pageSize: 15 }}
        locale={{ emptyText: <Empty description="Тохирох хүсэлт алга" /> }}
      />

      <Modal
        title={`${decideOpen?.Team?.name} → ${decideOpen?.Tournament?.name || ''}`}
        open={!!decideOpen}
        onCancel={() => setDecideOpen(null)}
        onOk={decide}
        confirmLoading={busy}
        okText={decideStatus === 'APPROVED' ? 'Зөвшөөрөх' : 'Татгалзах'}
        okButtonProps={decideStatus === 'REJECTED' ? { danger: true } : {}}
        cancelText="Цуцлах"
      >
        <Select
          value={decideStatus} onChange={setDecideStatus}
          style={{ width: '100%', marginBottom: 12 }}
          options={[
            { value: 'APPROVED', label: 'Зөвшөөрөх' },
            { value: 'REJECTED', label: 'Татгалзах' },
          ]}
        />
        <Input.TextArea rows={3} maxLength={500} showCount
          placeholder="Тайлбар (заавал биш)"
          value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
        />
      </Modal>
    </>
  );
}
