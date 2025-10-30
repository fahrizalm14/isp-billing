"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { SwalToast } from "./SweetAlert";

type UserFormModalProps = {
  mode: "create" | "edit";
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: UserFormData;
};

export type UserFormData = {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  status: string;
};

const defaultForm: UserFormData = {
  name: "",
  email: "",
  password: "",
  role: "CUSTOMER",
  status: "ACTIVE",
};

export default function UserFormModal({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: UserFormModalProps) {
  const [form, setForm] = useState<UserFormData>(defaultForm);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({ ...initialData, password: "" }); // kosongkan password saat edit
    } else {
      setForm(defaultForm);
    }
  }, [mode, initialData, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "create" && !form.password) {
      SwalToast.fire({
        title: "Password wajib diisi untuk user baru",
        icon: "warning",
      });
      return;
    }

    onSubmit(form);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-full max-w-lg space-y-4">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah User Baru" : "Edit User"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nama"
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full border px-3 py-2 rounded"
            required
          />
          {(mode === "create" || (mode === "edit" && form.id)) && (
            <input
              name="password"
              type="password"
              value={form.password || ""}
              onChange={handleChange}
              placeholder={
                mode === "create" ? "Password" : "Kosongkan jika tidak diubah"
              }
              className="w-full border px-3 py-2 rounded"
              required={mode === "create"}
            />
          )}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
          >
            <option value="CUSTOMER">Konsumen</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            name="status"
            value={form.status.toUpperCase()}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-secondary text-secondary-foreground"
          >
            <option value="ACTIVE">Aktif</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPEND">Suspend</option>
          </select>
          <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-secondary text-white hover:bg-secondary/90 rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded disabled:opacity-60"
              disabled={loading}
            >
              {loading
                ? "Menyimpan..."
                : mode === "create"
                ? "Simpan"
                : "Update"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
