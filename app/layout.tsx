import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/components/auth/AuthProvider';
import { Inter } from 'next/font/google'

export const metadata: Metadata = {
  title: 'Harmony Hub',
  description: 'Created for INFO Capstone',
  generator: 'hearingheroes.vercel.app',
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}