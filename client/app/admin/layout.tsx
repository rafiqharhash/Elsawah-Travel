"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Bus, Route, Users, BarChart3, LogOut, ShieldCheck, BookOpen, MapPin } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLang } from "@/app/providers";
import { Footer } from "@/components/ui/footer";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLang();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login page renders without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-card/30 backdrop-blur-xl hidden md:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">E</div>
            {t('appName')}
          </h1>
          {user && (
            <p className="text-xs text-muted-foreground mt-2 truncate">{user.name} · <span className="text-primary">{user.role}</span></p>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem href="/admin/dashboard" icon={<Home size={18} />} label={t('overview')} active={pathname === "/admin/dashboard"} />
          <NavItem href="/admin/trips" icon={<Route size={18} />} label={t('trips')} active={pathname.startsWith("/admin/trips")} />
          <NavItem href="/admin/locations" icon={<MapPin size={18} />} label={t('locationsFares')} active={pathname.startsWith("/admin/locations")} />
          <NavItem href="/admin/vehicles" icon={<Bus size={18} />} label={t('vehicles')} active={pathname.startsWith("/admin/vehicles")} />
          <NavItem href="/admin/students" icon={<Users size={18} />} label={t('students')} active={pathname.startsWith("/admin/students")} />
          <NavItem href="/admin/bookings" icon={<BookOpen size={18} />} label={t('bookings')} active={pathname.startsWith("/admin/bookings")} />
          <NavItem href="/admin/reports" icon={<BarChart3 size={18} />} label={t('reportsExport')} active={pathname.startsWith("/admin/reports")} />
          {user?.role === "Supervisor" && (
            <NavItem href="/admin/admins" icon={<ShieldCheck size={18} />} label={t('manageAdmins')} active={pathname.startsWith("/admin/admins")} supervisor />
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={18} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-white/10 bg-card/30 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
          <div className="md:hidden font-bold">{t('appName')}</div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            {user && <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>}
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-xs font-bold text-primary">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 md:p-8 overflow-auto relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-6xl mx-auto">
            {children}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active, supervisor }: { href: string; icon: ReactNode; label: string; active?: boolean; supervisor?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        active
          ? supervisor
            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
            : "bg-primary/10 text-primary border border-primary/20"
          : supervisor
          ? "text-purple-400/70 hover:bg-purple-500/5 hover:text-purple-400"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
