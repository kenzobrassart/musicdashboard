import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Facture, Contact, ProfilEmetteur } from '@/lib/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#141212' },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 12, color: '#5c5957', marginBottom: 28 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  block: { width: '47%' },
  blockTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10 },
  infoRow: { flexDirection: 'row', marginBottom: 5 },
  infoLabel: { width: '42%', fontSize: 9, color: '#5c5957' },
  infoValue: { width: '58%', fontSize: 9.5 },
  infoValueBold: { width: '58%', fontSize: 9.5, fontWeight: 700 },
  refLine: { fontSize: 9.5, color: '#5c5957', marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10 },
  table: { marginTop: 4, marginBottom: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#2a2826', padding: 8, fontSize: 9 },
  tableHeaderText: { color: '#ffffff', fontWeight: 700 },
  tableRow: { flexDirection: 'row', padding: 8, borderBottom: '1 solid #e5e2df', fontSize: 9.5 },
  colDesc: { width: '46%' },
  colPrice: { width: '18%', textAlign: 'right' },
  colQty: { width: '14%', textAlign: 'right' },
  colTotal: { width: '22%', textAlign: 'right' },
  tvaMention: { textAlign: 'right', fontSize: 8.5, color: '#5c5957', marginTop: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  totalLabel: { fontSize: 10.5, fontWeight: 700, marginRight: 12 },
  totalValue: { fontSize: 10.5, fontWeight: 700 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
  footerBlock: { width: '47%' },
  footerLabel: { fontSize: 9, fontWeight: 700 },
  footerValue: { fontSize: 9, color: '#5c5957' },
  notes: { marginTop: 24, fontSize: 9, color: '#5c5957', lineHeight: 1.5 },
  pageFooter: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#9e9a97', borderTop: '1 solid #e5e2df', paddingTop: 8 },
})

function fmtEuro(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function fmtDateLong(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function InvoiceDocument({ facture, contact, profil }: { facture: Facture; contact: Contact | null; profil: ProfilEmetteur }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Facture {facture.numero}</Text>
        <Text style={styles.subtitle}>{fmtDateLong(facture.dateEmission)}</Text>

        <View style={styles.sectionRow}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Émetteur</Text>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Société :</Text><Text style={styles.infoValueBold}>{profil.nom}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Adresse :</Text><Text style={styles.infoValue}>{profil.adresse}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Pays :</Text><Text style={styles.infoValue}>France</Text></View>
            {profil.siret && <View style={styles.infoRow}><Text style={styles.infoLabel}>Numéro d&apos;entreprise :</Text><Text style={styles.infoValue}>{profil.siret}</Text></View>}
            {profil.numeroSacem && <View style={styles.infoRow}><Text style={styles.infoLabel}>Numéro SACEM :</Text><Text style={styles.infoValue}>{profil.numeroSacem}</Text></View>}
            {profil.autreIdentifiant && <View style={styles.infoRow}><Text style={styles.infoLabel}>Autre identifiant :</Text><Text style={styles.infoValue}>{profil.autreIdentifiant}</Text></View>}
            {profil.email && <View style={styles.infoRow}><Text style={styles.infoLabel}>Adresse email :</Text><Text style={styles.infoValue}>{profil.email}</Text></View>}
            {profil.telephone && <View style={styles.infoRow}><Text style={styles.infoLabel}>Téléphone :</Text><Text style={styles.infoValue}>{profil.telephone}</Text></View>}
          </View>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Destinataire</Text>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Société :</Text><Text style={styles.infoValueBold}>{facture.contactNom}</Text></View>
            {contact?.interlocuteur && <View style={styles.infoRow}><Text style={styles.infoLabel}>Votre contact :</Text><Text style={styles.infoValue}>{contact.interlocuteur}</Text></View>}
            {contact?.adresse && <View style={styles.infoRow}><Text style={styles.infoLabel}>Adresse :</Text><Text style={styles.infoValue}>{contact.adresse}</Text></View>}
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Pays :</Text><Text style={styles.infoValue}>France</Text></View>
            {contact?.siret && <View style={styles.infoRow}><Text style={styles.infoLabel}>Numéro d&apos;entreprise :</Text><Text style={styles.infoValue}>{contact.siret}</Text></View>}
            {contact?.tvaIntracom && <View style={styles.infoRow}><Text style={styles.infoLabel}>Numéro de TVA :</Text><Text style={styles.infoValue}>{contact.tvaIntracom}</Text></View>}
            {contact?.email && <View style={styles.infoRow}><Text style={styles.infoLabel}>Adresse email :</Text><Text style={styles.infoValue}>{contact.email}</Text></View>}
          </View>
        </View>

        {facture.referenceCommande && (
          <Text style={styles.refLine}>Référence Bon de Commande : {facture.referenceCommande}</Text>
        )}

        <Text style={styles.sectionTitle}>Détail</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.tableHeaderText]}>Description</Text>
            <Text style={[styles.colPrice, styles.tableHeaderText]}>Prix unitaire</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Quantité</Text>
            <Text style={[styles.colTotal, styles.tableHeaderText]}>Total</Text>
          </View>
          {facture.lignes.map((l, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colDesc}>{l.description}</Text>
              <Text style={styles.colPrice}>{fmtEuro(l.prixUnitaire)}</Text>
              <Text style={styles.colQty}>{l.quantite}</Text>
              <Text style={styles.colTotal}>{fmtEuro(l.quantite * l.prixUnitaire)}</Text>
            </View>
          ))}
        </View>
        {!facture.mentionTva && <Text style={styles.tvaMention}>TVA non applicable, art. 293 B du CGI</Text>}
        {facture.mentionTva && <Text style={styles.tvaMention}>TVA ({facture.tva}%) : {fmtEuro(facture.montantTTC - facture.montantHT)}</Text>}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmtEuro(facture.montantTTC)}</Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerBlock}>
            <Text style={styles.sectionTitle}>Conditions</Text>
            <Text style={styles.footerValue}><Text style={styles.footerLabel}>Conditions de règlement : </Text>À réception</Text>
            <Text style={styles.footerValue}><Text style={styles.footerLabel}>Mode de règlement : </Text>Virement bancaire</Text>
            <Text style={styles.footerValue}><Text style={styles.footerLabel}>Intérêts de retard : </Text>Taux d&apos;intérêt légal en vigueur</Text>
          </View>
          {profil.iban && (
            <View style={styles.footerBlock}>
              <Text style={styles.sectionTitle}>RIB</Text>
              <Text style={styles.footerValue}><Text style={styles.footerLabel}>IBAN : </Text>{profil.iban}</Text>
              {profil.bic && <Text style={styles.footerValue}><Text style={styles.footerLabel}>BIC : </Text>{profil.bic}</Text>}
              <Text style={styles.footerValue}><Text style={styles.footerLabel}>Titulaire : </Text>{profil.nom}</Text>
            </View>
          )}
        </View>

        {facture.notes && <Text style={styles.notes}>{facture.notes}</Text>}

        <Text style={styles.pageFooter}>
          <Text>Facture {facture.numero}</Text>
          <Text>Page 1 sur 1</Text>
        </Text>
      </Page>
    </Document>
  )
}

export async function generateInvoicePdfBlob(facture: Facture, contact: Contact | null, profil: ProfilEmetteur) {
  return pdf(<InvoiceDocument facture={facture} contact={contact} profil={profil} />).toBlob()
}
