import React, { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, DatePicker, message,
  Tag, Space, Switch, InputNumber, Tabs, Drawer,
} from 'antd';
import { announcements as api } from '../api';
import ImageUpload from '../components/ImageUpload';
import dayjs from 'dayjs';

const KIND_LABEL = {
  HERO: 'Hero (нүүрний том баннер)',
  NEWS: 'Мэдээ',
};

export default function AnnouncementsAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawer, setDrawer] = useState(null);   // currently-edited announcement
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const reload = async () => {
    setLoading(true);
    try {
      const d = await api.adminList();
      setItems(d.announcements);
      // Refresh drawer if it points to an item that just changed.
      if (drawer) {
        const refreshed = d.announcements.find(a => a.id === drawer.id);
        if (refreshed) setDrawer(refreshed);
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []); // eslint-disable-line

  const onCreate = async () => {
    const v = await createForm.validateFields();
    try {
      const payload = {
        ...v,
        publishedAt: v.publishedAt ? v.publishedAt.toISOString() : new Date().toISOString(),
      };
      const res = await api.create(payload);
      message.success('Үүсгэгдлээ');
      setCreateOpen(false);
      createForm.resetFields();
      await reload();
      setDrawer(res.announcement);
    } catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };

  const onUpdate = async (changes) => {
    if (!drawer) return;
    try {
      const res = await api.update(drawer.id, {
        kind: drawer.kind,
        title: drawer.title,
        subtitle: drawer.subtitle,
        body: drawer.body,
        link: drawer.link,
        publishedAt: drawer.publishedAt,
        displayOrder: drawer.displayOrder,
        isActive: drawer.isActive,
        ...changes,
      });
      setDrawer(res.announcement);
      message.success('Хадгаллаа');
      reload();
    } catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };

  const onDelete = async (id) => {
    Modal.confirm({
      title: 'Устгах уу?',
      okText: 'Устгах', okType: 'danger', cancelText: 'Цуцлах',
      onOk: async () => {
        try {
          await api.remove(id);
          message.success('Устгагдлаа');
          if (drawer?.id === id) setDrawer(null);
          reload();
        } catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
      },
    });
  };

  const onUploadImage = async (file) => {
    if (!drawer) return;
    const res = await api.uploadImage(drawer.id, file);
    setDrawer(res.announcement);
    reload();
  };
  const onRemoveImage = async () => {
    if (!drawer) return;
    const res = await api.removeImage(drawer.id);
    setDrawer(res.announcement);
    reload();
  };

  const cols = [
    {
      title: '', dataIndex: 'imageUrl', width: 80,
      render: (url) => url
        ? <img src={url} alt="" style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 4 }} />
        : <div style={{ width: 64, height: 40, background: '#eef0f5', borderRadius: 4 }} />,
    },
    {
      title: 'Төрөл', dataIndex: 'kind', width: 120,
      render: (k) => <Tag color={k === 'HERO' ? 'magenta' : 'blue'}>{k}</Tag>,
    },
    { title: 'Гарчиг', dataIndex: 'title', render: (t, r) => <a onClick={() => setDrawer(r)}>{t}</a> },
    {
      title: 'Огноо', dataIndex: 'publishedAt', width: 140,
      render: (d) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: 'Идэвхтэй', dataIndex: 'isActive', width: 110,
      render: (v) => v ? <Tag color="green">Идэвхтэй</Tag> : <Tag>Нуусан</Tag>,
    },
    {
      title: '', width: 90, render: (_, row) => (
        <Space size={4}>
          <Button size="small" onClick={() => setDrawer(row)}>Засах</Button>
          <Button size="small" danger onClick={() => onDelete(row.id)}>×</Button>
        </Space>
      ),
    },
  ];

  const heroItems = items.filter(a => a.kind === 'HERO');
  const newsItems = items.filter(a => a.kind === 'NEWS');

  return (
    <Card
      title="Мэдээ ба Hero баннер"
      extra={<Button type="primary" onClick={() => setCreateOpen(true)}>+ Шинээр</Button>}
    >
      <Tabs
        items={[
          { key: 'hero', label: `Hero (${heroItems.length})`, children: <Table rowKey="id" loading={loading} columns={cols} dataSource={heroItems} pagination={false} /> },
          { key: 'news', label: `Мэдээ (${newsItems.length})`, children: <Table rowKey="id" loading={loading} columns={cols} dataSource={newsItems} pagination={{ pageSize: 10 }} /> },
        ]}
      />

      <Modal title="Шинэ зүйл" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={onCreate}
        okText="Үүсгэх" cancelText="Цуцлах">
        <Form form={createForm} layout="vertical" initialValues={{ kind: 'NEWS', isActive: true, displayOrder: 0 }}>
          <Form.Item name="kind" label="Төрөл" rules={[{ required: true }]}>
            <Select options={Object.keys(KIND_LABEL).map(k => ({ value: k, label: KIND_LABEL[k] }))} />
          </Form.Item>
          <Form.Item name="title" label="Гарчиг" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subtitle" label="Богино тайлбар"><Input /></Form.Item>
          <Form.Item name="body" label="Дэлгэрэнгүй текст"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="link" label="Холбоос (URL, заавал биш)"><Input placeholder="https://" /></Form.Item>
          <Form.Item name="ctaText" label="Товчны текст (CTA)"
            tooltip="Холбоосын товч дээр харагдах текст. Хоосон бол default 'Дэлгэрэнгүй'">
            <Input maxLength={80} placeholder="Жнь: Илүүг харах" />
          </Form.Item>
          <Form.Item name="publishedAt" label="Нийтлэх огноо"><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="startsAt" label="Эхлэх огноо (заавал биш)"
              tooltip="Энэ огнооноос өмнө мэдээ нийтлэгдэхгүй">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endsAt" label="Дуусах огноо (заавал биш)"
              tooltip="Энэ огнооны дараа мэдээ автоматаар нуугдана">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="displayOrder" label="Эрэмбэ" tooltip="Бага тоо нь эхэнд харагдана">
            <InputNumber min={0} max={9999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="imageOnly" label="Зөвхөн зураг (огноо, гарчиг нуух)"
            tooltip="Hero дээр зураг л харагдана — он сар, гарчиг, тайлбар нуугдана."
            valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="Идэвхтэй" valuePropName="checked"><Switch /></Form.Item>
        </Form>
        <div style={{ background: '#fffbe6', padding: 12, borderRadius: 6, fontSize: 12, color: '#666' }}>
          Үүсгэсний дараа баруун талаас Drawer нээгдэх ба зургаа upload хийгээрэй.
        </div>
      </Modal>

      <Drawer width={560} title={drawer?.title || 'Засварлах'} open={!!drawer} onClose={() => setDrawer(null)}>
        {drawer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card size="small" title="Зураг (Cloudinary)">
              <ImageUpload
                currentUrl={drawer.imageUrl}
                onUpload={onUploadImage}
                onRemove={onRemoveImage}
                shape="square"
                size={drawer.kind === 'HERO' ? 200 : 140}
                label="Зураг оруулах"
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                {drawer.kind === 'HERO'
                  ? 'Hero зураг: 16:9, дор хаяж 1280×720 px санал болгоно.'
                  : 'Мэдээний зураг: 16:10, дор хаяж 800×500 px.'}
              </div>
            </Card>

            <Card size="small" title="Агуулга">
              <Form
                layout="vertical"
                initialValues={drawer}
                key={drawer.id}
                onFinish={(v) => onUpdate(v)}
              >
                <Form.Item name="kind" label="Төрөл">
                  <Select options={Object.keys(KIND_LABEL).map(k => ({ value: k, label: KIND_LABEL[k] }))} />
                </Form.Item>
                <Form.Item name="title" label="Гарчиг" rules={[{ required: true, min: 2 }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="subtitle" label="Богино тайлбар"><Input /></Form.Item>
                <Form.Item name="body" label="Дэлгэрэнгүй"><Input.TextArea rows={4} /></Form.Item>
                <Form.Item name="link" label="Холбоос"><Input placeholder="https://" /></Form.Item>
                <Form.Item name="ctaText" label="Товчны текст (CTA)"
                  tooltip="Холбоосын товч дээр харагдах текст. Хоосон бол default 'Дэлгэрэнгүй'">
                  <Input maxLength={80} placeholder="Жнь: Илүүг харах" />
                </Form.Item>
                <Form.Item name="publishedAt" label="Нийтлэх огноо"
                  getValueFromEvent={(d) => d ? d.toISOString() : null}
                  getValueProps={(v) => ({ value: v ? dayjs(v) : null })}>
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Form.Item name="startsAt" label="Эхлэх огноо"
                    tooltip="Энэ огнооноос өмнө нийтлэгдэхгүй"
                    getValueFromEvent={(d) => d ? d.toISOString() : null}
                    getValueProps={(v) => ({ value: v ? dayjs(v) : null })}>
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="endsAt" label="Дуусах огноо"
                    tooltip="Энэ огнооны дараа автоматаар нуугдана"
                    getValueFromEvent={(d) => d ? d.toISOString() : null}
                    getValueProps={(v) => ({ value: v ? dayjs(v) : null })}>
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <Form.Item name="displayOrder" label="Эрэмбэ"><InputNumber min={0} max={9999} style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="imageOnly" label="Зөвхөн зураг (огноо, гарчиг нуух)"
                  tooltip="Hero дээр зураг л харагдана — он сар, гарчиг, тайлбар нуугдана."
                  valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="isActive" label="Идэвхтэй" valuePropName="checked"><Switch /></Form.Item>
                <Button type="primary" htmlType="submit" block>Хадгалах</Button>
              </Form>
            </Card>

            <Button danger onClick={() => onDelete(drawer.id)}>Энэ мэдээг устгах</Button>
          </div>
        )}
      </Drawer>
    </Card>
  );
}
