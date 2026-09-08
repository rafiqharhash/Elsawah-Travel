"use client";

import { useTheme } from "@/app/providers";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export function ThemeToggle({
  className = ""
}) {
  const {
    theme,
    toggleTheme
  } = useTheme();
  return /*#__PURE__*/_jsxDEV("button", {
    onClick: toggleTheme,
    "aria-label": "Toggle dark/light mode",
    className: `relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200
        ${theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10 text-amber-400' : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-600'} ${className}`,
    children: /*#__PURE__*/_jsxDEV(AnimatePresence, {
      mode: "wait",
      initial: false,
      children: theme === 'dark' ? /*#__PURE__*/_jsxDEV(motion.span, {
        initial: {
          opacity: 0,
          rotate: -30,
          scale: 0.5
        },
        animate: {
          opacity: 1,
          rotate: 0,
          scale: 1
        },
        exit: {
          opacity: 0,
          rotate: 30,
          scale: 0.5
        },
        transition: {
          duration: 0.2
        },
        className: "absolute",
        children: /*#__PURE__*/_jsxDEV(Moon, {
          size: 16
        }, void 0, false)
      }, "moon", false) : /*#__PURE__*/_jsxDEV(motion.span, {
        initial: {
          opacity: 0,
          rotate: 30,
          scale: 0.5
        },
        animate: {
          opacity: 1,
          rotate: 0,
          scale: 1
        },
        exit: {
          opacity: 0,
          rotate: -30,
          scale: 0.5
        },
        transition: {
          duration: 0.2
        },
        className: "absolute",
        children: /*#__PURE__*/_jsxDEV(Sun, {
          size: 16
        }, void 0, false)
      }, "sun", false)
    }, void 0, false)
  }, void 0, false);
}