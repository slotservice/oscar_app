import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

export function Plants() {
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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

  const toggleActive = async (plant: any) => {
    try {
      await adminApi.plants.update(plant.id, { active: !plant.active });
      loadPlants();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Plants</h2>
        <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>
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

      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, flex: 2 }}>Name</span>
          <span style={{ ...s.cell, flex: 2 }}>Location</span>
          <span style={s.cell}>Type</span>
          <span style={s.cell}>Status</span>
          <span style={s.cell}>Actions</span>
        </div>
        {plants.map((plant) => (
          <div key={plant.id} style={s.tableRow}>
            <span style={{ ...s.cell, flex: 2, fontWeight: 600 }}>{plant.name}</span>
            <span style={{ ...s.cell, flex: 2, color: '#64748b' }}>{plant.location || '—'}</span>
            <span style={{ ...s.cell, color: '#64748b' }}>{plant.plantType || '—'}</span>
            <span style={s.cell}>
              <span style={{ ...s.badge, backgroundColor: plant.active ? '#dcfce7' : '#fee2e2', color: plant.active ? '#22c55e' : '#ef4444' }}>
                {plant.active ? 'Active' : 'Inactive'}
              </span>
            </span>
            <span style={s.cell}>
              <button onClick={() => toggleActive(plant)} style={s.actionBtn}>
                {plant.active ? 'Disable' : 'Enable'}
              </button>
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
  form: { display: 'flex', gap: 12, marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' },
  input: { flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14 },
  submitBtn: { padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  table: { backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 13, color: '#64748b', textTransform: 'uppercase' },
  tableRow: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  cell: { flex: 1, fontSize: 14 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
  actionBtn: { padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, color: '#64748b' },
};
