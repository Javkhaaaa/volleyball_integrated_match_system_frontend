import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Modal, Form, Input, DatePicker, Select, message, Tag,
  Drawer, Space, Switch, InputNumber, Popconfirm, Avatar, Empty, Skeleton,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined,
  CalendarOutlined, AppstoreOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { tournaments as api } from '../api';
import ImageUpload from '../components/ImageUpload';
import PageBanner from '../components/PageBanner';
import dayjs from 'dayjs';

const STATUS = {
  DRAFT:    { color: 'default',    label: 'Ноорог' },
  ONGOING:  { color: 'processing', label: 'Явагдаж буй' },
  FINISHED: { color: 'success',    label: 'Дууссан' },
};

const FORMAT_OPTIONS = [
  { value: 'round-robin', label: 'Round-robin (бүгд бүгдтэйгээ)' },
  { value: 'single-elim', label: 'Single-elimination (нэг шатлалт)' },
  { value: 'double-elim', label: 'Double-elimination (хоёр шатлалт)' },
  { value: 'group-knockout', label: 'Хэсэг + плэйофф' },
  { value: 'league',      label: 'Лиг (улирал)' },
];

export default function TournamentsPage() {
  const user = useSelector(s => s.auth.user);
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('grid'); // grid | table
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const [drawer, setDrawer] = useState(null);
  const [editForm] = Form.useForm();
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const d = await api.list();
      setItems(d.tournaments);
      if (drawer) {
        const r = d.tournaments.find(t => t.id === drawer.id);
        if (r) setDrawer(r);
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    return items.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, statusFilter, search]);

  const onCreate = async () => {
    setBusy(true);
    try {
      const v = await createForm.validateFields();
      const payload = {
        name: v.name,
        format: v.format || null,
        location: v.location || null,
        description: v.description || null,
        status: v.status || 'DRAFT',
        startDate: v.dateRange?.[0]?.format('YYYY-MM-DD') || null,
        endDate:   v.dateRange?.[1]?.format('YYYY-MM-DD') || null,
      };
      const res = await api.create(payload);
      message.success('Тэмцээн үүсгэлээ');
      setCreateOpen(false);
      createForm.resetFields();
      await reload();
      // Open drawer immediately so admin can upload banner
      setDrawer(res.tournament);
      editForm.setFieldsValue(formToFields(res.tournament));
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const openEdit = (t) => {
    setDrawer(t);
    editForm.setFieldsValue(formToFields(t));
  };

  const onSaveEdit = async () => {
    if (!drawer) return;
    setBusy(true);
    try {
      const v = await editForm.validateFields();
      const payload = {
        name: v.name,
        format: v.format || null,
        location: v.location || null,
        description: v.description || null,
        status: v.status,
        startDate: v.dateRange?.[0]?.format('YYYY-MM-DD') || null,
        endDate:   v.dateRange?.[1]?.format('YYYY-MM-DD') || null,
        isFeatured: !!v.isFeatured,
        featuredOrder: v.featuredOrder ?? 0,
      };
      const res = await api.update(drawer.id, payload);
      setDrawer(res.tournament);
      message.success('Хадгаллаа');
      reload();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const onDelete = async (id) => {
    try {
      await api.remove(id);
      message.success('Устгасан');
      if (drawer?.id === id) setDrawer(null);
      reload();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Алдаа');
    }
  };

  const onUploadBanner = async (file) => {
    if (!drawer) return;
    const r = await api.uploadBanner(drawer.id, file);
    setDrawer(r.tournament);
    reload();
  };
  const onRemoveBanner = async () => {
    if (!drawer) return;
    const r = await api.removeBanner(drawer.id);
    setDrawer(r.tournament);
    reload();
  };

  // ----- table view columns
  const cols = [
    {
      title: '', dataIndex: 'bannerUrl', width: 64,
      render: (url) => url
        ? <Avatar shape="square" size={48} src={url} />
        : <Avatar shape="square" size={48} style={{ background: 'var(--bg-raised)' }}>·</Avatar>,
    },
    { title: 'Нэр', dataIndex: 'name',
      render: (n, r) => (
        <a onClick={() => navigate(`/tournaments/${r.id}`)} style={{ color: 'var(--text)', fontWeight: 700 }}>{n}</a>
      ),
    },
    { title: 'Формат', dataIndex: 'format', width: 160, render: f => f || <span className="dim">—</span> },
    { title: 'Эхлэх', dataIndex: 'startDate', width: 110, render: d => d ? dayjs(d).format('YYYY-MM-DD') : '—' },
    { title: 'Дуусах', dataIndex: 'endDate',  width: 110, render: d => d ? dayjs(d).format('YYYY-MM-DD') : '—' },
    { title: 'Газар', dataIndex: 'location', render: l => l || <span className="dim">—</span> },
    { title: 'Төлөв', dataIndex: 'status', width: 130,
      render: s => <Tag color={STATUS[s]?.color}>{STATUS[s]?.label || s}</Tag> },
    { title: 'Featured', dataIndex: 'isFeatured', width: 90, render: v => v ? <Tag color="gold">Featured</Tag> : '' },
    isAdmin && {
      title: '', width: 110,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Тэмцээнийг устгах уу?" okText="Устгах" cancelText="Цуцлах"
            okButtonProps={{ danger: true }} onConfirm={() => onDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(Boolean);

  // Featured tournament for the hero strip. Picks the highest-priority
  // featured row that has a banner so the strip never falls back to a
  // gradient-only placeholder.
  const featuredHero = useMemo(() => {
    return items
      .filter(t => t.isFeatured && t.bannerUrl)
      .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))[0]
      || null;
  }, [items]);

  return (
    <div>
      {featuredHero && (
        <FeaturedHero t={featuredHero} onOpen={() => navigate(`/tournaments/${featuredHero.id}`)} />
      )}
      <PageBanner
        kicker="Volleyball Match"
        title="Тэмцээнүүд"
        lede="Бүх тэмцээний жагсаалт. Дэлгэрэнгүй мэдээлэл, баг, тоглолтын хуваарь, standings харна уу."
        actions={
          <>
            <Input.Search placeholder="Хайх" allowClear
              onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}
              options={[
                { value: 'ALL', label: 'Бүгд' },
                { value: 'DRAFT', label: 'Ноорог' },
                { value: 'ONGOING', label: 'Явагдаж буй' },
                { value: 'FINISHED', label: 'Дууссан' },
              ]} />
            <Button.Group>
              <Button icon={<AppstoreOutlined />} type={view === 'grid' ? 'primary' : 'default'} onClick={() => setView('grid')} />
              <Button icon={<UnorderedListOutlined />} type={view === 'table' ? 'primary' : 'default'} onClick={() => setView('table')} />
            </Button.Group>
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}
                style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}>
                Шинэ тэмцээн
              </Button>
            )}
          </>
        }
      />

      {loading ? (
        <div className="cards-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><Skeleton active /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-card">
          <Empty description="Тэмцээн алга" />
          {isAdmin && (
            <Button type="primary" style={{ marginTop: 16 }} onClick={() => setCreateOpen(true)}>
              Эхний тэмцээн үүсгэх
            </Button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="cards-grid">
          {filtered.map(t => (
            <TournamentCard
              key={t.id}
              t={t}
              isAdmin={isAdmin}
              onOpen={() => navigate(`/tournaments/${t.id}`)}
              onEdit={() => openEdit(t)}
              onDelete={() => onDelete(t.id)}
            />
          ))}
        </div>
      ) : (
        <Card><Table rowKey="id" columns={cols} dataSource={filtered} pagination={{ pageSize: 12 }} /></Card>
      )}

      {/* CREATE modal */}
      <Modal title="Шинэ тэмцээн" open={createOpen} onCancel={() => setCreateOpen(false)}
        onOk={onCreate} okText="Үүсгэх" cancelText="Цуцлах" confirmLoading={busy} width={560}>
        <Form form={createForm} layout="vertical" initialValues={{ status: 'DRAFT' }}>
          <Form.Item name="name" label="Нэр" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="Жнь: МУЗЭ-ийн дээд лиг 2026" />
          </Form.Item>
          <Form.Item name="format" label="Тэмцээний формат">
            <Select options={FORMAT_OPTIONS} placeholder="Сонгох" allowClear />
          </Form.Item>
          <Form.Item name="dateRange" label="Хугацаа">
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="Зохион байгуулагдах газар">
            <Input prefix={<EnvironmentOutlined />} placeholder="Жнь: УБ, Бөмбөгийн ордон" />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар">
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item name="status" label="Эхний төлөв">
            <Select options={Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* EDIT drawer */}
      <Drawer width={620} title={drawer?.name} open={!!drawer} onClose={() => setDrawer(null)}
        extra={<Button onClick={() => navigate(`/tournaments/${drawer?.id}`)}>Public хуудас →</Button>}>
        {drawer && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" title="Banner зураг (16:9, 1280×720+ санал)">
              <ImageUpload
                currentUrl={drawer.bannerUrl}
                onUpload={onUploadBanner}
                onRemove={onRemoveBanner}
                shape="square"
                size={200}
                label="Banner оруулах"
              />
            </Card>
            <Card size="small" title="Дэлгэрэнгүй">
              <Form form={editForm} layout="vertical">
                <Form.Item name="name" label="Нэр" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
                <Form.Item name="format" label="Формат">
                  <Select options={FORMAT_OPTIONS} allowClear />
                </Form.Item>
                <Form.Item name="dateRange" label="Хугацаа"><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="location" label="Газар"><Input prefix={<EnvironmentOutlined />} /></Form.Item>
                <Form.Item name="description" label="Тайлбар">
                  <Input.TextArea rows={3} maxLength={1000} showCount />
                </Form.Item>
                <Form.Item name="status" label="Төлөв">
                  <Select options={Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label }))} />
                </Form.Item>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Form.Item name="isFeatured" label="Онцлох (Нүүр хуудсанд гарна)" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="featuredOrder" label="Эрэмбэ" tooltip="Бага тоо нь эхэнд гарна">
                    <InputNumber min={0} max={99} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Popconfirm title="Тэмцээнийг устгах уу?"
                    description="Бүх холбогдох баг, тоглолтын мэдээлэл алга болно."
                    okText="Устгах" cancelText="Цуцлах" okButtonProps={{ danger: true }}
                    onConfirm={() => onDelete(drawer.id)}>
                    <Button danger icon={<DeleteOutlined />}>Устгах</Button>
                  </Popconfirm>
                  <Button type="primary" loading={busy} onClick={onSaveEdit}>Хадгалах</Button>
                </Space>
              </Form>
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
}

