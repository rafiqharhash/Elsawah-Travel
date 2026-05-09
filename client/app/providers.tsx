"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, createContext, useContext } from 'react'
import { translations, Lang, TranslationKey } from '@/lib/i18n'
import { StudentProvider } from '@/contexts/StudentContext'

// ─── Theme Context ────────────────────────────────────────────────────────────
type Theme = 'dark' | 'light'
interface ThemeContextType { theme: Theme; toggleTheme: () => void }
const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', toggleTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    const resolved = saved ?? 'dark'
    setTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [])
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

// ─── Language Context ─────────────────────────────────────────────────────────
interface LangContextType {
  lang: Lang
  toggleLang: () => void
  t: (key: TranslationKey) => string
  isRTL: boolean
}
const LangContext = createContext<LangContextType>({
  lang: 'en',
  toggleLang: () => {},
  t: (key) => key,
  isRTL: false,
})
export const useLang = () => useContext(LangContext)

function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    const resolved: Lang = saved === 'ar' ? 'ar' : 'en'
    setLang(resolved)
    applyLang(resolved)
  }, [])

  const applyLang = (l: Lang) => {
    document.documentElement.setAttribute('lang', l)
    document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr')
  }

  const toggleLang = () => {
    setLang(prev => {
      const next: Lang = prev === 'en' ? 'ar' : 'en'
      localStorage.setItem('lang', next)
      applyLang(next)
      return next
    })
  }

  const t = (key: TranslationKey): string => translations[lang][key] as string

  return (
    <LangContext.Provider value={{ lang, toggleLang, t, isRTL: lang === 'ar' }}>
      {children}
    </LangContext.Provider>
  )
}

// ─── Root Providers ───────────────────────────────────────────────────────────
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
  }))
  return (
    <ThemeProvider>
      <LangProvider>
        <StudentProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </StudentProvider>
      </LangProvider>
    </ThemeProvider>
  )
}
