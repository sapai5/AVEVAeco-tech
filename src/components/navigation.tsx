'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image2vector%20(1)-qLP40VdyKNyjCwGNaY0eO6j7Yl6X5g.svg"
              alt="TerraMind Logo"
              width={30}
              height={30}
              className="dark:invert"
            />
          </Link>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link
            href="/home"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/home" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Analysis
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/dashboard" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/about"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/about" ? "text-foreground" : "text-foreground/60"
            )}
          >
            About
          </Link>
          <Link
            href="/features"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/features" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Features
          </Link>
        </nav>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="https://brandon-lims-organization.gitbook.io/terramind-docs" target="_blank" rel="noopener noreferrer">
              Documentation
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/pricing">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

