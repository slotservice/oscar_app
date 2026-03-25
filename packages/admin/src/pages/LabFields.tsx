import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

export function LabFields() {
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', unit: '' });

  useEffect(() => { loadPlants(); }, []);
  useEffect(() => { if (selectedPlant) loadFields(); }, [selectedPlant]);

  const loadPlants = async () => {
    try {
      const result = await adminApi.plants.list();
      setPlants(result.data);
      if (result.data.length > 0) setSelectedPlant(result.data[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadFields = async () => {
    try {
      const result = await adminApi.labFields.list(selectedPlant);
      setFields(result.data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.unit.trim()) return;
    try {
      await adminApi.labFields.create(selectedPlant, {
        name: form.name.trim(),
        unit: form.unit.trim(),
        displayOrder: fields.length + 1,
      });
      setForm({ name: '', unit: '' });
      setShowForm(false);
      loadFields();
    } catch (err: any) { alert(err.message); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await adminApi.labFields.update(id, { active: !active });
      loadFields();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Lab Fields</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <select style={s.select} value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)}>
            {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>
            {showForm ? 'Cancel' : '+ Add Lab Field'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={s.form}>
          <input style={s.input} placeholder="Field Name (e.g. DO, pH, Temperature) *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input style={s.input} placeholder="Unit (e.g. mg/L, SU, °F) *" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
          <button type="submit" style={s.submitBtn}>Create</button>
        </form>
      )}

      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, width: 50 }}>#</span>
          <span style={{ ...s.cell, flex: 2 }}>Name</span>
          <span style={s.cell}>Unit</span>
          <span style={s.cell}>Status</span>
          <span style={s.cell}>Actions</span>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} style={{ ...s.tableRow, opacity: field.active ? 1 : 0.5 }}>
            <span style={{ ...s.cell, width: 50, color: '#94a3b8' }}>{i + 1}</span>
            <span style={{ ...s.cell, flex: 2, fontWeight: 600 }}>{field.name}</span>
            <span style={{ ...s.cell, color: '#64748b' }}>{field.unit}</span>
            <span style={s.cell}>
              <span style={{ ...s.badge, backgroundColor: field.active ? '#dcfce7' : '#fee2e2', color: field.active ? '#22c55e' : '#ef4444' }}>
                {field.active ? 'Active' : 'Disabled'}
              </span>
            </span>
            <span style={s.cell}>
              <button onClick={() => toggleActive(field.id, field.active)} style={s.actionBtn}>
                {field.active ? 'Disable' : 'Enable'}
              </button>
            </span>
          </div>
        ))}
      </div>
      {fields.length === 0 && <div style={s.empty}>No lab fields configured. Add one above.</div>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { textAlign: 'center', padding: 40, color: '#64748b' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 700 },
  select: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
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
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 },
};
