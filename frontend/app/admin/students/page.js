"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, ChevronLeft, ChevronRight, BookPlus, X, CheckCircle2, Edit2, Shield } from "lucide-react";
const ROLE_COLORS = {
  Student: "text-blue-400 bg-blue-400/10",
  Admin: "text-purple-400 bg-purple-400/10",
  Supervisor: "text-amber-400 bg-amber-400/10"
};
const PICKUP_LOCATIONS = ["Kafr Eksheikh", "Desouk", "Damanhour", "Abu Hummus", "Kafr Eldawwar"];
const DROPOFF_LOCATIONS = [{
  value: "AIU Campus",
  ar: "الجامعة"
}, {
  value: "Iskan Motamayez (AIU Dorms)",
  ar: "اسكان متميز (سكن الجامعة)"
}, {
  value: "Sakan Masr (Oppo)",
  ar: "سكن مصر (أمام أوبو)"
}, {
  value: "Porto Golf (Entrance)",
  ar: "بورتو جولف (البوابة)"
}];
import { useLang } from "@/app/providers";
import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";
export default function StudentsPage() {
  const {
    t
  } = useLang();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Manual booking state
  const [showBooking, setShowBooking] = useState(false);
  const [bookForm, setBookForm] = useState({
    studentName: "",
    studentPhone: "",
    tripId: "",
    pickupLocation: "",
    dropoffLocation: ""
  });
  const [bookError, setBookError] = useState("");
  const [bookSuccess, setBookSuccess] = useState(null);

  // Edit User state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    studentNumber: "",
    relativePhone: "",
    isActive: true
  });
  const [editError, setEditError] = useState("");
  const {
    data,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["users", page, debouncedSearch, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10"
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      const res = await api.get(`/users?${params}`);
      return res.data;
    }
  });
  const {
    data: tripsData
  } = useQuery({
    queryKey: ["trips-scheduledactive"],
    queryFn: async () => {
      const res = await api.get("/trips?limit=100");
      return (res.data.data || []).filter(t => t.status === "Scheduled" || t.status === "Active");
    },
    enabled: showBooking
  });
  const bookMutation = useMutation({
    mutationFn: body => api.post("/users/manual-booking", body),
    onSuccess: res => {
      setBookSuccess(res.data.data);
      setBookError("");
    },
    onError: err => setBookError(err.response?.data?.message || "Booking failed")
  });
  const editMutation = useMutation({
    mutationFn: data => api.put(`/users/${data.id}`, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"]
      });
      setEditingUser(null);
      setEditError("");
    },
    onError: err => setEditError(err.response?.data?.message || "Update failed")
  });
  const handleSearch = val => {
    setSearch(val);
    clearTimeout(window.__searchTimer);
    window.__searchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };
  const resetBooking = () => {
    setBookForm({
      studentName: "",
      studentPhone: "",
      tripId: "",
      pickupLocation: "",
      dropoffLocation: ""
    });
    setBookError("");
    setBookSuccess(null);
  };
  const users = data?.data || [];
  const meta = data?.meta;
  const trips = tripsData || [];
  return /*#__PURE__*/_jsxDEV("div", {
    className: "space-y-6",
    children: [/*#__PURE__*/_jsxDEV("div", {
      className: "flex items-center justify-between",
      children: [/*#__PURE__*/_jsxDEV("div", {
        children: [/*#__PURE__*/_jsxDEV("h2", {
          className: "text-3xl font-bold tracking-tight",
          children: t("studentsTitle")
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground mt-1",
          children: t("studentsDesc")
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
        onClick: () => {
          resetBooking();
          setShowBooking(true);
        },
        className: "gap-2",
        children: [/*#__PURE__*/_jsxDEV(BookPlus, {
          size: 16
        }, void 0, false), " ", t("manualBooking")]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
      className: "flex gap-3 flex-wrap",
      children: [/*#__PURE__*/_jsxDEV("div", {
        className: "relative w-full sm:w-auto",
        children: [/*#__PURE__*/_jsxDEV(Search, {
          size: 16,
          className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
          value: search,
          onChange: e => handleSearch(e.target.value),
          placeholder: `${t("search")}...`,
          className: "pl-9 bg-white/5 border-white/10 w-full sm:w-72"
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("select", {
        value: roleFilter,
        onChange: e => {
          setRoleFilter(e.target.value);
          setPage(1);
        },
        className: "rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary",
        children: [/*#__PURE__*/_jsxDEV("option", {
          value: "",
          children: t("allRoles")
        }, void 0, false), ["Student", "Admin", "Supervisor"].map(r => /*#__PURE__*/_jsxDEV("option", {
          value: r,
          children: r
        }, r, false))]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      className: "border-white/5 bg-card/30 backdrop-blur-xl",
      children: /*#__PURE__*/_jsxDEV(CardContent, {
        className: "p-0",
        children: [isLoading ? /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-center py-16",
          children: /*#__PURE__*/_jsxDEV("div", {
            className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
          }, void 0, false)
        }, void 0, false) : isError ? /*#__PURE__*/_jsxDEV("div", {
          className: "text-center py-16 text-destructive",
          children: t("error")
        }, void 0, false) : users.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
          className: "text-center py-16 space-y-3",
          children: [/*#__PURE__*/_jsxDEV(Users, {
            size: 40,
            className: "mx-auto text-muted-foreground/40"
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-muted-foreground",
            children: t("noUsers")
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
                  children: t("name")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("email")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("phone")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("role")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("joined")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-right py-3 px-4 font-medium",
                  children: t("actions")
                }, void 0, false)]
              }, void 0, true)
            }, void 0, false), /*#__PURE__*/_jsxDEV("tbody", {
              children: users.map(u => /*#__PURE__*/_jsxDEV("tr", {
                className: "border-b border-white/5 hover:bg-white/5 transition-colors",
                children: [/*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 font-medium",
                  children: u.name
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-muted-foreground",
                  children: u.email || "—"
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 font-mono text-sm",
                  children: u.phone
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("span", {
                    className: `px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || ""}`,
                    children: u.role
                  }, void 0, false)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-muted-foreground",
                  children: new Date(u.createdAt).toLocaleDateString()
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-right",
                  children: /*#__PURE__*/_jsxDEV(Button, {
                    variant: "ghost",
                    size: "sm",
                    onClick: () => {
                      setEditingUser(u);
                      setEditForm({
                        name: u.name || "",
                        email: u.email || "",
                        phone: u.phone || "",
                        studentNumber: u.studentNumber || "",
                        relativePhone: u.relativePhone || "",
                        isActive: u.isActive !== false
                      });
                    },
                    className: "text-muted-foreground hover:text-foreground",
                    children: [/*#__PURE__*/_jsxDEV(Edit2, {
                      size: 14,
                      className: "mr-1"
                    }, void 0, false), " ", t("edit")]
                  }, void 0, true)
                }, void 0, false)]
              }, u._id, true))
            }, void 0, false)]
          }, void 0, true)
        }, void 0, false), meta && meta.pages > 1 && /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-between px-4 py-3 border-t border-white/5",
          children: [/*#__PURE__*/_jsxDEV("p", {
            className: "text-sm text-muted-foreground",
            children: ["Page ", meta.page, " of ", meta.pages, " (", meta.total, " total)"]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "flex gap-2",
            children: [/*#__PURE__*/_jsxDEV(Button, {
              variant: "outline",
              size: "sm",
              onClick: () => setPage(p => Math.max(1, p - 1)),
              disabled: page === 1,
              className: "border-white/10 h-8 px-2",
              children: /*#__PURE__*/_jsxDEV(ChevronLeft, {
                size: 14
              }, void 0, false)
            }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
              variant: "outline",
              size: "sm",
              onClick: () => setPage(p => Math.min(meta.pages, p + 1)),
              disabled: page === meta.pages,
              className: "border-white/10 h-8 px-2",
              children: /*#__PURE__*/_jsxDEV(ChevronRight, {
                size: 14
              }, void 0, false)
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), showBooking && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",
      onClick: () => {
        setShowBooking(false);
        resetBooking();
      },
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-card border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto",
        onClick: e => e.stopPropagation(),
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-between mb-5",
          children: [/*#__PURE__*/_jsxDEV("h3", {
            className: "text-lg font-bold flex items-center gap-2",
            children: [/*#__PURE__*/_jsxDEV(BookPlus, {
              size: 18,
              className: "text-primary"
            }, void 0, false), " Manual Booking"]
          }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => {
              setShowBooking(false);
              resetBooking();
            },
            className: "text-muted-foreground hover:text-foreground",
            children: /*#__PURE__*/_jsxDEV(X, {
              size: 18
            }, void 0, false)
          }, void 0, false)]
        }, void 0, true), bookSuccess ?
        /*#__PURE__*/
        /* Success State */
        _jsxDEV("div", {
          className: "text-center py-6 space-y-4",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto",
            children: /*#__PURE__*/_jsxDEV(CheckCircle2, {
              size: 28,
              className: "text-emerald-400"
            }, void 0, false)
          }, void 0, false), /*#__PURE__*/_jsxDEV("h4", {
            className: "text-lg font-bold",
            children: "Booking Confirmed!"
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            className: "bg-white/5 border border-white/10 rounded-lg p-4 text-left space-y-2 text-sm",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "flex justify-between",
              children: [/*#__PURE__*/_jsxDEV("span", {
                className: "text-muted-foreground",
                children: "Reference"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                className: "font-mono text-primary",
                children: bookSuccess.referenceId
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "flex justify-between",
              children: [/*#__PURE__*/_jsxDEV("span", {
                className: "text-muted-foreground",
                children: "Seat"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                className: "font-bold",
                children: bookSuccess.seatNumber
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "flex justify-between",
              children: [/*#__PURE__*/_jsxDEV("span", {
                className: "text-muted-foreground",
                children: "Pickup"
              }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                children: bookSuccess.pickupLocation
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "flex gap-3",
            children: [/*#__PURE__*/_jsxDEV(Button, {
              variant: "outline",
              className: "flex-1 border-white/10",
              onClick: resetBooking,
              children: "Book Another"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
              className: "flex-1",
              onClick: () => {
                setShowBooking(false);
                resetBooking();
              },
              children: "Done"
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true) :
        /*#__PURE__*/
        /* Booking Form */
        _jsxDEV("div", {
          className: "space-y-4",
          children: [bookError && /*#__PURE__*/_jsxDEV("p", {
            className: "text-destructive text-sm p-2 rounded bg-destructive/10",
            children: bookError
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: "Student Name"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              value: bookForm.studentName,
              onChange: e => setBookForm(f => ({
                ...f,
                studentName: e.target.value
              })),
              placeholder: "Full name",
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: "Student Phone"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              type: "tel",
              value: bookForm.studentPhone,
              onChange: e => setBookForm(f => ({
                ...f,
                studentPhone: e.target.value
              })),
              placeholder: "+1234567890",
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: "Trip"
            }, void 0, false), /*#__PURE__*/_jsxDEV("select", {
              value: bookForm.tripId,
              onChange: e => setBookForm(f => ({
                ...f,
                tripId: e.target.value
              })),
              className: "w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary",
              children: [/*#__PURE__*/_jsxDEV("option", {
                value: "",
                children: "— Select a trip —"
              }, void 0, false), trips.map(t => /*#__PURE__*/_jsxDEV("option", {
                value: t._id,
                children: [t.route, " · ", new Date(t.date).toLocaleDateString(), " @ ", t.departureTime]
              }, t._id, true))]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-2 block",
              children: "Pickup Location"
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              className: "grid grid-cols-1 gap-2",
              children: PICKUP_LOCATIONS.map(loc => {
                const selected = bookForm.pickupLocation === loc;
                return /*#__PURE__*/_jsxDEV("button", {
                  type: "button",
                  onClick: () => setBookForm(f => ({
                    ...f,
                    pickupLocation: loc
                  })),
                  className: `w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${selected ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"}`,
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    children: loc
                  }, void 0, false), selected && /*#__PURE__*/_jsxDEV("span", {
                    className: "w-2 h-2 rounded-full bg-primary"
                  }, void 0, false)]
                }, loc, true);
              })
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-2 block",
              children: "Drop-off Location"
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              className: "grid grid-cols-1 gap-2",
              children: DROPOFF_LOCATIONS.map(loc => {
                const selected = bookForm.dropoffLocation === loc.value;
                return /*#__PURE__*/_jsxDEV("button", {
                  type: "button",
                  onClick: () => setBookForm(f => ({
                    ...f,
                    dropoffLocation: loc.value
                  })),
                  className: `w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${selected ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"}`,
                  children: [/*#__PURE__*/_jsxDEV("span", {
                    children: loc.value
                  }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                    className: "text-xs opacity-50",
                    children: loc.ar
                  }, void 0, false)]
                }, loc.value, true);
              })
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "flex gap-3 pt-2",
            children: [/*#__PURE__*/_jsxDEV(Button, {
              variant: "outline",
              className: "flex-1 border-white/10",
              onClick: () => {
                setShowBooking(false);
                resetBooking();
              },
              children: "Cancel"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
              className: "flex-1",
              onClick: () => bookMutation.mutate(bookForm),
              disabled: bookMutation.isPending || !bookForm.studentName || !bookForm.studentPhone || !bookForm.tripId || !bookForm.pickupLocation || !bookForm.dropoffLocation,
              children: bookMutation.isPending ? "Booking..." : "Confirm Booking"
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), editingUser && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",
      onClick: () => setEditingUser(null),
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-card border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto",
        onClick: e => e.stopPropagation(),
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-between mb-5",
          children: [/*#__PURE__*/_jsxDEV("h3", {
            className: "text-lg font-bold flex items-center gap-2",
            children: [/*#__PURE__*/_jsxDEV(Edit2, {
              size: 18,
              className: "text-primary"
            }, void 0, false), " Edit ", editingUser.role, " Profile"]
          }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => setEditingUser(null),
            className: "text-muted-foreground hover:text-foreground",
            children: /*#__PURE__*/_jsxDEV(X, {
              size: 18
            }, void 0, false)
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "space-y-4",
          children: [editError && /*#__PURE__*/_jsxDEV("p", {
            className: "text-destructive text-sm p-2 rounded bg-destructive/10",
            children: editError
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: "Full Name"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              value: editForm.name,
              onChange: e => setEditForm(f => ({
                ...f,
                name: e.target.value
              })),
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: "Email"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              type: "email",
              value: editForm.email,
              onChange: e => setEditForm(f => ({
                ...f,
                email: e.target.value
              })),
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: "Phone Number"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              type: "tel",
              value: editForm.phone,
              onChange: e => setEditForm(f => ({
                ...f,
                phone: e.target.value
              })),
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), editingUser.role === 'Student' && /*#__PURE__*/_jsxDEV(_Fragment, {
            children: [/*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-sm font-medium mb-1 block",
                children: "ID Number / Reference"
              }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
                value: editForm.studentNumber,
                onChange: e => setEditForm(f => ({
                  ...f,
                  studentNumber: e.target.value
                })),
                className: "bg-white/5 border-white/10"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-sm font-medium mb-1 block",
                children: "Relative / Parent Phone"
              }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
                type: "tel",
                value: editForm.relativePhone,
                onChange: e => setEditForm(f => ({
                  ...f,
                  relativePhone: e.target.value
                })),
                className: "bg-white/5 border-white/10"
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "flex items-center gap-2 mt-4 p-3 border border-white/10 rounded-lg bg-white/5",
            children: [/*#__PURE__*/_jsxDEV("input", {
              type: "checkbox",
              id: "isActive",
              checked: editForm.isActive,
              onChange: e => setEditForm(f => ({
                ...f,
                isActive: e.target.checked
              })),
              className: "w-4 h-4 rounded bg-white/10 border-white/20 text-primary focus:ring-primary"
            }, void 0, false), /*#__PURE__*/_jsxDEV("label", {
              htmlFor: "isActive",
              className: "text-sm font-medium select-none cursor-pointer",
              children: "Account is Active"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "flex gap-3 pt-4",
            children: [/*#__PURE__*/_jsxDEV(Button, {
              variant: "outline",
              className: "flex-1 border-white/10",
              onClick: () => setEditingUser(null),
              children: "Cancel"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
              className: "flex-1",
              onClick: () => editMutation.mutate({
                id: editingUser._id,
                body: editForm
              }),
              disabled: editMutation.isPending || !editForm.name || !editForm.phone,
              children: editMutation.isPending ? "Saving..." : "Save Changes"
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false)]
  }, void 0, true);
}