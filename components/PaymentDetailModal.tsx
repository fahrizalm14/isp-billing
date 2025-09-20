"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";

interface PaymentDetailModalProps {
  id: string;
  open: boolean;
  onClose: () => void;
}

interface PaymentDetail {
  id: string;
  number: string;
  transactionNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  dueDate: string | null;
  packageName: string;
  customer: string;
}

export default function PaymentDetailModal({
  id,
  open,
  onClose,
}: PaymentDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<PaymentDetail | null>(null);

  useEffect(() => {
    if (open && id) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/payment/${id}`);
      if (!res.ok) throw new Error("Gagal memuat detail pembayaran");
      const result = await res.json();
      setDetail(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="flex items-center gap-2 text-green-600 font-semibold">
            <FaCheckCircle /> Sukses
          </span>
        );
      case "PENDING":
        return (
          <span className="flex items-center gap-2 text-yellow-600 font-semibold">
            <FaClock /> Pending
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-2 text-red-600 font-semibold">
            <FaTimesCircle /> Gagal
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg rounded-2xl shadow-lg"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Detail Pembayaran
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : detail ? (
          <div className="space-y-5 text-sm">
            {/* Nomor Tagihan */}
            <div className="grid grid-cols-2 gap-4 border-b pb-3">
              <div>
                <p className="text-gray-500">Nomor Tagihan</p>
                <p className="font-semibold text-base">
                  {detail.transactionNumber}
                </p>
              </div>
              <div>
                <p className="text-gray-500">TX ID</p>
                <p>{detail.id.toUpperCase()}</p>
              </div>
            </div>

            {/* Customer & Paket */}
            <div className="grid grid-cols-2 gap-4 border-b pb-3">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">{detail.customer}</p>
              </div>
              <div>
                <p className="text-gray-500">Paket</p>
                <p className="font-medium">{detail.packageName}</p>
              </div>
            </div>

            {/* Amount */}
            <div className="border-b pb-3">
              <p className="text-gray-500">Jumlah</p>
              <p className="font-bold text-primary">
                Rp {detail.amount.toLocaleString("id-ID")}
              </p>
            </div>

            {/* Status */}
            <div className="border-b pb-3">
              <p className="text-gray-500">Status</p>
              {renderStatus(detail.status)}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Tgl Dibuat</p>
                <p className="font-medium">
                  {new Date(detail.createdAt).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Jatuh Tempo</p>
                <p className="font-medium">
                  {detail.dueDate
                    ? new Date(detail.dueDate).toLocaleDateString("id-ID")
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Data tidak ditemukan.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
