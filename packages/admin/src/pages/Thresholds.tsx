import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { useTheme } from '../theme/ThemeContext';

export function Thresholds() {
  const { theme } = useTheme();
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [labFields, setLabFields] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    labFieldId: '',
    cautionLow: '',
    cautionHigh: '',
    criticalLow: '',
    criticalHigh: '',
    suggestionText: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    cautionLow: '',
    cautionHigh: '',
    criticalLow: '',
    criticalHigh: '',
    suggestionText: '',
  });

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (selectedPlant) loadData();
  }, [selectedPlant]);

  const loadPlants = async () => {
    try {
      const result = await adminApi.plants.list();
      setPlants(result.data);
      if (result.data.length > 0) setSelectedPlant(result.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [fieldsRes, thresholdsRes] = await Promise.all([
        adminApi.labFields.list(selectedPlant),
        adminApi.thresholds.list(selectedPlant),
      ]);
      setLabFields(fieldsRes.data);
      setThresholds(thresholdsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.thresholds.create(selectedPlant, {
        labFieldId: form.labFieldId,
        cautionLow: form.cautionLow ? parseFloat(form.cautionLow) : null,
        cautionHigh: form.cautionHigh ? parseFloat(form.cautionHigh) : null,
        criticalLow: form.criticalLow ? parseFloat(form.criticalLow) : null,
        criticalHigh: form.criticalHigh ? parseFloat(form.criticalHigh) : null,
        suggestionText: form.suggestionText,
      });
      setForm({ labFieldId: '', cautionLow: '', cautionHigh: '', criticalLow: '', criticalHigh: '', suggestionText: '' });
      setShowForm(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await adminApi.thresholds.update(id, { active: !active });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (t: any) => {
    setEditingId(t.id);
    setEditForm({
      cautionLow: t.cautionLow != null ? String(t.cautionLow) : '',
      cautionHigh: t.cautionHigh != null ? String(t.cautionHigh) : '',
      criticalLow: t.criticalLow != null ? String(t.criticalLow) : '',
      criticalHigh: t.criticalHigh != null ? String(t.criticalHigh) : '',
      suggestionText: t.suggestionText || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ cautionLow: '', cautionHigh: '', criticalLow: '', criticalHigh: '', suggestionText: '' });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await adminApi.thresholds.update(editingId, {
        cautionLow: editForm.cautionLow ? parseFloat(editForm.cautionLow) : null,
        cautionHigh: editForm.cautionHigh ? parseFloat(editForm.cautionHigh) : null,
        criticalLow: editForm.criticalLow ? parseFloat(editForm.criticalLow) : null,
        criticalHigh: editForm.criticalHigh ? parseFloat(editForm.criticalHigh) : null,
        suggestionText: editForm.suggestionText,
      });
      cancelEdit();
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the threshold rule for "${name}"?`)) return;
    try {
      const token = localStorage.getItem('oscar_admin_token');
      await fetch(`/api/admin/thresholds/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const s: Record<string, React.CSSProperties> = {
    loading: { textAlign: 'center', padding: 40, color: theme.textSecondary },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 700, color: theme.text },
    plantSelect: { padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text },
    addBtn: { padding: '8px 16px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
    form: { marginBottom: 24, padding: 16, backgroundColor: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: 12 },
    editForm: { marginBottom: 24, padding: 16, backgroundColor: theme.editBg, borderRadius: 10, border: `1px solid ${theme.editBorder}`, display: 'flex', flexDirection: 'column', gap: 12 },
    editFormTitle: { fontSize: 14, fontWeight: 600, color: '#1e40af' },
    formRow: { display: 'flex', gap: 12 },
    input: { flex: 1, padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text },
    submitBtn: { padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
    saveBtn: { padding: '8px 16px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
    cancelBtn: { padding: '8px 16px', backgroundColor: theme.surface, color: theme.textSecondary, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
    table: { backgroundColor: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, overflow: 'hidden' },
    tableHeader: { display: 'flex', padding: '12px 16px', backgroundColor: theme.surfaceHover, borderBottom: `1px solid ${theme.border}`, fontWeight: 600, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase' },
    tableRow: { display: 'flex', padding: '12px 16px', borderBottom: `1px solid ${theme.borderLight}`, alignItems: 'center' },
    cell: { flex: 1, fontSize: 13, color: theme.text },
    actionBtn: { padding: '3px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.surface, cursor: 'pointer', fontSize: 12, color: theme.textSecondary },
    editBtn: { padding: '3px 10px', border: `1px solid ${theme.editBorder}`, borderRadius: 6, backgroundColor: theme.editBg, cursor: 'pointer', fontSize: 12, color: '#1e40af', fontWeight: 600 },
    deleteBtn: { padding: '3px 10px', border: '1px solid #fecaca', borderRadius: 6, backgroundColor: '#fef2f2', cursor: 'pointer', fontSize: 12, color: '#ef4444', fontWeight: 600 },
    empty: { textAlign: 'center', padding: 40, color: theme.textTertiary, fontSize: 14 },
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Threshold Rules</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <select style={s.plantSelect} value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)}>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>
            {showForm ? 'Cancel' : '+ Add Rule'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={s.form}>
          <div style={s.formRow}>
            <select style={s.input} value={form.labFieldId} onChange={(e) => setForm({ ...form, labFieldId: e.target.value })} required>
              <option value="">Select Lab Field</option>
              {labFields.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.unit})</option>
              ))}
            </select>
          </div>
          <div style={s.formRow}>
            <input style={s.input} type="number" step="any" placeholder="Caution Low" value={form.cautionLow} onChange={(e) => setForm({ ...form, cautionLow: e.target.value })} />
            <input style={s.input} type="number" step="any" placeholder="Caution High" value={form.cautionHigh} onChange={(e) => setForm({ ...form, cautionHigh: e.target.value })} />
            <input style={s.input} type="number" step="any" placeholder="Critical Low" value={form.criticalLow} onChange={(e) => setForm({ ...form, criticalLow: e.target.value })} />
            <input style={s.input} type="number" step="any" placeholder="Critical High" value={form.criticalHigh} onChange={(e) => setForm({ ...form, criticalHigh: e.target.value })} />
          </div>
          <div style={s.formRow}>
            <input style={{ ...s.input, flex: 3 }} placeholder="Suggestion text *" value={form.suggestionText} onChange={(e) => setForm({ ...form, suggestionText: e.target.value })} required />
            <button type="submit" style={s.submitBtn}>Create</button>
          </div>
        </form>
      )}

      {editingId && (
        <form onSubmit={handleEditSave} style={s.editForm}>
          <div style={s.editFormTitle}>
            Editing: {thresholds.find((t) => t.id === editingId)?.labField?.name || 'Threshold'}
          </div>
          <div style={s.formRow}>
            <input style={s.input} type="number" step="any" placeholder="Caution Low" value={editForm.cautionLow} onChange={(e) => setEditForm({ ...editForm, cautionLow: e.target.value })} />
            <input style={s.input} type="number" step="any" placeholder="Caution High" value={editForm.cautionHigh} onChange={(e) => setEditForm({ ...editForm, cautionHigh: e.target.value })} />
            <input style={s.input} type="number" step="any" placeholder="Critical Low" value={editForm.criticalLow} onChange={(e) => setEditForm({ ...editForm, criticalLow: e.target.value })} />
            <input style={s.input} type="number" step="any" placeholder="Critical High" value={editForm.criticalHigh} onChange={(e) => setEditForm({ ...editForm, criticalHigh: e.target.value })} />
          </div>
          <div style={s.formRow}>
            <input style={{ ...s.input, flex: 3 }} placeholder="Suggestion text" value={editForm.suggestionText} onChange={(e) => setEditForm({ ...editForm, suggestionText: e.target.value })} />
            <button type="submit" style={s.saveBtn}>Save</button>
            <button type="button" onClick={cancelEdit} style={s.cancelBtn}>Cancel</button>
          </div>
        </form>
      )}

      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, flex: 1.5 }}>Lab Field</span>
          <span style={s.cell}>Caution Low</span>
          <span style={s.cell}>Caution High</span>
          <span style={s.cell}>Critical Low</span>
          <span style={s.cell}>Critical High</span>
          <span style={{ ...s.cell, flex: 2 }}>Suggestion</span>
          <span style={{ ...s.cell, flex: 1.5 }}>Actions</span>
        </div>
        {thresholds.map((t) => (
          <div key={t.id} style={{ ...s.tableRow, opacity: t.active ? 1 : 0.5 }}>
            <span style={{ ...s.cell, flex: 1.5, fontWeight: 600 }}>{t.labField?.name || '—'}</span>
            <span style={{ ...s.cell, color: '#eab308' }}>{t.cautionLow ?? '—'}</span>
            <span style={{ ...s.cell, color: '#eab308' }}>{t.cautionHigh ?? '—'}</span>
            <span style={{ ...s.cell, color: '#ef4444' }}>{t.criticalLow ?? '—'}</span>
            <span style={{ ...s.cell, color: '#ef4444' }}>{t.criticalHigh ?? '—'}</span>
            <span style={{ ...s.cell, flex: 2, fontSize: 13, color: theme.textSecondary }}>{t.suggestionText}</span>
            <span style={{ ...s.cell, flex: 1.5, display: 'flex', gap: 6 }}>
              <button onClick={() => startEdit(t)} style={s.editBtn}>Edit</button>
              <button onClick={() => toggleActive(t.id, t.active)} style={s.actionBtn}>
                {t.active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => handleDelete(t.id, t.labField?.name || 'this rule')} style={s.deleteBtn}>Delete</button>
            </span>
          </div>
        ))}
      </div>

      {thresholds.length === 0 && (
        <div style={s.empty}>No threshold rules configured. Add one above.</div>
      )}
    </div>
  );
}
