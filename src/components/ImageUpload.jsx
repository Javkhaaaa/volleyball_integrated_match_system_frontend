import React, { useState } from 'react';
import { Upload, message, Avatar, Button, Space, Spin } from 'antd';
import { UploadOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

// Reusable image upload + preview tile.
//
// props:
//   currentUrl: existing image URL (or null)
//   onUpload: async (file) => Promise<...>  — caller does the actual POST
//   onRemove: async () => Promise<...>      — caller does the actual DELETE
//   shape: 'circle' | 'square' (default 'square')
//   size: pixel size (default 96)
//   label: shown when no image present
export default function ImageUpload({ currentUrl, onUpload, onRemove, shape = 'square', size = 96, label = 'Зураг оруулах' }) {
  const [busy, setBusy] = useState(false);

  const beforeUpload = (file) => {
    if (!ALLOWED.includes(file.type)) {
      message.error('Зөвхөн PNG, JPEG, WebP формат зөвшөөрнө');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_BYTES) {
      message.error(`Файл хэт том (max ${MAX_BYTES / 1024 / 1024} MB)`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleCustom = async ({ file, onSuccess, onError }) => {
    setBusy(true);
    try {
      await onUpload(file);
      onSuccess && onSuccess({}, file);
      message.success('Зураг хадгалагдлаа');
    } catch (e) {
      onError && onError(e);
      const apiMsg = e?.response?.data?.error;
      message.error(apiMsg || 'Илгээх боломжгүй');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await onRemove();
      message.success('Зураг устгагдлаа');
    } catch (e) {
      message.error(e?.response?.data?.error || 'Устгаж чадсангүй');
    } finally {
      setBusy(false);
    }
  };

  const radius = shape === 'circle' ? size / 2 : 8;

  return (
    <Space direction="vertical" size={8}>
      <Spin spinning={busy}>
        {currentUrl ? (
          <div
            style={{
              width: size, height: size, borderRadius: radius,
              backgroundImage: `url(${currentUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              border: '1px solid #d9d9d9',
            }}
          />
        ) : (
          <Avatar
            shape={shape}
            size={size}
            icon={<UserOutlined />}
            style={{ background: '#f0f4ff', color: '#1A3E8C' }}
          />
        )}
      </Spin>
      <Space>
        <Upload
          accept={ALLOWED.join(',')}
          beforeUpload={beforeUpload}
          customRequest={handleCustom}
          showUploadList={false}
          disabled={busy}
        >
          <Button size="small" icon={<UploadOutlined />} disabled={busy}>
            {currentUrl ? 'Солих' : label}
          </Button>
        </Upload>
        {currentUrl && (
          <Button size="small" danger icon={<CloseOutlined />} onClick={handleRemove} disabled={busy}>
            Устгах
          </Button>
        )}
      </Space>
    </Space>
  );
}
