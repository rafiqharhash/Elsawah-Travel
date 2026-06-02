"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Bus, ChevronLeft, ChevronRight, X, CheckCircle } from "lucide-react";

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  assignedTrips?: { _id: string; route: string; departureTime: string; status: string }[];
}
import { useLang } from "@/app/providers";

export default function VehiclesPage() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({ vehicleNumber: "", driverName: "", driverPhone: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [apiError, setApiError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vehicles", page, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await api.get(`/vehicles?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/vehicles", body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setShowModal(false); resetForm(); },
    onError: (err: any) => setApiError(err.response?.data?.message || "Failed to create vehicle"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/vehicles/${id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setShowModal(false); resetForm(); },
    onError: (err: any) => setApiError(err.response?.data?.message || "Failed to update vehicle"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setDeleteId(null); },
    onError: (err: any) => alert(err.response?.data?.message || "Cannot delete vehicle"),
  });

  const resetForm = () => { setForm({ vehicleNumber: "", driverName: "", driverPhone: "" }); setEditingVehicle(null); setApiError(""); };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({ vehicleNumber: v.vehicleNumber, driverName: v.driverName, driverPhone: v.driverPhone });
    setApiError("");
    setShowModal(true);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400);
  };

  const vehicles: Vehicle[] = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("vehicleFleet")}</h2>
          <p className="text-muted-foreground mt-1">
            {t("vehicleFleetDesc")}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="gap-2">
          <Plus size={16} /> {t("addToFleet")}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => handleSearch(e.target.value)} placeholder={`${t("search")}...`} className="pl-9 bg-white/5 border-white/10" />
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-destructive">{t("error")}</div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Bus size={40} className="mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">{t("fleetEmpty")}</p>
              <p className="text-sm text-muted-foreground">{t("fleetEmptyDesc")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">{t("plate")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("driver")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("phone")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("capacity")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("assignedTrip")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{v.vehicleNumber}</td>
                      <td className="py-3 px-4">{v.driverName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{v.driverPhone}</td>
                      <td className="py-3 px-4 text-center font-mono">{v.capacity}</td>
                      <td className="py-3 px-4">
                        {v.assignedTrips && v.assignedTrips.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {v.assignedTrips.map(t => (
                              <span key={t._id} className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                {t.route} @ {t.departureTime}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">— None —</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"><Edit size={14} /></button>
                          <button onClick={() => setDeleteId(v._id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {meta && meta.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.pages} ({meta.total} total)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-white/10 h-8 px-2"><ChevronLeft size={14} /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page === meta.pages} className="border-white/10 h-8 px-2"><ChevronRight size={14} /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editingVehicle ? t("editVehicle") : t("addVehicleToFleet")}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            {apiError && <p className="text-destructive text-sm mb-3 p-2 rounded bg-destructive/10">{apiError}</p>}
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1 block">{t("plateNumber")}</label>
                <Input value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} placeholder={t("platePlaceholder")} className="bg-white/5 border-white/10" /></div>
              <div><label className="text-sm font-medium mb-1 block">{t("driverName")}</label>
                <Input value={form.driverName} onChange={e => setForm(f => ({ ...f, driverName: e.target.value }))} placeholder={t("driverNamePlaceholder")} className="bg-white/5 border-white/10" /></div>
              <div><label className="text-sm font-medium mb-1 block">{t("driverPhone")}</label>
                <Input value={form.driverPhone} onChange={e => setForm(f => ({ ...f, driverPhone: e.target.value }))} placeholder="+921234567890" className="bg-white/5 border-white/10" /></div>
              <p className="text-xs text-muted-foreground border border-white/5 rounded p-2 bg-white/5">
                🚌 {t("capacityNote")}
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-white/10" onClick={() => { setShowModal(false); resetForm(); }}>{t("cancel")}</Button>
                <Button className="flex-1" onClick={() => editingVehicle ? updateMutation.mutate({ id: editingVehicle._id, body: form }) : createMutation.mutate(form)} disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? t("saving") : editingVehicle ? t("update") : t("addToFleet")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-2">{t("removeFromFleet")}</h3>
            <p className="text-muted-foreground text-sm mb-5">{t("removeFleetConfirm")}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setDeleteId(null)}>{t("cancel")}</Button>
              <Button variant="destructive" className="flex-1" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
                {t("delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
