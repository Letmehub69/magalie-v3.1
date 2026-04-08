import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JuriPlateforme | La justice accessible au Québec',
  description: 'Plateforme juridique 100% gratuite et sécurisée conforme Loi 25.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900`}>{children}</body>
    </html>
  )
}
