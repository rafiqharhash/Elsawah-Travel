"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Bus, ChevronLeft, ChevronRight, X, CheckCircle } from "lucide-react";
import { useLang } from "@/app/providers";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export default function VehiclesPage() {
  const {
    t
  } = useLang();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState({
    vehicleNumber: "",
    driverName: "",
    driverPhone: ""
  });
  const [deleteId, setDeleteId] = useState(null);
  const [apiError, setApiError] = useState("");
  const {
    data,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["vehicles", page, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10"
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await api.get(`/vehicles?${params}`);
      return res.data;
    }
  });
  const createMutation = useMutation({
    mutationFn: body => api.post("/vehicles", body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vehicles"]
      });
      setShowModal(false);
      resetForm();
    },
    onError: err => setApiError(err.response?.data?.message || "Failed to create vehicle")
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body
    }) => api.put(`/vehicles/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vehicles"]
      });
      setShowModal(false);
      resetForm();
    },
    onError: err => setApiError(err.response?.data?.message || "Failed to update vehicle")
  });
  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vehicles"]
      });
      setDeleteId(null);
    },
    onError: err => alert(err.response?.data?.message || "Cannot delete vehicle")
  });
  const resetForm = () => {
    setForm({
      vehicleNumber: "",
      driverName: "",
      driverPhone: ""
    });
    setEditingVehicle(null);
    setApiError("");
  };
  const openEdit = v => {
    setEditingVehicle(v);
    setForm({
      vehicleNumber: v.vehicleNumber,
      driverName: v.driverName,
      driverPhone: v.driverPhone
    });
    setApiError("");
    setShowModal(true);
  };
  const handleSearch = val => {
    setSearch(val);
    clearTimeout(window.__searchTimer);
    window.__searchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };
  const vehicles = data?.data || [];
  const meta = data?.meta;
  return /*#__PURE__*/_jsxDEV("div", {
    className: "space-y-6",
    children: [/*#__PURE__*/_jsxDEV("div", {
      className: "flex items-center justify-between",
      children: [/*#__PURE__*/_jsxDEV("div", {
        children: [/*#__PURE__*/_jsxDEV("h2", {
          className: "text-3xl font-bold tracking-tight",
          children: t("vehicleFleet")
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground mt-1",
          children: t("vehicleFleetDesc")
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
        onClick: () => {
          resetForm();
          setShowModal(true);
        },
        className: "gap-2",
        children: [/*#__PURE__*/_jsxDEV(Plus, {
          size: 16
        }, void 0, false), " ", t("addToFleet")]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
      className: "relative max-w-sm",
      children: [/*#__PURE__*/_jsxDEV(Search, {
        size: 16,
        className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
        value: search,
        onChange: e => handleSearch(e.target.value),
        placeholder: `${t("search")}...`,
        className: "pl-9 bg-white/5 border-white/10"
      }, void 0, false)]
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
        }, void 0, false) : vehicles.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
          className: "text-center py-16 space-y-3",
          children: [/*#__PURE__*/_jsxDEV(Bus, {
            size: 40,
            className: "mx-auto text-muted-foreground/40"
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-muted-foreground font-medium",
            children: t("fleetEmpty")
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-sm text-muted-foreground",
            children: t("fleetEmptyDesc")
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
                  children: t("plate")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("driver")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("phone")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("capacity")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("assignedTrip")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("actions")
                }, void 0, false)]
              }, void 0, true)
            }, void 0, false), /*#__PURE__*/_jsxDEV("tbody", {
              children: vehicles.map(v => /*#__PURE__*/_jsxDEV("tr", {
                className: "border-b border-white/5 hover:bg-white/5 transition-colors",
                children: [/*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 font-mono font-bold text-primary",
                  children: v.vehicleNumber
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: v.driverName
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-muted-foreground",
                  children: v.driverPhone
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-center font-mono",
                  children: v.capacity
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: v.assignedTrips && v.assignedTrips.length > 0 ? /*#__PURE__*/_jsxDEV("div", {
                    className: "flex flex-wrap gap-1",
                    children: v.assignedTrips.map(t => /*#__PURE__*/_jsxDEV("span", {
                      className: "px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20",
                      children: [t.route, " @ ", t.departureTime]
                    }, t._id, true))
                  }, void 0, false) : /*#__PURE__*/_jsxDEV("span", {
                    className: "text-muted-foreground text-xs italic",
                    children: "— None —"
                  }, void 0, false)
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("div", {
                    className: "flex gap-2",
                    children: [/*#__PURE__*/_jsxDEV("button", {
                      onClick: () => openEdit(v),
                      className: "p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors",
                      children: /*#__PURE__*/_jsxDEV(Edit, {
                        size: 14
                      }, void 0, false)
                    }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
                      onClick: () => setDeleteId(v._id),
                      className: "p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors",
                      children: /*#__PURE__*/_jsxDEV(Trash2, {
                        size: 14
                      }, void 0, false)
                    }, void 0, false)]
                  }, void 0, true)
                }, void 0, false)]
              }, v._id, true))
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
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm",
      onClick: () => {
        setShowModal(false);
        resetForm();
      },
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-card border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl",
        onClick: e => e.stopPropagation(),
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-between mb-5",
          children: [/*#__PURE__*/_jsxDEV("h3", {
            className: "text-lg font-bold",
            children: editingVehicle ? t("editVehicle") : t("addVehicleToFleet")
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
          className: "text-destructive text-sm mb-3 p-2 rounded bg-destructive/10",
          children: apiError
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          className: "space-y-4",
          children: [/*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: t("plateNumber")
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              value: form.vehicleNumber,
              onChange: e => setForm(f => ({
                ...f,
                vehicleNumber: e.target.value
              })),
              placeholder: t("platePlaceholder"),
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: t("driverName")
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              value: form.driverName,
              onChange: e => setForm(f => ({
                ...f,
                driverName: e.target.value
              })),
              placeholder: t("driverNamePlaceholder"),
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: t("driverPhone")
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              value: form.driverPhone,
              onChange: e => setForm(f => ({
                ...f,
                driverPhone: e.target.value
              })),
              placeholder: "+921234567890",
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
            className: "text-xs text-muted-foreground border border-white/5 rounded p-2 bg-white/5",
            children: ["🚌 ", t("capacityNote")]
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
              onClick: () => editingVehicle ? updateMutation.mutate({
                id: editingVehicle._id,
                body: form
              }) : createMutation.mutate(form),
              disabled: createMutation.isPending || updateMutation.isPending,
              children: createMutation.isPending || updateMutation.isPending ? t("saving") : editingVehicle ? t("update") : t("addToFleet")
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
          children: t("removeFromFleet")
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground text-sm mb-5",
          children: t("removeFleetConfirm")
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
    }, void 0, false)]
  }, void 0, true);
}