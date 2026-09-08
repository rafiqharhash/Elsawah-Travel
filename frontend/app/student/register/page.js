"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Lock, Eye, EyeOff, ArrowRight, AlertCircle, User, Mail, Phone, Shield } from "lucide-react";
import { api } from "@/services/api";
import { useStudent } from "@/contexts/StudentContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLang } from "@/app/providers";
import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";
export default function StudentRegisterPage() {
  const router = useRouter();
  const {
    login
  } = useStudent();
  const {
    t,
    isRTL
  } = useLang();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    relativePhone: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const set = field => e => setForm(f => ({
    ...f,
    [field]: e.target.value
  }));
  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.phone || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post("/auth/student/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        relativePhone: form.relativePhone || undefined
      });
      login(res.data.data.token, res.data.data.student);
      window.location.href = "/student";
    } catch (err) {
      setError(err.response?.data?.message || t("error"));
    } finally {
      setIsLoading(false);
    }
  };
  const fields = [{
    id: "name",
    label: t("fullName") + " *",
    placeholder: "Ahmed Mohamed",
    icon: /*#__PURE__*/_jsxDEV(User, {
      size: 15
    }, void 0, false)
  }, {
    id: "email",
    label: t("emailAddress") + " *",
    placeholder: t("emailPlaceholder"),
    type: "email",
    icon: /*#__PURE__*/_jsxDEV(Mail, {
      size: 15
    }, void 0, false)
  }, {
    id: "phone",
    label: t("phoneNumber") + " *",
    placeholder: t("phoneNumberPlaceholder"),
    type: "tel",
    icon: /*#__PURE__*/_jsxDEV(Phone, {
      size: 15
    }, void 0, false)
  }, {
    id: "relativePhone",
    label: "Parent/Guardian Phone",
    placeholder: t("phoneNumberPlaceholder") + " (optional)",
    type: "tel",
    icon: /*#__PURE__*/_jsxDEV(Shield, {
      size: 15
    }, void 0, false)
  }];
  return /*#__PURE__*/_jsxDEV("div", {
    className: "min-h-screen flex flex-col bg-background relative overflow-hidden",
    children: [/*#__PURE__*/_jsxDEV("div", {
      className: "absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5 pointer-events-none"
    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
      className: "absolute top-1/3 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none"
    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
      className: `fixed top-4 z-50 flex gap-2 ${isRTL ? "left-4" : "right-4"}`,
      children: [/*#__PURE__*/_jsxDEV(LanguageToggle, {}, void 0, false), /*#__PURE__*/_jsxDEV(ThemeToggle, {}, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
      className: "flex-1 flex items-center justify-center p-4",
      children: /*#__PURE__*/_jsxDEV(motion.div, {
        initial: {
          opacity: 0,
          y: 24
        },
        animate: {
          opacity: 1,
          y: 0
        },
        className: "w-full max-w-sm relative z-10",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "text-center mb-6",
          children: [/*#__PURE__*/_jsxDEV(motion.div, {
            initial: {
              scale: 0
            },
            animate: {
              scale: 1
            },
            transition: {
              type: "spring",
              stiffness: 260,
              delay: 0.1
            },
            className: "w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3",
            children: /*#__PURE__*/_jsxDEV(GraduationCap, {
              size: 28,
              className: "text-primary"
            }, void 0, false)
          }, void 0, false), /*#__PURE__*/_jsxDEV("h1", {
            className: "text-2xl font-bold tracking-tight",
            children: t("registerTitle")
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-muted-foreground text-sm mt-1",
            children: t("registerSubtitle")
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV(motion.div, {
          initial: {
            opacity: 0,
            y: 16
          },
          animate: {
            opacity: 1,
            y: 0
          },
          transition: {
            delay: 0.15
          },
          className: "glass-card p-6 space-y-4",
          children: [/*#__PURE__*/_jsxDEV(AnimatePresence, {
            children: error && /*#__PURE__*/_jsxDEV(motion.div, {
              initial: {
                opacity: 0,
                height: 0
              },
              animate: {
                opacity: 1,
                height: "auto"
              },
              exit: {
                opacity: 0,
                height: 0
              },
              className: "flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm",
              children: [/*#__PURE__*/_jsxDEV(AlertCircle, {
                size: 15,
                className: "shrink-0"
              }, void 0, false), error]
            }, void 0, true)
          }, void 0, false), /*#__PURE__*/_jsxDEV("form", {
            onSubmit: handleSubmit,
            className: "space-y-3",
            children: [fields.map(f => /*#__PURE__*/_jsxDEV("div", {
              className: "space-y-1",
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-xs font-medium text-muted-foreground block",
                children: f.label
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "relative",
                children: [/*#__PURE__*/_jsxDEV("span", {
                  className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
                  children: f.icon
                }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
                  id: f.id,
                  type: f.type || "text",
                  value: form[f.id],
                  onChange: set(f.id),
                  placeholder: f.placeholder,
                  className: "w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                }, void 0, false)]
              }, void 0, true)]
            }, f.id, true)), /*#__PURE__*/_jsxDEV("div", {
              className: "space-y-1",
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-xs font-medium text-muted-foreground block",
                children: [t("password"), " *"]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "relative",
                children: [/*#__PURE__*/_jsxDEV(Lock, {
                  size: 15,
                  className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
                  id: "password",
                  type: showPassword ? "text" : "password",
                  value: form.password,
                  onChange: set("password"),
                  placeholder: "Min. 6 characters",
                  className: "w-full pl-9 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
                  type: "button",
                  onClick: () => setShowPassword(v => !v),
                  className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                  children: showPassword ? /*#__PURE__*/_jsxDEV(EyeOff, {
                    size: 15
                  }, void 0, false) : /*#__PURE__*/_jsxDEV(Eye, {
                    size: 15
                  }, void 0, false)
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "space-y-1",
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-xs font-medium text-muted-foreground block",
                children: "Confirm Password *"
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "relative",
                children: [/*#__PURE__*/_jsxDEV(Lock, {
                  size: 15,
                  className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                }, void 0, false), /*#__PURE__*/_jsxDEV("input", {
                  id: "confirmPassword",
                  type: showPassword ? "text" : "password",
                  value: form.confirmPassword,
                  onChange: set("confirmPassword"),
                  placeholder: "Re-enter password",
                  className: "w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
              type: "submit",
              disabled: isLoading,
              className: "w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 transition-all mt-2",
              children: isLoading ? /*#__PURE__*/_jsxDEV("span", {
                className: "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              }, void 0, false) : /*#__PURE__*/_jsxDEV(_Fragment, {
                children: [/*#__PURE__*/_jsxDEV(ArrowRight, {
                  size: 16
                }, void 0, false), " ", t("create")]
              }, void 0, true)
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
            className: "text-center text-xs text-muted-foreground pt-1",
            children: [t("alreadyAccount"), " ", /*#__PURE__*/_jsxDEV(Link, {
              href: "/student/login",
              className: "text-primary hover:text-primary/80 font-medium transition-colors",
              children: t("loginInstead")
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false)]
  }, void 0, true);
}