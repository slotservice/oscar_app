import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'OPERATOR' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, plantsRes] = await Promise.all([
        adminApi.users.list(),
        adminApi.plants.list(),
      ]);
      setUsers(usersRes.data);
      setPlants(plantsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.users.create(form);
      setForm({ name: '', email: '', password: '', role: 'OPERATOR' });
      setShowForm(false);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setShowForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await adminApi.users.update(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
      });
      setEditingUser(null);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const toggleActive = async (user: any) => {
    try {
      await adminApi.users.update(user.id, { active: !user.active });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const deleteUser = async (user: any) => {
    if (!window.confirm(`Are you sure you want to delete "${user.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('oscar_admin_token');
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const assignPlant = async (userId: string, plantId: string) => {
    try {
      await adminApi.users.assignPlant(userId, plantId);
      alert('Plant assigned successfully');
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Users</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingUser(null); }} style={s.addBtn}>
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

      {/* Edit Modal */}
      {editingUser && (
        <div style={s.editCard}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Edit User</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input style={s.input} placeholder="Name" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
            <input style={s.input} placeholder="Email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
            <select style={s.input} value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
              <option value="OPERATOR">Operator</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button onClick={handleSaveEdit} style={s.submitBtn}>Save</button>
            <button onClick={() => setEditingUser(null)} style={s.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, flex: 2 }}>Name</span>
          <span style={{ ...s.cell, flex: 2 }}>Email</span>
          <span style={s.cell}>Role</span>
          <span style={s.cell}>Status</span>
          <span style={{ ...s.cell, flex: 3 }}>Actions</span>
        </div>
        {users.map((user) => (
          <div key={user.id} style={s.tableRow}>
            <span style={{ ...s.cell, flex: 2, fontWeight: 600 }}>{user.name}</span>
            <span style={{ ...s.cell, flex: 2, color: '#64748b' }}>{user.email}</span>
            <span style={s.cell}>
              <span style={s.roleBadge}>{user.role}</span>
            </span>
            <span style={s.cell}>
              <span style={{ ...s.badge, backgroundColor: user.active ? '#dcfce7' : '#fee2e2', color: user.active ? '#22c55e' : '#ef4444' }}>
                {user.active ? 'Active' : 'Inactive'}
              </span>
            </span>
            <span style={{ ...s.cell, flex: 3, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => handleEdit(user)} style={s.editBtn}>Edit</button>
              <button onClick={() => toggleActive(user)} style={s.actionBtn}>
                {user.active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => deleteUser(user)} style={s.deleteBtn}>Delete</button>
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
  cancelBtn: { padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  editCard: { marginBottom: 20, padding: 16, backgroundColor: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' },
  table: { backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 13, color: '#64748b', textTransform: 'uppercase' },
  tableRow: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  cell: { flex: 1, fontSize: 14 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
  roleBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, backgroundColor: '#e0e7ff', color: '#4338ca' },
  actionBtn: { padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, color: '#64748b' },
  editBtn: { padding: '4px 10px', border: '1px solid #bfdbfe', borderRadius: 6, backgroundColor: '#eff6ff', cursor: 'pointer', fontSize: 12, color: '#1e40af', fontWeight: 600 },
  deleteBtn: { padding: '4px 10px', border: '1px solid #fecaca', borderRadius: 6, backgroundColor: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#ef4444', fontWeight: 600 },
  assignSelect: { padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#64748b' },
};
