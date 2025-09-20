"use client";

import SubscriptionSelectModal from "@/components/SubscriptionSelectModal";
import { SwalToast } from "@/components/SweetAlert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface PaymentFormModalProps {
  open: boolean;
  paymentId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PaymentForm {
  subscriptionId: string;
  amount: number;
  taxAmount: number;
  expiredAt?: string;
}

export default function PaymentFormModal({
  open,
  paymentId,
  onClose,
  onSuccess,
}: PaymentFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PaymentForm>({
    subscriptionId: "",
    amount: 0,
    taxAmount: 0,
  });

  // UI state saja
  const [subscriptionNumber, setSubscriptionNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [subscriptionModal, setSubscriptionModal] = useState(false);

  useEffect(() => {
    if (open && paymentId) {
      fetchPayment();
    } else if (open && !paymentId) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paymentId]);

  const resetForm = () => {
    setForm({
      subscriptionId: "",
      amount: 0,
      taxAmount: 0,
    });
    setSubscriptionNumber("");
    setCustomerName("");
    setPackageName("");
  };

  const fetchPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payment/${paymentId}`);
      if (!res.ok) throw new Error("Gagal memuat data pembayaran.");
      const result = await res.json();
      const p = result.data;

      setForm({
        subscriptionId: p.subscriptionId,
        amount: p.amount,
        taxAmount: p.taxAmount,
        expiredAt: p.expiredAt ? p.expiredAt.split("T")[0] : "",
      });

      setSubscriptionNumber(p.subscriptionNumber || "");
      setCustomerName(p.customer || "");
      setPackageName(p.packageName || "");
    } catch (error) {
      console.error(error);
      SwalToast.fire({ icon: "error", title: "Gagal memuat data pembayaran" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        paymentId ? `/api/payment/${paymentId}` : "/api/payment",
        {
          method: paymentId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Terjadi kesalahan.");
      }

      SwalToast.fire({
        icon: "success",
        title: `Tagihan berhasil ${paymentId ? "diperbarui" : "dibuat"}!`,
      });

      onClose();
      onSuccess?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      SwalToast.fire({ icon: "error", title: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!subscriptionModal && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent
            className="max-w-lg"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                {paymentId ? "Edit Tagihan" : "Buat Tagihan Baru"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subscription */}
              <div>
                <label className="block text-sm font-medium">
                  Subscription
                </label>
                <div className="flex gap-2">
                  <input
                    title="inputSubscriptionDisplay"
                    type="text"
                    value={
                      subscriptionNumber && customerName
                        ? `${subscriptionNumber} - ${customerName}`
                        : ""
                    }
                    readOnly
                    placeholder="Pilih subscription..."
                    className="flex-1 border rounded px-3 py-2 cursor-pointer"
                    onClick={() => setSubscriptionModal(true)}
                  />
                  <button
                    type="button"
                    title="btnSelectSubscription"
                    className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/90"
                    onClick={() => setSubscriptionModal(true)}
                  >
                    Pilih
                  </button>
                </div>
                {packageName && (
                  <p className="text-xs text-gray-500 mt-1">{packageName}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium">Jumlah (Rp)</label>
                <input
                  title="inputPaymentAmount"
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              {/* Tax */}
              <div>
                <label className="block text-sm font-medium">Pajak (%)</label>
                <input
                  title="inputPaymentTax"
                  type="number"
                  value={form.taxAmount}
                  onChange={(e) =>
                    setForm({ ...form, taxAmount: Number(e.target.value) })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  title="btnCancelPayment"
                  disabled={loading}
                  className="px-4 py-2 rounded border hover:bg-secondary-100 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  title="btnSubmitPayment"
                  className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : paymentId ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Select Subscription */}
      <SubscriptionSelectModal
        open={subscriptionModal}
        onClose={() => setSubscriptionModal(false)}
        onSelect={(subs) => {
          setForm({
            ...form,
            subscriptionId: subs.id,
            amount: subs.packagePrice || 0,
          });
          setSubscriptionNumber(subs.number);
          setCustomerName(subs.name || "");
          setPackageName(subs.packageName || "");
          setSubscriptionModal(false);
        }}
      />
    </>
  );
}
