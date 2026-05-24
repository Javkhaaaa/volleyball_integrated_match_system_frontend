import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Switch,
  Avatar, Popconfirm, Segmented,
} from 'antd';
import {
  GoogleOutlined, MailOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  UserOutlined, LockOutlined,
} from '@ant-design/icons';
import { admin as adminApi } from '../api';
import PageBanner from '../components/PageBanner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/mn';
dayjs.extend(relativeTime);
dayjs.locale('mn');

const ROLES = ['ADMIN', 'COACH', 'STATISTICIAN', 'UNASSIGNED'];

const ROLE_COLOR = {
  ADMIN: 'magenta',
  COACH: 'blue',
  STATISTICIAN: 'gold',
  UNASSIGNED: 'default',
};
const ROLE_LABEL = {
  ADMIN: 'Админ',
  COACH: 'Дасгалжуулагч',
  STATISTICIAN: 'Статистикч',
  UNASSIGNED: 'Оноогоогүй',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const [editForm] = Form.useForm();
  const [resetUser, setResetUser] = useState(null);
  const [resetForm] = Form.useForm();
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    try { const d = await adminApi.listUsers(); setUsers(d.users); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (u.name || '').toLowerCase().includes(q) ||
               (u.email || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, search, roleFilter]);

  const onChangeRole = (id, currentRole, newRole, name) => {
    if (currentRole === newRole) return;
    Modal.confirm({
      title: `Эрхийг солих уу?`,
      content: <div><strong>{name}</strong>-ийн эрхийг <Tag color={ROLE_COLOR[currentRole]}>{currentRole}</Tag> →
        <Tag color={ROLE_COLOR[newRole]}>{newRole}</Tag> болгох гэж байна.</div>,
      okText: 'Солих', cancelText: 'Цуцлах',
      onOk: async () => {
        try { await adminApi.setRole(id, newRole); message.success('Эрх шинэчлэгдлээ'); reload(); }
        catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
      },
    });
  };

  const onToggleActive = async (id, isActive) => {
    try { await adminApi.setActive(id, isActive); reload(); }
    catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };

  const onCreate = async () => {
    setBusy(true);
    try {
      const v = await createForm.validateFields();
      await adminApi.createUser(v);
      message.success('Хэрэглэгч үүсгэгдлээ');
      setCreateOpen(false); createForm.resetFields();
      reload();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const onEdit = (user) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      name: user.name, email: user.email,
      role: user.role, isActive: user.isActive,
    });
  };

  const onSaveEdit = async () => {
    setBusy(true);
    try {
      const v = await editForm.validateFields();
      await adminApi.updateUser(editingUser.id, v);
      message.success('Хадгалсан');
      setEditingUser(null);
      reload();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const onResetPassword = async () => {
    setBusy(true);
    try {
      const v = await resetForm.validateFields();
      await adminApi.setPassword(resetUser.id, v.password);
      message.success('Шинэ нууц үг тогтоолоо');
      setResetUser(null); resetForm.resetFields();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  const onDelete = async (id) => {
    try {
      await adminApi.deleteUser(id);
      message.success('Устгасан');
      reload();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Алдаа');
    }
  };

  const columns = [
    {
      title: '', dataIndex: 'picture', width: 50,
      render: (url, row) => url
        ? <Avatar size={36} src={url} />
        : <Avatar size={36} style={{
            background: `linear-gradient(135deg, var(--primary), var(--accent))`,
            fontWeight: 700,
          }}>
            {(row.name || '?').slice(0, 1).toUpperCase()}
          </Avatar>,
    },
    { title: 'Нэр', dataIndex: 'name', render: (n) => <strong>{n}</strong> },
    { title: 'И-мэйл', dataIndex: 'email', render: (e) => <span className="muted">{e}</span> },
    {
      title: 'Хэлбэр', dataIndex: 'provider', width: 110,
      render: (p) => p === 'google'
        ? <Tag icon={<GoogleOutlined />} color="gold">Google</Tag>
        : <Tag icon={<MailOutlined />}>Имэйл</Tag>,
    },
    {
      title: 'Эрх', dataIndex: 'role', width: 200,
      render: (role, row) => (
        <Select
          value={role} style={{ width: 180 }}
          onChange={(v) => onChangeRole(row.id, role, v, row.name)}
          options={ROLES.map(r => ({
            value: r, label: <Tag color={ROLE_COLOR[r]}>{ROLE_LABEL[r]}</Tag>,
          }))}
        />
      ),
    },
    {
      title: 'Идэвхтэй', dataIndex: 'isActive', width: 90,
      render: (v, row) => <Switch checked={v} onChange={(c) => onToggleActive(row.id, c)} />,
    },
    { title: 'Үүссэн', dataIndex: 'createdAt', width: 140,
      render: (d) => <span className="dim" title={dayjs(d).format('YYYY-MM-DD HH:mm')}>{dayjs(d).fromNow()}</span>,
    },
    {
      title: '', width: 140,
      render: (_, row) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(row)} title="Засах" />
          <Button size="small" icon={<LockOutlined />} onClick={() => setResetUser(row)} title="Нууц үг шинэчлэх" />
          <Popconfirm title="Хэрэглэгчийг устгах уу?" okText="Устгах" cancelText="Цуцлах"
            okButtonProps={{ danger: true }} onConfirm={() => onDelete(row.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const counts = useMemo(() => {
    const c = { ALL: users.length };
    ROLES.forEach(r => { c[r] = users.filter(u => u.role === r).length; });
    return c;
  }, [users]);

  return (
    <div>
      <PageBanner
        kicker="Систем удирдлага"
        title="Хэрэглэгчийн удирдлага"
        lede="Систем хэрэглэгчдийн жагсаалт. Эрх, идэвхтэй төлөв, нууц үг шинэчлэх боломжтой."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}
            style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}>
            Шинэ хэрэглэгч
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Segmented
            value={roleFilter} onChange={setRoleFilter}
            options={[
              { value: 'ALL',          label: `Бүгд (${counts.ALL})` },
              { value: 'ADMIN',        label: `Админ (${counts.ADMIN})` },
              { value: 'COACH',        label: `Дасгалжуулагч (${counts.COACH})` },
              { value: 'STATISTICIAN', label: `Статистикч (${counts.STATISTICIAN})` },
              { value: 'UNASSIGNED',   label: `Оноогоогүй (${counts.UNASSIGNED})` },
            ]}
          />
          <Input.Search
            placeholder="Нэр, и-мэйлээр хайх..."
            allowClear style={{ width: 280 }}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={filtered}
          pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: [10, 15, 30, 50] }} />
      </Card>

      {/* Edit modal */}
      <Modal
        title={`Засварлах · ${editingUser?.name}`}
        open={!!editingUser} onCancel={() => setEditingUser(null)} onOk={onSaveEdit}
        okText="Хадгалах" cancelText="Цуцлах" confirmLoading={busy}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Нэр" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
          <Form.Item name="email" label="И-мэйл" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="role" label="Эрх">
            <Select options={ROLES.map(r => ({ value: r, label: ROLE_LABEL[r] }))} />
          </Form.Item>
          <Form.Item name="isActive" label="Идэвхтэй" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      {/* Create modal */}
      <Modal title="Шинэ хэрэглэгч" open={createOpen} onCancel={() => setCreateOpen(false)}
        onOk={onCreate} okText="Үүсгэх" cancelText="Цуцлах" confirmLoading={busy}>
        <Form form={createForm} layout="vertical" initialValues={{ role: 'UNASSIGNED' }}>
          <Form.Item name="name" label="Нэр" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="Овог Нэр" prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="email" label="И-мэйл" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="user@example.com" prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item name="password" label="Нууц үг (≥6 тэмдэгт)" rules={[{ required: true, min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item name="role" label="Эрх">
            <Select options={ROLES.map(r => ({
              value: r, label: <Space><Tag color={ROLE_COLOR[r]}>{r}</Tag> {ROLE_LABEL[r]}</Space>,
            }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Password reset modal */}
      <Modal title={`Нууц үг шинэчлэх · ${resetUser?.name}`}
        open={!!resetUser} onCancel={() => { setResetUser(null); resetForm.resetFields(); }}
        onOk={onResetPassword} okText="Тогтоох" cancelText="Цуцлах" confirmLoading={busy}>
        <Form form={resetForm} layout="vertical">
          <Form.Item name="password" label="Шинэ нууц үг (≥8 тэмдэгт)" rules={[{ required: true, min: 8 }]}>
            <Input.Password autoFocus />
          </Form.Item>
          <Form.Item name="confirm" label="Дахин оруулах"
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, v) {
                  if (!v || getFieldValue('password') === v) return Promise.resolve();
                  return Promise.reject(new Error('Нууц үг тохирохгүй байна'));
                },
              }),
            ]}>
            <Input.Password />
          </Form.Item>
          <div className="muted" style={{ fontSize: 12 }}>
            Хэрэглэгчийн админ-шинэчилсэн нууц үгийг өөрөө хадгалаад түүнд нь өгнө.
          </div>
        </Form>
      </Modal>
    </div>
  );
}
