"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Shield, User, Edit2 } from "lucide-react";

interface Admin { _id: string; name: string; phone: string; username?: string; email?: string; role: string; createdAt: string; }
import { useLang } from "@/app/providers";

export default function ManageAdminsPage() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admins"] }); closeAndReset(); },
    onError: (err: any) => setApiError(err.response?.data?.message || "Failed to create admin"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string, body: any }) => api.put(`/users/${id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admins"] }); closeAndReset(); },
    onError: (err: any) => setApiError(err.response?.data?.message || "Failed to update admin"),
  });

  const closeAndReset = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ name: "", phone: "", username: "", password: "", email: "" });
    setApiError("");
  };

  const handleEditClick = (admin: Admin) => {
    setForm({
      name: admin.name,
      phone: admin.phone,
      username: admin.username || "",
      password: "", // empty so it won't update unless typed
      email: admin.email || "",
    });
    setEditingId(admin._id);
    setShowModal(true);
  };


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
            <span className="text-xs font-medium text-purple-400 uppercase tracking-widest">{t("supervisorOnly")}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{t("manageAdminsTitle")}</h2>
          <p className="text-muted-foreground mt-1">{t("manageAdminsPageDesc")}</p>
        </div>
        <Button onClick={() => { closeAndReset(); setShowModal(true); }} className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Plus size={16} /> {t("addAdmin")}
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
              <p className="text-muted-foreground">{t("noAdmins")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-muted-foreground">
                    <th className="text-left py-3 px-4 font-medium">{t("name")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("username")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("phone")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("email")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("created")}</th>
                    <th className="text-left py-3 px-4 font-medium">{t("actions")}</th>
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
                        <div className="flex gap-1">
                          <button onClick={() => handleEditClick(a)} className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteId(a._id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeAndReset}>
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2"><Shield size={18} className="text-purple-400" /> {editingId ? t("editAdmin") : t("createAdmin")}</h3>
              <button onClick={closeAndReset} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            {apiError && <p className="text-destructive text-sm mb-3 p-2 rounded bg-destructive/10">{apiError}</p>}
            <div className="space-y-3">
              <div><label className="text-sm font-medium mb-1 block">{t("fullName")} *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="" className="bg-white/5 border-white/10" /></div>
              <div><label className="text-sm font-medium mb-1 block">{t("phone")} *</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1234567890" className="bg-white/5 border-white/10" /></div>
              <div><label className="text-sm font-medium mb-1 block">{t("usernameOptional")}</label>
                <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="" className="bg-white/5 border-white/10" /></div>
              <div><label className="text-sm font-medium mb-1 block">{t("emailOptional")}</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="" className="bg-white/5 border-white/10" /></div>
              <div><label className="text-sm font-medium mb-1 block">{editingId ? t("newPassword") : t("password") + " *"}</label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="" className="bg-white/5 border-white/10" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-white/10" onClick={closeAndReset}>{t("cancel")}</Button>
                {editingId ? (
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => updateMutation.mutate({ id: editingId, body: form })} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? t("saving") : t("saveChanges")}
                  </Button>
                ) : (
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                    {createMutation.isPending ? t("creating") : t("createAdmin")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-2">{t("removeAdmin")}</h3>
            <p className="text-muted-foreground text-sm mb-5">{t("removeAdminConfirm")}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/10" onClick={() => setDeleteId(null)}>{t("cancel")}</Button>
              <Button variant="destructive" className="flex-1" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? t("delete") : t("removeAdmin")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
