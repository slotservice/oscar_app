import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';

const conditionStyles: Record<string, { bg: string; color: string; label: string }> = {
  GREEN: { bg: '#dcfce7', color: '#22c55e', label: 'All Good' },
  YELLOW: { bg: '#fef9c3', color: '#eab308', label: 'Caution' },
  RED: { bg: '#fee2e2', color: '#ef4444', label: 'Critical' },
};

export function RoundHistory() {
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [selectedRound, setSelectedRound] = useState<any>(null);

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (selectedPlant) loadHistory(1);
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

  const loadHistory = async (p: number) => {
    try {
      const result = await adminApi.history.list(selectedPlant, p);
      setRounds(result.data.rounds);
      setPagination(result.data.pagination);
      setPage(p);
    } catch (err) {
      console.error(err);
    }
  };

  const viewRound = async (roundId: string) => {
    try {
      const result = await adminApi.history.get(roundId);
      setSelectedRound(result.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;

  // Detail view
  if (selectedRound) {
    return (
      <div>
        <button onClick={() => setSelectedRound(null)} style={s.backBtn}>Back to List</button>
        <h2 style={s.title}>
          Round Detail — {new Date(selectedRound.date).toLocaleDateString()}
        </h2>
        <div style={s.detailGrid}>
          <div style={s.detailCard}>
            <h3 style={s.cardTitle}>Overview</h3>
            <p><strong>Operator:</strong> {selectedRound.operator?.name}</p>
            <p><strong>Plant:</strong> {selectedRound.plant?.name}</p>
            <p><strong>Status:</strong> {selectedRound.status}</p>
            {selectedRound.overallCondition && (
              <p>
                <strong>Condition:</strong>{' '}
                <span style={{ ...s.condBadge, backgroundColor: conditionStyles[selectedRound.overallCondition]?.bg, color: conditionStyles[selectedRound.overallCondition]?.color }}>
                  {conditionStyles[selectedRound.overallCondition]?.label}
                </span>
              </p>
            )}
            {selectedRound.notes && <p><strong>Notes:</strong> {selectedRound.notes}</p>}
          </div>

          <div style={s.detailCard}>
            <h3 style={s.cardTitle}>Lab Values</h3>
            {selectedRound.labEntries?.map((entry: any) => (
              <div key={entry.id} style={s.labRow}>
                <span>{entry.labField?.name}</span>
                <strong>{entry.value} {entry.labField?.unit}</strong>
              </div>
            ))}
            {(!selectedRound.labEntries || selectedRound.labEntries.length === 0) && (
              <p style={s.emptyText}>No lab data entered</p>
            )}
          </div>

          <div style={s.detailCard}>
            <h3 style={s.cardTitle}>Suggestions ({selectedRound.suggestions?.length || 0})</h3>
            {selectedRound.suggestions?.map((sug: any) => (
              <div key={sug.id} style={{ ...s.sugRow, borderLeftColor: sug.severity === 'CRITICAL' ? '#ef4444' : sug.severity === 'CAUTION' ? '#eab308' : '#22c55e' }}>
                <div style={s.sugMessage}>{sug.message}</div>
                <div style={s.sugMeta}>{sug.ruleType} · {sug.acknowledged ? 'Acknowledged' : 'Pending'}</div>
              </div>
            ))}
            {(!selectedRound.suggestions || selectedRound.suggestions.length === 0) && (
              <p style={s.emptyText}>No suggestions generated</p>
            )}
          </div>

          <div style={s.detailCard}>
            <h3 style={s.cardTitle}>Issues ({selectedRound.issues?.length || 0})</h3>
            {selectedRound.issues?.map((issue: any) => (
              <div key={issue.id} style={s.issueRow}>
                <div style={s.issueDesc}>{issue.description}</div>
                {issue.actionTaken && <div style={s.issueAction}>Action: {issue.actionTaken}</div>}
              </div>
            ))}
            {(!selectedRound.issues || selectedRound.issues.length === 0) && (
              <p style={s.emptyText}>No issues reported</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Round History</h2>
        <select style={s.plantSelect} value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)}>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, flex: 2 }}>Date</span>
          <span style={{ ...s.cell, flex: 2 }}>Operator</span>
          <span style={s.cell}>Status</span>
          <span style={s.cell}>Condition</span>
          <span style={s.cell}>Items</span>
          <span style={s.cell}>Suggestions</span>
          <span style={s.cell}>Actions</span>
        </div>
        {rounds.map((round) => (
          <div key={round.id} style={s.tableRow}>
            <span style={{ ...s.cell, flex: 2, fontWeight: 600 }}>
              {new Date(round.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span style={{ ...s.cell, flex: 2 }}>{round.operator?.name || '—'}</span>
            <span style={s.cell}>
              <span style={{ ...s.statusBadge, backgroundColor: round.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3', color: round.status === 'COMPLETED' ? '#22c55e' : '#eab308' }}>
                {round.status === 'COMPLETED' ? 'Done' : 'In Progress'}
              </span>
            </span>
            <span style={s.cell}>
              {round.overallCondition ? (
                <span style={{ ...s.condBadge, backgroundColor: conditionStyles[round.overallCondition]?.bg, color: conditionStyles[round.overallCondition]?.color }}>
                  {conditionStyles[round.overallCondition]?.label}
                </span>
              ) : '—'}
            </span>
            <span style={{ ...s.cell, color: '#64748b' }}>{round._count?.checklistEntries || 0}</span>
            <span style={{ ...s.cell, color: '#64748b' }}>{round._count?.suggestions || 0}</span>
            <span style={s.cell}>
              <button onClick={() => viewRound(round.id)} style={s.viewBtn}>View</button>
            </span>
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div style={s.pagination}>
          <button disabled={page <= 1} onClick={() => loadHistory(page - 1)} style={s.pageBtn}>Previous</button>
          <span style={s.pageInfo}>Page {page} of {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => loadHistory(page + 1)} style={s.pageBtn}>Next</button>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { textAlign: 'center', padding: 40, color: '#64748b' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 700 },
  plantSelect: { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  backBtn: { padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, color: '#64748b', marginBottom: 16 },
  table: { backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { display: 'flex', padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  tableRow: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  cell: { flex: 1, fontSize: 13 },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
  condBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12 },
  viewBtn: { padding: '4px 10px', backgroundColor: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 },
  pageBtn: { padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 13 },
  pageInfo: { fontSize: 13, color: '#64748b' },
  // Detail view
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 },
  detailCard: { backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, margin: 0, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' },
  labRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc', fontSize: 14 },
  sugRow: { padding: '8px 12px', borderLeft: '3px solid', marginBottom: 8, borderRadius: '0 6px 6px 0', backgroundColor: '#f8fafc' },
  sugMessage: { fontSize: 13, lineHeight: '1.4' },
  sugMeta: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  issueRow: { padding: '8px 0', borderBottom: '1px solid #f8fafc' },
  issueDesc: { fontSize: 14, fontWeight: 500 },
  issueAction: { fontSize: 13, color: '#64748b', marginTop: 2 },
  emptyText: { color: '#94a3b8', fontSize: 13 },
};
