import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/components/auth/AuthProvider';
import { Inter } from 'next/font/google'
import { OnboardingContextProvider } from '@/contexts/onboarding-context';
import OnboardingTourContainer from '@/components/OnboardingTourContainer';

export const metadata = {
  title: 'Harmony Hub',
  description: 'Created for INFO Capstone 24-25 by the Hearing Heroes',
}

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
      <head>
        <meta name="apple-mobile-web-app-title" content="Harmony Hub" />
      </head>
      <body>
        <AuthProvider>
          <OnboardingContextProvider>
            {children}
            <OnboardingTourContainer />
            <Toaster />
          </OnboardingContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}