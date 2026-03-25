import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { adminApi, setAuthToken, getAuthToken } from './api/client';
import { Dashboard } from './pages/Dashboard';
import { Plants } from './pages/Plants';
import { Users } from './pages/Users';
import { ChecklistConfig } from './pages/ChecklistConfig';
import { Thresholds } from './pages/Thresholds';
import { LabFields } from './pages/LabFields';
import { ObservationTags } from './pages/ObservationTags';
import { RoundHistory } from './pages/RoundHistory';

export function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

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
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <nav style={styles.sidebar}>
        <div style={styles.brand}>
          <h1 style={styles.brandText}>OSCAR</h1>
          <span style={styles.brandSub}>Admin Panel</span>
        </div>

        <div style={styles.nav}>
          {[
            { path: '/', label: 'Dashboard' },
            { path: '/plants', label: 'Plants' },
            { path: '/users', label: 'Users' },
            { path: '/checklist', label: 'Checklist Config' },
            { path: '/thresholds', label: 'Thresholds' },
            { path: '/lab-fields', label: 'Lab Fields' },
            { path: '/observation-tags', label: 'Observation Tags' },
            { path: '/history', label: 'Round History' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navLink,
                ...(location.pathname === item.path ? styles.navLinkActive : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div style={styles.userSection}>
          <div style={styles.userName}>{user.name}</div>
          <div style={styles.userRole}>{user.role}</div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plants" element={<Plants />} />
          <Route path="/users" element={<Users />} />
          <Route path="/checklist" element={<ChecklistConfig />} />
          <Route path="/thresholds" element={<Thresholds />} />
          <Route path="/lab-fields" element={<LabFields />} />
          <Route path="/observation-tags" element={<ObservationTags />} />
          <Route path="/history" element={<RoundHistory />} />
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
    <div style={styles.loginContainer}>
      <form onSubmit={handleSubmit} style={styles.loginForm}>
        <h1 style={styles.loginTitle}>OSCAR Admin</h1>
        {error && <div style={styles.error}>{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" disabled={loading} style={styles.loginBtn}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', fontSize: 18, color: '#64748b',
  },
  layout: {
    display: 'flex', minHeight: '100vh',
  },
  sidebar: {
    width: 240, backgroundColor: '#1e293b', color: '#fff',
    display: 'flex', flexDirection: 'column', padding: '24px 0',
    position: 'fixed', top: 0, left: 0, bottom: 0,
  },
  brand: {
    padding: '0 24px 24px', borderBottom: '1px solid #334155',
  },
  brandText: {
    fontSize: 28, fontWeight: 800, letterSpacing: 4, margin: 0,
  },
  brandSub: {
    fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 2,
  },
  nav: {
    flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 2,
  },
  navLink: {
    display: 'block', padding: '10px 24px', color: '#94a3b8',
    textDecoration: 'none', fontSize: 14, fontWeight: 500,
    transition: 'all 0.15s',
  },
  navLinkActive: {
    color: '#fff', backgroundColor: '#334155',
    borderLeft: '3px solid #3b82f6',
  },
  userSection: {
    padding: '16px 24px', borderTop: '1px solid #334155',
  },
  userName: {
    fontWeight: 600, fontSize: 14,
  },
  userRole: {
    fontSize: 12, color: '#94a3b8', marginTop: 2,
  },
  logoutBtn: {
    marginTop: 12, padding: '6px 12px', backgroundColor: 'transparent',
    border: '1px solid #475569', borderRadius: 6, color: '#94a3b8',
    cursor: 'pointer', fontSize: 12,
  },
  main: {
    flex: 1, marginLeft: 240, padding: 32,
  },
  // Login
  loginContainer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', backgroundColor: '#1e40af',
  },
  loginForm: {
    backgroundColor: '#fff', borderRadius: 12, padding: 40,
    width: 400, display: 'flex', flexDirection: 'column', gap: 16,
  },
  loginTitle: {
    fontSize: 28, fontWeight: 800, textAlign: 'center' as const, color: '#1e40af',
    letterSpacing: 4,
  },
  error: {
    backgroundColor: '#fee2e2', color: '#ef4444', padding: '8px 12px',
    borderRadius: 6, fontSize: 14,
  },
  input: {
    padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
    fontSize: 16, outline: 'none',
  },
  loginBtn: {
    padding: '12px', backgroundColor: '#1e40af', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
    cursor: 'pointer',
  },
};
