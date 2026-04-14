import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { useTheme } from '../theme/ThemeContext';

export function ObservationTags() {
  const { theme } = useTheme();
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [tags, setTags] = useState<any[]>([]);
  const [tagRules, setTagRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTagForm, setShowTagForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [tagForm, setTagForm] = useState({ name: '', category: '' });
  const [ruleForm, setRuleForm] = useState({ tagId: '', suggestionText: '', severity: 'CAUTION' });

  // Inline editing state for tags
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagForm, setEditTagForm] = useState({ name: '', category: '' });

  // Inline editing state for tag rules
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRuleForm, setEditRuleForm] = useState({ suggestionText: '', severity: '' });

  useEffect(() => { loadPlants(); }, []);
  useEffect(() => { if (selectedPlant) loadData(); }, [selectedPlant]);

  const authHeaders = (): Record<string, string> => ({
    'Authorization': `Bearer ${localStorage.getItem('oscar_admin_token')}`,
  });

  const authHeadersJson = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('oscar_admin_token')}`,
  });

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
        fetch(`/api/admin/plants/${selectedPlant}/tags`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`/api/admin/plants/${selectedPlant}/tag-rules`, { headers: authHeaders() }).then(r => r.json()),
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
        headers: authHeadersJson(),
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
        headers: authHeadersJson(),
        body: JSON.stringify({ active: !active }),
      });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const deleteTag = async (id: string, name: string) => {
    if (!window.confirm(`Delete tag ${name}?`)) return;
    try {
      await fetch(`/api/admin/tags/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const startEditTag = (tag: any) => {
    setEditingTagId(tag.id);
    setEditTagForm({ name: tag.name, category: tag.category || '' });
  };

  const cancelEditTag = () => {
    setEditingTagId(null);
    setEditTagForm({ name: '', category: '' });
  };

  const saveEditTag = async (id: string) => {
    if (!editTagForm.name.trim()) return;
    try {
      await fetch(`/api/admin/tags/${id}`, {
        method: 'PUT',
        headers: authHeadersJson(),
        body: JSON.stringify({ name: editTagForm.name.trim(), category: editTagForm.category.trim() || null }),
      });
      setEditingTagId(null);
      setEditTagForm({ name: '', category: '' });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.tagId || !ruleForm.suggestionText.trim()) return;
    try {
      await fetch(`/api/admin/plants/${selectedPlant}/tag-rules`, {
        method: 'POST',
        headers: authHeadersJson(),
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
        headers: authHeadersJson(),
        body: JSON.stringify({ active: !active }),
      });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const deleteRule = async (id: string) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await fetch(`/api/admin/tag-rules/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const startEditRule = (rule: any) => {
    setEditingRuleId(rule.id);
    setEditRuleForm({ suggestionText: rule.suggestionText, severity: rule.severity });
  };

  const cancelEditRule = () => {
    setEditingRuleId(null);
    setEditRuleForm({ suggestionText: '', severity: '' });
  };

  const saveEditRule = async (id: string) => {
    if (!editRuleForm.suggestionText.trim()) return;
    try {
      await fetch(`/api/admin/tag-rules/${id}`, {
        method: 'PUT',
        headers: authHeadersJson(),
        body: JSON.stringify({ suggestionText: editRuleForm.suggestionText.trim(), severity: editRuleForm.severity }),
      });
      setEditingRuleId(null);
      setEditRuleForm({ suggestionText: '', severity: '' });
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const s: Record<string, React.CSSProperties> = {
    loading: { textAlign: 'center', padding: 40, color: theme.textSecondary },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 24, fontWeight: 700, color: theme.text },
    select: { padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: 600, margin: 0, color: theme.text },
    addBtn: { padding: '8px 16px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    form: { display: 'flex', gap: 12, marginBottom: 16, padding: 16, backgroundColor: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, flexWrap: 'wrap' },
    input: { flex: 1, minWidth: 140, padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text },
    submitBtn: { padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
    table: { backgroundColor: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, overflow: 'hidden', marginBottom: 8 },
    tableHeader: { display: 'flex', padding: '12px 16px', backgroundColor: theme.surfaceHover, borderBottom: `1px solid ${theme.border}`, fontWeight: 600, fontSize: 12, color: theme.textSecondary, textTransform: 'uppercase' },
    tableRow: { display: 'flex', padding: '12px 16px', borderBottom: `1px solid ${theme.borderLight}`, alignItems: 'center' },
    cell: { flex: 1, fontSize: 13, color: theme.text },
    badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
    severityBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
    actionBtn: { padding: '3px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.surface, cursor: 'pointer', fontSize: 12, color: theme.textSecondary },
    editBtn: { padding: '3px 10px', border: `1px solid ${theme.editBorder}`, borderRadius: 6, backgroundColor: theme.editBg, color: '#1e40af', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
    deleteBtn: { padding: '3px 10px', border: '1px solid #fecaca', borderRadius: 6, backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
    saveBtn: { padding: '3px 10px', border: '1px solid #bbf7d0', borderRadius: 6, backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
    cancelBtn: { padding: '3px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, backgroundColor: theme.surface, color: theme.textSecondary, fontWeight: 600, fontSize: 12, cursor: 'pointer' },
    inlineInput: { width: '100%', padding: '4px 8px', border: `1px solid ${theme.border}`, borderRadius: 4, fontSize: 13, backgroundColor: theme.inputBg, color: theme.text },
    empty: { textAlign: 'center', padding: 24, color: theme.textTertiary, fontSize: 14 },
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
            {editingTagId === tag.id ? (
              <>
                <span style={{ ...s.cell, flex: 2 }}>
                  <input
                    style={s.inlineInput}
                    value={editTagForm.name}
                    onChange={(e) => setEditTagForm({ ...editTagForm, name: e.target.value })}
                    placeholder="Tag Name"
                  />
                </span>
                <span style={s.cell}>
                  <input
                    style={s.inlineInput}
                    value={editTagForm.category}
                    onChange={(e) => setEditTagForm({ ...editTagForm, category: e.target.value })}
                    placeholder="Category"
                  />
                </span>
                <span style={s.cell}>
                  <span style={{ ...s.badge, backgroundColor: tag.active ? '#dcfce7' : '#fee2e2', color: tag.active ? '#22c55e' : '#ef4444' }}>
                    {tag.active ? 'Active' : 'Disabled'}
                  </span>
                </span>
                <span style={{ ...s.cell, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button onClick={() => saveEditTag(tag.id)} style={s.saveBtn}>Save</button>
                  <button onClick={cancelEditTag} style={s.cancelBtn}>Cancel</button>
                </span>
              </>
            ) : (
              <>
                <span style={{ ...s.cell, flex: 2, fontWeight: 600 }}>{tag.name}</span>
                <span style={{ ...s.cell, color: theme.textSecondary }}>{tag.category || '—'}</span>
                <span style={s.cell}>
                  <span style={{ ...s.badge, backgroundColor: tag.active ? '#dcfce7' : '#fee2e2', color: tag.active ? '#22c55e' : '#ef4444' }}>
                    {tag.active ? 'Active' : 'Disabled'}
                  </span>
                </span>
                <span style={{ ...s.cell, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button onClick={() => toggleTag(tag.id, tag.active)} style={s.actionBtn}>
                    {tag.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => startEditTag(tag)} style={s.editBtn}>Edit</button>
                  <button onClick={() => deleteTag(tag.id, tag.name)} style={s.deleteBtn}>Delete</button>
                </span>
              </>
            )}
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
            {editingRuleId === rule.id ? (
              <>
                <span style={{ ...s.cell, flex: 1.5, fontWeight: 600 }}>{rule.tag?.name || '—'}</span>
                <span style={{ ...s.cell, flex: 2 }}>
                  <input
                    style={s.inlineInput}
                    value={editRuleForm.suggestionText}
                    onChange={(e) => setEditRuleForm({ ...editRuleForm, suggestionText: e.target.value })}
                    placeholder="Suggestion text"
                  />
                </span>
                <span style={s.cell}>
                  <select
                    style={s.inlineInput}
                    value={editRuleForm.severity}
                    onChange={(e) => setEditRuleForm({ ...editRuleForm, severity: e.target.value })}
                  >
                    <option value="CAUTION">Caution</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </span>
                <span style={s.cell}>
                  <span style={{ ...s.badge, backgroundColor: rule.active ? '#dcfce7' : '#fee2e2', color: rule.active ? '#22c55e' : '#ef4444' }}>
                    {rule.active ? 'Active' : 'Disabled'}
                  </span>
                </span>
                <span style={{ ...s.cell, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button onClick={() => saveEditRule(rule.id)} style={s.saveBtn}>Save</button>
                  <button onClick={cancelEditRule} style={s.cancelBtn}>Cancel</button>
                </span>
              </>
            ) : (
              <>
                <span style={{ ...s.cell, flex: 1.5, fontWeight: 600 }}>{rule.tag?.name || '—'}</span>
                <span style={{ ...s.cell, flex: 2, fontSize: 13, color: theme.textSecondary }}>{rule.suggestionText}</span>
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
                <span style={{ ...s.cell, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button onClick={() => toggleRule(rule.id, rule.active)} style={s.actionBtn}>
                    {rule.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => startEditRule(rule)} style={s.editBtn}>Edit</button>
                  <button onClick={() => deleteRule(rule.id)} style={s.deleteBtn}>Delete</button>
                </span>
              </>
            )}
          </div>
        ))}
      </div>
      {tagRules.length === 0 && <div style={s.empty}>No tag rules configured.</div>}
    </div>
  );
}
