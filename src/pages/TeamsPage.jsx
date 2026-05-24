import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, message, Tag, Drawer, InputNumber,
  Switch, Popconfirm, Space, Avatar, Segmented, Empty, Select, ColorPicker,
  Skeleton, Alert,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined,
  UnorderedListOutlined, UserOutlined, TrophyOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { teams as api, tournaments as tournApi, admin as adminApi } from '../api';
import ImageUpload from '../components/ImageUpload';
import PageBanner from '../components/PageBanner';
import { canManageTeam, isAdmin, isCoach } from '../utils/permissions';

const POSITION_OPTIONS = [
  { value: 'OH',  label: 'OH — Outside Hitter' },
  { value: 'OPP', label: 'OPP — Opposite' },
  { value: 'MB',  label: 'MB — Middle Blocker' },
  { value: 'S',   label: 'S — Setter' },
  { value: 'L',   label: 'L — Libero' },
  { value: 'DS',  label: 'DS — Defensive Specialist' },
];

export default function TeamsPage() {
  const user = useSelector(s => s.auth.user);
  const admin = isAdmin(user);
  const coach = isCoach(user);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkTeamId = searchParams.get('team');

  const [filter, setFilter] = useState(coach ? 'mine' : 'all');
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');

  const [items, setItems] = useState([]);
  const [tourns, setTourns] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const [drawerTeam, setDrawerTeam] = useState(null);
  const [editForm] = Form.useForm();
  const [playerForm] = Form.useForm();
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editPlayerForm] = Form.useForm();
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [t, tt, cc] = await Promise.all([
        api.list(),
        tournApi.list(),
        admin
          ? adminApi.listUsers({ role: 'COACH' }).catch(() => ({ users: [] }))
          : Promise.resolve({ users: [] }),
      ]);
      setItems(t.teams);
      setTourns(tt.tournaments);
      setCoaches(cc.users || []);
      if (drawerTeam) {
        const r = t.teams.find(x => x.id === drawerTeam.id);
        if (r) setDrawerTeam(r);
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [admin]);

  // Deep-link: /teams?team=ID auto-opens the management drawer for that
  // team. Used from Tournament Teams tab when admin clicks "Manage".
  useEffect(() => {
    if (!deepLinkTeamId || items.length === 0 || drawerTeam) return;
    const target = items.find(t => String(t.id) === String(deepLinkTeamId));
    if (target) {
      setDrawerTeam(target);
      editForm.setFieldsValue({
        name: target.name,
        shortName: target.shortName,
        color: target.color,
        tournamentId: target.tournamentId,
        coachId: target.coachId,
        gender: target.gender,
        isActive: target.isActive ?? true,
      });
    }
  }, [deepLinkTeamId, items, drawerTeam, editForm]);

  const visibleItems = useMemo(() => {
    let arr = items;
    if (filter === 'mine' && coach) arr = arr.filter(t => t.coachId === user.id);
    if (search) arr = arr.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.shortName || '').toLowerCase().includes(search.toLowerCase())
    );
    return arr;
  }, [items, filter, coach, user, search]);

  const onCreate = async () => {
    setBusy(true);
    try {
      const v = await createForm.validateFields();
      const payload = {
        name: v.name,
        shortName: v.shortName || null,
        color: typeof v.color === 'object' ? v.color?.toHexString?.() : (v.color || null),
        tournamentId: v.tournamentId || null,
        coachId: v.coachId || null,
      };
      const r = await api.create(payload);
      message.success('Баг үүсгэсэн');
      setCreateOpen(false); createForm.resetFields();
      reload();
      // Open drawer immediately so admin can upload logo / add players
      const fresh = await api.get(r.team.id);
      setDrawerTeam(fresh.team);
      editForm.setFieldsValue(fresh.team);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const openTeam = async (team) => {
    const d = await api.get(team.id);
    setDrawerTeam(d.team);
    editForm.setFieldsValue({
      ...d.team,
    });
  };

  const refreshDrawer = async () => {
    if (!drawerTeam) return;
    const d = await api.get(drawerTeam.id);
    setDrawerTeam(d.team);
  };

  const onToggleLock = async (locked) => {
    if (!drawerTeam) return;
    try {
      const r = await api.setLock(drawerTeam.id, locked);
      setDrawerTeam(r.team);
      message.success(locked ? 'Бүрэлдэхүүн түгжигдсэн' : 'Түгжээ тайлсан');
      reload();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Алдаа');
    }
  };

  const onSaveTeam = async () => {
    if (!drawerTeam) return;
    setBusy(true);
    try {
      const v = await editForm.validateFields();
      const payload = {
        name: v.name,
        shortName: v.shortName || null,
        color: typeof v.color === 'object' ? v.color?.toHexString?.() : (v.color || null),
        tournamentId: v.tournamentId || null,
        coachId: v.coachId || null,
        gender: v.gender || null,
        isActive: v.isActive ?? true,
      };
      const r = await api.update(drawerTeam.id, payload);
      setDrawerTeam(r.team);
      message.success('Хадгаллаа');
      reload();
    } catch (e) {
      if (e?.errorFields) return;
      const data = e?.response?.data || {};
      const details = data.details || data.detail;
      const detailMsg = Array.isArray(details) ? details.join(', ') : details;
      message.error(detailMsg || data.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const onDeleteTeam = async (id) => {
    try {
      await api.remove(id);
      message.success('Устгасан');
      if (drawerTeam?.id === id) setDrawerTeam(null);
      reload();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Алдаа');
    }
  };

  const onAssignCoach = async (id, coachId) => {
    try {
      await api.setCoach(id, coachId);
      message.success(coachId ? 'Дасгалжуулагч оноосон' : 'Дасгалжуулагч хасагдсан');
      reload();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Алдаа');
    }
  };

  const onAddPlayer = async () => {
    try {
      const v = await playerForm.validateFields();
      await api.addPlayer(drawerTeam.id, v);
      message.success('Тоглогч нэмэгдсэн');
      playerForm.resetFields();
      await refreshDrawer();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || 'Алдаа');
    }
  };

  const onDeletePlayer = async (pid) => {
    try {
      await api.deletePlayer(drawerTeam.id, pid);
      await refreshDrawer();
    } catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };

  const onEditPlayer = (player) => {
    setEditingPlayer(player);
    editPlayerForm.setFieldsValue({
      jerseyNumber: player.jerseyNumber,
      fullName: player.fullName,
      position: player.position,
      isLibero: !!player.isLibero,
      isActive: player.isActive !== false,
    });
  };

  const onSavePlayerEdit = async () => {
    try {
      const v = await editPlayerForm.validateFields();
      await api.updatePlayer(drawerTeam.id, editingPlayer.id, v);
      message.success('Тоглогчийн мэдээлэл шинэчлэгдлээ');
      setEditingPlayer(null);
      await refreshDrawer();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || 'Алдаа');
    }
  };

  const onUploadLogo = async (file) => {
    const r = await api.uploadLogo(drawerTeam.id, file);
    setDrawerTeam(r.team); reload();
  };
  const onRemoveLogo = async () => {
    const r = await api.removeLogo(drawerTeam.id);
    setDrawerTeam(r.team); reload();
  };
  const onUploadPlayerPhoto = async (pid, file) => {
    await api.uploadPlayerPhoto(drawerTeam.id, pid, file);
    await refreshDrawer();
  };
  const onRemovePlayerPhoto = async (pid) => {
    await api.removePlayerPhoto(drawerTeam.id, pid);
    await refreshDrawer();
  };

  const tournOptions = tourns.map(t => ({ value: t.id, label: t.name }));
  // Shared props for any Select that displays tournament names — long
  // names wrap inside the dropdown + tooltip on hover.
  const tournSelectProps = {
    popupMatchSelectWidth: false,
    showSearch: true,
    optionFilterProp: 'label',
    optionRender: (opt) => (
      <span title={opt.label} style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
        {opt.label}
      </span>
    ),
  };
  const coachOptions = coaches.map(c => ({
    value: c.id,
    label: (
      <Space>
        {c.picture ? <Avatar size={18} src={c.picture} /> : <Avatar size={18} icon={<UserOutlined />} />}
        {c.name} <span className="dim" style={{ fontSize: 11 }}>{c.email}</span>
      </Space>
    ),
  }));

  // ----- Table cols -----
  const cols = [
    {
      title: '', dataIndex: 'logoUrl', width: 56,
      render: (url) => url
        ? <Avatar shape="square" size={40} src={url} />
        : <Avatar shape="square" size={40} style={{ background: 'var(--bg-raised)' }}>·</Avatar>,
    },
    { title: 'Нэр', dataIndex: 'name',
      render: (n, r) => (
        <Space>
          <a onClick={() => navigate(`/teams/${r.id}`)} style={{ color: 'var(--text)', fontWeight: 700 }}>{n}</a>
          {r.coachId === user?.id && coach && <Tag color="gold">Миний баг</Tag>}
          {r.isFeatured && <Tag color="orange">Featured</Tag>}
        </Space>
      ),
    },
    { title: 'Богино', dataIndex: 'shortName', width: 90 },
    { title: 'Тэмцээн', dataIndex: 'tournamentId', width: 200,
      render: (tid) => {
        const t = tourns.find(x => x.id === tid);
        return t ? <Tag>{t.name}</Tag> : <span className="dim">оноогоогүй</span>;
      },
    },
    {
      title: 'Дасгалжуулагч', dataIndex: 'coach', width: 220,
      render: (c, r) => admin ? (
        <Select
          allowClear showSearch
          placeholder="Сонгох"
          value={r.coachId || undefined}
          onChange={(v) => onAssignCoach(r.id, v ?? null)}
          options={coachOptions}
          optionFilterProp="label"
          filterOption={(input, opt) => {
            const cu = coaches.find(x => x.id === opt.value);
            return (cu?.name || '').toLowerCase().includes(input.toLowerCase()) ||
                   (cu?.email || '').toLowerCase().includes(input.toLowerCase());
          }}
          style={{ width: '100%' }}
          size="small"
        />
      ) : (c
        ? <Space size={4}><Avatar size={20} src={c.picture} icon={!c.picture && <UserOutlined />} />{c.name}</Space>
        : <span className="dim">—</span>),
    },
    {
      title: 'Өнгө', dataIndex: 'color', width: 100,
      render: c => c
        ? <Tag><span className="color-swatch" style={{ background: c }} />{c}</Tag>
        : <span className="dim">—</span>,
    },
    {
      title: '', width: 120,
      render: (_, r) => {
        if (!canManageTeam(user, r)) return null;
        return (
          <Space size={4}>
            <Button size="small" icon={<EditOutlined />} onClick={() => openTeam(r)} />
            {admin && (
              <Popconfirm title="Багийг устгах уу?" okButtonProps={{ danger: true }}
                okText="Устгах" cancelText="Цуцлах" onConfirm={() => onDeleteTeam(r.id)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <PageBanner
        kicker="Багийн жагсаалт"
        title="Багууд"
        lede="Бүх багийн жагсаалт. Дасгалжуулагч, тоглогчдын мэдээлэл, тэмцээний үр дүн."
        actions={
          <>
            {coach && (
              <Segmented value={filter} onChange={setFilter}
                options={[
                  { value: 'mine', label: 'Миний баг' },
                  { value: 'all',  label: 'Бүх баг' },
                ]} />
            )}
            <Input.Search placeholder="Багийн нэр..." onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
            <Button.Group>
              <Button icon={<AppstoreOutlined />} type={view === 'grid' ? 'primary' : 'default'} onClick={() => setView('grid')} />
              <Button icon={<UnorderedListOutlined />} type={view === 'table' ? 'primary' : 'default'} onClick={() => setView('table')} />
            </Button.Group>
            {admin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}
                style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}>
                Шинэ баг
              </Button>
            )}
          </>
        }
      />

      {loading ? (
        <div className="cards-grid">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i}><Skeleton active /></Card>)}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="empty-card">
          <Empty description={
            filter === 'mine'
              ? 'Танд оноогдсон баг байхгүй. Админ танд оноосны дараа энд харагдана.'
              : 'Баг алга'
          } />
        </div>
      ) : view === 'grid' ? (
        <div className="cards-grid">
          {visibleItems.map(t => (
            <TeamCard
              key={t.id} t={t} tournaments={tourns} user={user}
              isAdmin={admin}
              onOpen={() => navigate(`/teams/${t.id}`)}
              onEdit={() => openTeam(t)}
              onDelete={() => onDeleteTeam(t.id)}
            />
          ))}
        </div>
      ) : (
        <Card><Table rowKey="id" columns={cols} dataSource={visibleItems} pagination={{ pageSize: 12 }} /></Card>
      )}

      {/* CREATE modal */}
      <Modal title="Шинэ баг" open={createOpen} onCancel={() => setCreateOpen(false)}
        onOk={onCreate} okText="Үүсгэх" cancelText="Цуцлах" confirmLoading={busy} width={520}>
        <Form form={createForm} layout="vertical" initialValues={{ isActive: true }}>
          <Form.Item name="name" label="Нэр" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="Жнь: Эрчим Мажор" />
          </Form.Item>
          <Form.Item name="shortName" label="Богино нэр (3-6 үсэг)">
            <Input maxLength={20} placeholder="ERC" />
          </Form.Item>
          <Form.Item name="gender" label="Хүйс" rules={[{ required: true, message: 'Хүйс сонгоно уу' }]}>
            <Select
              placeholder="Сонгох"
              options={[
                { value: 'MEN',   label: 'Эрэгтэй' },
                { value: 'WOMEN', label: 'Эмэгтэй' },
              ]}
            />
          </Form.Item>
          <Form.Item name="color" label="Багийн өнгө">
            <ColorPicker showText format="hex" />
          </Form.Item>
          <Form.Item name="tournamentId" label="Тэмцээн (заавал биш)">
            <Select allowClear options={tournOptions} placeholder="Сонгох" {...tournSelectProps} />
          </Form.Item>
          <Form.Item name="coachId" label="Дасгалжуулагч (заавал биш)">
            <Select allowClear options={coachOptions} placeholder="Сонгох" optionFilterProp="label" showSearch />
          </Form.Item>
          <Form.Item name="isActive" label="Идэвхтэй" valuePropName="checked"
            tooltip="Идэвхгүй бол жагсаалт ба тэмцээний бүртгэлд харагдахгүй">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* EDIT + ROSTER drawer */}
      <Drawer
        width={720}
        title={drawerTeam?.name}
        open={!!drawerTeam}
        onClose={() => {
          setDrawerTeam(null);
          if (deepLinkTeamId) {
            const next = new URLSearchParams(searchParams);
            next.delete('team');
            setSearchParams(next, { replace: true });
          }
        }}
        extra={
          drawerTeam && <Button onClick={() => navigate(`/teams/${drawerTeam.id}`)}>Public хуудас →</Button>
        }
      >
        {drawerTeam && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* Lock status banner (visible to everyone who can see drawer). */}
            {drawerTeam.rosterLocked && (
              <Alert
                type="warning"
                showIcon
                message="Багийн бүрэлдэхүүн түгжигдсэн"
                description={
                  admin
                    ? 'Дасгалжуулагч одоо засаж чадахгүй. Та админ тул үргэлжлүүлэн засах боломжтой.'
                    : 'Тэмцээн эхэлсэн тул бүрэлдэхүүнийг засах боломжгүй. Шинэчлэлт хийх бол админд хандана уу.'
                }
                action={admin && (
                  <Button size="small" onClick={() => onToggleLock(false)}>
                    Түгжээ тайлах
                  </Button>
                )}
              />
            )}
            {/* Admin lock toggle when team is unlocked */}
            {admin && !drawerTeam.rosterLocked && (
              <Alert
                type="info"
                showIcon
                message="Бүрэлдэхүүн түгжих"
                description="Тэмцээн эхэлсэний дараа дасгалжуулагч бүрэлдэхүүнээ өөрчлөхөөс хамгаалахын тулд түгжиж болно."
                action={
                  <Button size="small" type="primary" danger onClick={() => onToggleLock(true)}>
                    Түгжих
                  </Button>
                }
              />
            )}

            {/* Team logo */}
            {canManageTeam(user, drawerTeam) && (
              <Card size="small" title="Багийн лого">
                <ImageUpload
                  currentUrl={drawerTeam.logoUrl}
                  onUpload={onUploadLogo}
                  onRemove={onRemoveLogo}
                  shape="square" size={120}
                  label="Лого оруулах"
                />
              </Card>
            )}

            {/* Admin-only edit fields */}
            {admin && (
              <Card size="small" title="Багийн мэдээлэл">
                <Form form={editForm} layout="vertical" initialValues={drawerTeam}>
                  <Form.Item name="name" label="Нэр" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Form.Item name="shortName" label="Богино нэр"><Input maxLength={20} /></Form.Item>
                    <Form.Item name="color" label="Өнгө"><ColorPicker showText format="hex" /></Form.Item>
                  </div>
                  <Form.Item name="gender" label="Хүйс" rules={[{ required: true, message: 'Хүйс сонгоно уу' }]}>
                    <Select
                      options={[
                        { value: 'MEN',   label: 'Эрэгтэй' },
                        { value: 'WOMEN', label: 'Эмэгтэй' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="tournamentId" label={<><TrophyOutlined /> Тэмцээн</>}>
                    <Select allowClear options={tournOptions} {...tournSelectProps} />
                  </Form.Item>
                  <Form.Item name="coachId" label={<><UserOutlined /> Дасгалжуулагч</>}>
                    <Select allowClear options={coachOptions} optionFilterProp="label" showSearch />
                  </Form.Item>
                  <Form.Item name="isActive" label="Идэвхтэй" valuePropName="checked"
                    tooltip="Идэвхгүй болгосон баг жагсаалт болон тэмцээний бүртгэлд гарахгүй">
                    <Switch />
                  </Form.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Popconfirm title="Багийг устгах уу?"
                      description="Бүх тоглогчид нь хамт устах болно."
                      okText="Устгах" cancelText="Цуцлах" okButtonProps={{ danger: true }}
                      onConfirm={() => onDeleteTeam(drawerTeam.id)}>
                      <Button danger icon={<DeleteOutlined />}>Устгах</Button>
                    </Popconfirm>
                    <Button type="primary" loading={busy} onClick={onSaveTeam}>Хадгалах</Button>
                  </Space>
                </Form>
              </Card>
            )}

            {/* Coach card (visible to non-admin) */}
            {!admin && drawerTeam.coach && (
              <Card size="small" style={{ background: 'var(--bg-raised)' }}>
                <Space>
                  <Avatar size={36} src={drawerTeam.coach.picture} icon={!drawerTeam.coach.picture && <UserOutlined />} />
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Дасгалжуулагч</div>
                    <strong>{drawerTeam.coach.name}</strong>
                  </div>
                </Space>
              </Card>
            )}

            {/* Roster */}
            <Card size="small" title={`Тоглогчид (${drawerTeam.players?.length || 0})`}>
              {canManageTeam(user, drawerTeam) && (
                <div style={{
                  background: 'var(--bg-raised)', padding: 12, borderRadius: 8, marginBottom: 12,
                }}>
                  <Form form={playerForm} layout="vertical" initialValues={{ isLibero: false }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px 80px auto', gap: 8, alignItems: 'end' }}>
                      <Form.Item name="jerseyNumber" label="#" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <InputNumber min={0} max={99} style={{ width: '100%' }} placeholder="0-99" />
                      </Form.Item>
                      <Form.Item name="fullName" label="Бүтэн нэр" rules={[{ required: true, min: 2 }]} style={{ marginBottom: 0 }}>
                        <Input placeholder="Овог Нэр" />
                      </Form.Item>
                      <Form.Item name="position" label="Байр" style={{ marginBottom: 0 }}>
                        <Select allowClear options={POSITION_OPTIONS} placeholder="OH/MB/S/L" />
                      </Form.Item>
                      <Form.Item name="isLibero" label="Libero" valuePropName="checked" style={{ marginBottom: 0 }}>
                        <Switch />
                      </Form.Item>
                      <Form.Item label=" " style={{ marginBottom: 0 }}>
                        <Button type="primary" onClick={onAddPlayer} icon={<PlusOutlined />}>Нэмэх</Button>
                      </Form.Item>
                    </div>
                  </Form>
                </div>
              )}

              <Table
                size="small" rowKey="id"
                columns={[
                  {
                    title: '', dataIndex: 'photoUrl', width: 56,
                    render: (url) => url
                      ? <Avatar size={40} src={url} />
                      : <Avatar size={40} style={{ background: 'var(--bg-raised)' }} icon={<UserOutlined />} />,
                  },
                  { title: '#', dataIndex: 'jerseyNumber', width: 50,
                    render: (n) => <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{n}</strong> },
                  {
                    title: 'Нэр', dataIndex: 'fullName',
                    render: (n, row) => <Link to={`/players/${row.id}`} style={{ color: 'var(--text)' }}>{n}</Link>,
                  },
                  { title: 'Байр', dataIndex: 'position', width: 80, render: p => p || '—' },
                  { title: 'L', dataIndex: 'isLibero', width: 40, render: v => v ? <Tag color="gold">L</Tag> : '' },
                  { title: 'Идэвх', dataIndex: 'isActive', width: 70,
                    render: v => v === false ? <Tag>Идэвхгүй</Tag> : <Tag color="green">Идэвхтэй</Tag> },
                  canManageTeam(user, drawerTeam) && {
                    title: 'Зураг', width: 180, render: (_, row) => (
                      <ImageUpload
                        currentUrl={row.photoUrl}
                        onUpload={(file) => onUploadPlayerPhoto(row.id, file)}
                        onRemove={() => onRemovePlayerPhoto(row.id)}
                        shape="circle" size={48}
                        label="Зураг"
                      />
                    ),
                  },
                  canManageTeam(user, drawerTeam) && {
                    title: '', width: 100, render: (_, row) => (
                      <Space size={4}>
                        <Button size="small" icon={<EditOutlined />} onClick={() => onEditPlayer(row)} />
                        <Popconfirm title="Устгах уу?" onConfirm={() => onDeletePlayer(row.id)}
                          okButtonProps={{ danger: true }}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ].filter(Boolean)}
                dataSource={drawerTeam.players || []}
                pagination={false}
                locale={{ emptyText: <Empty description="Тоглогч алга байна" /> }}
              />
            </Card>
          </Space>
        )}
      </Drawer>

      {/* Edit player modal */}
      <Modal
        title={`Тоглогч засах · #${editingPlayer?.jerseyNumber}`}
        open={!!editingPlayer}
        onCancel={() => setEditingPlayer(null)}
        onOk={onSavePlayerEdit}
        okText="Хадгалах" cancelText="Цуцлах"
      >
        <Form form={editPlayerForm} layout="vertical">
          <Form.Item name="jerseyNumber" label="Дугаар" rules={[{ required: true }]}>
            <InputNumber min={0} max={99} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fullName" label="Бүтэн нэр" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="position" label="Байрлал">
            <Select allowClear options={POSITION_OPTIONS} />
          </Form.Item>
          <Form.Item name="isLibero" label="Libero" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="isActive" label="Идэвхтэй" valuePropName="checked"><Switch /></Form.Item>
          {admin && (
            <Card size="small" title="Онцлох (Featured)" style={{ marginTop: 8 }}>
              <Form.Item name="isFeatured" label="Нүүр хуудсанд гаргах" valuePropName="checked"
                tooltip="Идэвхжүүлбэл нүүр хуудасны 'Онцлох тоглогч' хэсэгт харагдана">
                <Switch />
              </Form.Item>
              <Form.Item name="featuredOrder" label="Эрэмбэ"
                tooltip="Бага тоо нь эхэнд гарна">
                <InputNumber min={0} max={9999} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="spotlightNote" label="Нүүр дээрх товч тайлбар"
                tooltip="Нүүр хуудсанд тоглогчийн зургийн доор гарах мессеж">
                <Input maxLength={200} placeholder="Жнь: Тэмцээний MVP" />
              </Form.Item>
            </Card>
          )}
        </Form>
      </Modal>
    </div>
  );
}

function TeamCard({ t, tournaments, user, isAdmin, onOpen, onEdit, onDelete }) {
  const tournament = tournaments.find(x => x.id === t.tournamentId);
  const canManage = canManageTeam(user, t);
  return (
    <div className="match-card" onClick={onOpen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {t.logoUrl
          ? <img src={t.logoUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, background: 'var(--bg-raised)' }} />
          : <div style={{
              width: 64, height: 64, borderRadius: 12,
              background: t.color || 'var(--bg-raised)',
              display: 'grid', placeItems: 'center',
              color: '#fff', fontWeight: 900, fontSize: 22,
            }}>
              {(t.shortName || t.name || '?').slice(0, 2).toUpperCase()}
            </div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>{t.name}</div>
          {t.shortName && <div className="muted" style={{ fontSize: 12 }}>{t.shortName}</div>}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {t.coachId === user?.id && <span className="pill accent">Миний баг</span>}
            {t.isFeatured && <span className="pill primary">Featured</span>}
            {t.rosterLocked && <span className="pill muted">🔒 Түгжсэн</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        <div><TrophyOutlined /> {tournament ? tournament.name : <span className="dim">тэмцээнд оноогоогүй</span>}</div>
        <div><UserOutlined /> {t.coach ? t.coach.name : <span className="dim">дасгалжуулагч оноогоогүй</span>}</div>
      </div>
      {canManage && (
        <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
          <Button size="small" type="primary" icon={<EditOutlined />} onClick={onEdit}
            style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}>
            {isAdmin ? 'Засах' : 'Бүрэлдэхүүн засах'}
          </Button>
          {isAdmin && (
            <Popconfirm title="Устгах уу?" onConfirm={onDelete} okButtonProps={{ danger: true }}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </div>
      )}
    </div>
  );
}
