import React, { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, InputNumber, Switch, message, Drawer, Popconfirm, Space,
} from 'antd';
import { sponsors as api } from '../../api';
import ImageUpload from '../../components/ImageUpload';

export default function SponsorsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [drawer, setDrawer] = useState(null);
  const [editForm] = Form.useForm();

  const reload = async () => {
    setLoading(true);
    try {
      const d = await api.adminList();
      setItems(d.sponsors);
      if (drawer) {
        const r = d.sponsors.find(s => s.id === drawer.id);
        if (r) setDrawer(r);
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []); // eslint-disable-line

  const onCreate = async () => {
    const v = await createForm.validateFields();
    try {
      const r = await api.create(v);
      setCreateOpen(false);
      createForm.resetFields();
      reload();
      // Open drawer immediately so admin uploads logo
      setDrawer(r.sponsor);
      editForm.setFieldsValue(r.sponsor);
    } catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };

  const onSave = async () => {
    if (!drawer) return;
    const v = await editForm.validateFields();
    try {
      const r = await api.update(drawer.id, v);
      setDrawer(r.sponsor);
      reload();
      message.success('Хадгалсан');
    } catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };

  const onDelete = (id) => {
    Modal.confirm({
      title: 'Устгах уу?', okText: 'Устгах', okType: 'danger', cancelText: 'Цуцлах',
      onOk: async () => {
        try { await api.remove(id); message.success('Устгагдсан'); if (drawer?.id === id) setDrawer(null); reload(); }
        catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
      },
    });
  };

  const onUploadLogo = async (file) => {
    if (!drawer) return;
    const r = await api.uploadLogo(drawer.id, file);
    setDrawer(r.sponsor);
    reload();
  };
  const onRemoveLogo = async () => {
    if (!drawer) return;
    const r = await api.removeLogo(drawer.id);
    setDrawer(r.sponsor);
    reload();
  };

  const cols = [
    {
      title: '', dataIndex: 'logoUrl', width: 80,
      render: url => url
        ? <img src={url} style={{ height: 32, maxWidth: 80, objectFit: 'contain' }} alt="" />
        : <div style={{ width: 80, height: 32, background: '#eef0f5', borderRadius: 4 }} />,
    },
    { title: 'Нэр', dataIndex: 'name', render: (t, r) => <a onClick={() => { setDrawer(r); editForm.setFieldsValue(r); }}>{t}</a> },
    { title: 'Веб', dataIndex: 'websiteUrl', render: u => u ? <a href={u} target="_blank" rel="noreferrer">{u}</a> : '—' },
    { title: 'Эрэмбэ', dataIndex: 'displayOrder', width: 80 },
    {
      title: 'Идэвхтэй', dataIndex: 'isActive', width: 100,
      render: v => v ? 'Тийм' : 'Үгүй',
    },
    {
      title: '', width: 90, render: (_, r) => (
        <Space size={4}>
          <Button size="small" onClick={() => { setDrawer(r); editForm.setFieldsValue(r); }}>Засах</Button>
          <Popconfirm title="Устгах уу?" onConfirm={() => onDelete(r.id)}><Button size="small" danger>×</Button></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card size="small" title="Ивээн тэтгэгчид"
        extra={<Button type="primary" onClick={() => setCreateOpen(true)}>+ Шинээр</Button>}
        style={{ marginBottom: 16 }}>
        <p style={{ color: '#666', margin: 0, fontSize: 13 }}>
          Идэвхтэй ивээн тэтгэгчид нүүр хуудасны доод хэсэгт гарна. Транспарент дэвсгэртэй PNG санал болгоно.
        </p>
      </Card>
      <Table rowKey="id" loading={loading} columns={cols} dataSource={items} pagination={{ pageSize: 10 }} />

      <Modal title="Шинэ ивээн тэтгэгч" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={onCreate}
        okText="Үүсгэх" cancelText="Цуцлах">
        <Form form={createForm} layout="vertical" initialValues={{ isActive: true, displayOrder: 0 }}>
          <Form.Item name="name" label="Нэр" rules={[{ required: true, min: 1 }]}><Input /></Form.Item>
          <Form.Item name="websiteUrl" label="Веб URL"><Input placeholder="https://" /></Form.Item>
          <Form.Item name="displayOrder" label="Эрэмбэ"><InputNumber min={0} max={9999} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="isActive" label="Идэвхтэй" valuePropName="checked"><Switch /></Form.Item>
        </Form>
        <div style={{ background: '#fffbe6', padding: 12, borderRadius: 6, fontSize: 12, color: '#666' }}>
          Үүсгэсний дараа Drawer нээгдэх ба логог upload хийгээрэй.
        </div>
      </Modal>

      <Drawer width={520} title={drawer?.name} open={!!drawer} onClose={() => setDrawer(null)}>
        {drawer && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" title="Лого">
              <ImageUpload
                currentUrl={drawer.logoUrl}
                onUpload={onUploadLogo}
                onRemove={onRemoveLogo}
                shape="square" size={120}
                label="Лого upload"
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                Транспарент PNG зөвлөж байна. Өндөр 80–200 px санал.
              </div>
            </Card>
            <Card size="small" title="Дэлгэрэнгүй">
              <Form form={editForm} layout="vertical">
                <Form.Item name="name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="websiteUrl" label="Веб URL"><Input placeholder="https://" /></Form.Item>
                <Form.Item name="displayOrder" label="Эрэмбэ"><InputNumber min={0} max={9999} style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="isActive" label="Идэвхтэй" valuePropName="checked"><Switch /></Form.Item>
                <Button type="primary" block onClick={onSave}>Хадгалах</Button>
              </Form>
            </Card>
            <Button danger onClick={() => onDelete(drawer.id)}>Устгах</Button>
          </Space>
        )}
      </Drawer>
    </>
  );
}
