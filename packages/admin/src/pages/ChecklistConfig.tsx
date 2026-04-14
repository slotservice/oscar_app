import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { useTheme } from '../theme/ThemeContext';

export function ChecklistConfig() {
  const { theme } = useTheme();
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newSection, setNewSection] = useState('');
  const [newItems, setNewItems] = useState<Record<string, string>>({});

  // Inline editing state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (selectedPlant) loadSections();
  }, [selectedPlant]);

  const loadPlants = async () => {
    try {
      const result = await adminApi.plants.list();
      setPlants(result.data);
      if (result.data.length > 0) {
        setSelectedPlant(result.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const result = await adminApi.sections.list(selectedPlant);
      setSections(result.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addSection = async () => {
    if (!newSection.trim()) return;
    try {
      await adminApi.sections.create(selectedPlant, {
        name: newSection.trim(),
        displayOrder: sections.length + 1,
      });
      setNewSection('');
      loadSections();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const addItem = async (sectionId: string) => {
    const name = newItems[sectionId]?.trim();
    if (!name) return;
    try {
      const section = sections.find((s) => s.id === sectionId);
      await adminApi.sections.createItem(sectionId, {
        name,
        displayOrder: (section?.items?.length || 0) + 1,
      });
      setNewItems((prev) => ({ ...prev, [sectionId]: '' }));
      loadSections();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleItem = async (itemId: string, active: boolean) => {
    try {
      await adminApi.sections.updateItem(itemId, { active: !active });
      loadSections();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- Edit handlers ---

  const startEditSection = (section: any) => {
    setEditingSectionId(section.id);
    setEditingSectionName(section.name);
  };

  const saveEditSection = async (sectionId: string) => {
    const trimmed = editingSectionName.trim();
    if (!trimmed) return;
    try {
      await adminApi.sections.update(sectionId, { name: trimmed });
      setEditingSectionId(null);
      setEditingSectionName('');
      loadSections();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const cancelEditSection = () => {
    setEditingSectionId(null);
    setEditingSectionName('');
  };

  const startEditItem = (item: any) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
  };

  const saveEditItem = async (itemId: string) => {
    const trimmed = editingItemName.trim();
    if (!trimmed) return;
    try {
      await adminApi.sections.updateItem(itemId, { name: trimmed });
      setEditingItemId(null);
      setEditingItemName('');
      loadSections();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditingItemName('');
  };

  // --- Delete handlers ---

  const deleteSection = async (section: any) => {
    if (!window.confirm(`Delete section ${section.name} and all its items?`)) return;
    try {
      const token = localStorage.getItem('oscar_admin_token');
      const resp = await fetch(`/api/admin/sections/${section.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || `Delete failed: ${resp.status}`);
      }
      loadSections();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteItem = async (item: any) => {
    if (!window.confirm(`Delete item ${item.name}?`)) return;
    try {
      const token = localStorage.getItem('oscar_admin_token');
      const resp = await fetch(`/api/admin/items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || `Delete failed: ${resp.status}`);
      }
      loadSections();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const s: Record<string, React.CSSProperties> = {
    loading: { textAlign: 'center', padding: 40, color: theme.textSecondary },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 700, color: theme.text },
    plantSelect: { padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text },
    addRow: { display: 'flex', gap: 12, marginBottom: 24 },
    input: { flex: 1, padding: '10px 14px', border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text },
    addBtn: { padding: '10px 16px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' },
    sectionCard: { backgroundColor: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, marginBottom: 16, overflow: 'hidden' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: theme.surfaceHover, borderBottom: `1px solid ${theme.border}` },
    sectionName: { fontSize: 16, fontWeight: 600, margin: 0, color: theme.text },
    itemCount: { fontSize: 13, color: theme.textSecondary },
    item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${theme.borderLight}` },
    itemName: { fontSize: 14, fontWeight: 500, color: theme.text },
    toggleBtn: { padding: '3px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.surface, cursor: 'pointer', fontSize: 12, color: theme.textSecondary },
    editBtn: { padding: '3px 10px', border: '1px solid #bfdbfe', borderRadius: 6, backgroundColor: '#eff6ff', color: '#1e40af', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
    deleteBtn: { padding: '3px 10px', border: '1px solid #fecaca', borderRadius: 6, backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
    addItemRow: { display: 'flex', gap: 8, padding: '10px 16px' },
    itemInput: { flex: 1, padding: '6px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 13, backgroundColor: theme.inputBg, color: theme.text },
    addItemBtn: { width: 32, height: 32, border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.surfaceHover, cursor: 'pointer', fontSize: 18, color: theme.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    empty: { textAlign: 'center', padding: 40, color: theme.textTertiary, fontSize: 14 },
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Checklist Configuration</h2>
        <select style={s.plantSelect} value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)}>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Add Section */}
      <div style={s.addRow}>
        <input style={s.input} placeholder="New section name..." value={newSection} onChange={(e) => setNewSection(e.target.value)} />
        <button onClick={addSection} style={s.addBtn}>+ Add Section</button>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.id} style={s.sectionCard}>
          <div style={s.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {editingSectionId === section.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    style={{ padding: '4px 8px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 14, fontWeight: 600, backgroundColor: theme.inputBg, color: theme.text }}
                    value={editingSectionName}
                    onChange={(e) => setEditingSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditSection(section.id);
                      if (e.key === 'Escape') cancelEditSection();
                    }}
                    autoFocus
                  />
                  <button onClick={() => saveEditSection(section.id)} style={s.addBtn}>Save</button>
                  <button onClick={cancelEditSection} style={s.toggleBtn}>Cancel</button>
                </div>
              ) : (
                <>
                  <h3 style={{ ...s.sectionName, opacity: section.active ? 1 : 0.5 }}>{section.name}</h3>
                  {!section.active && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, backgroundColor: '#fee2e2', color: '#ef4444' }}>DISABLED</span>}
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={s.itemCount}>{section.items?.length || 0} items</span>
              <button onClick={async () => { try { await adminApi.sections.update(section.id, { active: !section.active }); loadSections(); } catch (err: any) { alert(err.message); } }} style={{ ...s.toggleBtn, color: section.active ? '#ef4444' : '#22c55e' }}>
                {section.active ? 'Disable Section' : 'Enable Section'}
              </button>
              <button onClick={() => startEditSection(section)} style={s.editBtn}>Edit</button>
              <button onClick={() => deleteSection(section)} style={s.deleteBtn}>Delete</button>
            </div>
          </div>

          {/* Items */}
          {section.items?.map((item: any) => (
            <div key={item.id} style={{ ...s.item, opacity: item.active ? 1 : 0.5 }}>
              {editingItemId === item.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input
                    style={{ padding: '4px 8px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 13, fontWeight: 500, flex: 1, backgroundColor: theme.inputBg, color: theme.text }}
                    value={editingItemName}
                    onChange={(e) => setEditingItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditItem(item.id);
                      if (e.key === 'Escape') cancelEditItem();
                    }}
                    autoFocus
                  />
                  <button onClick={() => saveEditItem(item.id)} style={s.addBtn}>Save</button>
                  <button onClick={cancelEditItem} style={s.toggleBtn}>Cancel</button>
                </div>
              ) : (
                <>
                  <span style={s.itemName}>{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                      style={{ padding: '2px 6px', border: `1px solid ${theme.border}`, borderRadius: 4, fontSize: 11, backgroundColor: theme.inputBg, color: theme.textSecondary }}
                      value={item.minimumLevel || 'TRAINEE'}
                      onChange={async (e) => {
                        try { await adminApi.sections.updateItem(item.id, { minimumLevel: e.target.value }); loadSections(); }
                        catch (err: any) { alert(err.message); }
                      }}
                    >
                      <option value="TRAINEE">All</option>
                      <option value="EXPERIENCED">Exp+</option>
                      <option value="VETERAN">Vet</option>
                    </select>
                    <button onClick={() => toggleItem(item.id, item.active)} style={s.toggleBtn}>
                      {item.active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => startEditItem(item)} style={s.editBtn}>Edit</button>
                    <button onClick={() => deleteItem(item)} style={s.deleteBtn}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add Item */}
          <div style={s.addItemRow}>
            <input
              style={s.itemInput}
              placeholder="Add checklist item..."
              value={newItems[section.id] || ''}
              onChange={(e) => setNewItems((prev) => ({ ...prev, [section.id]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && addItem(section.id)}
            />
            <button onClick={() => addItem(section.id)} style={s.addItemBtn}>+</button>
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <div style={s.empty}>No sections configured. Add one above.</div>
      )}
    </div>
  );
}
