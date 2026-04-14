import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';

// All 34 scoring rules + 5 composite rules from OSCAR Beta Logic Matrix
const SCORING_RULES = [
  // Solids Stability (25 pts max)
  { id: 'SOL-01', category: 'Solids Stability', cap: 25, trigger: 'MLSS within plant stable band', window: '3-day', deduction: 0, output: 'Biomass inventory appears stable.', confidence: 'Neutral', optional: false },
  { id: 'SOL-02', category: 'Solids Stability', cap: 25, trigger: 'MLSS drift mild up or down', window: '3-day', deduction: 4, output: 'Biomass inventory is beginning to drift.', confidence: 'Neutral', optional: false },
  { id: 'SOL-03', category: 'Solids Stability', cap: 25, trigger: 'MLSS drift significant up or down', window: '3-day', deduction: 8, output: 'Biomass inventory is moving outside a comfortable range.', confidence: 'Neutral', optional: false },
  { id: 'SOL-04', category: 'Solids Stability', cap: 25, trigger: 'MLSS declining and waste sludge rate unchanged or high', window: '3-day', deduction: 6, output: 'Current wasting may be reducing biomass inventory.', confidence: 'Medium', optional: false },
  { id: 'SOL-05', category: 'Solids Stability', cap: 25, trigger: 'MLSS rising and waste sludge rate low', window: '3-day', deduction: 6, output: 'Current wasting may be too light for current solids conditions.', confidence: 'Medium', optional: false },
  { id: 'SOL-06', category: 'Solids Stability', cap: 25, trigger: 'WAS concentration higher than expected during MLSS decline', window: '3-day', deduction: 4, output: 'Actual solids removal may be stronger than the waste rate suggests.', confidence: 'High', optional: true },
  { id: 'SOL-07', category: 'Solids Stability', cap: 25, trigger: 'WAS concentration lower than expected during MLSS rise', window: '3-day', deduction: 4, output: 'Waste sludge may be removing fewer solids than expected.', confidence: 'High', optional: true },
  // Clarifier Stability (25 pts max)
  { id: 'CLR-01', category: 'Clarifier Stability', cap: 25, trigger: 'Blanket stable', window: '3-day', deduction: 0, output: 'Clarifier solids inventory appears stable.', confidence: 'Neutral', optional: false },
  { id: 'CLR-02', category: 'Clarifier Stability', cap: 25, trigger: 'Blanket slowly rising', window: '3-day', deduction: 5, output: 'Blanket depth is increasing and should be watched.', confidence: 'Neutral', optional: false },
  { id: 'CLR-03', category: 'Clarifier Stability', cap: 25, trigger: 'Blanket rising significantly', window: '3-day', deduction: 10, output: 'Clarifier stress is increasing.', confidence: 'Neutral', optional: false },
  { id: 'CLR-04', category: 'Clarifier Stability', cap: 25, trigger: 'Blanket rising and return sludge rate low', window: '3-day', deduction: 6, output: 'Return sludge rate may be insufficient for current clarifier conditions.', confidence: 'Medium', optional: false },
  { id: 'CLR-05', category: 'Clarifier Stability', cap: 25, trigger: 'Blanket rising and return sludge concentration weak', window: '3-day', deduction: 6, output: 'Return sludge appears weak relative to clarifier demand.', confidence: 'High', optional: true },
  { id: 'CLR-06', category: 'Clarifier Stability', cap: 25, trigger: 'Settleability worsening', window: '3-day', deduction: 4, output: 'Settling performance appears to be weakening.', confidence: 'High', optional: true },
  { id: 'CLR-07', category: 'Clarifier Stability', cap: 25, trigger: 'Poor settleability plus rising blanket', window: '3-day', deduction: 8, output: 'Clarifier stress may be driven by reduced settling quality.', confidence: 'High', optional: true },
  { id: 'CLR-08', category: 'Clarifier Stability', cap: 25, trigger: 'Flow spike plus rising blanket', window: '1-day + 3-day', deduction: 6, output: 'Increased hydraulic load may be affecting clarification.', confidence: 'Medium', optional: false },
  // Biological Support (25 pts max)
  { id: 'BIO-01', category: 'Biological Support', cap: 25, trigger: 'DO at or above target band', window: '1-day', deduction: 0, output: 'Oxygen conditions appear adequate.', confidence: 'Neutral', optional: false },
  { id: 'BIO-02', category: 'Biological Support', cap: 25, trigger: 'DO slightly below target or declining', window: '3-day', deduction: 5, output: 'Oxygen margin is decreasing.', confidence: 'Neutral', optional: false },
  { id: 'BIO-03', category: 'Biological Support', cap: 25, trigger: 'DO clearly low', window: '1-day', deduction: 10, output: 'Low oxygen may be limiting biological performance.', confidence: 'Neutral', optional: false },
  { id: 'OXY-03', category: 'Biological Support', cap: 25, trigger: 'Low DO + stable MLSS (biology present but unsupported)', window: '3-day', deduction: 5, output: 'Biomass adequate but oxygen may be limiting.', confidence: 'Medium', optional: false },
  { id: 'BIO-04', category: 'Biological Support', cap: 25, trigger: 'Cold temperature reducing process margin', window: 'Seasonal + 3-day', deduction: 2, output: 'Lower temperature may be reducing biological resilience.', confidence: 'Medium', optional: false },
  { id: 'BIO-05', category: 'Biological Support', cap: 25, trigger: 'Cold temperature plus low DO', window: '3-day', deduction: 4, output: 'Cold weather and low oxygen may both be reducing process stability.', confidence: 'Medium', optional: false },
  { id: 'BIO-06', category: 'Biological Support', cap: 25, trigger: 'Ammonia slightly rising', window: '3-day', deduction: 4, output: 'Ammonia trend suggests reduced biological performance margin.', confidence: 'High', optional: true },
  { id: 'BIO-07', category: 'Biological Support', cap: 25, trigger: 'Ammonia clearly rising', window: '3-day', deduction: 8, output: 'Rising ammonia indicates biological performance is declining.', confidence: 'High', optional: true },
  { id: 'BIO-08', category: 'Biological Support', cap: 25, trigger: 'Low DO plus rising ammonia', window: '3-day', deduction: 10, output: 'Oxygen limitation is likely affecting treatment performance.', confidence: 'High', optional: true },
  { id: 'BIO-09', category: 'Biological Support', cap: 25, trigger: 'Low MLSS plus rising ammonia', window: '3-day', deduction: 10, output: 'Biomass inventory may be insufficient for current treatment demand.', confidence: 'High', optional: true },
  // Hydraulic Stability (15 pts max)
  { id: 'HYD-01', category: 'Hydraulic Stability', cap: 15, trigger: 'Flow within normal band', window: '1-day', deduction: 0, output: 'Hydraulic conditions appear normal.', confidence: 'Neutral', optional: false },
  { id: 'HYD-02', category: 'Hydraulic Stability', cap: 15, trigger: 'Mild flow increase (+15-20%)', window: '1-day', deduction: 3, output: 'Flow has increased above recent baseline.', confidence: 'Neutral', optional: false },
  { id: 'HYD-03', category: 'Hydraulic Stability', cap: 15, trigger: 'Significant flow increase (+20-30%)', window: '1-day', deduction: 6, output: 'Hydraulic load may be stressing the process.', confidence: 'Neutral', optional: false },
  { id: 'HYD-04', category: 'Hydraulic Stability', cap: 15, trigger: 'Major flow surge with MLSS drop', window: '1-day + 3-day', deduction: 10, output: 'Recent flow conditions may be contributing to solids loss.', confidence: 'Medium', optional: false },
  { id: 'HYD-05', category: 'Hydraulic Stability', cap: 15, trigger: 'Major flow surge with rising blanket', window: '1-day + 3-day', deduction: 8, output: 'Recent flow conditions may be overloading clarification.', confidence: 'Medium', optional: false },
  // Operator Concern Flags (10 pts max)
  { id: 'OPS-01', category: 'Operator Flags', cap: 10, trigger: 'No concern flags', window: '1-day', deduction: 0, output: 'No unusual operator concerns were reported.', confidence: 'Neutral', optional: false },
  { id: 'OPS-02', category: 'Operator Flags', cap: 10, trigger: 'One mild concern flag', window: '1-day', deduction: 2, output: 'Operator observations suggest a mild process concern.', confidence: 'Medium', optional: false },
  { id: 'OPS-03', category: 'Operator Flags', cap: 10, trigger: 'Multiple mild concern flags', window: '1-day', deduction: 4, output: 'Operator observations indicate multiple developing concerns.', confidence: 'Medium', optional: false },
  { id: 'OPS-04', category: 'Operator Flags', cap: 10, trigger: 'Serious visual or process concern', window: '1-day', deduction: 6, output: 'Operator observations indicate elevated process concern.', confidence: 'Medium', optional: false },
  { id: 'OPS-05', category: 'Operator Flags', cap: 10, trigger: 'Equipment issue affecting process', window: '1-day', deduction: 8, output: 'Equipment conditions may be affecting plant stability.', confidence: 'Medium', optional: false },
];

