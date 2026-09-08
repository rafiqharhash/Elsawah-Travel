"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Route, ChevronLeft, ChevronRight, X, Bus, Ban } from "lucide-react";
const LOCATIONS_LIST = ["Kafr Eksheikh", "Desouk", "Damanhour", "Abu Hummus", "Kafr Eldawwar"];
const STATUS_COLORS = {
  Scheduled: "text-blue-400 bg-blue-400/10",
  Active: "text-emerald-400 bg-emerald-400/10",
  Completed: "text-zinc-400 bg-zinc-400/10",
  Cancelled: "text-red-400 bg-red-400/10"
};
import { useLang } from "@/app/providers";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export default function TripsPage() {
  const {
    t
  } = useLang();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [form, setForm] = useState({
    route: "",
    date: "",
    departureTime: "",
    status: "Scheduled"
  });
  const [locationTimes, setLocationTimes] = useState([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [apiError, setApiError] = useState("");
  const {
    data,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["trips", page, debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10"
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/trips?${params}`);
      return res.data;
    }
  });

  // Fetch all vehicles (any vehicle can be assigned to multiple trips now)
  const {
    data: fleetData
  } = useQuery({
    queryKey: ["fleet-available", editingTrip?._id],
    queryFn: async () => {
      const availRes = await api.get("/vehicles?limit=100");
      return availRes.data.data || [];
    },
    enabled: showModal
  });
  const createMutation = useMutation({
    mutationFn: body => api.post("/trips", body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips"]
      });
      queryClient.invalidateQueries({
        queryKey: ["vehicles"]
      });
      setShowModal(false);
      resetForm();
    },
    onError: err => setApiError(err.response?.data?.message || "Failed to create trip")
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body
    }) => api.put(`/trips/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips"]
      });
      queryClient.invalidateQueries({
        queryKey: ["vehicles"]
      });
      setShowModal(false);
      resetForm();
    },
    onError: err => setApiError(err.response?.data?.message || "Failed to update trip")
  });
  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/trips/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips"]
      });
      queryClient.invalidateQueries({
        queryKey: ["vehicles"]
      });
      setDeleteId(null);
    },
    onError: err => alert(err.response?.data?.message || "Cannot delete trip")
  });
  const cancelMutation = useMutation({
    mutationFn: id => api.patch(`/trips/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips"]
      });
      queryClient.invalidateQueries({
        queryKey: ["vehicles"]
      });
      queryClient.invalidateQueries({
        queryKey: ["bookings"]
      });
      setCancelId(null);
    },
    onError: err => alert(err.response?.data?.message || "Cancel failed")
  });
  const resetForm = () => {
    setForm({
      route: "",
      date: "",
      departureTime: "",
      status: "Scheduled"
    });
    setLocationTimes([]);
    setSelectedVehicleIds([]);
    setEditingTrip(null);
    setApiError("");
  };
  const openEdit = t => {
    setEditingTrip(t);
    setForm({
      route: t.route,
      date: t.date.split("T")[0],
      departureTime: t.departureTime,
      status: t.status
    });
    setLocationTimes(t.locationTimes || []);
    setSelectedVehicleIds(t.vehicleIds?.map(v => v._id) || []);
    setApiError("");
    setShowModal(true);
  };
  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };
  const toggleVehicle = id => {
    setSelectedVehicleIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };
  const handleSubmit = () => {
    const payload = {
      ...form,
      vehicleIds: selectedVehicleIds,
      locationTimes
    };
    if (editingTrip) updateMutation.mutate({
      id: editingTrip._id,
      body: payload
    });else createMutation.mutate(payload);
  };
  const handleSearch = val => {
    setSearch(val);
    clearTimeout(window.__searchTimer);
    window.__searchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };
  const fleet = fleetData || [];
  const trips = data?.data || [];
  const meta = data?.meta;
  const previewCapacity = selectedVehicleIds.length * 14;
  return /*#__PURE__*/_jsxDEV("div", {
    className: "space-y-6",
    children: [/*#__PURE__*/_jsxDEV("div", {
      className: "flex items-center justify-between",
      children: [/*#__PURE__*/_jsxDEV("div", {
        children: [/*#__PURE__*/_jsxDEV("h2", {
          className: "text-3xl font-bold tracking-tight",
          children: t("tripsTitle")
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground mt-1",
          children: t("tripsDesc")
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
        onClick: openCreate,
        className: "gap-2",
        children: [/*#__PURE__*/_jsxDEV(Plus, {
          size: 16
        }, void 0, false), " ", t("createTrip")]
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
          className: "pl-9 bg-white/5 border-white/10 w-full sm:w-64"
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV("select", {
        value: statusFilter,
        onChange: e => {
          setStatusFilter(e.target.value);
          setPage(1);
        },
        className: "sys-select w-auto",
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
        }, void 0, false) : trips.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
          className: "text-center py-16 space-y-3",
          children: [/*#__PURE__*/_jsxDEV(Route, {
            size: 40,
            className: "mx-auto text-muted-foreground/40"
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-muted-foreground font-medium",
            children: t("noTrips")
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-sm text-muted-foreground",
            children: t("noTripsHint")
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
                  children: t("date")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("time")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("vehicles")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("status")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("occupancy")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: "Income"
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("actions")
                }, void 0, false)]
              }, void 0, true)
            }, void 0, false), /*#__PURE__*/_jsxDEV("tbody", {
              children: trips.map(t => /*#__PURE__*/_jsxDEV("tr", {
                className: "border-b border-white/5 hover:bg-white/5 transition-colors",
                children: [/*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 font-medium",
                  children: t.route
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-muted-foreground",
                  children: new Date(t.date).toLocaleDateString()
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 font-mono text-primary",
                  children: t.departureTime
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("span", {
                    className: "flex items-center gap-1",
                    children: [/*#__PURE__*/_jsxDEV(Bus, {
                      size: 12,
                      className: "text-muted-foreground"
                    }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                      children: [t.vehicleIds?.length || 0, " bus", (t.vehicleIds?.length || 0) !== 1 ? "es" : ""]
                    }, void 0, true)]
                  }, void 0, true)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("span", {
                    className: `px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || ""}`,
                    children: t.status
                  }, void 0, false)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("div", {
                    className: "flex items-center gap-2",
                    children: [/*#__PURE__*/_jsxDEV("div", {
                      className: "w-20 h-2 bg-white/10 rounded-full overflow-hidden",
                      children: /*#__PURE__*/_jsxDEV("div", {
                        className: `h-full rounded-full ${t.occupancyPercentage > 90 ? "bg-red-500" : "bg-primary"}`,
                        style: {
                          width: `${t.occupancyPercentage}%`
                        }
                      }, void 0, false)
                    }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                      className: "text-xs text-muted-foreground",
                      children: [t.totalBooked, "/", t.totalCapacity]
                    }, void 0, true)]
                  }, void 0, true)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 font-mono font-medium text-emerald-400",
                  children: t.totalIncome ? `${t.totalIncome} EGP` : "—"
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("div", {
                    className: "flex gap-1.5 items-center",
                    children: [/*#__PURE__*/_jsxDEV("button", {
                      onClick: () => openEdit(t),
                      className: "p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors",
                      title: "Edit",
                      children: /*#__PURE__*/_jsxDEV(Edit, {
                        size: 14
                      }, void 0, false)
                    }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
                      onClick: () => setDeleteId(t._id),
                      className: "p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors",
                      title: "Delete",
                      children: /*#__PURE__*/_jsxDEV(Trash2, {
                        size: 14
                      }, void 0, false)
                    }, void 0, false), t.status !== "Cancelled" && /*#__PURE__*/_jsxDEV("button", {
                      onClick: () => setCancelId({
                        id: t._id,
                        route: t.route,
                        totalBooked: t.totalBooked
                      }),
                      className: "p-1.5 rounded hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 transition-colors",
                      title: "Force Cancel Trip",
                      children: /*#__PURE__*/_jsxDEV(Ban, {
                        size: 14
                      }, void 0, false)
                    }, void 0, false)]
                  }, void 0, true)
                }, void 0, false)]
              }, t._id, true))
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
    }, void 0, false), showModal && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",
      onClick: () => {
        setShowModal(false);
        resetForm();
      },
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-card border border-white/10 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto",
        onClick: e => e.stopPropagation(),
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-between mb-5",
          children: [/*#__PURE__*/_jsxDEV("h3", {
            className: "text-lg font-bold",
            children: editingTrip ? t("editTrip") : t("createTrip")
          }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
            onClick: () => {
              setShowModal(false);
              resetForm();
            },
            className: "text-muted-foreground hover:text-foreground",
            children: /*#__PURE__*/_jsxDEV(X, {
              size: 18
            }, void 0, false)
          }, void 0, false)]
        }, void 0, true), apiError && /*#__PURE__*/_jsxDEV("p", {
          className: "text-destructive text-sm mb-4 p-2 rounded bg-destructive/10",
          children: apiError
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          className: "space-y-4",
          children: [/*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: t("route")
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              value: form.route,
              onChange: e => setForm(f => ({
                ...f,
                route: e.target.value
              })),
              placeholder: t("routePlaceholder"),
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "grid grid-cols-2 gap-3",
            children: [/*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-sm font-medium mb-1 block",
                children: t("date")
              }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
                type: "date",
                value: form.date,
                onChange: e => setForm(f => ({
                  ...f,
                  date: e.target.value
                })),
                className: "bg-white/5 border-white/10"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-sm font-medium mb-1 block",
                children: t("departureTime")
              }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
                type: "time",
                value: form.departureTime,
                onChange: e => setForm(f => ({
                  ...f,
                  departureTime: e.target.value
                })),
                className: "bg-white/5 border-white/10"
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: t("status")
            }, void 0, false), /*#__PURE__*/_jsxDEV("select", {
              value: form.status,
              onChange: e => setForm(f => ({
                ...f,
                status: e.target.value
              })),
              className: "sys-select",
              children: ["Scheduled", "Active", "Completed", "Cancelled"].map(s => /*#__PURE__*/_jsxDEV("option", {
                value: s,
                children: s === "Scheduled" ? t("scheduledStatus") : s === "Active" ? t("activeStatus") : s === "Completed" ? t("completedStatus") : t("cancelledStatus")
              }, s, false))
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "space-y-3",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "flex items-center justify-between",
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-sm font-medium",
                children: "Location Timings (Optional)"
              }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
                variant: "outline",
                size: "sm",
                className: "h-7 text-xs border-white/10",
                onClick: () => setLocationTimes([...locationTimes, {
                  location: LOCATIONS_LIST[0],
                  time: form.departureTime || "08:00"
                }]),
                children: [/*#__PURE__*/_jsxDEV(Plus, {
                  size: 12,
                  className: "mr-1"
                }, void 0, false), " Add Location"]
              }, void 0, true)]
            }, void 0, true), locationTimes.length === 0 ? /*#__PURE__*/_jsxDEV("p", {
              className: "text-xs text-muted-foreground italic",
              children: "No custom location times added."
            }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
              className: "space-y-2",
              children: locationTimes.map((lt, index) => /*#__PURE__*/_jsxDEV("div", {
                className: "flex gap-2 items-center",
                children: [/*#__PURE__*/_jsxDEV("select", {
                  value: lt.location,
                  onChange: e => {
                    const newLT = [...locationTimes];
                    newLT[index].location = e.target.value;
                    setLocationTimes(newLT);
                  },
                  className: "sys-select flex-1 text-xs",
                  children: LOCATIONS_LIST.map(loc => /*#__PURE__*/_jsxDEV("option", {
                    value: loc,
                    children: loc
                  }, loc, false))
                }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
                  type: "time",
                  value: lt.time,
                  onChange: e => {
                    const newLT = [...locationTimes];
                    newLT[index].time = e.target.value;
                    setLocationTimes(newLT);
                  },
                  className: "w-28 h-8 text-xs bg-white/5 border-white/10"
                }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
                  onClick: () => setLocationTimes(locationTimes.filter((_, i) => i !== index)),
                  className: "p-1 text-muted-foreground hover:text-destructive",
                  children: /*#__PURE__*/_jsxDEV(X, {
                    size: 14
                  }, void 0, false)
                }, void 0, false)]
              }, index, true))
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "flex items-center justify-between mb-2",
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-sm font-medium",
                children: t("assignVehicles")
              }, void 0, false), selectedVehicleIds.length > 0 && /*#__PURE__*/_jsxDEV("span", {
                className: "text-xs text-primary font-medium",
                children: [selectedVehicleIds.length, " ", t("selectedCount"), " · ", previewCapacity, " ", t("seatsTotal")]
              }, void 0, true)]
            }, void 0, true), fleet.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
              className: "border border-white/10 rounded-lg p-4 text-center text-muted-foreground text-sm",
              children: t("noVehiclesInFleet")
            }, void 0, false) : /*#__PURE__*/_jsxDEV("div", {
              className: "border border-white/10 rounded-lg divide-y divide-white/5 max-h-48 overflow-y-auto",
              children: fleet.map(v => {
                const isSelected = selectedVehicleIds.includes(v._id);
                return /*#__PURE__*/_jsxDEV("button", {
                  onClick: () => toggleVehicle(v._id),
                  className: `w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-white/5"}`,
                  children: [/*#__PURE__*/_jsxDEV("div", {
                    className: "flex items-center gap-3",
                    children: [/*#__PURE__*/_jsxDEV("div", {
                      className: `w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "border-primary bg-primary" : "border-white/20"}`,
                      children: isSelected && /*#__PURE__*/_jsxDEV("div", {
                        className: "w-2 h-2 bg-white rounded-sm"
                      }, void 0, false)
                    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                      children: [/*#__PURE__*/_jsxDEV("p", {
                        className: "font-mono font-semibold text-sm text-primary",
                        children: v.vehicleNumber
                      }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                        className: "text-xs text-muted-foreground",
                        children: v.driverName
                      }, void 0, false)]
                    }, void 0, true)]
                  }, void 0, true), /*#__PURE__*/_jsxDEV("span", {
                    className: "text-xs text-muted-foreground",
                    children: [v.capacity, " seats"]
                  }, void 0, true)]
                }, v._id, true);
              })
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "flex gap-3 pt-2",
            children: [/*#__PURE__*/_jsxDEV(Button, {
              variant: "outline",
              className: "flex-1 border-white/10",
              onClick: () => {
                setShowModal(false);
                resetForm();
              },
              children: t("cancel")
            }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
              className: "flex-1",
              onClick: handleSubmit,
              disabled: createMutation.isPending || updateMutation.isPending,
              children: createMutation.isPending || updateMutation.isPending ? t("saving") : editingTrip ? t("updateTrip") : t("createTrip")
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), deleteId && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-card border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl",
        children: [/*#__PURE__*/_jsxDEV("h3", {
          className: "text-lg font-bold mb-2",
          children: t("deleteTrip")
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground text-sm mb-5",
          children: t("deleteTripConfirm")
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          className: "flex gap-3",
          children: [/*#__PURE__*/_jsxDEV(Button, {
            variant: "outline",
            className: "flex-1 border-white/10",
            onClick: () => setDeleteId(null),
            children: t("cancel")
          }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
            variant: "destructive",
            className: "flex-1",
            onClick: () => deleteMutation.mutate(deleteId),
            disabled: deleteMutation.isPending,
            children: t("delete")
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false), cancelId && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm",
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-card border border-orange-500/20 rounded-xl p-6 w-full max-w-sm shadow-2xl",
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center gap-3 mb-3",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "p-2 rounded-full bg-orange-500/10 border border-orange-500/20",
            children: /*#__PURE__*/_jsxDEV(Ban, {
              size: 20,
              className: "text-orange-400"
            }, void 0, false)
          }, void 0, false), /*#__PURE__*/_jsxDEV("h3", {
            className: "text-lg font-bold",
            children: "Force Cancel Trip?"
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground text-sm mb-2",
          children: ["You are about to cancel ", /*#__PURE__*/_jsxDEV("strong", {
            className: "text-foreground",
            children: cancelId.route
          }, void 0, false), "."]
        }, void 0, true), cancelId.totalBooked > 0 && /*#__PURE__*/_jsxDEV("div", {
          className: "rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-sm text-orange-300 mb-4",
          children: ["⚠ This trip has ", /*#__PURE__*/_jsxDEV("strong", {
            children: cancelId.totalBooked
          }, void 0, false), " booking(s). They will all be marked as ", /*#__PURE__*/_jsxDEV("strong", {
            children: "Cancelled"
          }, void 0, false), " and all vehicle seats will be released."]
        }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
          className: "flex gap-3",
          children: [/*#__PURE__*/_jsxDEV(Button, {
            variant: "outline",
            className: "flex-1 border-white/10",
            onClick: () => setCancelId(null),
            children: "Go Back"
          }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
            className: "flex-1 bg-orange-600 hover:bg-orange-700 text-white border-0",
            onClick: () => cancelMutation.mutate(cancelId.id),
            disabled: cancelMutation.isPending,
            children: cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Trip"
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false)]
  }, void 0, true);
}