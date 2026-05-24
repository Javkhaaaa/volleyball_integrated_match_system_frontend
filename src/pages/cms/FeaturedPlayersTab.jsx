import React, { useEffect, useState } from 'react';
import { Card, Table, Switch, InputNumber, Input, Avatar, message, Space } from 'antd';
import { players as api } from '../../api';

export default function FeaturedPlayersTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (q.trim()) params.q = q.trim();
      const d = await api.list(params);
      setItems(d.players);
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []); // eslint-disable-line

  const onToggle = async (id, isFeatured) => {
    try { await api.setFeatured(id, { isFeatured }); reload(); }
    catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };
  const onOrder = async (id, featuredOrder) => {
    try { await api.setFeatured(id, { isFeatured: true, featuredOrder }); reload(); }
    catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };
  const onNote = async (id, spotlightNote) => {
    try { await api.setFeatured(id, { isFeatured: true, spotlightNote }); reload(); message.success('Хадгалсан'); }
    catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };

  const cols = [
    {
      title: '', dataIndex: 'photoUrl', width: 56,
      render: url => url
        ? <Avatar size={40} src={url} />
        : <Avatar size={40} style={{ background: '#1A3E8C' }}>·</Avatar>,
    },
    { title: '#', dataIndex: 'jerseyNumber', width: 50 },
    { title: 'Нэр', dataIndex: 'fullName' },
    { title: 'Баг', dataIndex: 'Team', render: t => t?.name || '—' },
    { title: 'Байр', dataIndex: 'position', width: 70 },
    {
      title: 'Featured', dataIndex: 'isFeatured', width: 100,
      render: (v, r) => <Switch checked={v} onChange={(c) => onToggle(r.id, c)} />,
    },
    {
      title: 'Эрэмбэ', dataIndex: 'featuredOrder', width: 90,
      render: (v, r) => <InputNumber min={0} max={99} size="small" value={v} disabled={!r.isFeatured}
        onChange={(n) => onOrder(r.id, n ?? 0)} />,
    },
    {
      title: 'Spotlight тэмдэглэл', dataIndex: 'spotlightNote', width: 240,
      render: (v, r) => (
        <Input.TextArea
          size="small" rows={1} disabled={!r.isFeatured}
          defaultValue={v || ''}
          placeholder="Жнь: Сүүлийн 5 тоглолтод 142 оноо"
          maxLength={200}
          onBlur={(e) => e.target.value !== (v || '') && onNote(r.id, e.target.value)}
        />
      ),
    },
  ];

  return (
    <>
      <Card size="small" title="Онцлох тоглогчид" style={{ marginBottom: 16 }}>
        <p style={{ color: '#666', margin: 0, fontSize: 13 }}>
          Switch-ийг идэвхжүүлсэн тоглогчид нүүр хуудсанд "Онцлох тоглогчид" хэсэгт гарна.
          Тоглогчийн зургийг "Багууд" → багийн drawer-аас upload хийнэ.
        </p>
      </Card>
      <Space style={{ marginBottom: 12 }}>
        <Input.Search
          placeholder="Тоглогчоор хайх"
          allowClear
          onSearch={(v) => { setQ(v); setTimeout(reload, 0); }}
          style={{ width: 320 }}
        />
      </Space>
      <Table rowKey="id" loading={loading} columns={cols} dataSource={items} pagination={{ pageSize: 15 }} />
    </>
  );
}
