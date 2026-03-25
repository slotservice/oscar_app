import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

export function ObservationTags() {
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [tags, setTags] = useState<any[]>([]);
  const [tagRules, setTagRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTagForm, setShowTagForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [tagForm, setTagForm] = useState({ name: '', category: '' });
  const [ruleForm, setRuleForm] = useState({ tagId: '', suggestionText: '', severity: 'CAUTION' });

  useEffect(() => { loadPlants(); }, []);
  useEffect(() => { if (selectedPlant) loadData(); }, [selectedPlant]);

  const loadPlants = async () => {
    try {
      const result = await adminApi.plants.list();
      setPlants(result.data);
      if (result.data.length > 0) setSelectedPlant(result.data[0].id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadData = async () => {
    try {
      const [tagsRes, rulesRes] = await Promise.all([
        fetch(`/api/admin/plants/${selectedPlant}/tags`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('oscar_admin_token')}` } }).then(r => r.json()),
        fetch(`/api/admin/plants/${selectedPlant}/tag-rules`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('oscar_admin_token')}` } }).then(r => r.json()),
      ]);
      setTags(tagsRes.data || []);
      setTagRules(rulesRes.data || []);
    } catch (err) { console.error(err); }
  };

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagForm.name.trim()) return;
    try {
      await fetch(`/api/admin/plants/${selectedPlant}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('oscar_admin_token')}` },
        body: JSON.stringify({ name: tagForm.name.trim(), category: tagForm.category.trim() || null }),
      });
      setTagForm({ name: '', category: '' });
      setShowTagForm(false);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const toggleTag = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('oscar_admin_token')}` },
        body: JSON.stringify({ active: !active }),
      });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.tagId || !ruleForm.suggestionText.trim()) return;
    try {
      await fetch(`/api/admin/plants/${selectedPlant}/tag-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('oscar_admin_token')}` },
        body: JSON.stringify(ruleForm),
      });
      setRuleForm({ tagId: '', suggestionText: '', severity: 'CAUTION' });
      setShowRuleForm(false);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const toggleRule = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/admin/tag-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('oscar_admin_token')}` },
        body: JSON.stringify({ active: !active }),
      });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Observation Tags & Rules</h2>
        <select style={s.select} value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)}>
          {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Tags Section */}
      <div style={s.sectionHeader}>
        <h3 style={s.sectionTitle}>Observation Tags</h3>
        <button onClick={() => setShowTagForm(!showTagForm)} style={s.addBtn}>
          {showTagForm ? 'Cancel' : '+ Add Tag'}
        </button>
      </div>

      {showTagForm && (
        <form onSubmit={createTag} style={s.form}>
          <input style={s.input} placeholder="Tag Name (e.g. Cloudy clarifier) *" value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })} required />
          <input style={s.input} placeholder="Category (e.g. Clarifier, Aeration)" value={tagForm.category} onChange={(e) => setTagForm({ ...tagForm, category: e.target.value })} />
          <button type="submit" style={s.submitBtn}>Create</button>
        </form>
      )}

      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, flex: 2 }}>Tag Name</span>
          <span style={s.cell}>Category</span>
          <span style={s.cell}>Status</span>
          <span style={s.cell}>Actions</span>
        </div>
        {tags.map((tag) => (
          <div key={tag.id} style={{ ...s.tableRow, opacity: tag.active ? 1 : 0.5 }}>
            <span style={{ ...s.cell, flex: 2, fontWeight: 600 }}>{tag.name}</span>
            <span style={{ ...s.cell, color: '#64748b' }}>{tag.category || '—'}</span>
            <span style={s.cell}>
              <span style={{ ...s.badge, backgroundColor: tag.active ? '#dcfce7' : '#fee2e2', color: tag.active ? '#22c55e' : '#ef4444' }}>
                {tag.active ? 'Active' : 'Disabled'}
              </span>
            </span>
            <span style={s.cell}>
              <button onClick={() => toggleTag(tag.id, tag.active)} style={s.actionBtn}>
                {tag.active ? 'Disable' : 'Enable'}
              </button>
            </span>
          </div>
        ))}
      </div>
      {tags.length === 0 && <div style={s.empty}>No tags configured.</div>}

      {/* Tag Rules Section */}
      <div style={{ ...s.sectionHeader, marginTop: 32 }}>
        <h3 style={s.sectionTitle}>Tag Trigger Rules</h3>
        <button onClick={() => setShowRuleForm(!showRuleForm)} style={s.addBtn}>
          {showRuleForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      {showRuleForm && (
        <form onSubmit={createRule} style={s.form}>
          <select style={s.input} value={ruleForm.tagId} onChange={(e) => setRuleForm({ ...ruleForm, tagId: e.target.value })} required>
            <option value="">Select Tag...</option>
            {tags.filter(t => t.active).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input style={{ ...s.input, flex: 2 }} placeholder="Suggestion text *" value={ruleForm.suggestionText} onChange={(e) => setRuleForm({ ...ruleForm, suggestionText: e.target.value })} required />
          <select style={s.input} value={ruleForm.severity} onChange={(e) => setRuleForm({ ...ruleForm, severity: e.target.value })}>
            <option value="CAUTION">Caution</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <button type="submit" style={s.submitBtn}>Create</button>
        </form>
      )}

      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, flex: 1.5 }}>Tag</span>
          <span style={{ ...s.cell, flex: 2 }}>Suggestion</span>
          <span style={s.cell}>Severity</span>
          <span style={s.cell}>Status</span>
          <span style={s.cell}>Actions</span>
        </div>
        {tagRules.map((rule) => (
          <div key={rule.id} style={{ ...s.tableRow, opacity: rule.active ? 1 : 0.5 }}>
            <span style={{ ...s.cell, flex: 1.5, fontWeight: 600 }}>{rule.tag?.name || '—'}</span>
            <span style={{ ...s.cell, flex: 2, fontSize: 13, color: '#64748b' }}>{rule.suggestionText}</span>
            <span style={s.cell}>
              <span style={{ ...s.severityBadge, backgroundColor: rule.severity === 'CRITICAL' ? '#fee2e2' : '#fef9c3', color: rule.severity === 'CRITICAL' ? '#ef4444' : '#eab308' }}>
                {rule.severity}
              </span>
            </span>
            <span style={s.cell}>
              <span style={{ ...s.badge, backgroundColor: rule.active ? '#dcfce7' : '#fee2e2', color: rule.active ? '#22c55e' : '#ef4444' }}>
                {rule.active ? 'Active' : 'Disabled'}
              </span>
            </span>
            <span style={s.cell}>
              <button onClick={() => toggleRule(rule.id, rule.active)} style={s.actionBtn}>
                {rule.active ? 'Disable' : 'Enable'}
              </button>
            </span>
          </div>
        ))}
      </div>
      {tagRules.length === 0 && <div style={s.empty}>No tag rules configured.</div>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { textAlign: 'center', padding: 40, color: '#64748b' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700 },
  select: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 600, margin: 0 },
  addBtn: { padding: '8px 16px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  form: { display: 'flex', gap: 12, marginBottom: 16, padding: 16, backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap' },
  input: { flex: 1, minWidth: 140, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14 },
  submitBtn: { padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  table: { backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 8 },
  tableHeader: { display: 'flex', padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  tableRow: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  cell: { flex: 1, fontSize: 13 },
  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
  severityBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
  actionBtn: { padding: '3px 10px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 14 },
};
