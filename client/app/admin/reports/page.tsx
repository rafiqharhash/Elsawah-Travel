"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, FileText, Download, AlertCircle, Search, FileDown, Bus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "text-blue-400 bg-blue-400/10",
  Active: "text-emerald-400 bg-emerald-400/10",
  Completed: "text-zinc-400 bg-zinc-400/10",
  Cancelled: "text-red-400 bg-red-400/10",
};

interface Trip {
  _id: string;
  route: string;
  date: string;
  departureTime: string;
  status: string;
  totalBooked: number;
  totalCapacity: number;
  occupancyPercentage: number;
  vehicleIds: { _id: string; vehicleNumber: string; driverName: string }[];
}

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch ALL trips — no status restriction
  const { data, isLoading } = useQuery({
    queryKey: ["all-trips-export"],
    queryFn: async () => {
      const res = await api.get("/trips?limit=200");
      return res.data.data as Trip[];
    },
  });

  const trips = (data || []).filter(t => {
    const matchSearch = !search || t.route.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExport = async (tripId: string, format: "csv" | "excel" | "pdf", tripName: string) => {
    const key = `${tripId}-${format}`;
    setDownloading(key);
    setError(null);
    try {
      const url = format === "pdf"
        ? `/export/trip/${tripId}/pdf`
        : `/export/trip/${tripId}?format=${format}`;

      const res = await api.get(url, { responseType: "blob" });

      const ext = format === "excel" ? "xlsx" : format;
      const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        csv: "text/csv",
      };

      const blob = new Blob([res.data], { type: mimeTypes[format] });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${tripName.replace(/\s+/g, "_")}_sheet.${ext}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || "Export failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports & Export</h2>
        <p className="text-muted-foreground mt-1">
          Export a PDF trip sheet for any trip — available at any time, regardless of status.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* PDF Info Card */}
      <Card className="border-primary/20 bg-primary/5 backdrop-blur-xl">
        <CardContent className="py-4 px-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              <FileDown size={22} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-0.5">PDF Trip Sheet</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each PDF contains one page per vehicle. Each page shows the vehicle plate number, driver name &amp; phone,
                and all 14 seat rows — including each passenger's name, phone, and custom pickup &amp; dropoff location.
                Empty seats are shown as "Available".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search route..."
            className="pl-9 bg-white/5 border-white/10 w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          {["Scheduled", "Active", "Completed", "Cancelled"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Trips Table */}
      <Card className="border-white/5 bg-card/30 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base">All Trips</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText size={40} className="mx-auto mb-3 opacity-40" />
              <p>No trips found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">Route</th>
                    <th className="text-left py-3 px-4 font-medium">Date &amp; Time</th>
                    <th className="text-left py-3 px-4 font-medium">Vehicles</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Passengers</th>
                    <th className="text-left py-3 px-4 font-medium">Export</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium">{t.route}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        <br />
                        <span className="font-mono text-primary">{t.departureTime}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Bus size={12} />
                          {t.vehicleIds?.length || 0}
                          {(t.vehicleIds || []).length > 0 && (
                            <span className="hidden md:inline text-xs ml-1 text-zinc-500">
                              ({(t.vehicleIds || []).map(v => v.vehicleNumber).join(", ")})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || ""}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-primary">{t.totalBooked}</span>
                        <span className="text-muted-foreground text-xs"> / {t.totalCapacity}</span>
                        <div className="w-20 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${t.occupancyPercentage || 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {/* PDF — primary action */}
                          <Button
                            size="sm"
                            className="gap-1.5 h-7 text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                            variant="ghost"
                            onClick={() => handleExport(t._id, "pdf", t.route)}
                            disabled={downloading === `${t._id}-pdf`}
                            title="Download PDF trip sheet"
                          >
                            <FileDown size={12} />
                            {downloading === `${t._id}-pdf` ? "..." : "PDF"}
                          </Button>

                          {/* CSV */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-white/10 h-7 text-xs"
                            onClick={() => handleExport(t._id, "csv", t.route)}
                            disabled={downloading === `${t._id}-csv`}
                          >
                            <FileText size={12} />
                            {downloading === `${t._id}-csv` ? "..." : "CSV"}
                          </Button>

                          {/* Excel */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-white/10 h-7 text-xs text-emerald-400 hover:text-emerald-400"
                            onClick={() => handleExport(t._id, "excel", t.route)}
                            disabled={downloading === `${t._id}-excel`}
                          >
                            <FileSpreadsheet size={12} />
                            {downloading === `${t._id}-excel` ? "..." : "Excel"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
