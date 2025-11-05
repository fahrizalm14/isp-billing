"use client";

import SubscriptionSelectModal from "@/components/SubscriptionSelectModal";
import { SwalToast } from "@/components/SweetAlert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calculatePaymentTotals } from "@/lib/paymentTotals";
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

interface SubscriptionData {
  discount: number;
  additionalPrice: number;
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

  // Data dari subscription
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    discount: 0,
    additionalPrice: 0,
  });

  const totals = calculatePaymentTotals({
    amount: form.amount,
    discount: subscriptionData.discount,
    additionalPrice: subscriptionData.additionalPrice,
    taxPercent: form.taxAmount,
  });
  const taxInfo =
    totals.taxPercent > 0
      ? ` (Pajak ${totals.taxPercent}% = Rp ${totals.taxValue.toLocaleString(
          "id-ID"
        )})`
      : "";

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
    setSubscriptionData({
      discount: 0,
      additionalPrice: 0,
    });
  };

  const fetchPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payment/${paymentId}`);
      if (!res.ok) throw new Error("Gagal memuat data pembayaran.");
      const result = await res.json();
      const p = result.data;

      setForm({
        subscriptionId: p.subscriptionId || "",
        amount: p.amount,
        taxAmount: p.taxAmount,
        expiredAt: p.expiredAt ? p.expiredAt.split("T")[0] : "",
      });

      setSubscriptionNumber(p.subscriptionNumber || "");
      setCustomerName(p.customer || "");
      setPackageName(p.packageName || "");
      setSubscriptionData({
        discount: p.discount ?? 0,
        additionalPrice: p.additionalPrice ?? 0,
      });
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
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setForm({
                      ...form,
                      amount: Number.isNaN(value) ? 0 : Math.max(value, 0),
                    });
                  }}
                  className="w-full border rounded px-3 py-2"
                  min={0}
                  required
                />
              </div>

              {/* Info Diskon & Biaya Tambahan dari Subscription */}
              {form.subscriptionId && (
                <div className="p-3 rounded-md border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diskon:</span>
                    <span className="font-medium">
                      Rp {subscriptionData.discount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Biaya Tambahan:</span>
                    <span className="font-medium">
                      Rp{" "}
                      {subscriptionData.additionalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Tagihan:</span>
                      <span className="text-primary">
                        Rp {totals.total.toLocaleString("id-ID")}
                      </span>
                    </div>
                    {taxInfo && (
                      <p className="text-xs text-gray-500 mt-1">{taxInfo}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tax */}
              <div>
                <label className="block text-sm font-medium">Pajak (%)</label>
                <input
                  title="inputPaymentTax"
                  type="number"
                  value={form.taxAmount}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setForm({
                      ...form,
                      taxAmount: Number.isNaN(value) ? 0 : Math.max(value, 0),
                    });
                  }}
                  className="w-full border rounded px-3 py-2"
                  min={0}
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
          setSubscriptionData({
            discount: subs.discount ?? 0,
            additionalPrice: subs.additionalPrice ?? 0,
          });
          setSubscriptionModal(false);
        }}
      />
    </>
  );
}
