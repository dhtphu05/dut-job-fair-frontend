'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    apiClient.clearToken()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo_dut.webp" alt="DUT" width={40} height={40} className="object-contain rounded" priority />
            <Image src="/logo_tt.jpg" alt="TTHT" width={40} height={40} className="object-contain rounded" priority />
            <div className="hidden sm:block w-px h-8 bg-border/60" />
            <div>
              <h1 className="font-bold text-lg">DUT Job Fair 2026</h1>
              <p className="text-xs text-muted-foreground">School Admin Dashboard</p>
            </div>
          </Link>

          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