const COMPOSITE_RULES = [
  { id: 'CMP-01', trigger: 'Two categories at moderate concern or worse', deduction: 4, output: 'Multiple plant stability indicators are showing concern.' },
  { id: 'CMP-02', trigger: 'One high-risk rule plus one additional moderate rule', deduction: 6, output: 'Plant conditions indicate elevated instability risk.' },
  { id: 'CMP-03', trigger: 'Low DO + rising blanket + operator concern', deduction: 6, output: 'Biological and clarifier signals both suggest emerging instability.' },
  { id: 'CMP-04', trigger: 'Flow surge + MLSS decline + blanket rise', deduction: 8, output: 'Hydraulic change may be affecting both biomass retention and clarification.' },
  { id: 'STAB-07', trigger: 'MLSS drop + blanket rise + low DO', deduction: 8, output: 'Multiple indicators show instability — declining biomass, rising blanket, and low oxygen.' },
  { id: 'CMP-05', trigger: 'Ammonia rise + low DO + cold temperature', deduction: 8, output: 'Conditions are consistent with reduced nitrification margin.' },
];

const CATEGORIES = ['All', 'Solids Stability', 'Clarifier Stability', 'Biological Support', 'Hydraulic Stability', 'Operator Flags'];

export function LogicMatrix() {
  const { theme } = useTheme();
  const [filterCategory, setFilterCategory] = useState('All');

  const filtered = filterCategory === 'All'
    ? SCORING_RULES
    : SCORING_RULES.filter((r) => r.category === filterCategory);

  const s: Record<string, React.CSSProperties> = {
    title: { fontSize: 24, fontWeight: 700, color: theme.text },
    subtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 20, marginTop: 4 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    filterSelect: { padding: '8px 12px', border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text },
    table: { backgroundColor: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, overflow: 'hidden', marginBottom: 24 },
    tableHeader: { display: 'flex', padding: '10px 12px', backgroundColor: theme.surfaceHover, borderBottom: `1px solid ${theme.border}`, fontWeight: 600, fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', gap: 8 },
    tableRow: { display: 'flex', padding: '10px 12px', borderBottom: `1px solid ${theme.borderLight}`, alignItems: 'center', gap: 8 },
    cell: { fontSize: 13, color: theme.text },
    badge: { fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 600, color: theme.text, marginBottom: 12, marginTop: 8 },
    infoCard: { backgroundColor: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, padding: 16, marginBottom: 16 },
    infoRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: theme.text },
    infoLabel: { color: theme.textSecondary },
  };

  const deductionColor = (d: number) => {
    if (d === 0) return { bg: '#dcfce7', color: '#22c55e' };
    if (d <= 4) return { bg: '#fef9c3', color: '#ca8a04' };
    if (d <= 6) return { bg: '#fff7ed', color: '#f97316' };
    return { bg: '#fee2e2', color: '#ef4444' };
  };

  return (
    <div>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>OSCAR Logic Matrix</h2>
          <div style={s.subtitle}>34 scoring rules + 5 composite escalation rules — read-only reference</div>
        </div>
        <select style={s.filterSelect} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Scoring Model Summary */}
      <div style={s.infoCard}>
        <div style={s.infoRow}><span style={s.infoLabel}>Model</span><span>Start at 100 → subtract deductions → cap per category → smooth display score</span></div>
        <div style={s.infoRow}><span style={s.infoLabel}>Solids Stability</span><span style={{ fontWeight: 600 }}>25 pts max</span></div>
        <div style={s.infoRow}><span style={s.infoLabel}>Clarifier Stability</span><span style={{ fontWeight: 600 }}>25 pts max</span></div>
        <div style={s.infoRow}><span style={s.infoLabel}>Biological Support</span><span style={{ fontWeight: 600 }}>25 pts max</span></div>
        <div style={s.infoRow}><span style={s.infoLabel}>Hydraulic Stability</span><span style={{ fontWeight: 600 }}>15 pts max</span></div>
        <div style={s.infoRow}><span style={s.infoLabel}>Operator Concern Flags</span><span style={{ fontWeight: 600 }}>10 pts max</span></div>
        <div style={{ ...s.infoRow, borderTop: `1px solid ${theme.border}`, marginTop: 4, paddingTop: 4 }}><span style={s.infoLabel}>Smoothing</span><span>60% today + 25% yesterday + 15% two days ago</span></div>
        <div style={s.infoRow}><span style={s.infoLabel}>Status Bands</span><span>85-100 Stable · 70-84 Slight Drift · 50-69 Moderate Concern · 0-49 High Risk</span></div>
      </div>

      {/* Scoring Rules Table */}
      <h3 style={s.sectionTitle}>Scoring Rules ({filtered.length})</h3>
      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, width: 60, flex: 0 }}>Rule ID</span>
          <span style={{ ...s.cell, flex: 1.5 }}>Category</span>
          <span style={{ ...s.cell, flex: 3 }}>Trigger</span>
          <span style={{ ...s.cell, width: 70, flex: 0 }}>Window</span>
          <span style={{ ...s.cell, width: 50, flex: 0, textAlign: 'center' }}>Pts</span>
          <span style={{ ...s.cell, width: 60, flex: 0 }}>Conf.</span>
          <span style={{ ...s.cell, flex: 3 }}>Output Text</span>
        </div>
        {filtered.map((rule) => {
          const dc = deductionColor(rule.deduction);
          return (
            <div key={rule.id} style={s.tableRow}>
              <span style={{ ...s.cell, width: 60, flex: 0, fontWeight: 600, fontFamily: 'monospace' }}>{rule.id}</span>
              <span style={{ ...s.cell, flex: 1.5, fontSize: 12, color: theme.textSecondary }}>{rule.category}</span>
              <span style={{ ...s.cell, flex: 3 }}>{rule.trigger}</span>
              <span style={{ ...s.cell, width: 70, flex: 0, fontSize: 11, color: theme.textTertiary }}>{rule.window}</span>
              <span style={{ ...s.cell, width: 50, flex: 0, textAlign: 'center' }}>
                <span style={{ ...s.badge, backgroundColor: dc.bg, color: dc.color }}>-{rule.deduction}</span>
              </span>
              <span style={{ ...s.cell, width: 60, flex: 0, fontSize: 11, color: theme.textTertiary }}>{rule.confidence}</span>
              <span style={{ ...s.cell, flex: 3, fontSize: 12, color: theme.textSecondary }}>{rule.output}</span>
            </div>
          );
        })}
      </div>

      {/* Composite Rules */}
      <h3 style={s.sectionTitle}>Composite Escalation Rules ({COMPOSITE_RULES.length})</h3>
      <div style={s.table}>
        <div style={s.tableHeader}>
          <span style={{ ...s.cell, width: 60, flex: 0 }}>Rule ID</span>
          <span style={{ ...s.cell, flex: 3 }}>Trigger</span>
          <span style={{ ...s.cell, width: 50, flex: 0, textAlign: 'center' }}>Pts</span>
          <span style={{ ...s.cell, flex: 3 }}>Output Text</span>
        </div>
        {COMPOSITE_RULES.map((rule) => {
          const dc = deductionColor(rule.deduction);
          return (
            <div key={rule.id} style={s.tableRow}>
              <span style={{ ...s.cell, width: 60, flex: 0, fontWeight: 600, fontFamily: 'monospace' }}>{rule.id}</span>
              <span style={{ ...s.cell, flex: 3 }}>{rule.trigger}</span>
              <span style={{ ...s.cell, width: 50, flex: 0, textAlign: 'center' }}>
                <span style={{ ...s.badge, backgroundColor: dc.bg, color: dc.color }}>-{rule.deduction}</span>
              </span>
              <span style={{ ...s.cell, flex: 3, fontSize: 12, color: theme.textSecondary }}>{rule.output}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
