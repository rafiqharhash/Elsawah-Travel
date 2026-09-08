"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Bus, Route, Users, BarChart3, LogOut, ShieldCheck, BookOpen, MapPin, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLang } from "@/app/providers";
import { Footer } from "@/components/ui/footer";
import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";
export default function AdminLayout({
  children
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    t,
    isRTL
  } = useLang();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    // Skip auth check on the login page itself
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) {
      router.replace("/admin/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.role !== "Admin" && parsed.role !== "Supervisor") {
        router.replace("/admin/login");
        return;
      }
      setUser(parsed);
    } catch {
      router.replace("/admin/login");
      return;
    }
    setChecking(false);
  }, [pathname, router]);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/admin/login");
  };

  // Show blank while checking auth (prevents flash)
  if (checking && pathname !== "/admin/login") {
    return /*#__PURE__*/_jsxDEV("div", {
      className: "min-h-screen flex items-center justify-center bg-background",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
      }, void 0, false)
    }, void 0, false);
  }

  // Login page renders without sidebar
  if (pathname === "/admin/login") {
    return /*#__PURE__*/_jsxDEV(_Fragment, {
      children: children
    }, void 0, false);
  }
  return /*#__PURE__*/_jsxDEV("div", {
    className: "min-h-screen bg-background flex overflow-hidden",
    children: [isMobileMenuOpen && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity",
      onClick: () => setIsMobileMenuOpen(false)
    }, void 0, false), /*#__PURE__*/_jsxDEV("aside", {
      className: `fixed inset-y-0 ${isRTL ? "right-0 border-l" : "left-0 border-r"} z-50 w-64 border-white/10 bg-card/95 md:bg-card/30 backdrop-blur-xl flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"}`,
      children: [/*#__PURE__*/_jsxDEV("div", {
        className: "p-6 border-b border-white/10 flex items-center justify-between",
        children: [/*#__PURE__*/_jsxDEV("div", {
          children: [/*#__PURE__*/_jsxDEV("h1", {
            className: "text-xl font-bold text-foreground flex items-center gap-2",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm",
              children: "E"
            }, void 0, false), t('appName')]
          }, void 0, true), user && /*#__PURE__*/_jsxDEV("p", {
            className: "text-xs text-muted-foreground mt-2 truncate",
            children: [user.name, " · ", /*#__PURE__*/_jsxDEV("span", {
              className: "text-primary",
              children: user.role
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
          className: "md:hidden text-muted-foreground hover:text-foreground p-1",
          onClick: () => setIsMobileMenuOpen(false),
          children: /*#__PURE__*/_jsxDEV(X, {
            size: 20
          }, void 0, false)
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("nav", {
        className: "flex-1 p-4 space-y-1 overflow-y-auto",
        children: [/*#__PURE__*/_jsxDEV(NavItem, {
          href: "/admin/dashboard",
          icon: /*#__PURE__*/_jsxDEV(Home, {
            size: 18
          }, void 0, false),
          label: t('overview'),
          active: pathname === "/admin/dashboard",
          onClick: () => setIsMobileMenuOpen(false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(NavItem, {
          href: "/admin/trips",
          icon: /*#__PURE__*/_jsxDEV(Route, {
            size: 18
          }, void 0, false),
          label: t('trips'),
          active: pathname.startsWith("/admin/trips"),
          onClick: () => setIsMobileMenuOpen(false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(NavItem, {
          href: "/admin/locations",
          icon: /*#__PURE__*/_jsxDEV(MapPin, {
            size: 18
          }, void 0, false),
          label: t('locationsFares'),
          active: pathname.startsWith("/admin/locations"),
          onClick: () => setIsMobileMenuOpen(false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(NavItem, {
          href: "/admin/vehicles",
          icon: /*#__PURE__*/_jsxDEV(Bus, {
            size: 18
          }, void 0, false),
          label: t('vehicles'),
          active: pathname.startsWith("/admin/vehicles"),
          onClick: () => setIsMobileMenuOpen(false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(NavItem, {
          href: "/admin/students",
          icon: /*#__PURE__*/_jsxDEV(Users, {
            size: 18
          }, void 0, false),
          label: t('students'),
          active: pathname.startsWith("/admin/students"),
          onClick: () => setIsMobileMenuOpen(false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(NavItem, {
          href: "/admin/bookings",
          icon: /*#__PURE__*/_jsxDEV(BookOpen, {
            size: 18
          }, void 0, false),
          label: t('bookings'),
          active: pathname.startsWith("/admin/bookings"),
          onClick: () => setIsMobileMenuOpen(false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(NavItem, {
          href: "/admin/reports",
          icon: /*#__PURE__*/_jsxDEV(BarChart3, {
            size: 18
          }, void 0, false),
          label: t('reportsExport'),
          active: pathname.startsWith("/admin/reports"),
          onClick: () => setIsMobileMenuOpen(false)
        }, void 0, false), user?.role === "Supervisor" && /*#__PURE__*/_jsxDEV(NavItem, {
          href: "/admin/admins",
          icon: /*#__PURE__*/_jsxDEV(ShieldCheck, {
            size: 18
          }, void 0, false),
          label: t('manageAdmins'),
          active: pathname.startsWith("/admin/admins"),
          supervisor: true,
          onClick: () => setIsMobileMenuOpen(false)
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
        className: "p-4 border-t border-white/10 shrink-0",
        children: /*#__PURE__*/_jsxDEV("button", {
          onClick: handleLogout,
          className: "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors",
          children: [/*#__PURE__*/_jsxDEV(LogOut, {
            size: 18
          }, void 0, false), t('logout')]
        }, void 0, true)
      }, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV("main", {
      className: "flex-1 flex flex-col min-h-screen overflow-hidden",
      children: [/*#__PURE__*/_jsxDEV("header", {
        className: "h-16 border-b border-white/10 bg-card/30 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shrink-0",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center gap-3 md:hidden",
          children: [/*#__PURE__*/_jsxDEV("button", {
            onClick: () => setIsMobileMenuOpen(true),
            className: `p-2 ${isRTL ? "-mr-2" : "-ml-2"} text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors`,
            children: /*#__PURE__*/_jsxDEV(Menu, {
              size: 20
            }, void 0, false)
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            className: "font-bold text-lg",
            children: t('appName')
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "hidden md:block flex-1"
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center gap-3",
          children: [/*#__PURE__*/_jsxDEV(LanguageToggle, {}, void 0, false), /*#__PURE__*/_jsxDEV(ThemeToggle, {}, void 0, false), user && /*#__PURE__*/_jsxDEV("span", {
            className: "text-sm text-muted-foreground hidden sm:block",
            children: user.name
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            className: "w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-xs font-bold text-primary",
            children: user?.name?.[0]?.toUpperCase() || "A"
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
        className: "flex-1 p-6 md:p-8 overflow-auto relative",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none"
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          className: "relative z-10 max-w-6xl mx-auto",
          children: children
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV(Footer, {}, void 0, false)]
    }, void 0, true)]
  }, void 0, true);
}
function NavItem({
  href,
  icon,
  label,
  active,
  supervisor,
  onClick
}) {
  return /*#__PURE__*/_jsxDEV(Link, {
    href: href,
    onClick: onClick,
    className: `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${active ? supervisor ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-primary/10 text-primary border border-primary/20" : supervisor ? "text-purple-400/70 hover:bg-purple-500/5 hover:text-purple-400" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`,
    children: [icon, /*#__PURE__*/_jsxDEV("span", {
      className: "truncate",
      children: label
    }, void 0, false)]
  }, void 0, true);
}