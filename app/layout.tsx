import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'DUT Jobfair 2026 - Checkin',
  description: 'Hệ thống check-in và hộ chiếu điện tử cho Ngày hội việc làm Bách khoa 2026.',
  keywords: ['job fair', 'qr scanner', 'visitor tracking', 'event management'],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
  },
  icons: {
    icon: 'https://res.cloudinary.com/dspt9bcwt/image/upload/v1775529703/logo_tt_hbsnlo.jpg',
    shortcut: 'https://res.cloudinary.com/dspt9bcwt/image/upload/v1775529703/logo_tt_hbsnlo.jpg',
    apple: 'https://res.cloudinary.com/dspt9bcwt/image/upload/v1775529703/logo_tt_hbsnlo.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
