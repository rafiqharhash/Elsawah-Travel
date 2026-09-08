"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, FileText, Download, AlertCircle, Search, FileDown, Bus, Globe, GlobeLock } from "lucide-react";
const STATUS_COLORS = {
  Scheduled: "text-blue-400 bg-blue-400/10",
  Active: "text-emerald-400 bg-emerald-400/10",
  Completed: "text-zinc-400 bg-zinc-400/10",
  Cancelled: "text-red-400 bg-red-400/10"
};
import { useLang } from "@/app/providers";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export default function ReportsPage() {
  const {
    t
  } = useLang();
  const qc = useQueryClient();
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [publishedToast, setPublishedToast] = useState(null);

  // Fetch ALL trips — no status restriction
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["all-trips-export"],
    queryFn: async () => {
      const res = await api.get("/trips?limit=200");
      return res.data.data;
    }
  });
  const publishMutation = useMutation({
    mutationFn: ({
      id,
      isPublished
    }) => api.patch(`/trips/${id}/publish`, {
      isPublished
    }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: ["all-trips-export"]
      });
      setPublishedToast(variables.isPublished ? t("sheetPublishedSuccess") : t("sheetUnpublished"));
      setTimeout(() => setPublishedToast(null), 3500);
    },
    onError: err => setError(err.response?.data?.message || t("publishFailed"))
  });
  const trips = (data || []).filter(t => {
    const matchSearch = !search || t.route.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const handleExport = async (tripId, format, tripName) => {
    const key = `${tripId}-${format}`;
    setDownloading(key);
    setError(null);
    try {
      const url = format === "pdf" ? `/export/trip/${tripId}/pdf` : `/export/trip/${tripId}?format=${format}`;
      const res = await api.get(url, {
        responseType: "blob"
      });
      const ext = format === "excel" ? "xlsx" : format;
      const mimeTypes = {
        pdf: "application/pdf",
        excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        csv: "text/csv"
      };
      const blob = new Blob([res.data], {
        type: mimeTypes[format]
      });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${tripName.replace(/\s+/g, "_")}_sheet.${ext}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.response?.data?.message || t("exportFailed"));
    } finally {
      setDownloading(null);
    }
  };
  return /*#__PURE__*/_jsxDEV("div", {
    className: "space-y-6",
    children: [/*#__PURE__*/_jsxDEV("div", {
      children: [/*#__PURE__*/_jsxDEV("h2", {
        className: "text-3xl font-bold tracking-tight",
        children: t("reportsExport")
      }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
        className: "text-muted-foreground mt-1",
        children: t("reportsDesc")
      }, void 0, false)]
    }, void 0, true), error && /*#__PURE__*/_jsxDEV("div", {
      className: "flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive",
      children: [/*#__PURE__*/_jsxDEV(AlertCircle, {
        size: 18
      }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
        className: "text-sm",
        children: error
      }, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      className: "border-primary/20 bg-primary/5 backdrop-blur-xl",
      children: /*#__PURE__*/_jsxDEV(CardContent, {
        className: "py-4 px-5",
        children: /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-start gap-4",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0",
            children: /*#__PURE__*/_jsxDEV(FileDown, {
              size: 22,
              className: "text-primary"
            }, void 0, false)
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("p", {
              className: "font-semibold text-sm mb-0.5",
              children: t("pdfTripSheet")
            }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
              className: "text-xs text-muted-foreground leading-relaxed",
              children: t("pdfTripSheetDesc")
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true)
      }, void 0, false)
    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
      className: "flex gap-3 flex-wrap",
      children: [/*#__PURE__*/_jsxDEV("div", {
        className: "relative w-full sm:w-auto",
        children: [/*#__PURE__*/_jsxDEV(Search, {
          size: 15,
          className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
          value: search,
          onChange: e => setSearch(e.target.value),
          placeholder: `${t("search")}...`,
          className: "pl-9 bg-white/5 border-white/10 w-full sm:w-64"
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("select", {
        value: statusFilter,
        onChange: e => setStatusFilter(e.target.value),
        className: "rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary",
        children: [/*#__PURE__*/_jsxDEV("option", {
          value: "",
          children: t("allStatuses")
        }, void 0, false), ["Scheduled", "Active", "Completed", "Cancelled"].map(s => /*#__PURE__*/_jsxDEV("option", {
          value: s,
          children: s === "Scheduled" ? t("scheduledStatus") : s === "Active" ? t("activeStatus") : s === "Completed" ? t("completedStatus") : t("cancelledStatus")
        }, s, false))]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      className: "border-white/5 bg-card/30 backdrop-blur-xl",
      children: [/*#__PURE__*/_jsxDEV(CardHeader, {
        children: /*#__PURE__*/_jsxDEV(CardTitle, {
          className: "text-base",
          children: t("allTrips")
        }, void 0, false)
      }, void 0, false), /*#__PURE__*/_jsxDEV(CardContent, {
        className: "p-0",
        children: isLoading ? /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-center py-16",
          children: /*#__PURE__*/_jsxDEV("div", {
            className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
          }, void 0, false)
        }, void 0, false) : trips.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
          className: "text-center py-16 text-muted-foreground",
          children: [/*#__PURE__*/_jsxDEV(FileText, {
            size: 40,
            className: "mx-auto mb-3 opacity-40"
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            children: t("noTrips")
          }, void 0, false)]
        }, void 0, true) : /*#__PURE__*/_jsxDEV("div", {
          className: "overflow-x-auto",
          children: /*#__PURE__*/_jsxDEV("table", {
            className: "w-full text-sm whitespace-nowrap",
            children: [/*#__PURE__*/_jsxDEV("thead", {
              children: /*#__PURE__*/_jsxDEV("tr", {
                className: "border-b border-white/5 text-muted-foreground",
                children: [/*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("route")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("dateTime")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("vehicles")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("status")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("passengers")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("publishSheet")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("export")
                }, void 0, false)]
              }, void 0, true)
            }, void 0, false), /*#__PURE__*/_jsxDEV("tbody", {
              children: trips.map(trip => /*#__PURE__*/_jsxDEV("tr", {
                className: "border-b border-white/5 hover:bg-white/5 transition-colors",
                children: [/*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 font-medium",
                  children: trip.route
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-muted-foreground text-xs",
                  children: [new Date(trip.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  }), /*#__PURE__*/_jsxDEV("br", {}, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    className: "font-mono text-primary",
                    children: trip.departureTime
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("span", {
                    className: "flex items-center gap-1 text-muted-foreground",
                    children: [/*#__PURE__*/_jsxDEV(Bus, {
                      size: 12
                    }, void 0, false), trip.vehicleIds?.length || 0, (trip.vehicleIds || []).length > 0 && /*#__PURE__*/_jsxDEV("span", {
                      className: "hidden md:inline text-xs ml-1 text-zinc-500",
                      children: ["(", (trip.vehicleIds || []).map(v => v.vehicleNumber).join(", "), ")"]
                    }, void 0, true)]
                  }, void 0, true)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("span", {
                    className: `px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[trip.status] || ""}`,
                    children: trip.status
                  }, void 0, false)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    className: "font-mono text-primary",
                    children: trip.totalBooked
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    className: "text-muted-foreground text-xs",
                    children: [" / ", trip.totalCapacity]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
                    className: "w-20 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden",
                    children: /*#__PURE__*/_jsxDEV("div", {
                      className: "h-full bg-primary rounded-full",
                      style: {
                        width: `${trip.occupancyPercentage || 0}%`
                      }
                    }, void 0, false)
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("button", {
                    onClick: () => publishMutation.mutate({
                      id: trip._id,
                      isPublished: !trip.isPublished
                    }),
                    disabled: publishMutation.isPending,
                    className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${trip.isPublished ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-white/5 text-muted-foreground border-white/10 hover:border-primary/30 hover:text-primary hover:bg-primary/5"}`,
                    title: trip.isPublished ? t("clickUnpublish") : t("publishToStudents"),
                    children: [trip.isPublished ? /*#__PURE__*/_jsxDEV(Globe, {
                      size: 12
                    }, void 0, false) : /*#__PURE__*/_jsxDEV(GlobeLock, {
                      size: 12
                    }, void 0, false), trip.isPublished ? t("published") : t("publish")]
                  }, void 0, true)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("div", {
                    className: "flex gap-1.5 flex-wrap",
                    children: [/*#__PURE__*/_jsxDEV(Button, {
                      size: "sm",
                      className: "gap-1.5 h-7 text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20",
                      variant: "ghost",
                      onClick: () => handleExport(trip._id, "pdf", trip.route),
                      disabled: downloading === `${trip._id}-pdf`,
                      title: "Download PDF trip sheet",
                      children: [/*#__PURE__*/_jsxDEV(FileDown, {
                        size: 12
                      }, void 0, false), downloading === `${trip._id}-pdf` ? "..." : "PDF"]
                    }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
                      size: "sm",
                      variant: "outline",
                      className: "gap-1.5 border-white/10 h-7 text-xs",
                      onClick: () => handleExport(trip._id, "csv", trip.route),
                      disabled: downloading === `${trip._id}-csv`,
                      children: [/*#__PURE__*/_jsxDEV(FileText, {
                        size: 12
                      }, void 0, false), downloading === `${trip._id}-csv` ? "..." : "CSV"]
                    }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
                      size: "sm",
                      variant: "outline",
                      className: "gap-1.5 border-white/10 h-7 text-xs text-emerald-400 hover:text-emerald-400",
                      onClick: () => handleExport(trip._id, "excel", trip.route),
                      disabled: downloading === `${trip._id}-excel`,
                      children: [/*#__PURE__*/_jsxDEV(FileSpreadsheet, {
                        size: 12
                      }, void 0, false), downloading === `${trip._id}-excel` ? "..." : "Excel"]
                    }, void 0, true)]
                  }, void 0, true)
                }, void 0, false)]
              }, trip._id, true))
            }, void 0, false)]
          }, void 0, true)
        }, void 0, false)
      }, void 0, false)]
    }, void 0, true), publishedToast && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed bottom-6 right-6 z-50 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-5 py-3 rounded-xl shadow-2xl backdrop-blur flex items-center gap-2 animate-in slide-in-from-bottom-4",
      children: [/*#__PURE__*/_jsxDEV(Globe, {
        size: 15
      }, void 0, false), publishedToast]
    }, void 0, true)]
  }, void 0, true);
}