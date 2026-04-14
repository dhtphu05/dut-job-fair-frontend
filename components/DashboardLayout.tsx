'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

interface DashboardLayoutProps {
  title: string
  subtitle: string
  navItems: NavItem[]
  activeTab: string
  onTabChange: (tab: string) => void
  children: React.ReactNode
  headerActions?: React.ReactNode
}

export function DashboardLayout({
  title,
  subtitle,
  navItems,
  activeTab,
  onTabChange,
  children,
  headerActions,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex flex-col h-[100dvh] bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/50 shrink-0 z-20 bg-white">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:inline-flex p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            {/* Logo / Home Link (Strictly Navigation ONLY) */}
            <Link href="/" className="flex items-center gap-2 group transition-all min-w-0">
              <div className="w-8 h-8 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-foreground leading-tight truncate">{title}</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
              </div>
            </Link>
          </div>
          {headerActions && (
            <div className="flex gap-1 sm:gap-2 ml-2 shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-2xl transform lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out lg:shadow-none border-r border-border/50 shrink-0',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            <div className="lg:hidden flex items-center justify-between p-4 border-b">
              <span className="font-bold text-blue-700">DUT 2026</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left group',
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <span className={cn(
                    "shrink-0 transition-colors",
                    activeTab === item.id ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "truncate transition-opacity duration-200",
                    !sidebarOpen && "lg:opacity-0"
                  )}>
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
