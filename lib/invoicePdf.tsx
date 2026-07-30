import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Facture, Contact, ProfilEmetteur } from '@/lib/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#141212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  brand: { fontSize: 20, fontWeight: 700, color: '#ff563c' },
  small: { fontSize: 9, color: '#5c5957', marginTop: 2 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  section: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  block: { width: '45%' },
  blockLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: '#9e9a97', marginBottom: 4 },
  blockText: { fontSize: 10, marginBottom: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 8, borderBottom: '1 solid #e5e2df' },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f4f1ef', padding: 6, fontSize: 9, fontWeight: 700 },
  tableRow: { flexDirection: 'row', padding: 6, borderBottom: '1 solid #e5e2df', fontSize: 10 },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'right' },
  colPrice: { width: '17.5%', textAlign: 'right' },
  colTotal: { width: '17.5%', textAlign: 'right' },
  totals: { marginTop: 16, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, marginBottom: 4 },
  totalLabel: { fontSize: 10, color: '#5c5957' },
  totalValue: { fontSize: 10, fontWeight: 700 },
  totalTtc: { flexDirection: 'row', justifyContent: 'space-between', width: 200, marginTop: 6, paddingTop: 6, borderTop: '1 solid #141212' },
  mentions: { marginTop: 32, fontSize: 8, color: '#9e9a97', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#9e9a97', textAlign: 'center' },
})

function fmtEuro(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function fmtDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR')
}

export function InvoiceDocument({ facture, contact, profil }: { facture: Facture; contact: Contact | null; profil: ProfilEmetteur }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{profil.nom || 'Facture'}</Text>
            <Text style={styles.small}>{profil.adresse}</Text>
            {profil.siret && <Text style={styles.small}>SIRET : {profil.siret}</Text>}
            {profil.email && <Text style={styles.small}>{profil.email}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.title}>FACTURE</Text>
            <Text style={styles.small}>{facture.numero}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text>Date d&apos;émission : {fmtDate(facture.dateEmission)}</Text>
          <Text>Échéance : {fmtDate(facture.dateEcheance)}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Émetteur</Text>
            <Text style={styles.blockText}>{profil.nom}</Text>
            <Text style={styles.blockText}>{profil.adresse}</Text>
            {profil.siret && <Text style={styles.blockText}>SIRET {profil.siret}</Text>}
            {profil.email && <Text style={styles.blockText}>{profil.email}</Text>}
            {profil.telephone && <Text style={styles.blockText}>{profil.telephone}</Text>}
          </View>
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Client</Text>
            <Text style={styles.blockText}>{facture.contactNom}</Text>
            {contact?.adresse && <Text style={styles.blockText}>{contact.adresse}</Text>}
            {contact?.siret && <Text style={styles.blockText}>SIRET {contact.siret}</Text>}
            {contact?.email && <Text style={styles.blockText}>{contact.email}</Text>}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colPrice}>P.U. HT</Text>
            <Text style={styles.colTotal}>Total HT</Text>
          </View>
          {facture.lignes.map((l, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colDesc}>{l.description}</Text>
              <Text style={styles.colQty}>{l.quantite}</Text>
              <Text style={styles.colPrice}>{fmtEuro(l.prixUnitaire)}</Text>
              <Text style={styles.colTotal}>{fmtEuro(l.quantite * l.prixUnitaire)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{fmtEuro(facture.montantHT)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA {facture.mentionTva ? `(${facture.tva}%)` : ''}</Text>
            <Text style={styles.totalValue}>{facture.mentionTva ? fmtEuro(facture.montantTTC - facture.montantHT) : 'N/A'}</Text>
          </View>
          <View style={styles.totalTtc}>
            <Text style={{ fontSize: 11, fontWeight: 700 }}>Total TTC</Text>
            <Text style={{ fontSize: 11, fontWeight: 700 }}>{fmtEuro(facture.montantTTC)}</Text>
          </View>
        </View>

        <View style={styles.mentions}>
          {!facture.mentionTva && <Text>TVA non applicable, art. 293 B du CGI.</Text>}
          {profil.iban && <Text>Coordonnées bancaires — IBAN : {profil.iban}{profil.bic ? `  BIC : ${profil.bic}` : ''}</Text>}
          <Text>Pas d&apos;escompte pour paiement anticipé. En cas de retard de paiement, une indemnité forfaitaire de 40 € pour frais de recouvrement sera exigible (art. L441-10 du Code de commerce).</Text>
          {facture.notes && <Text style={{ marginTop: 6 }}>{facture.notes}</Text>}
        </View>

        <Text style={styles.footer}>{facture.numero} — {profil.nom}</Text>
      </Page>
    </Document>
  )
}

export async function generateInvoicePdfBlob(facture: Facture, contact: Contact | null, profil: ProfilEmetteur) {
  return pdf(<InvoiceDocument facture={facture} contact={contact} profil={profil} />).toBlob()
}
