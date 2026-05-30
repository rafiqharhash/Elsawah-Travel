"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, ChevronLeft, ChevronRight, BookPlus, X, CheckCircle2, Edit2, Shield } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  Student: "text-blue-400 bg-blue-400/10",
  Admin: "text-purple-400 bg-purple-400/10",
  Supervisor: "text-amber-400 bg-amber-400/10",
};

const PICKUP_LOCATIONS = [
  "Kafr Eksheikh",
  "Desouk",
  "Damanhour",
  "Abu Hummus",
  "Kafr Eldawwar",
];

const DROPOFF_LOCATIONS = [
  { value: "AIU Campus",                  ar: "الجامعة" },
  { value: "Iskan Motamayez (AIU Dorms)", ar: "اسكان متميز (سكن الجامعة)" },
  { value: "Sakan Masr (Oppo)",           ar: "سكن مصر (أمام أوبو)" },
  { value: "Porto Golf (Entrance)",       ar: "بورتو جولف (البوابة)" },
];
import { useLang } from "@/app/providers";

export default function StudentsPage() {
  const { t } = useLang();
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
    dropoffLocation: "",
  });
  const [bookError, setBookError] = useState("");
  const [bookSuccess, setBookSuccess] = useState<any>(null);

  // Edit User state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    studentNumber: "",
    relativePhone: "",
    isActive: true,
  });
  const [editError, setEditError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", page, debouncedSearch, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter) params.set("role", roleFilter);
      const res = await api.get(`/users?${params}`);
      return res.data;
    },
  });

  const { data: tripsData } = useQuery({
    queryKey: ["trips-scheduledactive"],
    queryFn: async () => {
      const res = await api.get("/trips?limit=100");
      return (res.data.data || []).filter((t: any) =>
        t.status === "Scheduled" || t.status === "Active"
      );
    },
    enabled: showBooking,
  });

  const bookMutation = useMutation({
    mutationFn: (body: any) => api.post("/users/manual-booking", body),
    onSuccess: (res) => {
      setBookSuccess(res.data.data);
      setBookError("");
    },
    onError: (err: any) => setBookError(err.response?.data?.message || "Booking failed"),
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; body: any }) => api.put(`/users/${data.id}`, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      setEditError("");
    },
    onError: (err: any) => setEditError(err.response?.data?.message || "Update failed"),
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400);
  };

  const resetBooking = () => {
    setBookForm({ studentName: "", studentPhone: "", tripId: "", pickupLocation: "", dropoffLocation: "" });
    setBookError("");
    setBookSuccess(null);
  };

  const users = data?.data || [];
  const meta = data?.meta;
  const trips: any[] = tripsData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("studentsTitle")}</h2>
          <p className="text-muted-foreground mt-1">{t("studentsDesc")}</p>
        </div>
        <Button onClick={() => { resetBooking(); setShowBooking(true); }} className="gap-2">
          <BookPlus size={16} /> {t("manualBooking")}
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => handleSearch(e.target.value)} placeholder={`${t("search")}...`} className="pl-9 bg-white/5 border-white/10 w-72" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">{t("allRoles")}</option>
          {["Student", "Admin", "Supervisor"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center py-16 text-destructive">{t("error")}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Users size={40} className="mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">{t("noUsers")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">{t("name")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("email")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("phone")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("role")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("joined")}</th>
                    <th className="text-right py-3 px-4 font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium">{u.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{u.email || "—"}</td>
                      <td className="py-3 px-4 font-mono text-sm">{u.phone}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || ""}`}>{u.role}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingUser(u);
                            setEditForm({
                              name: u.name || "",
                              email: u.email || "",
                              phone: u.phone || "",
                              studentNumber: u.studentNumber || "",
                              relativePhone: u.relativePhone || "",
                              isActive: u.isActive !== false,
                            });
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 size={14} className="mr-1" /> {t("edit")}
                        </Button>
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

      {/* ── Manual Booking Modal ─────────────────────────────────────────── */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setShowBooking(false); resetBooking(); }}>
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BookPlus size={18} className="text-primary" /> Manual Booking
              </h3>
              <button onClick={() => { setShowBooking(false); resetBooking(); }} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            {bookSuccess ? (
              /* Success State */
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                </div>
                <h4 className="text-lg font-bold">Booking Confirmed!</h4>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-left space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono text-primary">{bookSuccess.referenceId}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Seat</span><span className="font-bold">{bookSuccess.seatNumber}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Pickup</span><span>{bookSuccess.pickupLocation}</span></div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-white/10" onClick={resetBooking}>Book Another</Button>
                  <Button className="flex-1" onClick={() => { setShowBooking(false); resetBooking(); }}>Done</Button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <div className="space-y-4">
                {bookError && <p className="text-destructive text-sm p-2 rounded bg-destructive/10">{bookError}</p>}

                <div><label className="text-sm font-medium mb-1 block">Student Name</label>
                  <Input value={bookForm.studentName} onChange={e => setBookForm(f => ({ ...f, studentName: e.target.value }))} placeholder="Full name" className="bg-white/5 border-white/10" /></div>

                <div><label className="text-sm font-medium mb-1 block">Student Phone</label>
                  <Input type="tel" value={bookForm.studentPhone} onChange={e => setBookForm(f => ({ ...f, studentPhone: e.target.value }))} placeholder="+1234567890" className="bg-white/5 border-white/10" /></div>

                <div><label className="text-sm font-medium mb-1 block">Trip</label>
                  <select value={bookForm.tripId} onChange={e => setBookForm(f => ({ ...f, tripId: e.target.value }))} className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">— Select a trip —</option>
                    {trips.map(t => <option key={t._id} value={t._id}>{t.route} · {new Date(t.date).toLocaleDateString()} @ {t.departureTime}</option>)}
                  </select>
                </div>

                {/* Pickup location buttons */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Pickup Location</label>
                  <div className="grid grid-cols-1 gap-2">
                    {PICKUP_LOCATIONS.map(loc => {
                      const selected = bookForm.pickupLocation === loc;
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setBookForm(f => ({ ...f, pickupLocation: loc }))}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
                          }`}
                        >
                          <span>{loc}</span>
                          {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dropoff location picker */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Drop-off Location</label>
                  <div className="grid grid-cols-1 gap-2">
                    {DROPOFF_LOCATIONS.map(loc => {
                      const selected = bookForm.dropoffLocation === loc.value;
                      return (
                        <button
                          key={loc.value}
                          type="button"
                          onClick={() => setBookForm(f => ({ ...f, dropoffLocation: loc.value }))}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
                            selected
                              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
                          }`}
                        >
                          <span>{loc.value}</span>
                          <span className="text-xs opacity-50">{loc.ar}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 border-white/10" onClick={() => { setShowBooking(false); resetBooking(); }}>Cancel</Button>
                  <Button
                    className="flex-1"
                    onClick={() => bookMutation.mutate(bookForm)}
                    disabled={bookMutation.isPending || !bookForm.studentName || !bookForm.studentPhone || !bookForm.tripId || !bookForm.pickupLocation || !bookForm.dropoffLocation}
                  >
                    {bookMutation.isPending ? "Booking..." : "Confirm Booking"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Student Modal ─────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Edit2 size={18} className="text-primary" /> Edit {editingUser.role} Profile
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              {editError && <p className="text-destructive text-sm p-2 rounded bg-destructive/10">{editError}</p>}

              <div>
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="bg-white/5 border-white/10" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="bg-white/5 border-white/10" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Phone Number</label>
                <Input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="bg-white/5 border-white/10" />
              </div>

              {editingUser.role === 'Student' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">ID Number / Reference</label>
                    <Input value={editForm.studentNumber} onChange={e => setEditForm(f => ({ ...f, studentNumber: e.target.value }))} className="bg-white/5 border-white/10" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Relative / Parent Phone</label>
                    <Input type="tel" value={editForm.relativePhone} onChange={e => setEditForm(f => ({ ...f, relativePhone: e.target.value }))} className="bg-white/5 border-white/10" />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 mt-4 p-3 border border-white/10 rounded-lg bg-white/5">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={editForm.isActive} 
                  onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))} 
                  className="w-4 h-4 rounded bg-white/10 border-white/20 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-medium select-none cursor-pointer">Account is Active</label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 border-white/10" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button
                  className="flex-1"
                  onClick={() => editMutation.mutate({ id: editingUser._id, body: editForm })}
                  disabled={editMutation.isPending || !editForm.name || !editForm.phone}
                >
                  {editMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
