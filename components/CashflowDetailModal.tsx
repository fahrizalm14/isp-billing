"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface CashflowDetailModalProps {
  id: string;
  open: boolean;
  onClose: () => void;
}

interface CashflowDetail {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CashflowDetailModal({
  id,
  open,
  onClose,
}: CashflowDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CashflowDetail | null>(null);

  useEffect(() => {
    if (open && id) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cash-flow/${id}`);
      if (!res.ok) throw new Error("Gagal memuat detail cashflow");
      const result = await res.json();
      setDetail(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Spinner loader modern
  const Spinner = () => (
    <div className="flex justify-center items-center py-12">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Detail Cashflow
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <Spinner />
        ) : detail ? (
          <div className="space-y-4 text-sm">
            {/* Type & Amount */}
            <div className="flex justify-between items-center border-b pb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  detail.type === "INCOME"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {detail.type}
              </span>
              <span className="text-lg font-bold text-primary">
                Rp {detail.amount.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Description */}
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-500">Deskripsi</p>
              <p className="font-medium">{detail.description || "-"}</p>
            </div>

            {/* Date */}
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-500">Tanggal</p>
              <p className="font-medium">
                {new Date(detail.date).toLocaleDateString("id-ID")}
              </p>
            </div>

            {/* Reference */}
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-500">Ref Payment</p>
              <p className="font-medium">{detail.reference || "-"}</p>
            </div>

            {/* Created */}
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-500">Dibuat</p>
              <p className="font-medium">
                {new Date(detail.createdAt).toLocaleString("id-ID")}
              </p>
            </div>

            {/* Updated */}
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-500">Diperbarui</p>
              <p className="font-medium">
                {new Date(detail.updatedAt).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">
            Data tidak ditemukan.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
