import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Alert, Divider } from 'antd';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { auth as authApi, siteSettings as settingsApi } from '../api';
import { setUser } from '../store';
import VolleyballLoader from '../components/VolleyballLoader';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      authApi.config().catch(() => ({ googleClientId: null })),
      settingsApi.publicMap().catch(() => ({ settings: {} })),
    ]).then(([cfg, st]) => {
      setConfig(cfg);
      setSettings(st.settings || {});
    });
  }, []);

  const onPasswordLogin = async (values) => {
    setLoading(true); setError(null);
    try {
      const data = await authApi.login(values.email, values.password);
      dispatch(setUser(data.user));
      navigate('/');
    } catch (e) {
      setError(e?.response?.data?.error || 'Нэвтрэх алдаа');
    } finally { setLoading(false); }
  };

  const onGoogleSuccess = async (cred) => {
    setError(null); setLoading(true);
    try {
      const data = await authApi.google(cred.credential);
      dispatch(setUser(data.user));
      navigate(data.user.role === 'UNASSIGNED' ? '/?welcome=1' : '/');
    } catch (e) {
      setError(e?.response?.data?.error || 'Google нэвтрэлт амжилтгүй');
    } finally { setLoading(false); }
  };

  if (!config) {
    return (
      <div style={{ padding: 120, display: 'grid', placeItems: 'center' }}>
        <VolleyballLoader label="Ачаалж байна" />
      </div>
    );
  }

  const heroStyle = settings.loginImageUrl
    ? { backgroundImage: `url(${settings.loginImageUrl})` }
    : {};

  const heroTitle = settings.loginTitle || 'Volley Live';
  const heroSubtitle = settings.loginSubtitle || 'Волейболын тэмцээний live статистик';

  return (
    <div className="auth-shell">
      <div className="auth-image-side" style={heroStyle}>
        <div className="auth-overlay">
          <span className="badge">● Live · Real-time scoreboard</span>
          <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>
          <p style={{ fontSize: 14, opacity: 0.85 }}>
            Үзэгчид нэвтрэхгүйгээр шууд оноо үзнэ. Дасгалжуулагч, статистикчид Google-ээр эсвэл имэйл/нууц үгээр нэвтэрнэ.
          </p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card">
          <h2>Тавтай морил</h2>
          <p className="lede">Шинэ хэрэглэгч бол Google-ээр нэвтэрнэ үү. Админ бол доорх форм-оор нэвтэрнэ.</p>

          {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />}

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            {config.googleClientId ? (
              <GoogleOAuthProvider clientId={config.googleClientId}>
                <GoogleLogin
                  onSuccess={onGoogleSuccess}
                  onError={() => setError('Google нэвтрэлт амжилтгүй')}
                  size="large"
                  width="380"
                  text="signin_with"
                  theme="filled_black"
                  shape="pill"
                  locale="mn"
                />
              </GoogleOAuthProvider>
            ) : (
              <Alert
                type="warning" showIcon
                message="Google нэвтрэлт идэвхгүй"
                description="Админ нь backend .env дээр GOOGLE_CLIENT_ID-г тохируулна уу"
                style={{ width: '100%' }}
              />
            )}
          </div>

          <div className="auth-divider">эсвэл имэйл/нууц үгээр</div>

          <Form layout="vertical" onFinish={onPasswordLogin} initialValues={{ email: '', password: '' }}>
            <Form.Item name="email" label="И-мэйл" rules={[{ required: true, message: 'И-мэйл оруулна уу' }, { type: 'email', message: 'Зөв и-мэйл бичнэ үү' }]}>
              <Input size="large" autoComplete="username" placeholder="you@example.com" />
            </Form.Item>
            <Form.Item name="password" label="Нууц үг" rules={[{ required: true, message: 'Нууц үг оруулна уу' }]}>
              <Input.Password size="large" autoComplete="current-password" placeholder="••••••••" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}
              style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700, height: 48 }}>
              Нэвтрэх
            </Button>
          </Form>

          <Divider style={{ margin: '24px 0 16px', borderColor: 'var(--border)' }} />

          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Үзэгчийн scoreboard нь нэвтрэхгүйгээр харагдана.
            <br />
            <a href="/" style={{ marginTop: 4, display: 'inline-block' }}>Нүүр хуудас руу буцах →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
