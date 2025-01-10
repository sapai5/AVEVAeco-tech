import '../styles/globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "../components/theme-provider"
import { ThemeToggle } from "../components/theme-toggle"
import { Navigation } from "../components/navigation"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TerraMind',
  description: 'Mining AI UI with advanced charting',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navigation />
          <div className="relative">
            <div className="absolute right-4 top-4 z-50">
              <ThemeToggle />
            </div>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

