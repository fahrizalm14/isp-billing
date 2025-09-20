"use client";

import { SwalToast } from "@/components/SweetAlert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface CashflowFormModalProps {
  open: boolean;
  cashflowId?: string; // edit mode kalau ada
  onClose: () => void;
  onSuccess?: () => void;
}

interface CashflowForm {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: string;
}

export default function CashflowFormModal({
  open,
  cashflowId,
  onClose,
  onSuccess,
}: CashflowFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CashflowForm>({
    type: "INCOME",
    amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // reset / fetch
  useEffect(() => {
    if (open && cashflowId) {
      fetchCashflow();
    } else if (open && !cashflowId) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cashflowId]);

  const resetForm = () => {
    setForm({
      type: "INCOME",
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const fetchCashflow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cash-flow/${cashflowId}`);
      if (!res.ok) throw new Error("Gagal memuat cashflow.");
      const result = await res.json();
      const cf = result.data;
      setForm({
        type: cf.type,
        amount: cf.amount,
        description: cf.description || "",
        date: cf.date
          ? cf.date.split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      SwalToast.fire({ icon: "error", title: "Gagal memuat cashflow" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        cashflowId ? `/api/cash-flow/${cashflowId}` : "/api/cash-flow",
        {
          method: cashflowId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const result = await res.json();
      if (!res.ok || result.error)
        throw new Error(result.error || "Terjadi kesalahan");

      SwalToast.fire({
        icon: "success",
        title: `Cashflow berhasil ${
          cashflowId ? "diperbarui" : "ditambahkan"
        }!`,
      });

      onClose();
      onSuccess?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      SwalToast.fire({ icon: "error", title: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Spinner inline
  const Spinner = () => (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {cashflowId ? "Edit Cashflow" : "Tambah Cashflow"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium">Tipe</label>
            <select
              title="selectCashFlowType"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as "INCOME" | "EXPENSE",
                })
              }
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="INCOME">INCOME (Pemasukan)</option>
              <option value="EXPENSE">EXPENSE (Pengeluaran)</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium">Jumlah (Rp)</label>
            <input
              title="inputAmountCashFlow"
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: Number(e.target.value) })
              }
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium">Deskripsi</label>
            <textarea
              title="textAreaCashFlow"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
              rows={2}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium">Tanggal</label>
            <input
              title="inputDateCashFlow"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border hover:bg-secondary/100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 flex items-center justify-center gap-2 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading && <Spinner />}
              {cashflowId ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
