"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Route, ChevronLeft, ChevronRight, X, Bus, Ban } from "lucide-react";

interface LocationTime { location: string; time: string; }
interface Vehicle { _id: string; vehicleNumber: string; driverName: string; capacity: number; tripId: string | null; }
interface Trip { _id: string; route: string; date: string; departureTime: string; status: string; totalCapacity: number; totalBooked: number; occupancyPercentage: number; vehicleIds: Vehicle[]; totalIncome?: number; locationTimes?: LocationTime[]; }

const LOCATIONS_LIST = ["Kafr Eksheikh", "Desouk", "Damanhour", "Abu Hummus", "Kafr Eldawwar"];

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "text-blue-400 bg-blue-400/10",
  Active: "text-emerald-400 bg-emerald-400/10",
  Completed: "text-zinc-400 bg-zinc-400/10",
  Cancelled: "text-red-400 bg-red-400/10",
};

export default function TripsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [form, setForm] = useState({ route: "", date: "", departureTime: "", status: "Scheduled" });
  const [locationTimes, setLocationTimes] = useState<LocationTime[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<{ id: string; route: string; totalBooked: number } | null>(null);
  const [apiError, setApiError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["trips", page, debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/trips?${params}`);
      return res.data;
    },
  });

  // Fetch all vehicles (any vehicle can be assigned to multiple trips now)
  const { data: fleetData } = useQuery({
    queryKey: ["fleet-available", editingTrip?._id],
    queryFn: async () => {
      const availRes = await api.get("/vehicles?limit=100");
      return availRes.data.data || [];
    },
    enabled: showModal,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/trips", body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trips"] }); queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setShowModal(false); resetForm(); },
    onError: (err: any) => setApiError(err.response?.data?.message || "Failed to create trip"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/trips/${id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trips"] }); queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setShowModal(false); resetForm(); },
    onError: (err: any) => setApiError(err.response?.data?.message || "Failed to update trip"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/trips/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trips"] }); queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setDeleteId(null); },
    onError: (err: any) => alert(err.response?.data?.message || "Cannot delete trip"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/trips/${id}/cancel`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["trips"] }); queryClient.invalidateQueries({ queryKey: ["vehicles"] }); queryClient.invalidateQueries({ queryKey: ["bookings"] }); setCancelId(null); },
    onError: (err: any) => alert(err.response?.data?.message || "Cancel failed"),
  });

  const resetForm = () => {
    setForm({ route: "", date: "", departureTime: "", status: "Scheduled" });
    setLocationTimes([]);
    setSelectedVehicleIds([]);
    setEditingTrip(null);
    setApiError("");
  };

  const openEdit = (t: Trip) => {
    setEditingTrip(t);
    setForm({ route: t.route, date: t.date.split("T")[0], departureTime: t.departureTime, status: t.status });
    setLocationTimes(t.locationTimes || []);
    setSelectedVehicleIds(t.vehicleIds?.map(v => v._id) || []);
    setApiError("");
    setShowModal(true);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    const payload = { ...form, vehicleIds: selectedVehicleIds, locationTimes };
    if (editingTrip) updateMutation.mutate({ id: editingTrip._id, body: payload });
    else createMutation.mutate(payload);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400);
  };

  const fleet: Vehicle[] = fleetData || [];
  const trips: Trip[] = data?.data || [];
  const meta = data?.meta;
  const previewCapacity = selectedVehicleIds.length * 14;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trips</h2>
          <p className="text-muted-foreground mt-1">Create trips and assign vehicles from your fleet.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus size={16} /> Create Trip</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search route..." className="pl-9 bg-white/5 border-white/10 w-64" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="sys-select w-auto">
          <option value="">All Statuses</option>
          {["Scheduled","Active","Completed","Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : isError ? (
            <div className="text-center py-16 text-destructive">Failed to load trips.</div>
          ) : trips.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Route size={40} className="mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No trips yet.</p>
              <p className="text-sm text-muted-foreground">First add vehicles to your fleet, then create a trip.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">Route</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Time</th>
                    <th className="text-left py-3 px-4 font-medium">Vehicles</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Occupancy</th>
                    <th className="text-left py-3 px-4 font-medium">Income</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map(t => (
                    <tr key={t._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium">{t.route}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-mono text-primary">{t.departureTime}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1">
                          <Bus size={12} className="text-muted-foreground" />
                          <span>{t.vehicleIds?.length || 0} bus{(t.vehicleIds?.length || 0) !== 1 ? "es" : ""}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || ""}`}>{t.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${t.occupancyPercentage > 90 ? "bg-red-500" : "bg-primary"}`} style={{ width: `${t.occupancyPercentage}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{t.totalBooked}/{t.totalCapacity}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-emerald-400">
                        {t.totalIncome ? `${t.totalIncome} EGP` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5 items-center">
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setDeleteId(t._id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                          {/* Supervisor-only: cancel even with bookings */}
                          {t.status !== "Cancelled" && (
                            <button
                              onClick={() => setCancelId({ id: t._id, route: t.route, totalBooked: t.totalBooked })}
                              className="p-1.5 rounded hover:bg-orange-500/10 text-muted-foreground hover:text-orange-400 transition-colors"
                              title="Force Cancel Trip"
                            >
                              <Ban size={14} />
                            </button>
                          )}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editingTrip ? "Edit Trip" : "Create New Trip"}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            {apiError && <p className="text-destructive text-sm mb-4 p-2 rounded bg-destructive/10">{apiError}</p>}
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1 block">Route</label>
                <Input value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} placeholder="e.g. Campus → City Center" className="bg-white/5 border-white/10" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1 block">Date</label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-white/5 border-white/10" /></div>
                <div><label className="text-sm font-medium mb-1 block">Departure Time</label>
                  <Input type="time" value={form.departureTime} onChange={e => setForm(f => ({ ...f, departureTime: e.target.value }))} className="bg-white/5 border-white/10" /></div>
              </div>
              <div><label className="text-sm font-medium mb-1 block">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="sys-select">
                  {["Scheduled","Active","Completed","Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Location Times */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Location Timings (Optional)</label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-white/10"
                    onClick={() => setLocationTimes([...locationTimes, { location: LOCATIONS_LIST[0], time: form.departureTime || "08:00" }])}
                  >
                    <Plus size={12} className="mr-1" /> Add Location
                  </Button>
                </div>
                {locationTimes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No custom location times added.</p>
                ) : (
                  <div className="space-y-2">
                    {locationTimes.map((lt, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={lt.location}
                          onChange={e => {
                            const newLT = [...locationTimes];
                            newLT[index].location = e.target.value;
                            setLocationTimes(newLT);
                          }}
                          className="sys-select flex-1 text-xs"
                        >
                          {LOCATIONS_LIST.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                        <Input
                          type="time"
                          value={lt.time}
                          onChange={e => {
                            const newLT = [...locationTimes];
                            newLT[index].time = e.target.value;
                            setLocationTimes(newLT);
                          }}
                          className="w-28 h-8 text-xs bg-white/5 border-white/10"
                        />
                        <button
                          onClick={() => setLocationTimes(locationTimes.filter((_, i) => i !== index))}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle multi-select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Assign Vehicles from Fleet</label>
                  {selectedVehicleIds.length > 0 && (
                    <span className="text-xs text-primary font-medium">{selectedVehicleIds.length} selected · {previewCapacity} seats total</span>
                  )}
                </div>
                {fleet.length === 0 ? (
                  <div className="border border-white/10 rounded-lg p-4 text-center text-muted-foreground text-sm">
                    No available vehicles in fleet. <a href="/admin/vehicles" className="text-primary underline">Add vehicles first</a>.
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-lg divide-y divide-white/5 max-h-48 overflow-y-auto">
                    {fleet.map((v: Vehicle) => {
                      const isSelected = selectedVehicleIds.includes(v._id);
                      return (
                        <button
                          key={v._id}
                          onClick={() => toggleVehicle(v._id)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-white/5"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "border-primary bg-primary" : "border-white/20"}`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </div>
                            <div>
                              <p className="font-mono font-semibold text-sm text-primary">{v.vehicleNumber}</p>
                              <p className="text-xs text-muted-foreground">{v.driverName}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{v.capacity} seats</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-white/10" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTrip ? "Update Trip" : "Create Trip"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Delete Trip?</h3>
            <p className="text-muted-foreground text-sm mb-5">Assigned vehicles will be returned to the fleet. Trips with bookings cannot be deleted — use Force Cancel instead.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Force Cancel Confirmation (Supervisor) */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-orange-500/20 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Ban size={20} className="text-orange-400" />
              </div>
              <h3 className="text-lg font-bold">Force Cancel Trip?</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-2">
              You are about to cancel <strong className="text-foreground">{cancelId.route}</strong>.
            </p>
            {cancelId.totalBooked > 0 && (
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-sm text-orange-300 mb-4">
                ⚠ This trip has <strong>{cancelId.totalBooked}</strong> booking(s). They will all be marked as <strong>Cancelled</strong> and all vehicle seats will be released.
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setCancelId(null)}>Go Back</Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white border-0"
                onClick={() => cancelMutation.mutate(cancelId.id)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Trip"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
