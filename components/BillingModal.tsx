"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { SwalToast } from "./SweetAlert";

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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="w-full max-w-xl space-y-5 p-4 sm:p-6 text-sm">
        <DialogHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <DialogTitle className="text-lg font-bold">
            Detail Pembayaran
          </DialogTitle>
          <Button
            size="sm"
            variant="outline"
            className="self-start hover:bg-secondary/90 sm:self-auto"
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
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="flex flex-col gap-2 pt-4 border-t border-dashed sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            className="hover:bg-secondary/90"
            onClick={handleOpenInvoice}
          >
            Lihat Invoice
          </Button>
        </div>

        {payment?.status !== "SUCCESS" && (
          <div className="space-y-4">
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

            {method === "manual" && (
              <div className="space-y-2">
                <Label htmlFor="reference">No. Referensi / Transfer</Label>
                <Input
                  id="reference"
                  placeholder="Masukkan nomor referensi"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            )}

            {method === "gateway" && (
              <div className="text-gray-600 text-sm">
                Anda akan diarahkan ke halaman pembayaran pihak ketiga untuk
                menyelesaikan transaksi ini.
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
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
      </DialogContent>
    </Dialog>
  );
}
