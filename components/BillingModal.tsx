"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { showConfirm, SwalToast } from "./SweetAlert";

interface PaymentDetailModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  id: string;
}

interface PaymentDetail {
  amount: number;
  status: "PENDING" | "SUCCESS" | "CANCELLED";
  paymentLink: string;
  transactionNumber?: string;
  createdAt: string;
}

export function BillingModal({
  open,
  onClose,
  onSuccess,
  id,
}: PaymentDetailModalProps) {
  const [method, setMethod] = useState<"manual" | "gateway">("manual");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentDetail>({
    amount: 0,
    createdAt: "",
    transactionNumber: "",
    status: "PENDING",
    paymentLink: "",
  });

  useEffect(() => {
    if (open) getPaymentById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, open]);

  const getPaymentById = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payment/${id}`);
      const { data } = await res.json();
      setPayment(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPayment = async () => {
    if (
      await showConfirm(
        "Eiiits..",
        "question",
        false,
        "Apakah kamu yakin akan melanjutkan pembayaran manual?"
      )
    ) {
      try {
        setLoading(true);

        const res = await fetch(`/api/payment/${id}`, {
          method: "POST",
          body: JSON.stringify({ reference }),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok)
          return SwalToast.fire({
            icon: "error",
            title: "Gagak melakukan pembayaran manual.",
          });
        await getPaymentById();

        SwalToast.fire({
          icon: "success",
          title: "Berhasil melakukan pembayaran manual.",
        });
        setReference("");
        onSuccess();
      } catch (error) {
        console.log(error);

        SwalToast.fire({
          icon: "error",
          title: "Gagak melakukan pembayaran manual.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGatewayPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/midtrans/${id}`);
      if (res.ok) {
        const url = await res.json();
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        SwalToast.fire({
          icon: "error",
          title: "Gagal membuat payment gateway.",
        });
      }
    } catch (error) {
      console.error(error);
      SwalToast.fire({
        icon: "error",
        title: "Gagal membuat payment gateway.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInvoice = () => {
    window.open(`/invoice/${id}`, "_blank");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-6 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h2 className="text-lg font-bold">Detail Pembayaran</h2>
          <Button
            size="sm"
            variant="outline"
            className="hover:bg-secondary/90"
            onClick={getPaymentById}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                Refresh...
              </span>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>

        {/* Body */}
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs">Transaction #</p>
              <p className="font-medium">{payment?.transactionNumber || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Jumlah</p>
              <p className="font-semibold text-primary">
                Rp {payment?.amount.toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Status</p>
              <span
                className={`inline-block px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${
                  payment?.status === "SUCCESS"
                    ? "bg-green-100 text-green-700"
                    : payment?.status === "CANCELLED"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {payment?.status}
              </span>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Tgl Dibuat</p>
              <p className="font-medium">
                {payment?.createdAt
                  ? new Date(payment.createdAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "-"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="hover:bg-secondary/90"
              onClick={handleOpenInvoice}
            >
              Lihat Invoice
            </Button>
            {/* WA share optional */}
          </div>
        </div>

        {/* Payment Tabs */}
        {payment?.status !== "SUCCESS" && (
          <div className="mt-6">
            <div className="flex border-b text-sm font-medium">
              <button
                onClick={() => setMethod("manual")}
                className={`flex-1 py-2 text-center transition ${
                  method === "manual"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 hover:text-primary"
                }`}
              >
                Bayar Manual
              </button>
              <button
                onClick={() => setMethod("gateway")}
                className={`flex-1 py-2 text-center transition ${
                  method === "gateway"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 hover:text-primary"
                }`}
              >
                Payment Gateway
              </button>
            </div>

            {/* Manual Payment */}
            {method === "manual" && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="reference">No. Referensi / Transfer</Label>
                <Input
                  id="reference"
                  placeholder="Masukkan nomor referensi"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            )}

            {/* Gateway Payment */}
            {method === "gateway" && (
              <div className="mt-4 text-gray-600 text-sm">
                Anda akan diarahkan ke halaman pembayaran pihak ketiga untuk
                menyelesaikan transaksi ini.
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6 border-t pt-4">
          <Button
            variant="outline"
            className="hover:bg-secondary/90"
            onClick={onClose}
          >
            Tutup
          </Button>
          {payment?.status !== "SUCCESS" &&
            (method === "manual" ? (
              <Button
                disabled={loading}
                onClick={handleManualPayment}
                className="bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300"
              >
                {loading ? "Memproses..." : "Konfirmasi Manual"}
              </Button>
            ) : (
              <Button
                disabled={loading}
                onClick={handleGatewayPayment}
                className="bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300"
              >
                {loading ? "Memproses..." : "Generate Gateway"}
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
}
