import React, { useEffect, useState } from 'react';
import { Card, Table, Switch, InputNumber, Avatar, message, Select, Space, Tag } from 'antd';
import { teams as api, admin as adminApi } from '../../api';

export default function FeaturedTeamsTab() {
  const [items, setItems] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        api.list({}),
        adminApi.listUsers({ role: 'COACH' }).catch(() => ({ users: [] })),
      ]);
      setItems(t.teams);
      setCoaches(c.users);
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []); // eslint-disable-line

  const onToggle = async (id, isFeatured) => {
    try { await api.setFeatured(id, isFeatured); reload(); }
    catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };
  const onOrder = async (id, featuredOrder) => {
    try { await api.setFeatured(id, true, featuredOrder); reload(); }
    catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };
  const onAssignCoach = async (id, coachId) => {
    try {
      await api.setCoach(id, coachId);
      message.success(coachId ? 'Дасгалжуулагч оноосон' : 'Дасгалжуулагч хасагдсан');
      reload();
    } catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };

  const coachOptions = coaches.map(c => ({
    value: c.id,
    label: (
      <Space>
        {c.picture ? <Avatar size={18} src={c.picture} /> : <Avatar size={18}>{c.name?.[0]}</Avatar>}
        {c.name} <span style={{ color: '#888', fontSize: 11 }}>{c.email}</span>
      </Space>
    ),
  }));

  const cols = [
    {
      title: '', dataIndex: 'logoUrl', width: 56,
      render: url => url
        ? <Avatar shape="square" size={40} src={url} />
        : <Avatar shape="square" size={40} style={{ background: '#f0f4ff', color: '#1A3E8C' }}>·</Avatar>,
    },
    { title: 'Нэр', dataIndex: 'name' },
    { title: 'Товч', dataIndex: 'shortName', width: 80 },
    {
      title: 'Дасгалжуулагч', dataIndex: 'coachId', width: 280,
      render: (cid, row) => (
        <Select
          allowClear
          showSearch
          placeholder="Дасгалжуулагч сонгох"
          value={cid || undefined}
          onChange={(v) => onAssignCoach(row.id, v ?? null)}
          options={coachOptions}
          optionFilterProp="label"
          filterOption={(input, opt) => {
            const c = coaches.find(x => x.id === opt.value);
            return (c?.name || '').toLowerCase().includes(input.toLowerCase()) ||
                   (c?.email || '').toLowerCase().includes(input.toLowerCase());
          }}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Featured', dataIndex: 'isFeatured', width: 100,
      render: (v, r) => <Switch checked={v} onChange={(c) => onToggle(r.id, c)} />,
    },
    {
      title: 'Эрэмбэ', dataIndex: 'featuredOrder', width: 90,
      render: (v, r) => <InputNumber min={0} max={99} size="small" value={v} disabled={!r.isFeatured}
        onChange={(n) => onOrder(r.id, n ?? 0)} />,
    },
  ];

  return (
    <>
      <Card size="small" title="Багууд + дасгалжуулагч + featured" style={{ marginBottom: 16 }}>
        <p style={{ color: '#666', margin: 0, fontSize: 13 }}>
          Багт <strong>дасгалжуулагч</strong> оноосноор тэр хүн "Багууд" хуудсаас өөрийн
          багийн тоглогчдыг бүртгүүлэх, мэдээлэл шинэчлэх, лого upload хийх зөвшөөрөл
          авна. Featured switch-ийг идэвхжүүлсэн багууд нүүр хуудсанд гарна.
        </p>
        {coaches.length === 0 && (
          <Tag color="warning" style={{ marginTop: 8 }}>
            Тэмдэглэгдсэн COACH хэрэглэгч байхгүй — Хэрэглэгчид цэснээс role оноогоорой
          </Tag>
        )}
      </Card>
      <Table rowKey="id" loading={loading} columns={cols} dataSource={items} pagination={{ pageSize: 15 }} />
    </>
  );
}
