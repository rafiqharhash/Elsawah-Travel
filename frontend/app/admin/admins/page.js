"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X, Shield, User, Edit2 } from "lucide-react";
import { useLang } from "@/app/providers";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
export default function ManageAdminsPage() {
  const {
    t
  } = useLang();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    username: "",
    password: "",
    email: ""
  });
  const [deleteId, setDeleteId] = useState(null);
  const [apiError, setApiError] = useState("");
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const res = await api.get("/users?role=Admin&limit=50");
      return res.data.data;
    }
  });
  const createMutation = useMutation({
    mutationFn: body => api.post("/users/admins", body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admins"]
      });
      closeAndReset();
    },
    onError: err => setApiError(err.response?.data?.message || "Failed to create admin")
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body
    }) => api.put(`/users/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admins"]
      });
      closeAndReset();
    },
    onError: err => setApiError(err.response?.data?.message || "Failed to update admin")
  });
  const closeAndReset = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      username: "",
      password: "",
      email: ""
    });
    setApiError("");
  };
  const handleEditClick = admin => {
    setForm({
      name: admin.name,
      phone: admin.phone,
      username: admin.username || "",
      password: "",
      // empty so it won't update unless typed
      email: admin.email || ""
    });
    setEditingId(admin._id);
    setShowModal(true);
  };
  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/users/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admins"]
      });
      setDeleteId(null);
    },
    onError: err => alert(err.response?.data?.message || "Failed to remove admin")
  });
  const admins = data || [];
  return /*#__PURE__*/_jsxDEV("div", {
    className: "space-y-6",
    children: [/*#__PURE__*/_jsxDEV("div", {
      className: "flex items-center justify-between",
      children: [/*#__PURE__*/_jsxDEV("div", {
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center gap-2 mb-1",
          children: [/*#__PURE__*/_jsxDEV(Shield, {
            size: 18,
            className: "text-purple-400"
          }, void 0, false), /*#__PURE__*/_jsxDEV("span", {
            className: "text-xs font-medium text-purple-400 uppercase tracking-widest",
            children: t("supervisorOnly")
          }, void 0, false)]
        }, void 0, true), /*#__PURE__*/_jsxDEV("h2", {
          className: "text-3xl font-bold tracking-tight",
          children: t("manageAdminsTitle")
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground mt-1",
          children: t("manageAdminsPageDesc")
        }, void 0, false)]
      }, void 0, true), /*#__PURE__*/_jsxDEV(Button, {
        onClick: () => {
          closeAndReset();
          setShowModal(true);
        },
        className: "gap-2 bg-purple-600 hover:bg-purple-700",
        children: [/*#__PURE__*/_jsxDEV(Plus, {
          size: 16
        }, void 0, false), " ", t("addAdmin")]
      }, void 0, true)]
    }, void 0, true), /*#__PURE__*/_jsxDEV(Card, {
      className: "border-white/5 bg-card/30 backdrop-blur-xl",
      children: /*#__PURE__*/_jsxDEV(CardContent, {
        className: "p-0",
        children: isLoading ? /*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-center py-16",
          children: /*#__PURE__*/_jsxDEV("div", {
            className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
          }, void 0, false)
        }, void 0, false) : admins.length === 0 ? /*#__PURE__*/_jsxDEV("div", {
          className: "text-center py-16 space-y-3",
          children: [/*#__PURE__*/_jsxDEV(User, {
            size: 40,
            className: "mx-auto text-muted-foreground/40"
          }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
            className: "text-muted-foreground",
            children: t("noAdmins")
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
                  children: t("username")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("phone")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("email")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("created")
                }, void 0, false), /*#__PURE__*/_jsxDEV("th", {
                  className: "text-left py-3 px-4 font-medium",
                  children: t("actions")
                }, void 0, false)]
              }, void 0, true)
            }, void 0, false), /*#__PURE__*/_jsxDEV("tbody", {
              children: admins.map(a => /*#__PURE__*/_jsxDEV("tr", {
                className: "border-b border-white/5 hover:bg-white/5 transition-colors",
                children: [/*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 font-medium",
                  children: a.name
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 font-mono text-primary",
                  children: a.username || "—"
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-muted-foreground",
                  children: a.phone
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-muted-foreground",
                  children: a.email || "—"
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4 text-muted-foreground",
                  children: new Date(a.createdAt).toLocaleDateString()
                }, void 0, false), /*#__PURE__*/_jsxDEV("td", {
                  className: "py-3 px-4",
                  children: /*#__PURE__*/_jsxDEV("div", {
                    className: "flex gap-1",
                    children: [/*#__PURE__*/_jsxDEV("button", {
                      onClick: () => handleEditClick(a),
                      className: "p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors",
                      children: /*#__PURE__*/_jsxDEV(Edit2, {
                        size: 14
                      }, void 0, false)
                    }, void 0, false), /*#__PURE__*/_jsxDEV("button", {
                      onClick: () => setDeleteId(a._id),
                      className: "p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors",
                      children: /*#__PURE__*/_jsxDEV(Trash2, {
                        size: 14
                      }, void 0, false)
                    }, void 0, false)]
                  }, void 0, true)
                }, void 0, false)]
              }, a._id, true))
            }, void 0, false)]
          }, void 0, true)
        }, void 0, false)
      }, void 0, false)
    }, void 0, false), showModal && /*#__PURE__*/_jsxDEV("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",
      onClick: closeAndReset,
      children: /*#__PURE__*/_jsxDEV("div", {
        className: "bg-card border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl",
        onClick: e => e.stopPropagation(),
        children: [/*#__PURE__*/_jsxDEV("div", {
          className: "flex items-center justify-between mb-5",
          children: [/*#__PURE__*/_jsxDEV("h3", {
            className: "text-lg font-bold flex items-center gap-2",
            children: [/*#__PURE__*/_jsxDEV(Shield, {
              size: 18,
              className: "text-purple-400"
            }, void 0, false), " ", editingId ? t("editAdmin") : t("createAdmin")]
          }, void 0, true), /*#__PURE__*/_jsxDEV("button", {
            onClick: closeAndReset,
            className: "text-muted-foreground hover:text-foreground",
            children: /*#__PURE__*/_jsxDEV(X, {
              size: 18
            }, void 0, false)
          }, void 0, false)]
        }, void 0, true), apiError && /*#__PURE__*/_jsxDEV("p", {
          className: "text-destructive text-sm mb-3 p-2 rounded bg-destructive/10",
          children: apiError
        }, void 0, false), /*#__PURE__*/_jsxDEV("div", {
          className: "space-y-3",
          children: [/*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: [t("fullName"), " *"]
            }, void 0, true), /*#__PURE__*/_jsxDEV(Input, {
              value: form.name,
              onChange: e => setForm(f => ({
                ...f,
                name: e.target.value
              })),
              placeholder: "",
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: [t("phone"), " *"]
            }, void 0, true), /*#__PURE__*/_jsxDEV(Input, {
              value: form.phone,
              onChange: e => setForm(f => ({
                ...f,
                phone: e.target.value
              })),
              placeholder: "+1234567890",
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: t("usernameOptional")
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              value: form.username,
              onChange: e => setForm(f => ({
                ...f,
                username: e.target.value
              })),
              placeholder: "",
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: t("emailOptional")
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              type: "email",
              value: form.email,
              onChange: e => setForm(f => ({
                ...f,
                email: e.target.value
              })),
              placeholder: "",
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            children: [/*#__PURE__*/_jsxDEV("label", {
              className: "text-sm font-medium mb-1 block",
              children: editingId ? t("newPassword") : t("password") + " *"
            }, void 0, false), /*#__PURE__*/_jsxDEV(Input, {
              type: "password",
              value: form.password,
              onChange: e => setForm(f => ({
                ...f,
                password: e.target.value
              })),
              placeholder: "",
              className: "bg-white/5 border-white/10"
            }, void 0, false)]
          }, void 0, true), /*#__PURE__*/_jsxDEV("div", {
            className: "flex gap-3 pt-2",
            children: [/*#__PURE__*/_jsxDEV(Button, {
              variant: "outline",
              className: "flex-1 border-white/10",
              onClick: closeAndReset,
              children: t("cancel")
            }, void 0, false), editingId ? /*#__PURE__*/_jsxDEV(Button, {
              className: "flex-1 bg-purple-600 hover:bg-purple-700",
              onClick: () => updateMutation.mutate({
                id: editingId,
                body: form
              }),
              disabled: updateMutation.isPending,
              children: updateMutation.isPending ? t("saving") : t("saveChanges")
            }, void 0, false) : /*#__PURE__*/_jsxDEV(Button, {
              className: "flex-1 bg-purple-600 hover:bg-purple-700",
              onClick: () => createMutation.mutate(form),
              disabled: createMutation.isPending,
              children: createMutation.isPending ? t("creating") : t("createAdmin")
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
          children: t("removeAdmin")
        }, void 0, false), /*#__PURE__*/_jsxDEV("p", {
          className: "text-muted-foreground text-sm mb-5",
          children: t("removeAdminConfirm")
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
            children: deleteMutation.isPending ? t("delete") : t("removeAdmin")
          }, void 0, false)]
        }, void 0, true)]
      }, void 0, true)
    }, void 0, false)]
  }, void 0, true);
}