function formToFields(t) {
  return {
    name: t.name,
    format: t.format,
    location: t.location,
    description: t.description,
    status: t.status,
    isFeatured: t.isFeatured,
    featuredOrder: t.featuredOrder ?? 0,
    dateRange: [t.startDate ? dayjs(t.startDate) : null, t.endDate ? dayjs(t.endDate) : null],
  };
}

function FeaturedHero({ t, onOpen }) {
  return (
    <div className="tournament-featured-hero" onClick={onOpen}
      style={{ backgroundImage: `url(${t.bannerUrl})` }}>
      <div className="overlay" />
      <div className="content">
        <span className="kicker">Онцлох тэмцээн</span>
        <h2>{t.name}</h2>
        <div className="meta">
          {(t.startDate || t.endDate) && (
            <span><CalendarOutlined /> {t.startDate ? dayjs(t.startDate).format('YYYY.MM.DD') : '?'}{t.endDate ? ` — ${dayjs(t.endDate).format('YYYY.MM.DD')}` : ''}</span>
          )}
          {t.location && <span><EnvironmentOutlined /> {t.location}</span>}
          {t.format && <span className="format-chip">{t.format}</span>}
        </div>
      </div>
    </div>
  );
}

function TournamentCard({ t, isAdmin, onOpen, onEdit, onDelete }) {
  const status = STATUS[t.status];
  return (
    <div className="match-card" onClick={onOpen} style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          aspectRatio: '16/8',
          background: t.bannerUrl
            ? `url(${t.bannerUrl}) center/cover`
            : 'linear-gradient(135deg, var(--primary), var(--primary-active))',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(14,18,48,0.0) 30%, rgba(14,18,48,0.85) 100%)',
        }} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
          <span className={`pill ${t.status === 'ONGOING' ? 'live' : t.status === 'FINISHED' ? 'success' : 'muted'}`}>
            {status?.label || t.status}
          </span>
          {t.isFeatured && <span className="pill accent">Featured</span>}
        </div>
      </div>
      <div style={{ padding: 18 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.2, color: 'var(--accent)' }}>{t.name}</h3>
        <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(t.startDate || t.endDate) && (
            <span><CalendarOutlined /> {t.startDate ? dayjs(t.startDate).format('YYYY.MM.DD') : '?'}{t.endDate ? ` — ${dayjs(t.endDate).format('YYYY.MM.DD')}` : ''}</span>
          )}
          {t.location && <span><EnvironmentOutlined /> {t.location}</span>}
        </div>
        {isAdmin && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <Button size="small" icon={<EditOutlined />} onClick={onEdit}>Засах</Button>
            <Popconfirm title="Устгах уу?" onConfirm={onDelete} okButtonProps={{ danger: true }}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        )}
      </div>
    </div>
  );
}
