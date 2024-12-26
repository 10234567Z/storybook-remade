import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import Header from '@/components/Header'


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Social Media App',
  description: 'A real-time social media application',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
