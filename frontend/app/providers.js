"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext } from 'react';
import { translations } from '@/lib/i18n';
import { StudentProvider } from '@/contexts/StudentContext';

// ─── Theme Context ────────────────────────────────────────────────────────────
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
const ThemeContext = /*#__PURE__*/createContext({
  theme: 'dark',
  toggleTheme: () => {}
});
export const useTheme = () => useContext(ThemeContext);
function ThemeProvider({
  children
}) {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const resolved = saved ?? 'dark';
    setTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, []);
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };
  return /*#__PURE__*/_jsxDEV(ThemeContext.Provider, {
    value: {
      theme,
      toggleTheme
    },
    children: children
  }, void 0, false);
}

// ─── Language Context ─────────────────────────────────────────────────────────

const LangContext = /*#__PURE__*/createContext({
  lang: 'en',
  toggleLang: () => {},
  t: key => key,
  isRTL: false
});
export const useLang = () => useContext(LangContext);
function LangProvider({
  children
}) {
  const [lang, setLang] = useState('en');
  useEffect(() => {
    const saved = localStorage.getItem('lang');
    const resolved = saved === 'ar' ? 'ar' : 'en';
    setLang(resolved);
    applyLang(resolved);
  }, []);
  const applyLang = l => {
    document.documentElement.setAttribute('lang', l);
    document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
  };
  const toggleLang = () => {
    setLang(prev => {
      const next = prev === 'en' ? 'ar' : 'en';
      localStorage.setItem('lang', next);
      applyLang(next);
      return next;
    });
  };
  const t = key => translations[lang][key];
  return /*#__PURE__*/_jsxDEV(LangContext.Provider, {
    value: {
      lang,
      toggleLang,
      t,
      isRTL: lang === 'ar'
    },
    children: children
  }, void 0, false);
}

// ─── Root Providers ───────────────────────────────────────────────────────────
export default function Providers({
  children
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1
      }
    }
  }));
  return /*#__PURE__*/_jsxDEV(ThemeProvider, {
    children: /*#__PURE__*/_jsxDEV(LangProvider, {
      children: /*#__PURE__*/_jsxDEV(StudentProvider, {
        children: /*#__PURE__*/_jsxDEV(QueryClientProvider, {
          client: queryClient,
          children: children
        }, void 0, false)
      }, void 0, false)
    }, void 0, false)
  }, void 0, false);
}