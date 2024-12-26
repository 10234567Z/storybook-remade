'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Menu, X, Sun, Moon } from 'lucide-react'

export default function Header() {
  const [mounted, setMounted] = useState(false)
  const { theme = 'light', setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  if (!mounted) return null

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white">
            SocialApp
          </Link>
          <div className="hidden md:flex items-center space-x-4">
            <NavLinks />
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
          <button onClick={toggleMenu} className="md:hidden text-gray-600 dark:text-gray-300">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            <NavLinks mobile />
            <div className="flex justify-between items-center">
              <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
  const linkClass = `text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors duration-200 ${
    mobile ? 'block py-2' : ''
  }`
  return (
    <>
      <Link href="/search" className={linkClass}>
        Search
      </Link>
      <Link href="/messages" className={linkClass}>
        Messages
      </Link>
      <Link href="/profile" className={linkClass}>
        Profile
      </Link>
    </>
  )
}

const ThemeToggle = ({ theme, setTheme }: { theme: string, setTheme: (theme: string) => void }) => (
  <button
    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors duration-200"
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
  </button>
)

