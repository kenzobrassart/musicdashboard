'use client';

import { useState } from 'react';

/**
 * Module Factures
 * Gestion des factures liées aux cachets et autres revenus/dépenses.
 * À connecter à Firestore : collection `factures` (sous-collection ou top-level).
 *
 * Champs prévus :
 *  - id           : string (auto)
 *  - numero       : string  — ex. "FAC-2026-001"
 *  - date         : string  — ISO date
 *  - artiste      : string
 *  - description  : string
 *  - montantHT    : number
 *  - tva          : number  — taux en % (ex. 20)
 *  - montantTTC   : number  — calculé automatiquement
 *  - statut       : 'brouillon' | 'envoyee' | 'payee' | 'annulee'
 *  - cachetRef    : string | null  — référence optionnelle à un cachet
 *  - fichierUrl   : string | null  — lien Firebase Storage (PDF)
 *  - createdAt    : timestamp
 */

const STATUTS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoyee',   label: 'Envoyée' },
  { value: 'payee',     label: 'Payée' },
  { value: 'annulee',   label: 'Annulée' },
];

const STATUT_STYLE = {
  brouillon: { background: 'var(--color-neutral-200)', color: 'var(--color-neutral-700)' },
  envoyee:   { background: 'var(--color-accent-100)',  color: 'var(--color-accent-700)' },
  payee:     { background: '#d1fae5',                  color: '#065f46' },
  annulee:   { background: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)', textDecoration: 'line-through' },
};

