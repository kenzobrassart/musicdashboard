import ContactsModule from '@/components/modules/ContactsModule'

export default function ContactsPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <p className="text-text-muted text-sm mt-1">Artistes, labels et clients — le répertoire se remplit au fil de tes cachets et factures</p>
      </div>
      <ContactsModule />
    </main>
  )
}
