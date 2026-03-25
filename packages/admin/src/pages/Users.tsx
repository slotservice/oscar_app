import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'OPERATOR' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, plantsRes] = await Promise.all([
        adminApi.users.list(),
        adminApi.plants.list(),
      ]);
      setUsers(usersRes.data);
      setPlants(plantsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.users.create(form);
      setForm({ name: '', email: '', password: '', role: 'OPERATOR' });
      setShowForm(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (user: any) => {
    try {
      await adminApi.users.update(user.id, { active: !user.active });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const assignPlant = async (userId: string, plantId: string) => {
    try {
      await adminApi.users.assignPlant(userId, plantId);
      alert('Plant assigned successfully');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Users</h2>
        <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={s.form}>
          <input style={s.input} placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input style={s.input} type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={s.input} type="password" placeholder="Password *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select style={s.input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="OPERATOR">Operator</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" style={s.submitBtn}>Create User</button>
        </form>
      )}

      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, flex: 2 }}>Name</span>
          <span style={{ ...s.cell, flex: 2 }}>Email</span>
          <span style={s.cell}>Role</span>
          <span style={s.cell}>Status</span>
          <span style={{ ...s.cell, flex: 2 }}>Actions</span>
        </div>
        {users.map((user) => (
          <div key={user.id} style={s.tableRow}>
            <span style={{ ...s.cell, flex: 2, fontWeight: 600 }}>{user.name}</span>
            <span style={{ ...s.cell, flex: 2, color: '#64748b' }}>{user.email}</span>
            <span style={s.cell}>
              <span style={{ ...s.roleBadge }}>{user.role}</span>
            </span>
            <span style={s.cell}>
              <span style={{ ...s.badge, backgroundColor: user.active ? '#dcfce7' : '#fee2e2', color: user.active ? '#22c55e' : '#ef4444' }}>
                {user.active ? 'Active' : 'Inactive'}
              </span>
            </span>
            <span style={{ ...s.cell, flex: 2, display: 'flex', gap: 8 }}>
              <button onClick={() => toggleActive(user)} style={s.actionBtn}>
                {user.active ? 'Disable' : 'Enable'}
              </button>
              <select
                style={s.assignSelect}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) assignPlant(user.id, e.target.value);
                  e.target.value = '';
                }}
              >
                <option value="" disabled>Assign Plant...</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { textAlign: 'center', padding: 40, color: '#64748b' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 700 },
  addBtn: { padding: '8px 16px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  form: { display: 'flex', gap: 12, marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap' },
  input: { flex: 1, minWidth: 150, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14 },
  submitBtn: { padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  table: { backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 13, color: '#64748b', textTransform: 'uppercase' },
  tableRow: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  cell: { flex: 1, fontSize: 14 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
  roleBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, backgroundColor: '#e0e7ff', color: '#4338ca' },
  actionBtn: { padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, color: '#64748b' },
  assignSelect: { padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#64748b' },
};
