import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Pages authentifiées, propres à chaque utilisateur : pas de pré-rendu statique.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Le cockpit métier du beatmaker — cachets, factures, fiscalité.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dashboard',
  },
}

export const viewport: Viewport = {
  themeColor: '#ff563c',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} font-sans bg-bg-primary text-text-primary antialiased`}>
        {children}
      </body>
    </html>
  )
}