export default function FacturesPage() {
  // TODO: remplacer par onSnapshot Firestore
  const [factures, setFactures] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [form, setForm] = useState({
    numero: '',
    date: '',
    artiste: '',
    description: '',
    montantHT: '',
    tva: '20',
    statut: 'brouillon',
    cachetRef: '',
    fichierUrl: '',
  });

  const montantTTC = form.montantHT && form.tva
    ? (parseFloat(form.montantHT) * (1 + parseFloat(form.tva) / 100)).toFixed(2)
    : '';

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));
  }

  function openNew() {
    setEditTarget(null);
    setForm({ numero: '', date: '', artiste: '', description: '', montantHT: '', tva: '20', statut: 'brouillon', cachetRef: '', fichierUrl: '' });
    setShowForm(true);
  }

  function openEdit(f) {
    setEditTarget(f.id);
    setForm({ ...f });
    setShowForm(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const entry = { ...form, montantTTC: parseFloat(montantTTC) || 0, id: editTarget || crypto.randomUUID(), createdAt: new Date().toISOString() };
    // TODO: setDoc / addDoc Firestore
    setFactures(prev => editTarget ? prev.map(f => f.id === editTarget ? entry : f) : [...prev, entry]);
    setShowForm(false);
  }

  function handleDelete(id) {
    // TODO: deleteDoc Firestore
    setFactures(prev => prev.filter(f => f.id !== id));
  }

  function cycleStatut(facture) {
    const order = ['brouillon', 'envoyee', 'payee', 'annulee'];
    const next = order[(order.indexOf(facture.statut) + 1) % order.length];
    // TODO: updateDoc Firestore
    setFactures(prev => prev.map(f => f.id === facture.id ? { ...f, statut: next } : f));
  }

  const totalTTC = factures.filter(f => f.statut !== 'annulee').reduce((s, f) => s + (parseFloat(f.montantTTC) || 0), 0);
  const totalPayee = factures.filter(f => f.statut === 'payee').reduce((s, f) => s + (parseFloat(f.montantTTC) || 0), 0);

  return (
    <div style={{ padding: '28px 32px 64px', maxWidth: 1400 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ marginRight: 'auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
            Comptabilité production musicale
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, letterSpacing: '-.02em', marginTop: 4 }}>
            Factures
          </h1>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '14px 26px' }}>
            <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>Total TTC</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24, letterSpacing: '-.02em' }}>
              {totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '14px 26px' }}>
            <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>Encaissé</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24, letterSpacing: '-.02em', color: 'var(--color-accent-700)' }}>
              {totalPayee.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={openNew}>+ Nouvelle facture</button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-lg)', padding: '20px 24px 24px', marginBottom: 24, background: 'var(--color-surface)' }}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 14 }}>
            {editTarget ? 'Modifier la facture' : 'Nouvelle facture'}
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px 16px', alignItems: 'end' }}>

              <div className="field">
                <label htmlFor="numero">N° facture</label>
                <input className="input" id="numero" value={form.numero} onChange={handleChange} placeholder="FAC-2026-001" required />
              </div>
              <div className="field">
                <label htmlFor="date">Date</label>
                <input className="input" type="date" id="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="artiste">Artiste / Client</label>
                <input className="input" id="artiste" value={form.artiste} onChange={handleChange} placeholder="Nom" required />
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="description">Description</label>
                <input className="input" id="description" value={form.description} onChange={handleChange} placeholder="Prestation, session studio…" />
              </div>
              <div className="field">
                <label htmlFor="montantHT">Montant HT (€)</label>
                <input className="input" type="number" step="0.01" id="montantHT" value={form.montantHT} onChange={handleChange} placeholder="0" required />
              </div>
              <div className="field">
                <label htmlFor="tva">TVA (%)</label>
                <input className="input" type="number" step="0.1" id="tva" value={form.tva} onChange={handleChange} placeholder="20" />
              </div>
              <div className="field">
                <label>Montant TTC (€)</label>
                <input className="input" value={montantTTC} readOnly style={{ opacity: 0.6 }} />
              </div>
              <div className="field">
                <label htmlFor="statut">Statut</label>
                <select className="input" id="statut" value={form.statut} onChange={handleChange}>
                  {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="cachetRef">Réf. cachet (opt.)</label>
                <input className="input" id="cachetRef" value={form.cachetRef} onChange={handleChange} placeholder="ID cachet lié" />
              </div>
              <div className="field">
                <label htmlFor="fichierUrl">Lien PDF (opt.)</label>
                <input className="input" id="fichierUrl" value={form.fichierUrl} onChange={handleChange} placeholder="https://…" />
              </div>

            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button type="submit" className="btn btn-primary">{editTarget ? 'Enregistrer' : 'Créer la facture'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {factures.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 32px', color: 'var(--color-neutral-500)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧾</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Aucune facture</div>
          <div style={{ fontSize: 13 }}>Crée ta première facture pour commencer à suivre tes paiements.</div>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Date</th>
              <th>Artiste / Client</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>HT</th>
              <th style={{ textAlign: 'right' }}>TVA</th>
              <th style={{ textAlign: 'right' }}>TTC</th>
              <th>Statut</th>
              <th>PDF</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {factures.map(f => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{f.numero}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{f.date ? new Date(f.date).toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ fontWeight: 600 }}>{f.artiste}</td>
                <td style={{ fontSize: 13 }}>{f.description}</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {parseFloat(f.montantHT).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{f.tva}%</td>
                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {parseFloat(f.montantTTC).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </td>
                <td>
                  <button
                    className="tag"
                    onClick={() => cycleStatut(f)}
                    style={{ ...STATUT_STYLE[f.statut], border: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                    title="Cliquer pour changer le statut"
                  >
                    {STATUTS.find(s => s.value === f.statut)?.label}
                  </button>
                </td>
                <td>
                  {f.fichierUrl
                    ? <a href={f.fichierUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>PDF</a>
                    : <span style={{ color: 'var(--color-neutral-500)', fontSize: 12 }}>—</span>
                  }
                </td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <button className="btn btn-ghost" onClick={() => openEdit(f)} style={{ fontSize: 13 }}>Modifier</button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(f.id)} style={{ fontSize: 13 }}>Suppr.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
