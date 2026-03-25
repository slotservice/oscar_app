import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

export function Dashboard() {
  const [plants, setPlants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plantsRes, usersRes] = await Promise.all([
        adminApi.plants.list(),
        adminApi.users.list(),
      ]);
      setPlants(plantsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  const operators = users.filter((u) => u.role === 'OPERATOR');
  const activePlants = plants.filter((p) => p.active);

  return (
    <div>
      <h2 style={s.title}>Dashboard</h2>

      <div style={s.statsGrid}>
        <StatCard label="Active Plants" value={activePlants.length} color="#22c55e" />
        <StatCard label="Total Users" value={users.length} color="#3b82f6" />
        <StatCard label="Operators" value={operators.length} color="#8b5cf6" />
        <StatCard label="Total Plants" value={plants.length} color="#f59e0b" />
      </div>

      <div style={s.sections}>
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Plants</h3>
          {plants.map((plant) => (
            <div key={plant.id} style={s.listItem}>
              <span style={s.itemName}>{plant.name}</span>
              <span style={s.itemSub}>{plant.location || 'No location'}</span>
              <span style={{ ...s.badge, backgroundColor: plant.active ? '#dcfce7' : '#fee2e2', color: plant.active ? '#22c55e' : '#ef4444' }}>
                {plant.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>

        <div style={s.section}>
          <h3 style={s.sectionTitle}>Users</h3>
          {users.map((user) => (
            <div key={user.id} style={s.listItem}>
              <span style={s.itemName}>{user.name}</span>
              <span style={s.itemSub}>{user.email}</span>
              <span style={{ ...s.badge, backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statValue, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { textAlign: 'center', padding: 40, color: '#64748b' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 24 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  statCard: { backgroundColor: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e2e8f0', textAlign: 'center' },
  statValue: { fontSize: 36, fontWeight: 800 },
  statLabel: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 },
  sections: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  section: { backgroundColor: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e293b' },
  listItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
  itemName: { fontWeight: 600, fontSize: 14, flex: 1 },
  itemSub: { fontSize: 13, color: '#64748b' },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase' },
};
