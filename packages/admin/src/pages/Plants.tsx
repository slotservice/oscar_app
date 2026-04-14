import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { useTheme } from '../theme/ThemeContext';

export function Plants() {
  const { theme } = useTheme();
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState<any>(null);
  const [form, setForm] = useState({ name: '', location: '', plantType: '' });

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      const result = await adminApi.plants.list();
      setPlants(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.plants.create(form);
      setForm({ name: '', location: '', plantType: '' });
      setShowForm(false);
      loadPlants();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (plant: any) => {
    setEditingPlant(plant);
    setShowForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editingPlant) return;
    try {
      await adminApi.plants.update(editingPlant.id, {
        name: editingPlant.name,
        location: editingPlant.location,
        plantType: editingPlant.plantType,
      });
      setEditingPlant(null);
      loadPlants();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (plant: any) => {
    try {
      await adminApi.plants.update(plant.id, { active: !plant.active });
      loadPlants();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deletePlant = async (plant: any) => {
    if (!window.confirm(`Are you sure you want to delete ${plant.name}?`)) return;
    try {
      const token = localStorage.getItem('oscar_admin_token');
      const res = await fetch(`/api/admin/plants/${plant.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      loadPlants();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const s: Record<string, React.CSSProperties> = {
    loading: { textAlign: 'center', padding: 40, color: theme.textSecondary },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 700, color: theme.text },
    addBtn: { padding: '8px 16px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
    form: { display: 'flex', gap: 12, marginBottom: 24, padding: 16, backgroundColor: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}` },
    input: { flex: 1, minWidth: 150, padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text },
    submitBtn: { padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
    cancelBtn: { padding: '8px 16px', backgroundColor: theme.surfaceAlt, color: theme.textSecondary, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
    editCard: { marginBottom: 20, padding: 16, backgroundColor: theme.editBg, borderRadius: 10, border: `1px solid ${theme.editBorder}` },
    table: { backgroundColor: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, overflow: 'hidden' },
    tableHeader: { display: 'flex', padding: '12px 16px', backgroundColor: theme.surfaceHover, borderBottom: `1px solid ${theme.border}`, fontWeight: 600, fontSize: 13, color: theme.textSecondary, textTransform: 'uppercase' },
    tableRow: { display: 'flex', padding: '12px 16px', borderBottom: `1px solid ${theme.borderLight}`, alignItems: 'center' },
    cell: { flex: 1, fontSize: 14, color: theme.text },
    badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
    actionBtn: { padding: '4px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.surface, cursor: 'pointer', fontSize: 12, color: theme.textSecondary },
    editBtn: { padding: '4px 10px', border: `1px solid ${theme.editBorder}`, borderRadius: 6, backgroundColor: theme.editBg, cursor: 'pointer', fontSize: 12, color: '#1e40af', fontWeight: 600 },
    deleteBtn: { padding: '4px 10px', border: '1px solid #fecaca', borderRadius: 6, backgroundColor: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#ef4444', fontWeight: 600 },
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Plants</h2>
        <button onClick={() => { setShowForm(!showForm); setEditingPlant(null); }} style={s.addBtn}>
          {showForm ? 'Cancel' : '+ Add Plant'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={s.form}>
          <input style={s.input} placeholder="Plant Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input style={s.input} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input style={s.input} placeholder="Plant Type" value={form.plantType} onChange={(e) => setForm({ ...form, plantType: e.target.value })} />
          <button type="submit" style={s.submitBtn}>Create Plant</button>
        </form>
      )}

      {/* Edit Card */}
      {editingPlant && (
        <div style={s.editCard}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, color: theme.text }}>Edit Plant</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input style={s.input} placeholder="Name" value={editingPlant.name} onChange={(e) => setEditingPlant({ ...editingPlant, name: e.target.value })} />
            <input style={s.input} placeholder="Location" value={editingPlant.location || ''} onChange={(e) => setEditingPlant({ ...editingPlant, location: e.target.value })} />
            <input style={s.input} placeholder="Plant Type" value={editingPlant.plantType || ''} onChange={(e) => setEditingPlant({ ...editingPlant, plantType: e.target.value })} />
            <button onClick={handleSaveEdit} style={s.submitBtn}>Save</button>
            <button onClick={() => setEditingPlant(null)} style={s.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, flex: 2 }}>Name</span>
          <span style={{ ...s.cell, flex: 2 }}>Location</span>
          <span style={s.cell}>Type</span>
          <span style={s.cell}>Status</span>
          <span style={{ ...s.cell, flex: 2 }}>Actions</span>
        </div>
        {plants.map((plant) => (
          <div key={plant.id} style={s.tableRow}>
            <span style={{ ...s.cell, flex: 2, fontWeight: 600 }}>{plant.name}</span>
            <span style={{ ...s.cell, flex: 2, color: theme.textSecondary }}>{plant.location || '—'}</span>
            <span style={{ ...s.cell, color: theme.textSecondary }}>{plant.plantType || '—'}</span>
            <span style={s.cell}>
              <span style={{ ...s.badge, backgroundColor: plant.active ? '#dcfce7' : '#fee2e2', color: plant.active ? '#22c55e' : '#ef4444' }}>
                {plant.active ? 'Active' : 'Inactive'}
              </span>
            </span>
            <span style={{ ...s.cell, flex: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => handleEdit(plant)} style={s.editBtn}>Edit</button>
              <button onClick={() => toggleActive(plant)} style={s.actionBtn}>
                {plant.active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => deletePlant(plant)} style={s.deleteBtn}>Delete</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
