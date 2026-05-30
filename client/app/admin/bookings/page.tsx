"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Clock, Search, ImageIcon, X, ExternalLink, AlertCircle } from "lucide-react";

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:5000";

const STATUS_STYLES: Record<string, string> = {
  Pending:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Confirmed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Pending:   <Clock size={12} />,
  Confirmed: <CheckCircle2 size={12} />,
  Cancelled: <XCircle size={12} />,
};

interface Booking {
  _id: string;
  referenceId: string;
  studentName: string;
  studentPhone: string;
  pickupLocation: string;
  pickupAddress: string;
  dropoffLocation: string;
  seatNumber: number;
  amount: number;
  status: "Pending" | "Confirmed" | "Cancelled";
  paymentScreenshot: string;
  tripId: { route: string; date: string; departureTime: string } | null;
  vehicleId: { vehicleNumber: string; driverName: string } | null;
  createdAt: string;
}
import { useLang } from "@/app/providers";

export default function BookingsPage() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await api.get(`/bookings?${params}`);
      return res.data.data as Booking[];
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setActionError(null);
    },
    onError: (err: any) => setActionError(err.response?.data?.message || t("confirmFailed")),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setActionError(null);
    },
    onError: (err: any) => setActionError(err.response?.data?.message || t("rejectFailed")),
  });

  const bookings = data || [];
  const pending = bookings.filter((b) => b.status === "Pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {pending > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-bold">
                {pending} {t("pendingBookings")}
              </span>
            )}
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{t("bookingApprovals")}</h2>
          <p className="text-muted-foreground mt-1">
            {t("bookingApprovalsDesc")}
          </p>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle size={16} /> {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t("search")}...`}
            className="pl-9 bg-white/5 border-white/10 w-60"
          />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {["Pending", "Confirmed", "Cancelled", ""].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {s ? (s === "Pending" ? t("pendingStatus") : s === "Confirmed" ? t("confirmedStatus") : s === "Cancelled" ? t("cancelledStatus") : s) : t("allStatuses")}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <CheckCircle2 size={40} className="mx-auto text-emerald-400/40" />
              <p className="text-muted-foreground">
                {statusFilter === "Pending" ? t("noPendingBookings") : t("noBookings")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground text-xs">
                    <th className="text-left py-3 px-4 font-medium">{t("reference")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("student")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("trip")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("pickup")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("dropoff")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("seatHeader")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("amount")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("screenshot")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("status")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-primary text-xs">{b.referenceId}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{b.studentName}</p>
                        <p className="text-muted-foreground text-xs">{b.studentPhone}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {b.tripId ? (
                          <>
                            <p className="text-foreground font-medium">{b.tripId.route}</p>
                            <p>{new Date(b.tripId.date).toLocaleDateString("en-GB")} · {b.tripId.departureTime}</p>
                          </>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <p>{b.pickupLocation}</p>
                        <p className="text-xs text-muted-foreground">{b.pickupAddress}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{b.dropoffLocation}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs text-primary font-bold">{(b as any).seatNumbers?.join(", ") ?? (b as any).seatNumber}</span>
                          {(b as any).seatCount > 1 && <span className="text-xs text-muted-foreground">{(b as any).seatCount} {t("seats")}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-400">{b.amount} EGP</span>
                      </td>
                      <td className="py-3 px-4">
                        {b.paymentScreenshot ? (
                          <button
                            onClick={() => setPreviewImg(`${SERVER_URL}/uploads/payments/${b.paymentScreenshot}`)}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors border border-primary/20 rounded px-2 py-1 bg-primary/5 hover:bg-primary/10"
                          >
                            <ImageIcon size={12} />
                            {t("view")}
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[b.status]}`}>
                          {STATUS_ICONS[b.status]}
                          {b.status === "Pending" ? t("pendingStatus") : b.status === "Confirmed" ? t("confirmedStatus") : b.status === "Cancelled" ? t("cancelledStatus") : b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {b.status === "Pending" && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => confirmMutation.mutate(b._id)}
                              disabled={confirmMutation.isPending || rejectMutation.isPending}
                            >
                              <CheckCircle2 size={11} />
                              {confirmMutation.isPending ? "..." : t("confirm")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs gap-1"
                              onClick={() => rejectMutation.mutate(b._id)}
                              disabled={confirmMutation.isPending || rejectMutation.isPending}
                            >
                              <XCircle size={11} />
                              {rejectMutation.isPending ? "..." : t("reject")}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screenshot Preview Modal */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewImg(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white">{t("paymentScreenshotModal")}</p>
              <div className="flex gap-2">
                <a
                  href={previewImg}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={() => setPreviewImg(null)}
                  className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImg}
              alt="Payment Screenshot"
              className="w-full rounded-xl border border-white/10 max-h-[75vh] object-contain bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
