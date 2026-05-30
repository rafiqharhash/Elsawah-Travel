"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  X,
  Navigation,
  CheckCircle,
  XCircle,
  ArrowDownUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Location {
  _id: string;
  name: string;
  arabicName: string;
  type: "pickup" | "dropoff";
  fare: number;
  isActive: boolean;
}

const emptyForm = {
  name: "",
  arabicName: "",
  type: "pickup" as "pickup" | "dropoff",
  fare: "",
  isActive: true,
};

interface LocationPayload {
  name: string;
  arabicName: string;
  type: "pickup" | "dropoff";
  fare: number;
  isActive: boolean;
}

export default function LocationsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pickup" | "dropoff">("pickup");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [apiError, setApiError] = useState("");

  // Fetch all locations (admin view — including inactive)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["locations-all"],
    queryFn: async () => {
      const res = await api.get("/locations/all");
      return res.data.data as Location[];
    },
  });

  const pickups = (data || []).filter((l) => l.type === "pickup");
  const dropoffs = (data || []).filter((l) => l.type === "dropoff");
  const displayed = tab === "pickup" ? pickups : dropoffs;

  const createMutation = useMutation({
    mutationFn: (body: LocationPayload) => api.post("/locations", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations-all"] });
      closeModal();
    },
    onError: (err: any) =>
      setApiError(err.response?.data?.message || "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api.put(`/locations/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations-all"] });
      closeModal();
    },
    onError: (err: any) =>
      setApiError(err.response?.data?.message || "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/locations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations-all"] });
      setDeleteTarget(null);
    },
    onError: (err: any) =>
      alert(err.response?.data?.message || "Failed to delete"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/locations/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations-all"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, type: tab });
    setApiError("");
    setShowModal(true);
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setForm({
      name: loc.name,
      arabicName: loc.arabicName,
      type: loc.type,
      fare: String(loc.fare),
      isActive: loc.isActive,
    });
    setApiError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ ...emptyForm });
    setApiError("");
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      fare: Number(form.fare) || 0,
    };
    if (editing) {
      updateMutation.mutate({ id: editing._id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Locations & Fares</h2>
          <p className="text-muted-foreground mt-1">
            Manage pickup areas and drop-off points. Changes reflect instantly on
            the student portal.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Location
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Pickup Locations",
            value: pickups.length,
            active: pickups.filter((l) => l.isActive).length,
            icon: <Navigation size={18} className="text-primary" />,
            color: "from-primary/20 to-primary/5",
          },
          {
            label: "Drop-off Points",
            value: dropoffs.length,
            active: dropoffs.filter((l) => l.isActive).length,
            icon: <MapPin size={18} className="text-emerald-400" />,
            color: "from-emerald-500/20 to-emerald-500/5",
          },
          {
            label: "Avg. Pickup Fare",
            value:
              pickups.length > 0
                ? `${Math.round(
                    pickups.filter((l) => l.isActive).reduce((s, l) => s + l.fare, 0) /
                      (pickups.filter((l) => l.isActive).length || 1)
                  )} EGP`
                : "—",
            icon: <ArrowDownUp size={18} className="text-amber-400" />,
            color: "from-amber-400/20 to-amber-400/5",
          },
          {
            label: "Price Range",
            value:
              pickups.length > 0
                ? `${Math.min(...pickups.map((l) => l.fare))}–${Math.max(
                    ...pickups.map((l) => l.fare)
                  )} EGP`
                : "—",
            icon: <ArrowDownUp size={18} className="text-purple-400" />,
            color: "from-purple-500/20 to-purple-500/5",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-white/10 bg-gradient-to-br ${stat.color} p-4 backdrop-blur`}
          >
            <div className="flex items-center gap-2 mb-1">
              {stat.icon}
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-black">{stat.value}</p>
            {typeof stat.active === "number" && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.active} active
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
        {(["pickup", "dropoff"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-lg transition-all capitalize",
              tab === t
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "pickup" ? "Pickup Locations" : "Drop-off Points"}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-white/5 bg-card/30 backdrop-blur-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <p className="text-center py-16 text-destructive">
              Failed to load locations.
            </p>
          ) : displayed.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <MapPin size={40} className="mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                No {tab} locations yet.
              </p>
              <Button variant="outline" size="sm" onClick={openCreate} className="border-white/10">
                <Plus size={14} className="mr-2" /> Add one
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground">
                    <th className="text-left py-3 px-5 font-medium">Location Name</th>
                    <th className="text-left py-3 px-4 font-medium">Arabic Name</th>
                    {tab === "pickup" && (
                      <th className="text-left py-3 px-4 font-medium">Fare / Seat</th>
                    )}
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {displayed.map((loc) => (
                      <motion.tr
                        key={loc._id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                loc.isActive ? "bg-emerald-400" : "bg-zinc-500"
                              )}
                            />
                            <span className="font-semibold">{loc.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-arabic">
                          {loc.arabicName || (
                            <span className="italic opacity-40">—</span>
                          )}
                        </td>
                        {tab === "pickup" && (
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md text-sm">
                              {loc.fare} EGP
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: loc._id,
                                isActive: !loc.isActive,
                              })
                            }
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                              loc.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20"
                            )}
                          >
                            {loc.isActive ? (
                              <CheckCircle size={11} />
                            ) : (
                              <XCircle size={11} />
                            )}
                            {loc.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openEdit(loc)}
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(loc)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {editing ? "Edit Location" : "Add Location"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Changes apply to the student portal instantly
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {apiError && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {apiError}
                </div>
              )}

              <div className="space-y-4">
                {/* Type selector — only for new locations */}
                {!editing && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <div className="flex gap-2">
                      {(["pickup", "dropoff"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, type: t }))
                          }
                          className={cn(
                            "flex-1 py-2.5 text-sm rounded-xl border font-medium transition-all capitalize",
                            form.type === t
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"
                          )}
                        >
                          {t === "pickup" ? "🚏 Pickup" : "📍 Drop-off"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Location Name (English) *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. Kafr Eksheikh"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                {/* Arabic name */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Arabic Name
                    <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                  </label>
                  <Input
                    value={form.arabicName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, arabicName: e.target.value }))
                    }
                    placeholder="e.g. كفر الشيخ"
                    dir="rtl"
                    className="bg-white/5 border-white/10 font-arabic"
                  />
                </div>

                {/* Fare — only for pickup */}
                {form.type === "pickup" && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Fare per Seat (EGP) *
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        step={5}
                        value={form.fare}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, fare: e.target.value }))
                        }
                        placeholder="e.g. 210"
                        className="bg-white/5 border-white/10 pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                        EGP
                      </span>
                    </div>
                    {form.fare && Number(form.fare) > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        2 seats = <strong className="text-foreground">{Number(form.fare) * 2} EGP</strong>
                        {" · "}
                        3 seats = <strong className="text-foreground">{Number(form.fare) * 3} EGP</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Active toggle */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-white/10 bg-white/5">
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">
                      Inactive locations are hidden from students
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, isActive: !f.isActive }))
                    }
                    className={cn(
                      "w-11 h-6 rounded-full border-2 transition-all relative",
                      form.isActive
                        ? "bg-primary border-primary"
                        : "bg-white/10 border-white/20"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                        form.isActive ? "left-[calc(100%-18px)]" : "left-0.5"
                      )}
                    />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/10"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isPending || !form.name.trim()}
                  >
                    {isPending
                      ? "Saving…"
                      : editing
                      ? "Save Changes"
                      : "Create Location"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-destructive/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
                  <Trash2 size={20} className="text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Delete Location?</h3>
                  <p className="text-xs text-muted-foreground">
                    This cannot be undone
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-5">
                You are about to delete{" "}
                <strong className="text-foreground">{deleteTarget.name}</strong>.
                Students who selected this location in-progress may be affected.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => deleteMutation.mutate(deleteTarget._id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
