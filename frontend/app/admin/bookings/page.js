"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Clock, Search, ImageIcon, X, ExternalLink, AlertCircle } from "lucide-react";
const SERVER_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:5000";
const STATUS_STYLES = {
  Pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Confirmed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Cancelled: "text-red-400 bg-red-400/10 border-red-400/20"
};
const STATUS_ICONS = {
  Pending: /*#__PURE__*/_jsxDEV(Clock, {
    size: 12
  }, void 0, false),
  Confirmed: /*#__PURE__*/_jsxDEV(CheckCircle2, {
    size: 12
  }, void 0, false),
  Cancelled: /*#__PURE__*/_jsxDEV(XCircle, {
    size: 12
  }, void 0, false)
};
import { useLang } from "@/app/providers";
import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";
export default function BookingsPage() {
  const {
    t
  } = useLang();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [previewImg, setPreviewImg] = useState(null);
  const [actionError, setActionError] = useState(null);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["bookings", statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: "100"
      });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await api.get(`/bookings?${params}`);
      return res.data.data;
    }
  });
  const confirmMutation = useMutation({
    mutationFn: id => api.patch(`/bookings/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookings"]
      });
      setActionError(null);
    },
    onError: err => setActionError(err.response?.data?.message || t("confirmFailed"))
  });
  const rejectMutation = useMutation({
    mutationFn: id => api.patch(`/bookings/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bookings"]
      });
      setActionError(null);
    },
    onError: err => setActionError(err.response?.data?.message || t("rejectFailed"))
  });
  const bookings = data || [];
  const pending = bookings.filter(b => b.status === "Pending").length;
  return /*#__PURE__*/_jsxDEV("div", {
    className: "space-y-6",
    children: [/*#__PURE__*/_jsxDEV("div", {
      className: "flex items-center justify-between",
      children: /*#__PURE__*/_jsxDEV("div", {
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center gap-2 mb-1",
          children: pending > 0 && /*#__PURE__*/_jsxDEV("span", {
            className: "px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-bold",
            children: [pending, " ", t("pendingBookings")]
          }, void 0, true)
        }, void 0, false), /*#__PURE__*/_jsxDEV("h2", {
          className: "text-3xl font-bold tracking-tight",
          children: t("bookingApprovals")
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground mt-1",
          children: t("bookingApprovalsDesc")
        }, void 0, false)]
      }, void 0, true)
    }, void 0, false), actionError && /*#__PURE__*/_jsxDEV("div", {
      className: "flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm",
      children: [/*#__PURE__*/_jsxDEV(AlertCircle, {
        size: 16
      }, void 0, false), " ", actionError]
    }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
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
          className: "pl-9 bg-white/5 border-white/10 w-full sm:w-60"
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
        className: "flex rounded-lg overflow-hidden border border-white/10",
        children: ["Pending", "Confirmed", "Cancelled", ""].map(s => /*#__PURE__*/_jsxDEV("button", {
          onClick: () => setStatusFilter(s),
          className: `px-4 py-2 text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`,
          children: s ? s === "Pending" ? t("pendingStatus") : s === "Confirmed" ? t("confirmedStatus") : s === "Cancelled" ? t("cancelledStatus") : s : t("allStatuses")
        }, s, false))
      }, void 0, false)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      className: "border-white/5 bg-card/30 backdrop-blur-xl",
      children: /*#__PURE__*/_jsxDEV(CardContent, {
        className: "p-0",
        children: isLoading ? /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-center py-16",
          children: /*#__PURE__*/_jsxDEV("div", {
            className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
          }, void 0, false)
        }, void 0, false) : bookings.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
          className: "text-center py-16 space-y-2",
          children: [/*#__PURE__*/_jsxDEV(CheckCircle2, {
            size: 40,
            className: "mx-auto text-emerald-400/40"
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-muted-foreground",
            children: statusFilter === "Pending" ? t("noPendingBookings") : t("noBookings")
          }, void 0, false)]
        }, void 0, true) : /*#__PURE__*/_jsxDEV("div", {
          className: "overflow-x-auto",
          children: /*#__PURE__*/_jsxDEV("table", {
            className: "w-full text-sm whitespace-nowrap",
            children: [/*#__PURE__*/_jsxDEV("thead", {
              children: /*#__PURE__*/_jsxDEV("tr", {
                className: "border-b border-white/5 text-muted-foreground text-xs",
                children: [/*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("reference")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("student")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("trip")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("pickup")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("dropoff")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("seatHeader")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("amount")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("screenshot")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("status")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("actions")
                }, void 0, false)]
              }, void 0, true)
            }, void 0, false), /*#__PURE__*/_jsxDEV("tbody", {
              children: bookings.map(b => /*#__PURE__*/_jsxDEV("tr", {
                className: "border-b border-white/5 hover:bg-white/5 transition-colors",
                children: [/*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 font-mono text-primary text-xs",
                  children: b.referenceId
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: [/*#__PURE__*/_jsxDEV("p", {
                    className: "font-medium",
                    children: b.studentName
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-muted-foreground text-xs",
                    children: b.studentPhone
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-xs text-muted-foreground",
                  children: b.tripId ? /*#__PURE__*/_jsxDEV(_Fragment, {
                    children: [/*#__PURE__*/_jsxDEV("p", {
                      className: "text-foreground font-medium",
                      children: b.tripId.route
                    }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                      children: [new Date(b.tripId.date).toLocaleDateString("en-GB"), " · ", b.tripId.departureTime]
                    }, void 0, true)]
                  }, void 0, true) : "—"
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-sm",
                  children: [/*#__PURE__*/_jsxDEV("p", {
                    children: b.pickupLocation
                  }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                    className: "text-xs text-muted-foreground",
                    children: b.pickupAddress
                  }, void 0, false)]
                }, void 0, true), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-xs text-muted-foreground",
                  children: b.dropoffLocation
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("div", {
                    className: "flex flex-col gap-0.5",
                    children: [/*#__PURE__*/_jsxDEV("span", {
                      className: "font-mono text-xs text-primary font-bold",
                      children: b.seatNumbers?.join(", ") ?? b.seatNumber
                    }, void 0, false), b.seatCount > 1 && /*#__PURE__*/_jsxDEV("span", {
                      className: "text-xs text-muted-foreground",
                      children: [b.seatCount, " ", t("seats")]
                    }, void 0, true)]
                  }, void 0, true)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("span", {
                    className: "font-semibold text-emerald-400",
                    children: [b.amount, " EGP"]
                  }, void 0, true)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: b.paymentScreenshot ? /*#__PURE__*/_jsxDEV("button", {
                    onClick: () => setPreviewImg(`${SERVER_URL}/uploads/payments/${b.paymentScreenshot}`),
                    className: "flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors border border-primary/20 rounded px-2 py-1 bg-primary/5 hover:bg-primary/10",
                    children: [/*#__PURE__*/_jsxDEV(ImageIcon, {
                      size: 12
                    }, void 0, false), t("view")]
                  }, void 0, true) : /*#__PURE__*/_jsxDEV("span", {
                    className: "text-muted-foreground text-xs",
                    children: "—"
                  }, void 0, false)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("span", {
                    className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[b.status]}`,
                    children: [STATUS_ICONS[b.status], b.status === "Pending" ? t("pendingStatus") : b.status === "Confirmed" ? t("confirmedStatus") : b.status === "Cancelled" ? t("cancelledStatus") : b.status]
                  }, void 0, true)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: b.status === "Pending" && /*#__PURE__*/_jsxDEV("div", {
                    className: "flex gap-1.5",
                    children: [/*#__PURE__*/_jsxDEV(Button, {
                      size: "sm",
                      className: "h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700",
                      onClick: () => confirmMutation.mutate(b._id),
                      disabled: confirmMutation.isPending || rejectMutation.isPending,
                      children: [/*#__PURE__*/_jsxDEV(CheckCircle2, {
                        size: 11
                      }, void 0, false), confirmMutation.isPending ? "..." : t("confirm")]
                    }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
                      size: "sm",
                      variant: "destructive",
                      className: "h-7 text-xs gap-1",
                      onClick: () => rejectMutation.mutate(b._id),
                      disabled: confirmMutation.isPending || rejectMutation.isPending,
                      children: [/*#__PURE__*/_jsxDEV(XCircle, {
                        size: 11
                      }, void 0, false), rejectMutation.isPending ? "..." : t("reject")]
                    }, void 0, true)]
                  }, void 0, true)
                }, void 0, false)]
              }, b._id, true))
            }, void 0, false)]
          }, void 0, true)
        }, void 0, false)
      }, void 0, false)
    }, void 0, false), previewImg && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4",
      onClick: () => setPreviewImg(null),
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "relative max-w-2xl w-full",
        onClick: e => e.stopPropagation(),
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-between mb-3",
          children: [/*#__PURE__*/_jsxDEV("p", {
            className: "text-sm font-medium text-white",
            children: t("paymentScreenshotModal")
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            className: "flex gap-2",
            children: [/*#__PURE__*/_jsxDEV("a", {
              href: previewImg,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors",
              children: /*#__PURE__*/_jsxDEV(ExternalLink, {
                size: 16
              }, void 0, false)
            }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
              onClick: () => setPreviewImg(null),
              className: "p-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors",
              children: /*#__PURE__*/_jsxDEV(X, {
                size: 16
              }, void 0, false)
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("img", {
          src: previewImg,
          alt: "Payment Screenshot",
          className: "w-full rounded-xl border border-white/10 max-h-[75vh] object-contain bg-black"
        }, void 0, false)]
      }, void 0, true)
    }, void 0, false)]
  }, void 0, true);
}