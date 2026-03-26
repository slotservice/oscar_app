import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../api/client';

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPlantId, setBulkPlantId] = useState('');

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

  // Sort: ADMIN first, then by name. Assign row numbers.
  const sortedUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
      if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return sortedUsers.filter((u) => {
      const matchSearch = searchText === '' ||
        u.name.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email.toLowerCase().includes(searchText.toLowerCase());
      const matchRole = filterRole === 'ALL' || u.role === filterRole;
      const matchStatus = filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && u.active) ||
        (filterStatus === 'INACTIVE' && !u.active);
      return matchSearch && matchRole && matchStatus;
    });
  }, [sortedUsers, searchText, filterRole, filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.users.create(form);
      setForm({ name: '', email: '', password: '', role: 'USER' });
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
    if (user.role === 'ADMIN') {
      alert('Cannot delete admin account.');
      return;
    }
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

  // Multi-select
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const bulkAssignPlant = async () => {
    if (!bulkPlantId || selectedIds.size === 0) {
      alert('Select users and a plant first.');
      return;
    }
    let success = 0;
    let skipped = 0;
    for (const userId of selectedIds) {
      try {
        await adminApi.users.assignPlant(userId, bulkPlantId);
        success++;
      } catch {
        skipped++;
      }
    }
    alert(`Assigned: ${success} users. Already assigned: ${skipped}.`);
    setSelectedIds(new Set());
    setBulkPlantId('');
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Users ({users.length})</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingUser(null); }} style={s.addBtn}>
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={s.form}>
          <input style={s.input} placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input style={s.input} type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={s.input} type="password" placeholder="Password *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select style={s.input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" style={s.submitBtn}>Create User</button>
        </form>
      )}

      {/* Edit Form */}
      {editingUser && (
        <div style={s.editCard}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Edit User</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input style={s.input} placeholder="Name" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
            <input style={s.input} placeholder="Email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
            <select style={s.input} value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button onClick={handleSaveEdit} style={s.submitBtn}>Save</button>
            <button onClick={() => setEditingUser(null)} style={s.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div style={s.filterBar}>
        <input
          style={s.searchInput}
          placeholder="Search by name or email..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select style={s.filterSelect} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
        <select style={s.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {searchText || filterRole !== 'ALL' || filterStatus !== 'ALL' ? (
          <button onClick={() => { setSearchText(''); setFilterRole('ALL'); setFilterStatus('ALL'); }} style={s.clearBtn}>Clear</button>
        ) : null}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div style={s.bulkBar}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{selectedIds.size} selected</span>
          <select style={s.filterSelect} value={bulkPlantId} onChange={(e) => setBulkPlantId(e.target.value)}>
            <option value="">Select Plant...</option>
            {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={bulkAssignPlant} style={s.bulkBtn}>Assign Plant to Selected</button>
          <button onClick={() => setSelectedIds(new Set())} style={s.cancelBtn}>Clear Selection</button>
        </div>
      )}

      {/* Table */}
      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, width: 36, flex: 0 }}>
            <input type="checkbox" checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0} onChange={toggleSelectAll} />
          </span>
          <span style={{ ...s.cell, width: 40, flex: 0 }}>No</span>
          <span style={{ ...s.cell, flex: 2 }}>Name</span>
          <span style={{ ...s.cell, flex: 2 }}>Email</span>
          <span style={s.cell}>Role</span>
          <span style={s.cell}>Status</span>
          <span style={{ ...s.cell, flex: 3 }}>Actions</span>
        </div>
        {filteredUsers.map((user, idx) => {
          // Admin always #1, rest numbered sequentially
          const rowNo = sortedUsers.indexOf(user) + 1;
          return (
            <div key={user.id} style={s.tableRow}>
              <span style={{ ...s.cell, width: 36, flex: 0 }}>
                <input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} />
              </span>
              <span style={{ ...s.cell, width: 40, flex: 0, color: '#94a3b8', fontWeight: 600 }}>{rowNo}</span>
              <span style={{ ...s.cell, flex: 2, fontWeight: 600 }}>{user.name}</span>
              <span style={{ ...s.cell, flex: 2, color: '#64748b' }}>{user.email}</span>
              <span style={s.cell}>
                <span style={{
                  ...s.roleBadge,
                  backgroundColor: user.role === 'ADMIN' ? '#fef3c7' : '#e0e7ff',
                  color: user.role === 'ADMIN' ? '#d97706' : '#4338ca',
                }}>{user.role}</span>
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
          );
        })}
      </div>
      {filteredUsers.length === 0 && <div style={s.empty}>No users match the filters.</div>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { textAlign: 'center', padding: 40, color: '#64748b' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 700 },
  addBtn: { padding: '8px 16px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  form: { display: 'flex', gap: 12, marginBottom: 20, padding: 16, backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap' },
  input: { flex: 1, minWidth: 150, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14 },
  submitBtn: { padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  cancelBtn: { padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  editCard: { marginBottom: 20, padding: 16, backgroundColor: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' },
  // Filters
  filterBar: { display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  filterSelect: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#64748b' },
  clearBtn: { padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, color: '#64748b' },
  // Bulk
  bulkBar: { display: 'flex', gap: 10, marginBottom: 16, padding: '12px 16px', backgroundColor: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', alignItems: 'center', flexWrap: 'wrap' },
  bulkBtn: { padding: '8px 16px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  // Table
  table: { backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 13, color: '#64748b', textTransform: 'uppercase', alignItems: 'center', gap: 8 },
  tableRow: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', gap: 8 },
  cell: { flex: 1, fontSize: 14 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
  roleBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
  actionBtn: { padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, color: '#64748b' },
  editBtn: { padding: '4px 10px', border: '1px solid #bfdbfe', borderRadius: 6, backgroundColor: '#eff6ff', cursor: 'pointer', fontSize: 12, color: '#1e40af', fontWeight: 600 },
  deleteBtn: { padding: '4px 10px', border: '1px solid #fecaca', borderRadius: 6, backgroundColor: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#ef4444', fontWeight: 600 },
  assignSelect: { padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 },
};
