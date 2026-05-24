import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, Link, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Spin, Button, Dropdown, Avatar } from 'antd';
import {
  DownOutlined, UserOutlined, SettingOutlined, LogoutOutlined,
  CrownOutlined, TeamOutlined, MenuOutlined, CloseOutlined,
  HomeOutlined, CalendarOutlined, TrophyOutlined,
} from '@ant-design/icons';
import AccountSettingsModal from './components/AccountSettingsModal';
import NavigationProgress from './components/NavigationProgress';
import VolleyballLoader from './components/VolleyballLoader';
import LiveStrip from './components/LiveStrip';
import BackToTop from './components/BackToTop';
import SiteFooter from './components/SiteFooter';
import { useDispatch, useSelector } from 'react-redux';
import { auth as authApi, siteSettings as settingsApi } from './api';
import { setUser, clearUser, setStatus } from './store';
import { isAdmin as isAdminRole } from './utils/permissions';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';

// Code-split everything except HomePage + LoginPage. Most visitors land on
// the homepage and never need the admin chunks; this drops the initial JS
// payload by ~60% and gives the route-change progress bar real work to do
// the first time you click Tournaments / Teams / Admin.
const MatchesListPage      = lazy(() => import('./pages/MatchesListPage'));
const MatchScoreboardPage  = lazy(() => import('./pages/MatchScoreboardPage'));
const PlayerProfilePage    = lazy(() => import('./pages/PlayerProfilePage'));
const StatEntryPage        = lazy(() => import('./pages/StatEntryPage'));
const TournamentsPage      = lazy(() => import('./pages/TournamentsPage'));
const TournamentDetailPage = lazy(() => import('./pages/TournamentDetailPage'));
const TeamsPage            = lazy(() => import('./pages/TeamsPage'));
const TeamDetailPage       = lazy(() => import('./pages/TeamDetailPage'));
const NewsDetailPage       = lazy(() => import('./pages/NewsDetailPage'));
const AdminUsersPage       = lazy(() => import('./pages/AdminUsersPage'));
const CmsHubPage           = lazy(() => import('./pages/CmsHubPage'));
const NotFoundPage         = lazy(() => import('./pages/NotFoundPage'));

function RequireRole({ roles, children }) {
  const user = useSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Suspense fallback — also dispatches `app:loading` so the top progress bar
// keeps animating until the lazy chunk finishes.
function RouteLoader() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('app:loading', { detail: true }));
    return () => window.dispatchEvent(new CustomEvent('app:loading', { detail: false }));
  }, []);
  return (
    <div className="route-loader">
      <VolleyballLoader label="Ачаалж байна" />
    </div>
  );
}

// Wrap each route element in a fade-in shell. Rendered fresh on every route
// change because of the `key` we pass at mount, so the animation re-fires.
function RouteShell({ children }) {
  return <div className="route-fade">{children}</div>;
}

