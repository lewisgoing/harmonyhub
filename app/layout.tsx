import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hearing Heroes',
  description: 'Created for INFO Capstone',
  generator: 'hearingheroes.vercel.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
