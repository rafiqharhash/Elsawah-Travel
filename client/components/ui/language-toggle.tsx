"use client"

import { useLang } from "@/app/providers"
import { motion, AnimatePresence } from "framer-motion"

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, toggleLang } = useLang()

  return (
    <button
      onClick={toggleLang}
      aria-label="Toggle Arabic/English"
      title={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      className={`relative h-9 px-3 flex items-center justify-center rounded-full border font-semibold text-xs tracking-wide transition-all duration-200
        border-white/10 bg-white/5 hover:bg-white/10 text-foreground
        dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10
        light:border-zinc-200 light:bg-zinc-100 light:hover:bg-zinc-200
        ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={lang}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className="select-none"
          style={{ fontFamily: lang === 'ar' ? 'system-ui' : 'inherit' }}
        >
          {lang === 'en' ? 'عربي' : 'EN'}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