export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useSelector((s) => s.auth.status);
  const user = useSelector((s) => s.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState({});
  const [scrolled, setScrolled] = useState(false);

  // Toggle header chrome (shadow, more solid bg) once the viewer has
  // scrolled away from the very top. 12px is enough that a tiny rubber-band
  // bounce on iOS doesn't flicker the class.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    dispatch(setStatus('checking'));
    authApi.me()
      .then((d) => { if (!cancelled) dispatch(setUser(d.user)); })
      .catch(() => { if (!cancelled) dispatch(clearUser()); });
    return () => { cancelled = true; };
  }, [dispatch]);

  // Site-wide settings (logo, name) — needed for header brand and favicon.
  useEffect(() => {
    let cancelled = false;
    settingsApi.publicMap()
      .then((r) => { if (!cancelled) setSiteSettings(r.settings || {}); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Sync favicon + document.title to whatever the admin uploaded.
  useEffect(() => {
    const url = siteSettings.siteLogoUrl;
    if (url) {
      let icon = document.querySelector('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
      }
      icon.href = url;
      let apple = document.querySelector('link[rel="apple-touch-icon"]');
      if (!apple) {
        apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        document.head.appendChild(apple);
      }
      apple.href = url;
    }
    if (siteSettings.siteName) {
      document.title = `${siteSettings.siteName} · Live статистик`;
    }
  }, [siteSettings.siteLogoUrl, siteSettings.siteName]);

  const onLogout = async () => {
    try { await authApi.logout(); } catch {}
    dispatch(clearUser());
    navigate('/');
  };

  // Close mobile sheet + scroll to top on every navigation
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  if (status === 'checking') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  const isFullBleed = isHome || isLogin;
  // Use the shared permission helper (avoids shadowing the import).
  const isAdmin = isAdminRole(user);

  const adminMenu = isAdmin ? {
    items: [
      { key: 'cms',   icon: <CrownOutlined />, label: <Link to="/admin/cms">Сайтын удирдлага (CMS)</Link> },
      { key: 'users', icon: <TeamOutlined />,  label: <Link to="/admin/users">Хэрэглэгчид</Link> },
      { key: 'teams', icon: <TeamOutlined />,  label: <Link to="/teams">Багуудын удирдлага</Link> },
    ],
  } : null;

  return (
    <div className="app-shell">
      <NavigationProgress />

      <header className={`app-header ${isHome ? 'transparent' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="app-header-inner">
          <Link to="/" className="brand">
            {siteSettings.siteLogoUrl ? (
              <img className="brand-mark brand-mark-img" src={siteSettings.siteLogoUrl} alt="" />
            ) : (
              <span className="brand-mark" aria-hidden />
            )}
            <span className="brand-name">
              <span className="hide-on-mobile">{siteSettings.siteName || 'Volley Live'}</span>
              <span className="show-on-mobile">VLS</span>
            </span>
          </Link>

          <nav className="nav">
            <NavLink to="/" end>Нүүр</NavLink>
            <NavLink to="/matches">Тоглолт</NavLink>
            <NavLink to="/tournaments">Тэмцээн</NavLink>
          </nav>

          <div className="header-cta">
            {adminMenu && (
              <Dropdown menu={adminMenu} trigger={['click']}>
                <Button type="text" className="admin-menu-btn" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                  <CrownOutlined /> <span className="hide-on-mobile">Удирдлага</span> <DownOutlined />
                </Button>
              </Dropdown>
            )}
            {user ? (
              <UserDropdown user={user} onLogout={onLogout} />
            ) : (
              <Button type="primary" onClick={() => navigate('/login')}
                style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 700 }}>
                Нэвтрэх
              </Button>
            )}
            <Button
              className="mobile-menu-btn"
              type="text"
              icon={mobileOpen ? <CloseOutlined /> : <MenuOutlined />}
              onClick={() => setMobileOpen(o => !o)}
              aria-label="menu"
            />
          </div>
        </div>
      </header>

      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} isAdmin={isAdmin} />}

      <main style={{ flex: 1 }}>
        <ErrorBoundary>
          <div className={isFullBleed ? '' : 'page-container'}>
            <Suspense fallback={<RouteLoader />}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<RouteShell><HomePage /></RouteShell>} />
                <Route path="/login" element={<RouteShell><LoginPage /></RouteShell>} />
                <Route path="/matches" element={<RouteShell><MatchesListPage /></RouteShell>} />
                <Route path="/matches/:id" element={<RouteShell><MatchScoreboardPage /></RouteShell>} />
                <Route
                  path="/matches/:id/stat-entry"
                  element={<RequireRole roles={['ADMIN','STATISTICIAN']}><RouteShell><StatEntryPage /></RouteShell></RequireRole>}
                />
                <Route path="/tournaments" element={<RouteShell><TournamentsPage /></RouteShell>} />
                <Route path="/tournaments/:id" element={<RouteShell><TournamentDetailPage /></RouteShell>} />
                <Route path="/teams" element={<RouteShell><TeamsPage /></RouteShell>} />
                <Route path="/teams/:id" element={<RouteShell><TeamDetailPage /></RouteShell>} />
                <Route path="/players/:id" element={<RouteShell><PlayerProfilePage /></RouteShell>} />
                <Route path="/news/:id" element={<RouteShell><NewsDetailPage /></RouteShell>} />
                <Route
                  path="/admin/users"
                  element={<RequireRole roles={['ADMIN']}><RouteShell><AdminUsersPage /></RouteShell></RequireRole>}
                />
                <Route
                  path="/admin/announcements"
                  element={<RequireRole roles={['ADMIN']}><Navigate to="/admin/cms?tab=news" replace /></RequireRole>}
                />
                <Route
                  path="/admin/cms"
                  element={<RequireRole roles={['ADMIN']}><RouteShell><CmsHubPage /></RouteShell></RequireRole>}
                />
                <Route path="*" element={<RouteShell><NotFoundPage /></RouteShell>} />
              </Routes>
            </Suspense>
          </div>
        </ErrorBoundary>
      </main>
      <SiteFooter settings={siteSettings} />
      <LiveStrip />
      <BackToTop />
    </div>
  );
}

function UserDropdown({ user, onLogout }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const items = [
    {
      key: 'me',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 700 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
          <div style={{ marginTop: 6 }}>
            <span className="pill primary">{user.role}</span>
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    { key: 'settings', label: 'Хэрэглэгчийн тохиргоо', icon: <SettingOutlined />, onClick: () => setSettingsOpen(true) },
    { key: 'logout',   label: 'Гарах',                 icon: <LogoutOutlined />,  onClick: onLogout },
  ];
  return (
    <>
      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
        <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, color: 'var(--accent)' }}>
          {user.picture
            ? <Avatar size={28} src={user.picture} />
            : <Avatar size={28} icon={<UserOutlined />} style={{ background: 'var(--accent)', color: '#fff' }} />}
          <span className="hide-on-mobile" style={{ fontWeight: 600 }}>{user.name?.split(' ')[0] || 'User'}</span>
          <DownOutlined className="hide-on-mobile" style={{ fontSize: 10, opacity: 0.5 }} />
        </Button>
      </Dropdown>
      <AccountSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

function MobileNav({ onClose, isAdmin }) {
  const links = [
    { to: '/', label: 'Нүүр',       icon: <HomeOutlined />,     end: true },
    { to: '/matches', label: 'Тоглолт', icon: <CalendarOutlined /> },
    { to: '/tournaments', label: 'Тэмцээн', icon: <TrophyOutlined /> },
  ];
  return (
    <div className="mobile-nav-sheet" role="dialog" aria-modal="true">
      <div className="mobile-nav-orb mobile-nav-orb-1" />
      <div className="mobile-nav-orb mobile-nav-orb-2" />
      <nav className="mobile-nav-list">
        {links.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className="mobile-nav-link"
            style={{ animationDelay: `${60 + i * 60}ms` }}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
            <span className="chev" aria-hidden>→</span>
          </NavLink>
        ))}
        {isAdmin && (
          <div className="mobile-nav-group" style={{ animationDelay: `${60 + links.length * 60}ms` }}>
            <div className="mobile-nav-group-label">Удирдлага</div>
            <NavLink to="/admin/cms" onClick={onClose} className="mobile-nav-link is-admin">
              <span className="icon"><CrownOutlined /></span>
              <span className="label">CMS удирдлага</span>
              <span className="chev" aria-hidden>→</span>
            </NavLink>
            <NavLink to="/admin/users" onClick={onClose} className="mobile-nav-link is-admin">
              <span className="icon"><TeamOutlined /></span>
              <span className="label">Хэрэглэгчид</span>
              <span className="chev" aria-hidden>→</span>
            </NavLink>
            <NavLink to="/teams" onClick={onClose} className="mobile-nav-link is-admin">
              <span className="icon"><TeamOutlined /></span>
              <span className="label">Багуудын удирдлага</span>
              <span className="chev" aria-hidden>→</span>
            </NavLink>
          </div>
        )}
      </nav>
      <div className="mobile-nav-footer">
        <span className="mn-brand-mark" aria-hidden>V</span>
        <span className="mn-brand-text">Volleyball Match · Live</span>
      </div>
    </div>
  );
}
