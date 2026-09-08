"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, MapPin, X, Navigation, CheckCircle, XCircle, ArrowDownUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
const emptyForm = {
  name: "",
  arabicName: "",
  type: "pickup",
  fare: "",
  isActive: true
};
import { useLang } from "@/app/providers";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export default function LocationsPage() {
  const {
    t
  } = useLang();
  const qc = useQueryClient();
  const [tab, setTab] = useState("pickup");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    ...emptyForm
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [apiError, setApiError] = useState("");

  // Fetch all locations (admin view — including inactive)
  const {
    data,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["locations-all"],
    queryFn: async () => {
      const res = await api.get("/locations/all");
      return res.data.data;
    }
  });
  const pickups = (data || []).filter(l => l.type === "pickup");
  const dropoffs = (data || []).filter(l => l.type === "dropoff");
  const displayed = tab === "pickup" ? pickups : dropoffs;
  const createMutation = useMutation({
    mutationFn: body => api.post("/locations", body),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["locations-all"]
      });
      closeModal();
    },
    onError: err => setApiError(err.response?.data?.message || "Failed to create")
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body
    }) => api.put(`/locations/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["locations-all"]
      });
      closeModal();
    },
    onError: err => setApiError(err.response?.data?.message || "Failed to update")
  });
  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/locations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["locations-all"]
      });
      setDeleteTarget(null);
    },
    onError: err => alert(err.response?.data?.message || "Failed to delete")
  });
  const toggleActiveMutation = useMutation({
    mutationFn: ({
      id,
      isActive
    }) => api.put(`/locations/${id}`, {
      isActive
    }),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["locations-all"]
    })
  });
  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      type: tab
    });
    setApiError("");
    setShowModal(true);
  };
  const openEdit = loc => {
    setEditing(loc);
    setForm({
      name: loc.name,
      arabicName: loc.arabicName,
      type: loc.type,
      fare: String(loc.fare),
      isActive: loc.isActive
    });
    setApiError("");
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({
      ...emptyForm
    });
    setApiError("");
  };
  const handleSubmit = () => {
    const payload = {
      ...form,
      fare: Number(form.fare) || 0
    };
    if (editing) {
      updateMutation.mutate({
        id: editing._id,
        body: payload
      });
    } else {
      createMutation.mutate(payload);
    }
  };
  const isPending = createMutation.isPending || updateMutation.isPending;
  return /*#__PURE__*/_jsxDEV("div", {
    className: "space-y-6",
    children: [/*#__PURE__*/_jsxDEV("div", {
      className: "flex items-center justify-between",
      children: [/*#__PURE__*/_jsxDEV("div", {
        children: [/*#__PURE__*/_jsxDEV("h2", {
          className: "text-3xl font-bold tracking-tight",
          children: t("locationsFares")
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground mt-1",
          children: t("locationsDesc")
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
        onClick: openCreate,
        className: "gap-2",
        children: [/*#__PURE__*/_jsxDEV(Plus, {
          size: 16
        }, void 0, false), " ", t("addLocation")]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
      className: "grid grid-cols-2 sm:grid-cols-4 gap-4",
      children: [{
        label: t("pickupLocations"),
        value: pickups.length,
        active: pickups.filter(l => l.isActive).length,
        icon: /*#__PURE__*/_jsxDEV(Navigation, {
          size: 18,
          className: "text-primary"
        }, void 0, false),
        color: "from-primary/20 to-primary/5"
      }, {
        label: t("dropoffPoints"),
        value: dropoffs.length,
        active: dropoffs.filter(l => l.isActive).length,
        icon: /*#__PURE__*/_jsxDEV(MapPin, {
          size: 18,
          className: "text-emerald-400"
        }, void 0, false),
        color: "from-emerald-500/20 to-emerald-500/5"
      }, {
        label: t("avgPickupFare"),
        value: pickups.length > 0 ? `${Math.round(pickups.filter(l => l.isActive).reduce((s, l) => s + l.fare, 0) / (pickups.filter(l => l.isActive).length || 1))} EGP` : "—",
        icon: /*#__PURE__*/_jsxDEV(ArrowDownUp, {
          size: 18,
          className: "text-amber-400"
        }, void 0, false),
        color: "from-amber-400/20 to-amber-400/5"
      }, {
        label: t("priceRange"),
        value: pickups.length > 0 ? `${Math.min(...pickups.map(l => l.fare))}–${Math.max(...pickups.map(l => l.fare))} EGP` : "—",
        icon: /*#__PURE__*/_jsxDEV(ArrowDownUp, {
          size: 18,
          className: "text-purple-400"
        }, void 0, false),
        color: "from-purple-500/20 to-purple-500/5"
      }].map(stat => /*#__PURE__*/_jsxDEV("div", {
        className: `rounded-xl border border-white/10 bg-gradient-to-br ${stat.color} p-4 backdrop-blur`,
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center gap-2 mb-1",
          children: [stat.icon, /*#__PURE__*/_jsxDEV("span", {
            className: "text-xs text-muted-foreground",
            children: stat.label
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
          className: "text-2xl font-black",
          children: stat.value
        }, void 0, false), typeof stat.active === "number" && /*#__PURE__*/_jsxDEV("p", {
          className: "text-xs text-muted-foreground mt-0.5",
          children: [stat.active, " ", t("active").toLowerCase()]
        }, void 0, true)]
      }, stat.label, true))
    }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
      className: "flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit",
      children: ["pickup", "dropoff"].map(type => /*#__PURE__*/_jsxDEV("button", {
        onClick: () => setTab(type),
        className: cn("px-5 py-2 text-sm font-medium rounded-lg transition-all capitalize", tab === type ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"),
        children: t(type === "pickup" ? "pickupLocations" : "dropoffPoints")
      }, type, false))
    }, void 0, false), /*#__PURE__*/_jsxDEV(Card, {
      className: "border-white/5 bg-card/30 backdrop-blur-xl",
      children: /*#__PURE__*/_jsxDEV(CardContent, {
        className: "p-0",
        children: isLoading ? /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-center py-20",
          children: /*#__PURE__*/_jsxDEV("div", {
            className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
          }, void 0, false)
        }, void 0, false) : isError ? /*#__PURE__*/_jsxDEV("p", {
          className: "text-center py-16 text-destructive",
          children: t("error")
        }, void 0, false) : displayed.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
          className: "text-center py-16 space-y-3",
          children: [/*#__PURE__*/_jsxDEV(MapPin, {
            size: 40,
            className: "mx-auto text-muted-foreground/40"
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-muted-foreground font-medium",
            children: tab === "pickup" ? t("noPickupLocations") : t("noDropoffLocations")
          }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
            variant: "outline",
            size: "sm",
            onClick: openCreate,
            className: "border-white/10",
            children: [/*#__PURE__*/_jsxDEV(Plus, {
              size: 14,
              className: "mr-2"
            }, void 0, false), " ", t("addOne")]
          }, void 0, true)]
        }, void 0, true) : /*#__PURE__*/_jsxDEV("div", {
          className: "overflow-x-auto",
          children: /*#__PURE__*/_jsxDEV("table", {
            className: "w-full text-sm whitespace-nowrap",
            children: [/*#__PURE__*/_jsxDEV("thead", {
              children: /*#__PURE__*/_jsxDEV("tr", {
                className: "border-b border-white/5 text-muted-foreground",
                children: [/*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-5 font-medium",
                  children: t("locationName")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("arabicName")
                }, void 0, false), tab === "pickup" && /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("farePerSeat")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("status")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("actions")
                }, void 0, false)]
              }, void 0, true)
            }, void 0, false), /*#__PURE__*/_jsxDEV("tbody", {
              children: /*#__PURE__*/_jsxDEV(AnimatePresence, {
                children: displayed.map(loc => /*#__PURE__*/_jsxDEV(motion.tr, {
                  initial: {
                    opacity: 0,
                    y: 4
                  },
                  animate: {
                    opacity: 1,
                    y: 0
                  },
                  exit: {
                    opacity: 0,
                    y: -4
                  },
                  className: "border-b border-white/5 hover:bg-white/5 transition-colors",
                  children: [/*#__PURE__*/_jsxDEV("td", {
                    className: "py-3 px-5",
                    children: /*#__PURE__*/_jsxDEV("div", {
                      className: "flex items-center gap-2",
                      children: [/*#__PURE__*/_jsxDEV("div", {
                        className: cn("w-2 h-2 rounded-full", loc.isActive ? "bg-emerald-400" : "bg-zinc-500")
                      }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                        className: "font-semibold",
                        children: loc.name
                      }, void 0, false)]
                    }, void 0, true)
                  }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                    className: "py-3 px-4 text-muted-foreground font-arabic",
                    children: loc.arabicName || /*#__PURE__*/_jsxDEV("span", {
                      className: "italic opacity-40",
                      children: "—"
                    }, void 0, false)
                  }, void 0, false), tab === "pickup" && /*#__PURE__*/_jsxDEV("td", {
                    className: "py-3 px-4",
                    children: /*#__PURE__*/_jsxDEV("span", {
                      className: "font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md text-sm",
                      children: [loc.fare, " EGP"]
                    }, void 0, true)
                  }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                    className: "py-3 px-4",
                    children: /*#__PURE__*/_jsxDEV("button", {
                      onClick: () => toggleActiveMutation.mutate({
                        id: loc._id,
                        isActive: !loc.isActive
                      }),
                      className: cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all", loc.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20"),
                      children: [loc.isActive ? /*#__PURE__*/_jsxDEV(CheckCircle, {
                        size: 11
                      }, void 0, false) : /*#__PURE__*/_jsxDEV(XCircle, {
                        size: 11
                      }, void 0, false), loc.isActive ? t("active") : t("inactive")]
                    }, void 0, true)
                  }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                    className: "py-3 px-4",
                    children: /*#__PURE__*/_jsxDEV("div", {
                      className: "flex gap-1.5",
                      children: [/*#__PURE__*/_jsxDEV("button", {
                        onClick: () => openEdit(loc),
                        className: "p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors",
                        title: t("edit"),
                        children: /*#__PURE__*/_jsxDEV(Edit, {
                          size: 14
                        }, void 0, false)
                      }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
                        onClick: () => setDeleteTarget(loc),
                        className: "p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors",
                        title: t("delete"),
                        children: /*#__PURE__*/_jsxDEV(Trash2, {
                          size: 14
                        }, void 0, false)
                      }, void 0, false)]
                    }, void 0, true)
                  }, void 0, false)]
                }, loc._id, true))
              }, void 0, false)
            }, void 0, false)]
          }, void 0, true)
        }, void 0, false)
      }, void 0, false)
    }, void 0, false), /*#__PURE__*/_jsxDEV(AnimatePresence, {
      children: showModal && /*#__PURE__*/_jsxDEV(motion.div, {
        initial: {
          opacity: 0
        },
        animate: {
          opacity: 1
        },
        exit: {
          opacity: 0
        },
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",
        onClick: closeModal,
        children: /*#__PURE__*/_jsxDEV(motion.div, {
          initial: {
            scale: 0.95,
            opacity: 0,
            y: 16
          },
          animate: {
            scale: 1,
            opacity: 1,
            y: 0
          },
          exit: {
            scale: 0.95,
            opacity: 0,
            y: 16
          },
          transition: {
            type: "spring",
            stiffness: 320,
            damping: 26
          },
          className: "bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl",
          onClick: e => e.stopPropagation(),
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "flex items-center justify-between mb-6",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "flex items-center gap-3",
              children: [/*#__PURE__*/_jsxDEV("div", {
                className: "w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center",
                children: /*#__PURE__*/_jsxDEV(MapPin, {
                  size: 18,
                  className: "text-primary"
                }, void 0, false)
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                children: [/*#__PURE__*/_jsxDEV("h3", {
                  className: "font-bold text-lg",
                  children: editing ? t("editLocation") : t("addLocation")
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-xs text-muted-foreground",
                  children: t("changesApplyInstantly")
                }, void 0, false)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
              onClick: closeModal,
              className: "text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-white/10",
              children: /*#__PURE__*/_jsxDEV(X, {
                size: 18
              }, void 0, false)
            }, void 0, false)]
          }, void 0, true), apiError && /*#__PURE__*/_jsxDEV("div", {
            className: "mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive",
            children: apiError
          }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
            className: "space-y-4",
            children: [!editing && /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-sm font-medium mb-2 block",
                children: t("type")
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "flex gap-2",
                children: ["pickup", "dropoff"].map(type => /*#__PURE__*/_jsxDEV("button", {
                  type: "button",
                  onClick: () => setForm(f => ({
                    ...f,
                    type: type
                  })),
                  className: cn("flex-1 py-2.5 text-sm rounded-xl border font-medium transition-all capitalize", form.type === type ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"),
                  children: t(type === "pickup" ? "pickupType" : "dropoffType")
                }, type, false))
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-sm font-medium mb-1 block",
                children: t("locationNameEnglish")
              }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
                value: form.name,
                onChange: e => setForm(f => ({
                  ...f,
                  name: e.target.value
                })),
                placeholder: "e.g. Kafr Eksheikh",
                className: "bg-white/5 border-white/10"
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-sm font-medium mb-1 block",
                children: [t("arabicName"), /*#__PURE__*/_jsxDEV("span", {
                  className: "text-muted-foreground font-normal ml-1",
                  children: t("optional")
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV(Input, {
                value: form.arabicName,
                onChange: e => setForm(f => ({
                  ...f,
                  arabicName: e.target.value
                })),
                placeholder: "e.g. كفر الشيخ",
                dir: "rtl",
                className: "bg-white/5 border-white/10 font-arabic"
              }, void 0, false)]
            }, void 0, true), form.type === "pickup" && /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("label", {
                className: "text-sm font-medium mb-1 block",
                children: t("farePerSeatLabel")
              }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
                className: "relative",
                children: [/*#__PURE__*/_jsxDEV(Input, {
                  type: "number",
                  min: 0,
                  step: 5,
                  value: form.fare,
                  onChange: e => setForm(f => ({
                    ...f,
                    fare: e.target.value
                  })),
                  placeholder: "e.g. 210",
                  className: "bg-white/5 border-white/10 pr-14"
                }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
                  className: "absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium",
                  children: "EGP"
                }, void 0, false)]
              }, void 0, true), form.fare && Number(form.fare) > 0 && /*#__PURE__*/_jsxDEV("p", {
                className: "text-xs text-muted-foreground mt-1",
                children: ["2 seats = ", /*#__PURE__*/_jsxDEV("strong", {
                  className: "text-foreground",
                  children: [Number(form.fare) * 2, " EGP"]
                }, void 0, true), " · ", "3 seats = ", /*#__PURE__*/_jsxDEV("strong", {
                  className: "text-foreground",
                  children: [Number(form.fare) * 3, " EGP"]
                }, void 0, true)]
              }, void 0, true)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "flex items-center justify-between py-3 px-4 rounded-xl border border-white/10 bg-white/5",
              children: [/*#__PURE__*/_jsxDEV("div", {
                children: [/*#__PURE__*/_jsxDEV("p", {
                  className: "text-sm font-medium",
                  children: t("active")
                }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                  className: "text-xs text-muted-foreground",
                  children: t("inactiveDesc")
                }, void 0, false)]
              }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
                type: "button",
                onClick: () => setForm(f => ({
                  ...f,
                  isActive: !f.isActive
                })),
                className: cn("w-11 h-6 rounded-full border-2 transition-all relative", form.isActive ? "bg-primary border-primary" : "bg-white/10 border-white/20"),
                children: /*#__PURE__*/_jsxDEV("span", {
                  className: cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", form.isActive ? "left-[calc(100%-18px)]" : "left-0.5")
                }, void 0, false)
              }, void 0, false)]
            }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
              className: "flex gap-3 pt-1",
              children: [/*#__PURE__*/_jsxDEV(Button, {
                variant: "outline",
                className: "flex-1 border-white/10",
                onClick: closeModal,
                children: t("cancel")
              }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
                className: "flex-1",
                onClick: handleSubmit,
                disabled: isPending || !form.name.trim(),
                children: isPending ? t("saving") : editing ? t("saveChanges") : t("createLocation")
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true)]
        }, void 0, true)
      }, "modal-backdrop", false)
    }, void 0, false), /*#__PURE__*/_jsxDEV(AnimatePresence, {
      children: deleteTarget && /*#__PURE__*/_jsxDEV(motion.div, {
        initial: {
          opacity: 0
        },
        animate: {
          opacity: 1
        },
        exit: {
          opacity: 0
        },
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",
        children: /*#__PURE__*/_jsxDEV(motion.div, {
          initial: {
            scale: 0.95,
            opacity: 0
          },
          animate: {
            scale: 1,
            opacity: 1
          },
          exit: {
            scale: 0.95,
            opacity: 0
          },
          className: "bg-card border border-destructive/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl",
          children: [/*#__PURE__*/_jsxDEV("div", {
            className: "flex items-center gap-3 mb-3",
            children: [/*#__PURE__*/_jsxDEV("div", {
              className: "p-2.5 rounded-xl bg-destructive/10 border border-destructive/20",
              children: /*#__PURE__*/_jsxDEV(Trash2, {
                size: 20,
                className: "text-destructive"
              }, void 0, false)
            }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
              children: [/*#__PURE__*/_jsxDEV("h3", {
                className: "font-bold text-lg",
                children: t("deleteLocation")
              }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
                className: "text-xs text-muted-foreground",
                children: t("cannotBeUndone")
              }, void 0, false)]
            }, void 0, true)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("p", {
            className: "text-muted-foreground text-sm mb-5",
            children: [t("aboutToDelete"), " ", /*#__PURE__*/_jsxDEV("strong", {
              className: "text-foreground",
              children: deleteTarget.name
            }, void 0, false), ".", t("deleteLocationWarning")]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "flex gap-3",
            children: [/*#__PURE__*/_jsxDEV(Button, {
              variant: "outline",
              className: "flex-1 border-white/10",
              onClick: () => setDeleteTarget(null),
              children: t("cancel")
            }, void 0, false), /*#__PURE__*/_jsxDEV(Button, {
              variant: "destructive",
              className: "flex-1",
              onClick: () => deleteMutation.mutate(deleteTarget._id),
              disabled: deleteMutation.isPending,
              children: deleteMutation.isPending ? t("deleting") : t("delete")
            }, void 0, false)]
          }, void 0, true)]
        }, void 0, true)
      }, "delete-backdrop", false)
    }, void 0, false)]
  }, void 0, true);
}