"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, Bus, Route, TrendingUp, Star, Activity } from "lucide-react";
import { motion } from "framer-motion";

import { useLang } from "@/app/providers";

export default function DashboardOverview() {
  const { t } = useLang();
  const [user, setUser] = useState<any>(null);
  const isSupervisor = user?.role === "Supervisor";

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/stats/dashboard");
      return res.data.data;
    },
  });

  const { data: tripsData } = useQuery({
    queryKey: ["dashboard-trips"],
    queryFn: async () => {
      const res = await api.get("/trips?limit=10"); // Just fetch recent/active for the status list
      return res.data.data || [];
    },
  });

  const activeTrips = statsData?.activeTripsCount || 0;
  const totalTrips = statsData?.totalTrips || 0;
  const totalUsers = statsData?.totalUsers || 0;
  const avgOccupancy = statsData?.avgOccupancy || 0;
  const totalBooked = statsData?.totalBookedSeats || 0;
  const weeklyData = statsData?.weeklyActivity || [];

  return (
    <div className="space-y-8">
      {/* Supervisor Welcome Banner */}
      {isSupervisor && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent p-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-medium text-amber-400 uppercase tracking-widest">{t("supervisorBadge")}</span>
              </div>
              <h2 className="text-3xl font-bold">
                {t("welcomeBack")} <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{user?.name}</span> 👋
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("supervisorDesc")}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <Activity size={16} className="text-primary" />
              <span className="text-sm font-medium text-primary">{activeTrips} {t("activeTripsRunning")}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Standard Admin Header (non-supervisor) */}
      {!isSupervisor && (
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("dashboardTitle")}</h2>
          <p className="text-muted-foreground mt-2">{t("dashboardSubtitle")}</p>
        </div>
      )}

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard title={t("totalStudents")} value={String(totalUsers || "0")} icon={<Users className="text-primary" />} sub={t("registeredUsers")} color="primary" />
        <StatCard title={t("activeTrips")} value={String(activeTrips)} icon={<Route className="text-emerald-400" />} sub={`${totalTrips} ${t("totalTrips")}`} color="emerald" />
        <StatCard title={t("fleetVehicles")} value={String(totalBooked)} icon={<Bus className="text-amber-400" />} sub={t("bookingsTotal")} color="amber" />
        <StatCard title={t("avgOccupancy")} value={`${avgOccupancy}%`} icon={<TrendingUp className="text-purple-400" />} sub="" color="purple" />
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-7"
      >
        <Card className="col-span-4 glass-card border-white/5 bg-card/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t("weeklyActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={{ backgroundColor: "#111", borderColor: "#333", borderRadius: "8px" }} />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 glass-card border-white/5 bg-card/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t("activeTripsStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-1">
              {!tripsData || tripsData.filter((t: any) => t.status !== "Completed" && t.status !== "Cancelled").length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("noActiveTrips")}</p>
              ) : (
                tripsData
                  .filter((t: any) => t.status !== "Completed" && t.status !== "Cancelled")
                  .slice(0, 6)
                  .map((t: any) => (
                    <div key={t._id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium leading-tight">{t.route}</p>
                        <p className="text-xs text-muted-foreground">{t.departureTime} · {t.vehicleIds?.length || 0} bus(es)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-primary">{t.totalBooked}/{t.totalCapacity}</p>
                        <div className="w-16 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${t.occupancyPercentage || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Supervisor quick actions */}
      {isSupervisor && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">{t("quickActions")}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: t("manageAdmins"), desc: t("manageAdminsDesc"), href: "/admin/admins", color: "from-purple-500/10 to-transparent border-purple-500/20" },
              { label: t("manualBooking"), desc: t("manualBookingDesc"), href: "/admin/students", color: "from-primary/10 to-transparent border-primary/20" },
              { label: t("fleetOverview"), desc: t("fleetOverviewDesc"), href: "/admin/vehicles", color: "from-amber-500/10 to-transparent border-amber-500/20" },
            ].map(action => (
              <a key={action.href} href={action.href} className={`block p-4 rounded-xl border bg-gradient-to-br ${action.color} hover:scale-[1.01] transition-transform`}>
                <p className="font-semibold text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, sub, color = "primary" }: { title: string; value: string; icon: React.ReactNode; sub: string; color?: string }) {
  return (
    <Card className="border-white/5 bg-card/30 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 bg-${color}/10 rounded-md`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
