'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

  return (
    <div className="min-h-screen bg-background text-slate-900 font-sans">
      {/* Main Content - No redundant header here, DashboardLayout in pages handles it */}
      <main>{children}</main>
    </div>
  )
}
