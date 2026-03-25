import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

export function ChecklistConfig() {
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newSection, setNewSection] = useState('');
  const [newItems, setNewItems] = useState<Record<string, string>>({});

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
              <h3 style={{ ...s.sectionName, opacity: section.active ? 1 : 0.5 }}>{section.name}</h3>
              {!section.active && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, backgroundColor: '#fee2e2', color: '#ef4444' }}>DISABLED</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={s.itemCount}>{section.items?.length || 0} items</span>
              <button onClick={async () => { try { await adminApi.sections.update(section.id, { active: !section.active }); loadSections(); } catch (err: any) { alert(err.message); } }} style={{ ...s.toggleBtn, color: section.active ? '#ef4444' : '#22c55e' }}>
                {section.active ? 'Disable Section' : 'Enable Section'}
              </button>
            </div>
          </div>

          {/* Items */}
          {section.items?.map((item: any) => (
            <div key={item.id} style={{ ...s.item, opacity: item.active ? 1 : 0.5 }}>
              <span style={s.itemName}>{item.name}</span>
              <button onClick={() => toggleItem(item.id, item.active)} style={s.toggleBtn}>
                {item.active ? 'Disable' : 'Enable'}
              </button>
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

const s: Record<string, React.CSSProperties> = {
  loading: { textAlign: 'center', padding: 40, color: '#64748b' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 700 },
  plantSelect: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  addRow: { display: 'flex', gap: 12, marginBottom: 24 },
  input: { flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  addBtn: { padding: '10px 16px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16, overflow: 'hidden' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  sectionName: { fontSize: 16, fontWeight: 600, margin: 0 },
  itemCount: { fontSize: 13, color: '#64748b' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f1f5f9' },
  itemName: { fontSize: 14, fontWeight: 500 },
  toggleBtn: { padding: '3px 10px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, color: '#64748b' },
  addItemRow: { display: 'flex', gap: 8, padding: '10px 16px' },
  itemInput: { flex: 1, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 },
  addItemBtn: { width: 32, height: 32, border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 },
};
