import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { adminApi, setAuthToken, getAuthToken } from './api/client';
import { useTheme } from './theme/ThemeContext';
import { Dashboard } from './pages/Dashboard';
import { Plants } from './pages/Plants';
import { Users } from './pages/Users';
import { ChecklistConfig } from './pages/ChecklistConfig';
import { Thresholds } from './pages/Thresholds';
import { LabFields } from './pages/LabFields';
import { ObservationTags } from './pages/ObservationTags';
import { RoundHistory } from './pages/RoundHistory';
import { LogicMatrix } from './pages/LogicMatrix';

export function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { mode, theme, toggle } = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    try {
      const result = await adminApi.auth.me();
      setUser(result.data);
    } catch {
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const result = await adminApi.auth.login(email, password);
    setAuthToken(result.data.token);
    setUser(result.data.user);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: theme.textSecondary }}>Loading...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={{ width: 240, backgroundColor: theme.sidebarBg, color: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 0', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '0 24px 24px', borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, margin: 0 }}>OSCAR</h1>
          <span style={{ fontSize: 12, color: theme.sidebarText, textTransform: 'uppercase' as const, letterSpacing: 2 }}>Admin Panel</span>
        </div>

        <div style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { path: '/', label: 'Dashboard' },
            { path: '/plants', label: 'Plants' },
            { path: '/users', label: 'Users' },
            { path: '/checklist', label: 'Checklist Config' },
            { path: '/thresholds', label: 'Thresholds' },
            { path: '/lab-fields', label: 'Lab Fields' },
            { path: '/observation-tags', label: 'Observation Tags' },
            { path: '/history', label: 'Round History' },
            { path: '/logic-matrix', label: 'Logic Matrix' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block', padding: '10px 24px', color: theme.sidebarText,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                transition: 'all 0.15s',
                ...(location.pathname === item.path ? { color: theme.sidebarActiveText, backgroundColor: theme.sidebarActiveBg, borderLeft: '3px solid #3b82f6' } : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.sidebarBorder}` }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: theme.sidebarText, marginTop: 2 }}>{user.role}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={toggle} style={{ padding: '6px 12px', backgroundColor: 'transparent', border: `1px solid ${theme.sidebarBorder}`, borderRadius: 6, color: theme.sidebarText, cursor: 'pointer', fontSize: 12 }}>
              {mode === 'light' ? 'Dark' : 'Light'}
            </button>
            <button onClick={handleLogout} style={{ padding: '6px 12px', backgroundColor: 'transparent', border: `1px solid ${theme.sidebarBorder}`, borderRadius: 6, color: theme.sidebarText, cursor: 'pointer', fontSize: 12 }}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 240, padding: 32 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plants" element={<Plants />} />
          <Route path="/users" element={<Users />} />
          <Route path="/checklist" element={<ChecklistConfig />} />
          <Route path="/thresholds" element={<Thresholds />} />
          <Route path="/lab-fields" element={<LabFields />} />
          <Route path="/observation-tags" element={<ObservationTags />} />
          <Route path="/history" element={<RoundHistory />} />
          <Route path="/logic-matrix" element={<LogicMatrix />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: theme.loginBg }}>
      <form onSubmit={handleSubmit} style={{ backgroundColor: theme.loginFormBg, borderRadius: 12, padding: 40, width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center' as const, color: theme.loginTitle, letterSpacing: 4 }}>OSCAR Admin</h1>
        {error && <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '8px 12px', borderRadius: 6, fontSize: 14 }}>{error}</div>}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 16, outline: 'none', backgroundColor: theme.inputBg, color: theme.text }} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 16, outline: 'none', backgroundColor: theme.inputBg, color: theme.text }} required />
        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
