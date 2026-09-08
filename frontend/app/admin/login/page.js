"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Lock, User, AlertCircle, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLang } from "@/app/providers";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export default function AdminLoginPage() {
  const router = useRouter();
  const {
    t
  } = useLang();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        username,
        password
      };
      const res = await api.post("/auth/login", payload);
      const {
        token,
        user
      } = res.data.data;
      if (user.role !== "Admin" && user.role !== "Supervisor") {
        setError(t('accessDenied'));
        setLoading(false);
        return;
      }
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || t('loginError'));
    } finally {
      setLoading(false);
    }
  };
  return /*#__PURE__*/_jsxDEV("div", {
    className: "min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden",
    children: [/*#__PURE__*/_jsxDEV("div", {
      className: "absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none"
    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
      className: "absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"
    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
      className: "absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"
    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
      className: "fixed top-4 right-4 z-50 flex gap-2",
      children: [/*#__PURE__*/_jsxDEV(LanguageToggle, {}, void 0, false), /*#__PURE__*/_jsxDEV(ThemeToggle, {}, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(motion.div, {
      initial: {
        opacity: 0,
        y: 24
      },
      animate: {
        opacity: 1,
        y: 0
      },
      transition: {
        duration: 0.4
      },
      className: "w-full max-w-sm relative z-10",
      children: [/*#__PURE__*/_jsxDEV("div", {
        className: "text-center mb-8",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "relative inline-block",
          children: /*#__PURE__*/_jsxDEV("div", {
            className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-600/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/10",
            children: /*#__PURE__*/_jsxDEV(Shield, {
              size: 28,
              className: "text-primary"
            }, void 0, false)
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV("h1", {
          className: "text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent",
          children: t('loginTitle')
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground text-sm mt-1",
          children: t('loginSubtitle')
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("form", {
        onSubmit: handleLogin,
        className: "space-y-4 bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl",
        children: [error && /*#__PURE__*/_jsxDEV(motion.div, {
          initial: {
            opacity: 0,
            y: -8
          },
          animate: {
            opacity: 1,
            y: 0
          },
          className: "flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm",
          children: [/*#__PURE__*/_jsxDEV(AlertCircle, {
            size: 16,
            className: "mt-0.5 shrink-0"
          }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
            children: error
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          children: [/*#__PURE__*/_jsxDEV("label", {
            className: "text-sm font-medium mb-1.5 block text-zinc-300",
            children: "Username"
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            className: "relative",
            children: [/*#__PURE__*/_jsxDEV(User, {
              size: 15,
              className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              type: "text",
              value: username,
              onChange: e => setUsername(e.target.value),
              placeholder: "e.g. admin",
              required: true,
              className: "pl-9 bg-white/5 border-white/10 focus:border-primary/50"
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          children: [/*#__PURE__*/_jsxDEV("label", {
            className: "text-sm font-medium mb-1.5 block text-zinc-300",
            children: t('password')
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            className: "relative",
            children: [/*#__PURE__*/_jsxDEV(Lock, {
              size: 15,
              className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              type: "password",
              value: password,
              onChange: e => setPassword(e.target.value),
              placeholder: "••••••••",
              required: true,
              className: "pl-9 bg-white/5 border-white/10 focus:border-primary/50"
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
          type: "submit",
          className: "w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20",
          disabled: loading,
          children: loading ? /*#__PURE__*/_jsxDEV("span", {
            className: "flex items-center gap-2",
            children: [/*#__PURE__*/_jsxDEV("span", {
              className: "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            }, void 0, false), t('signingIn')]
          }, void 0, true) : /*#__PURE__*/_jsxDEV("span", {
            className: "flex items-center gap-2",
            children: [/*#__PURE__*/_jsxDEV(Shield, {
              size: 15
            }, void 0, false), t('signIn')]
          }, void 0, true)
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-center text-xs text-muted-foreground",
          children: [t('studentLink'), " ", /*#__PURE__*/_jsxDEV("a", {
            href: "/",
            className: "text-primary hover:underline",
            children: t('bookInstead')
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)]
    }, void 0, true)]
  }, void 0, true);
}