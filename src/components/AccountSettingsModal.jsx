import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Alert, message, Tag } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { auth as authApi } from '../api';
import { setUser } from '../store';

export default function AccountSettingsModal({ open, onClose }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [form] = Form.useForm();
  const [hasPassword, setHasPassword] = useState(true);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!open) return;
    setInfo(null);
    form.resetFields();
    authApi.me().then(d => {
      setHasPassword(d.hasPassword);
      dispatch(setUser(d.user));
    }).catch(() => {});
  }, [open, dispatch, form]);

  const onFinish = async (v) => {
    setBusy(true);
    try {
      await authApi.setPassword(v.newPassword, v.currentPassword || null);
      message.success('Нууц үг шинэчлэгдлээ');
      setHasPassword(true);
      setInfo(null);
      form.resetFields();
      onClose();
    } catch (e) {
      setInfo(e?.response?.data?.error || 'Алдаа');
    } finally { setBusy(false); }
  };

  return (
    <Modal title="Хэрэглэгчийн тохиргоо" open={open} onCancel={onClose} footer={null} destroyOnClose>
      <div style={{ marginBottom: 16 }}>
        <strong>{user?.name}</strong> · <span style={{ color: '#888' }}>{user?.email}</span>
        <div style={{ marginTop: 6 }}>
          <Tag color="blue">{user?.role}</Tag>
          <Tag color={user?.provider === 'google' ? 'gold' : 'default'}>
            {user?.provider === 'google' ? 'Google-ээр нэвтэрсэн' : 'Имэйл/нууц үг'}
          </Tag>
          <Tag color={hasPassword ? 'green' : 'orange'}>
            {hasPassword ? 'Нууц үг тохируулсан' : 'Нууц үг тохируулаагүй'}
          </Tag>
        </div>
      </div>

      <Alert
        type="info"
        showIcon
        message={hasPassword ? 'Нууц үгээ солих' : 'Нууц үг тохируулах'}
        description={hasPassword
          ? 'Одоогийн нууц үгээ шалгасны дараа шинэ нууц үгийг хадгална.'
          : 'Та одоогоор зөвхөн Google-ээр нэвтэрдэг. Нууц үг тохируулсны дараа имэйл/нууц үгээр ч нэвтэрч чадна.'}
        style={{ marginBottom: 16 }}
      />

      {info && <Alert type="error" message={info} style={{ marginBottom: 12 }} />}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        {hasPassword && (
          <Form.Item name="currentPassword" label="Одоогийн нууц үг" rules={[{ required: true, min: 6 }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
        )}
        <Form.Item name="newPassword" label="Шинэ нууц үг (≥ 8 тэмдэгт)"
          rules={[{ required: true, min: 8 }]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="confirmPassword" label="Шинэ нууц үг дахин"
          dependencies={['newPassword']}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error('Нууц үг тохирохгүй байна'));
              },
            }),
          ]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={busy} block>Хадгалах</Button>
      </Form>
    </Modal>
  );
}
