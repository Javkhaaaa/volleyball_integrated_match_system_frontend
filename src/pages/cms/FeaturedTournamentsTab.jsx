import React, { useEffect, useState } from 'react';
import { Card, Table, Switch, InputNumber, Tag, Space, message, Drawer, Form, Input, DatePicker, Select, Button } from 'antd';
import { tournaments as api } from '../../api';
import ImageUpload from '../../components/ImageUpload';
import dayjs from 'dayjs';

const STATUS_OPTIONS = [
  { value: 'DRAFT',    label: 'Ноорог' },
  { value: 'ONGOING',  label: 'Явагдаж буй' },
  { value: 'FINISHED', label: 'Дууссан' },
];
const FORMAT_OPTIONS = [
  { value: 'round-robin',    label: 'Round-robin' },
  { value: 'single-elim',    label: 'Single-elimination' },
  { value: 'double-elim',    label: 'Double-elimination' },
  { value: 'group-knockout', label: 'Хэсэг + плэйофф' },
  { value: 'league',         label: 'Лиг' },
];

export default function FeaturedTournamentsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawer, setDrawer] = useState(null);
  const [form] = Form.useForm();

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

  const onToggle = async (id, isFeatured) => {
    try { await api.setFeatured(id, isFeatured); reload(); message.success(isFeatured ? 'Onцлог болсон' : 'Болиулсан'); }
    catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };
  const onOrder = async (id, featuredOrder) => {
    try { await api.setFeatured(id, true, featuredOrder); reload(); }
    catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
  };
  const onSave = async () => {
    if (!drawer) return;
    const v = await form.validateFields();
    try {
      await api.update(drawer.id, {
        ...v,
        startDate: v.startDate ? dayjs(v.startDate).format('YYYY-MM-DD') : null,
        endDate: v.endDate ? dayjs(v.endDate).format('YYYY-MM-DD') : null,
      });
      message.success('Хадгалсан');
      reload();
    } catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
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

  const cols = [
    {
      title: '', dataIndex: 'bannerUrl', width: 80,
      render: url => url
        ? <img src={url} style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 4 }} alt="" />
        : <div style={{ width: 64, height: 40, background: '#eef0f5', borderRadius: 4 }} />,
    },
    { title: 'Нэр', dataIndex: 'name', render: (t, r) => <a onClick={() => { setDrawer(r); form.setFieldsValue({ ...r, startDate: r.startDate ? dayjs(r.startDate) : null, endDate: r.endDate ? dayjs(r.endDate) : null }); }}>{t}</a> },
    { title: 'Төлөв', dataIndex: 'status', width: 100, render: s => <Tag>{s}</Tag> },
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
      <Card size="small" title="Тэмцээний featured ба банер" style={{ marginBottom: 16 }}>
        <p style={{ color: '#666', margin: 0, fontSize: 13 }}>
          Switch-ийг идэвхжүүлэхэд тэмцээн нь нүүр хуудасны "Онцлох тэмцээн" хэсэгт гарна.
          Banner зургийг доор Drawer нээгээд оруулна.
        </p>
      </Card>
      <Table rowKey="id" loading={loading} columns={cols} dataSource={items} pagination={{ pageSize: 10 }} />

      <Drawer width={560} title={drawer?.name} open={!!drawer} onClose={() => setDrawer(null)}>
        {drawer && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" title="Banner (16:9, 1280×720+)">
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
              <Form form={form} layout="vertical">
                <Form.Item name="name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="format" label="Формат"><Select options={FORMAT_OPTIONS} allowClear placeholder="Сонгох" /></Form.Item>
                <Form.Item name="location" label="Газар"><Input placeholder="Улаанбаатар, Бөмбөгийн ордон" /></Form.Item>
                <Form.Item name="description" label="Тайлбар"><Input.TextArea rows={3} /></Form.Item>
                <Form.Item name="startDate" label="Эхлэх"><DatePicker style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="endDate" label="Дуусах"><DatePicker style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="status" label="Төлөв"><Select options={STATUS_OPTIONS} /></Form.Item>
                <Button type="primary" block onClick={onSave}>Хадгалах</Button>
              </Form>
            </Card>
          </Space>
        )}
      </Drawer>
    </>
  );
}
