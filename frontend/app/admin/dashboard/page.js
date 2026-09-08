"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, Bus, Route, TrendingUp, Star, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/app/providers";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export default function DashboardOverview() {
  const {
    t
  } = useLang();
  const [user, setUser] = useState(null);
  const isSupervisor = user?.role === "Supervisor";
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);
  const {
    data: statsData,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/stats/dashboard");
      return res.data.data;
    }
  });
  const {
    data: tripsData
  } = useQuery({
    queryKey: ["dashboard-trips"],
    queryFn: async () => {
      const res = await api.get("/trips?limit=10"); // Just fetch recent/active for the status list
      return res.data.data || [];
    }
  });
  const activeTrips = statsData?.activeTripsCount || 0;
  const totalTrips = statsData?.totalTrips || 0;
  const totalUsers = statsData?.totalUsers || 0;
  const avgOccupancy = statsData?.avgOccupancy || 0;
  const totalBooked = statsData?.totalBookedSeats || 0;
  const weeklyData = statsData?.weeklyActivity || [];
  return /*#__PURE__*/_jsxDEV("div", {
    className: "space-y-8",
    children: [isSupervisor && /*#__PURE__*/_jsxDEV(motion.div, {
      initial: {
        opacity: 0,
        y: -16
      },
      animate: {
        opacity: 1,
        y: 0
      },
      transition: {
        duration: 0.5
      },
      className: "relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent p-6",
      children: [/*#__PURE__*/_jsxDEV("div", {
        className: "absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none"
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        className: "relative z-10 flex items-center justify-between flex-wrap gap-4",
        children: [/*#__PURE__*/_jsxDEV("div", {
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "flex items-center gap-2 mb-1",
            children: [/*#__PURE__*/_jsxDEV(Star, {
              size: 16,
              className: "text-amber-400 fill-amber-400"
            }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
              className: "text-xs font-medium text-amber-400 uppercase tracking-widest",
              children: t("supervisorBadge")
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("h2", {
            className: "text-3xl font-bold",
            children: [t("welcomeBack"), " ", /*#__PURE__*/_jsxDEV("span", {
              className: "bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent",
              children: user?.name
            }, void 0, false), " 👋"]
          }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
            className: "text-muted-foreground mt-1 text-sm",
            children: t("supervisorDesc")
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20",
          children: [/*#__PURE__*/_jsxDEV(Activity, {
            size: 16,
            className: "text-primary"
          }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
            className: "text-sm font-medium text-primary",
            children: [activeTrips, " ", t("activeTripsRunning")]
          }, void 0, true)]
        }, void 0, true)]
      }, void 0, true)]
    }, void 0, true), !isSupervisor && /*#__PURE__*/_jsxDEV("div", {
      children: [/*#__PURE__*/_jsxDEV("h2", {
        className: "text-3xl font-bold tracking-tight",
        children: t("dashboardTitle")
      }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
        className: "text-muted-foreground mt-2",
        children: t("dashboardSubtitle")
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
        duration: 0.4,
        delay: 0.1
      },
      className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
      children: [/*#__PURE__*/_jsxDEV(StatCard, {
        title: t("totalStudents"),
        value: String(totalUsers || "0"),
        icon: /*#__PURE__*/_jsxDEV(Users, {
          className: "text-primary"
        }, void 0, false),
        sub: t("registeredUsers"),
        color: "primary"
      }, void 0, false), /*#__PURE__*/_jsxDEV(StatCard, {
        title: t("activeTrips"),
        value: String(activeTrips),
        icon: /*#__PURE__*/_jsxDEV(Route, {
          className: "text-emerald-400"
        }, void 0, false),
        sub: `${totalTrips} ${t("totalTrips")}`,
        color: "emerald"
      }, void 0, false), /*#__PURE__*/_jsxDEV(StatCard, {
        title: t("fleetVehicles"),
        value: String(totalBooked),
        icon: /*#__PURE__*/_jsxDEV(Bus, {
          className: "text-amber-400"
        }, void 0, false),
        sub: t("bookingsTotal"),
        color: "amber"
      }, void 0, false), /*#__PURE__*/_jsxDEV(StatCard, {
        title: t("avgOccupancy"),
        value: `${avgOccupancy}%`,
        icon: /*#__PURE__*/_jsxDEV(TrendingUp, {
          className: "text-purple-400"
        }, void 0, false),
        sub: "",
        color: "purple"
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
        duration: 0.4,
        delay: 0.2
      },
      className: "grid gap-4 md:grid-cols-2 lg:grid-cols-7",
      children: [/*#__PURE__*/_jsxDEV(Card, {
        className: "col-span-4 glass-card border-white/5 bg-card/30 backdrop-blur-xl",
        children: [/*#__PURE__*/_jsxDEV(CardHeader, {
          children: /*#__PURE__*/_jsxDEV(CardTitle, {
            className: "text-base font-semibold",
            children: t("weeklyActivity")
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(CardContent, {
          children: /*#__PURE__*/_jsxDEV("div", {
            className: "h-[260px] w-full",
            children: /*#__PURE__*/_jsxDEV(ResponsiveContainer, {
              width: "100%",
              height: "100%",
              children: /*#__PURE__*/_jsxDEV(BarChart, {
                data: weeklyData,
                children: [/*#__PURE__*/_jsxDEV(CartesianGrid, {
                  strokeDasharray: "3 3",
                  stroke: "#ffffff08",
                  vertical: false
                }, void 0, false), /*#__PURE__*/_jsxDEV(XAxis, {
                  dataKey: "name",
                  stroke: "#888",
                  fontSize: 12,
                  tickLine: false,
                  axisLine: false
                }, void 0, false), /*#__PURE__*/_jsxDEV(YAxis, {
                  stroke: "#888",
                  fontSize: 12,
                  tickLine: false,
                  axisLine: false
                }, void 0, false), /*#__PURE__*/_jsxDEV(Tooltip, {
                  cursor: {
                    fill: "#ffffff08"
                  },
                  contentStyle: {
                    backgroundColor: "#111",
                    borderColor: "#333",
                    borderRadius: "8px"
                  }
                }, void 0, false), /*#__PURE__*/_jsxDEV(Bar, {
                  dataKey: "bookings",
                  fill: "hsl(var(--primary))",
                  radius: [4, 4, 0, 0]
                }, void 0, false)]
              }, void 0, true)
            }, void 0, false)
          }, void 0, false)
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
        className: "col-span-3 glass-card border-white/5 bg-card/30 backdrop-blur-xl",
        children: [/*#__PURE__*/_jsxDEV(CardHeader, {
          children: /*#__PURE__*/_jsxDEV(CardTitle, {
            className: "text-base font-semibold",
            children: t("activeTripsStatus")
          }, void 0, false)
        }, void 0, false), /*#__PURE__*/_jsxDEV(CardContent, {
          children: /*#__PURE__*/_jsxDEV("div", {
            className: "space-y-3 mt-1",
            children: !tripsData || tripsData.filter(t => t.status !== "Completed" && t.status !== "Cancelled").length === 0 ? /*#__PURE__*/_jsxDEV("p", {
              className: "text-sm text-muted-foreground text-center py-8",
              children: t("noActiveTrips")
            }, void 0, false) : tripsData.filter(t => t.status !== "Completed" && t.status !== "Cancelled").slice(0, 6).map(t => /*#__PURE__*/_jsxDEV("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/_jsxDEV("div", {
                children: [/*#__PURE__*/_jsxDEV("p", {
                  className: "text-sm font-medium leading-tight",
                  children: t.route
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-xs text-muted-foreground",
                  children: [t.departureTime, " · ", t.vehicleIds?.length || 0, " bus(es)"]
                }, void 0, true)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                className: "text-right",
                children: [/*#__PURE__*/_jsxDEV("p", {
                  className: "text-xs font-mono text-primary",
                  children: [t.totalBooked, "/", t.totalCapacity]
                }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                  className: "w-16 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden",
                  children: /*#__PURE__*/_jsxDEV("div", {
                    className: "h-full bg-primary rounded-full",
                    style: {
                      width: `${t.occupancyPercentage || 0}%`
                    }
                  }, void 0, false)
                }, void 0, false)]
              }, void 0, true)]
            }, t._id, true))
          }, void 0, false)
        }, void 0, false)]
      }, void 0, true)]
    }, void 0, true), isSupervisor && /*#__PURE__*/_jsxDEV(motion.div, {
      initial: {
        opacity: 0,
        y: 16
      },
      animate: {
        opacity: 1,
        y: 0
      },
      transition: {
        duration: 0.4,
        delay: 0.3
      },
      children: [/*#__PURE__*/_jsxDEV("h3", {
        className: "text-lg font-semibold mb-4",
        children: t("quickActions")
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        className: "grid grid-cols-1 gap-3 sm:grid-cols-3",
        children: [{
          label: t("manageAdmins"),
          desc: t("manageAdminsDesc"),
          href: "/admin/admins",
          color: "from-purple-500/10 to-transparent border-purple-500/20"
        }, {
          label: t("manualBooking"),
          desc: t("manualBookingDesc"),
          href: "/admin/students",
          color: "from-primary/10 to-transparent border-primary/20"
        }, {
          label: t("fleetOverview"),
          desc: t("fleetOverviewDesc"),
          href: "/admin/vehicles",
          color: "from-amber-500/10 to-transparent border-amber-500/20"
        }].map(action => /*#__PURE__*/_jsxDEV("a", {
          href: action.href,
          className: `block p-4 rounded-xl border bg-gradient-to-br ${action.color} hover:scale-[1.01] transition-transform`,
          children: [/*#__PURE__*/_jsxDEV("p", {
            className: "font-semibold text-sm",
            children: action.label
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-xs text-muted-foreground mt-0.5",
            children: action.desc
          }, void 0, false)]
        }, action.href, true))
      }, void 0, false)]
    }, void 0, true)]
  }, void 0, true);
}
function StatCard({
  title,
  value,
  icon,
  sub,
  color = "primary"
}) {
  return /*#__PURE__*/_jsxDEV(Card, {
    className: "border-white/5 bg-card/30 backdrop-blur-xl",
    children: [/*#__PURE__*/_jsxDEV(CardHeader, {
      className: "flex flex-row items-center justify-between pb-2",
      children: [/*#__PURE__*/_jsxDEV(CardTitle, {
        className: "text-sm font-medium text-muted-foreground",
        children: title
      }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
        className: `p-2 bg-${color}/10 rounded-md`,
        children: icon
      }, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(CardContent, {
      children: [/*#__PURE__*/_jsxDEV("div", {
        className: "text-2xl font-bold",
        children: value
      }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
        className: "text-xs text-muted-foreground mt-1",
        children: sub
      }, void 0, false)]
    }, void 0, true)]
  }, void 0, true);
}