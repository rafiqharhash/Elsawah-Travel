"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Shield, User } from "lucide-react";

interface Admin { _id: string; name: string; phone: string; username?: string; email?: string; role: string; createdAt: string; }

export default function ManageAdminsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", username: "", password: "", email: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [apiError, setApiError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const res = await api.get("/users?role=Admin&limit=50");
      return res.data.data as Admin[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post("/users/admins", body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admins"] }); setShowModal(false); setForm({ name: "", phone: "", username: "", password: "", email: "" }); setApiError(""); },
    onError: (err: any) => setApiError(err.response?.data?.message || "Failed to create admin"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/admins/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admins"] }); setDeleteId(null); },
    onError: (err: any) => alert(err.response?.data?.message || "Failed to remove admin"),
  });

  const admins = data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-purple-400" />
            <span className="text-xs font-medium text-purple-400 uppercase tracking-widest">Supervisor Only</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Admins</h2>
          <p className="text-muted-foreground mt-1">Add or remove admin accounts for the dashboard.</p>
        </div>
        <Button onClick={() => { setShowModal(true); setApiError(""); }} className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Plus size={16} /> Add Admin
        </Button>
      </div>

      <Card className="border-white/5 bg-card/30 backdrop-blur-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <User size={40} className="mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">No admin accounts yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Username</th>
                    <th className="text-left py-3 px-4 font-medium">Phone</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Created</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium">{a.name}</td>
                      <td className="py-3 px-4 font-mono text-primary">{a.username || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{a.phone}</td>
                      <td className="py-3 px-4 text-muted-foreground">{a.email || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => setDeleteId(a._id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2"><Shield size={18} className="text-purple-400" /> Create Admin Account</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            {apiError && <p className="text-destructive text-sm mb-3 p-2 rounded bg-destructive/10">{apiError}</p>}
            <div className="space-y-3">
              <div><label className="text-sm font-medium mb-1 block">Full Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Admin Name" className="bg-white/5 border-white/10" /></div>
              <div><label className="text-sm font-medium mb-1 block">Phone *</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1234567890" className="bg-white/5 border-white/10" /></div>
              <div><label className="text-sm font-medium mb-1 block">Username (optional)</label>
                <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="e.g. admin2" className="bg-white/5 border-white/10" /></div>
              <div><label className="text-sm font-medium mb-1 block">Email (optional)</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@elsawahtravel.com" className="bg-white/5 border-white/10" /></div>
              <div><label className="text-sm font-medium mb-1 block">Password *</label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" className="bg-white/5 border-white/10" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-white/10" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Admin"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Remove Admin?</h3>
            <p className="text-muted-foreground text-sm mb-5">This admin account will be permanently deleted and they will lose all access.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Removing..." : "Remove Admin"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
