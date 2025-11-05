"use client";

import { BillingModal } from "@/components/BillingModal";
import PaymentDetailModal from "@/components/PaymentDetailModal";
import PaymentFormModal from "@/components/PaymentFormModal";
import { SwalToast } from "@/components/SweetAlert";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Loader from "@/components/ui/custom/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaInfoCircle,
  FaMoneyBillWave,
  FaSyncAlt,
  FaTrash,
} from "react-icons/fa";

interface PaymentSummary {
  id: string;
  number: string;
  customer: string;
  subscriptionNumber: string;
  amount: number;
  subtotal: number;
  discount: number;
  taxValue: number;
  tax: number;
  status: string;
  createdAt: string;
  expiredAt: string;
}

export default function PaymentPage() {
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [paymentModal, setPaymentModal] = useState({ id: "", open: false });
  const [paymentDetailModal, setPaymentDetailModal] = useState({
    id: "",
    open: false,
  });
  const [billingModal, setBillingModal] = useState({ id: "", open: false });
  const [deletePayment, setDeletePayment] = useState({
    id: "",
    name: "",
    open: false,
  });

  // Midtrans config state
  const [serverKey, setServerKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [showServer, setShowServer] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Fetch payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/payment?search=${search}&page=${page}&limit=10`
      );
      if (!res.ok) throw new Error("Gagal memuat data.");
      const result = await res.json();
      setPayments(result.data);
      setTotalPages(result.totalPages || 1);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setPayments([]);
      SwalToast.fire({ icon: "error", title: "Gagal memuat data" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch midtrans config
  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/website-info/payment");
      if (!res.ok) return;
      const result = await res.json();
      if (result?.data) {
        setServerKey(result.data.midtransServerKey || "");
        setSecretKey(result.data.midtransSecretKey || "");
      }
    } catch (err) {
      console.error("Fetch config error:", err);
    }
  };

  // Delete payment
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payment/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) {
        SwalToast.fire("Ooops...", data.error, "error");
      } else {
        fetchPayments();
        SwalToast.fire("Yess....", data.message, "success");
      }
    } finally {
      setLoading(false);
    }
  };

  // Save midtrans keys
  const handleSaveMidtrans = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverKey || !secretKey) {
      SwalToast.fire({ icon: "error", title: "Semua field wajib diisi" });
      return;
    }
    try {
      setSavingConfig(true);
      const res = await fetch("/api/website-info/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          midtransServerKey: serverKey,
          midtransSecretKey: secretKey,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gagal simpan");
      SwalToast.fire({
        icon: "success",
        title: result.message || "Konfigurasi disimpan",
      });
    } catch (err) {
      SwalToast.fire({
        icon: "error",
        title: (err as Error).message || "Gagal menyimpan konfigurasi",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <>
      <div className="p-6">
        {/* Konfigurasi Midtrans */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
          <h2 className="text-xl font-semibold">Konfigurasi Midtrans</h2>

          <form
            onSubmit={handleSaveMidtrans}
            className="flex items-center gap-2 w-full md:w-auto"
          >
            {/* Server Key */}
            <div className="relative w-full sm:w-64">
              <input
                type={showServer ? "text" : "password"}
                value={serverKey}
                onChange={(e) => setServerKey(e.target.value)}
                placeholder="Server Key"
                className="border rounded px-3 py-2 w-full pr-10"
                disabled={savingConfig}
              />
              <button
                type="button"
                onClick={() => setShowServer((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showServer ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Secret Key */}
            <div className="relative w-full sm:w-64">
              <input
                type={showSecret ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Secret Key"
                className="border rounded px-3 py-2 w-full pr-10"
                disabled={savingConfig}
              />
              <button
                type="button"
                onClick={() => setShowSecret((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showSecret ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={savingConfig}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 whitespace-nowrap"
            >
              {savingConfig ? "Menyimpan..." : "Simpan"}
            </button>
          </form>
        </div>

        <h2 className="text-xl font-semibold mb-4">Daftar Pembayaran</h2>

        {/* Tombol atas */}
        <div className="flex flex-col md:flex-row justify-between mt-4 mb-2 items-start md:items-center gap-2">
          <div className="w-full md:w-auto flex gap-2">
            <button
              className="w-full md:w-auto bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
              onClick={() => setPaymentModal({ id: "", open: true })}
            >
              + Buat Tagihan
            </button>
          </div>

          {/* Search + Refresh */}
          <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <input
              type="text"
              placeholder="Cari pembayaran..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-64 border rounded px-3 py-2"
            />
            <button
              className="w-full md:w-auto bg-primary text-white px-3 py-2 rounded hover:bg-primary/90 flex items-center justify-center gap-1"
              onClick={fetchPayments}
              disabled={loading}
            >
              <FaSyncAlt /> Refresh
            </button>
          </div>
        </div>

        {/* Table Pembayaran */}
        <Table className="table-auto w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Nomor Tagihan</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tgl Dibuat</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead className="text-center">#</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((pay) => (
              <TableRow key={pay.id}>
                <TableCell>{pay.number}</TableCell>
                <TableCell>{pay.customer}</TableCell>
                <TableCell>{pay.subscriptionNumber}</TableCell>
                <TableCell>
                  <div className="font-semibold">
                    Rp {pay.amount.toLocaleString("id-ID")}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      pay.status === "SUCCESS"
                        ? "bg-green-600"
                        : pay.status === "PENDING"
                        ? "bg-yellow-600"
                        : "bg-red-600"
                    }`}
                  >
                    {pay.status}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(pay.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell>
                  {pay.expiredAt
                    ? new Date(pay.expiredAt).toLocaleDateString("id-ID")
                    : "-"}
                </TableCell>
                <TableCell className="flex justify-center gap-2">
                  <button
                    title="detail"
                    className="bg-primary text-white p-2 rounded hover:bg-primary/90"
                    onClick={() =>
                      setPaymentDetailModal({ id: pay.id, open: true })
                    }
                  >
                    <FaInfoCircle className="w-4 h-4" />
                  </button>
                  <button
                    title="billing"
                    className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                    onClick={() => setBillingModal({ id: pay.id, open: true })}
                  >
                    <FaMoneyBillWave className="w-4 h-4" />
                  </button>
                  <button
                    title="hapus"
                    className="bg-secondary text-white p-2 rounded hover:bg-secondary/70"
                    onClick={() =>
                      setDeletePayment({
                        id: pay.id,
                        name: pay.subscriptionNumber,
                        open: true,
                      })
                    }
                    disabled={pay.status === "SUCCESS"}
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {!payments.length && !loading && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-4 text-gray-500"
                >
                  Tidak ada data pembayaran
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1 border rounded transition ${
                page === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`px-3 py-1 border rounded transition ${
                page === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Loader loading={loading} />

      {/* Modals */}
      <PaymentFormModal
        open={paymentModal.open}
        paymentId={paymentModal.id}
        onClose={() => setPaymentModal({ id: "", open: false })}
        onSuccess={fetchPayments}
      />
      <PaymentDetailModal
        open={paymentDetailModal.open}
        id={paymentDetailModal.id}
        onClose={() => setPaymentDetailModal({ id: "", open: false })}
      />
      <BillingModal
        open={billingModal.open}
        id={billingModal.id}
        onClose={() => setBillingModal({ id: "", open: false })}
        onSuccess={fetchPayments}
      />

      {/* ConfirmDialog */}
      <ConfirmDialog
        open={deletePayment.open}
        onOpenChange={(change) =>
          setDeletePayment((prev) => ({ ...prev, open: change }))
        }
        title="Hapus item?"
        description={
          <>
            Tindakan ini tidak bisa dibatalkan. Untuk mengkonfirmasi, ketik nama
            item persis.
          </>
        }
        // requiredText={deletePayment.name}
        matchMode="equals"
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={() => handleDelete(deletePayment.id)}
      />
    </>
  );
}
