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

interface Field { id: string; label: string; placeholder: string; type?: string; icon: React.ReactNode; required?: boolean; }

export default function StudentRegisterPage() {
  const router = useRouter();
  const { login } = useStudent();
  const { isRTL } = useLang();

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    password: "", confirmPassword: "", relativePhone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
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
        relativePhone: form.relativePhone || undefined,
      });
      login(res.data.data.token, res.data.data.student);
      window.location.href = "/student";
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fields: Field[] = [
    { id: "name",          label: "Full Name *",      placeholder: "Ahmed Mohamed",        icon: <User size={15} /> },
    { id: "email",         label: "Email *",           placeholder: "ahmed@aiu.edu.eg",     type: "email", icon: <Mail size={15} /> },
    { id: "phone",         label: "Phone Number *",    placeholder: "01XXXXXXXXX",          type: "tel", icon: <Phone size={15} /> },
    { id: "relativePhone", label: "Parent/Guardian Phone", placeholder: "01XXXXXXXXX (optional)", type: "tel", icon: <Shield size={15} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5 pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className={`fixed top-4 z-50 flex gap-2 ${isRTL ? "left-4" : "right-4"}`}>
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3"
            >
              <GraduationCap size={28} className="text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
            <p className="text-muted-foreground text-sm mt-1">Register to book your trip with Elsawah Travel</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6 space-y-4"
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3">
              {fields.map(f => (
                <div key={f.id} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground block">{f.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{f.icon}</span>
                    <input
                      id={f.id}
                      type={f.type || "text"}
                      value={(form as any)[f.id]}
                      onChange={set(f.id)}
                      placeholder={f.placeholder}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              ))}

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground block">Password *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Min. 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground block">Confirm Password *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 transition-all mt-2"
              >
                {isLoading
                  ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <><ArrowRight size={16} /> Create Account</>}
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground pt-1">
              Already registered?{" "}
              <Link href="/student/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
