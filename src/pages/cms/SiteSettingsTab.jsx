import React, { useEffect, useState } from 'react';
import { Card, Input, Button, message, Space, Alert } from 'antd';
import { siteSettings as api } from '../../api';
import ImageUpload from '../../components/ImageUpload';
import VolleyballLoader from '../../components/VolleyballLoader';

export default function SiteSettingsTab() {
  const [items, setItems] = useState([]);
  const [publicMap, setPublicMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [draft, setDraft] = useState({});

  const reload = async () => {
    setLoading(true);
    try {
      const [editor, pub] = await Promise.all([api.adminList(), api.publicMap()]);
      setItems(editor.settings);
      setPublicMap(pub.settings || {});
      const m = {};
      editor.settings.forEach(s => { m[s.key] = s.value || ''; });
      setDraft(m);
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const onSave = async (key) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await api.set(key, draft[key] ?? '');
      message.success('Хадгалсан');
    } catch (e) { message.error(e?.response?.data?.error || 'Алдаа'); }
    finally { setSaving(s => ({ ...s, [key]: false })); }
  };

  const onUploadLogin = async (file) => {
    const r = await api.uploadLoginImage(file);
    setPublicMap(p => ({ ...p, loginImageUrl: r.loginImageUrl }));
  };
  const onRemoveLogin = async () => {
    await api.removeLoginImage();
    setPublicMap(p => ({ ...p, loginImageUrl: '' }));
  };

  const onUploadLogo = async (file) => {
    const r = await api.uploadSiteLogo(file);
    setPublicMap(p => ({ ...p, siteLogoUrl: r.siteLogoUrl }));
  };
  const onRemoveLogo = async () => {
    await api.removeSiteLogo();
    setPublicMap(p => ({ ...p, siteLogoUrl: '' }));
  };

  if (loading) return (
    <div style={{ padding: 60, display: 'grid', placeItems: 'center' }}>
      <VolleyballLoader label="Тохиргоо ачаалж байна" />
    </div>
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" title="Сайтын лого (header + favicon)">
        <Alert
          type="info" showIcon style={{ marginBottom: 12 }}
          message="Header дээрх жижиг лого + browser tab-д харагдах favicon"
          description="Квадрат харьцаатай (1:1) зураг тохиромжтой. Дор хаяж 512×512 px санал. Дэвсгэр өнгө шингэсэн PNG (transparent биш) бол browser tab дээр илүү тод."
        />
        <ImageUpload
          currentUrl={publicMap.siteLogoUrl}
          onUpload={onUploadLogo}
          onRemove={onRemoveLogo}
          shape="square"
          size={160}
          label="Лого оруулах"
        />
      </Card>

      <Card size="small" title="Нэвтрэх хуудасны зүүн дэвсгэр зураг">
        <Alert
          type="info" showIcon style={{ marginBottom: 12 }}
          message="Login хуудасны зүүн талд харагдах зураг"
          description="3:4 эсвэл 4:5 портрет харьцаатай зураг тохиромжтой. Дор хаяж 1200×1500 px санал. Зургийн дээр текст уншигдахуйц байхын тулд харанхуй өнгөтэй зураг сонгож, эсвэл доор Title/Subtitle-аа богино байлгаж болно."
        />
        <ImageUpload
          currentUrl={publicMap.loginImageUrl}
          onUpload={onUploadLogin}
          onRemove={onRemoveLogin}
          shape="square"
          size={220}
          label="Зураг оруулах"
        />
      </Card>

      <Card size="small" title="Бусад тохиргоо">
        <p style={{ color: '#666', fontSize: 13, marginTop: 0 }}>
          Эдгээр утгууд нь нүүр хуудас, footer, header, login хуудас зэрэгт хэрэглэгдэнэ.
          Хоосон үлдээсэн утгууд (жнь social link) тухайн UI-д харагдахгүй.
        </p>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {items.map(s => (
            <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <strong style={{ fontSize: 13 }}>{s.description || s.key}</strong>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#888' }}>{s.key}</div>
              </div>
              {(s.key.startsWith('home') || s.key === 'tagline' || s.key === 'footerCopyright' || s.key === 'loginSubtitle')
                ? <Input.TextArea rows={2} value={draft[s.key] ?? ''} onChange={e => setDraft({ ...draft, [s.key]: e.target.value })} />
                : <Input value={draft[s.key] ?? ''} onChange={e => setDraft({ ...draft, [s.key]: e.target.value })} />}
              <Button onClick={() => onSave(s.key)} loading={!!saving[s.key]} type="primary" ghost>Хадгалах</Button>
            </div>
          ))}
        </Space>
      </Card>
    </Space>
  );
}
