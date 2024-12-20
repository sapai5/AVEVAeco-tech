import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mining AI Forecast',
  description: 'Real-time mining analysis and forecasting',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#121212] text-foreground antialiased`}>
        <nav className="bg-[#1C1C1C] p-4">
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="text-white hover:text-blue-500">Live Mode</Link>
            </li>
            <li>
              <Link href="/data-mode" className="text-white hover:text-blue-500">Data Mode</Link>
            </li>
          </ul>
        </nav>
        {children}
      </body>
    </html>
  )
}

