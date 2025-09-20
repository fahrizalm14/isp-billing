"use client";

import { BillingModal } from "@/components/BillingModal";
import PaymentDetailModal from "@/components/PaymentDetailModal";
import PaymentFormModal from "@/components/PaymentFormModal";
import { SwalToast, showConfirm } from "@/components/SweetAlert";
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
  const [billingModal, setBillingModal] = useState({
    id: "",
    open: false,
  });

  useEffect(() => {
    fetchPayments();
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
    } catch (err) {
      setPayments([]);
      console.error(err);
      SwalToast.fire({ icon: "error", title: "Gagal memuat data" });
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleDelete = async (id: string) => {
    const confirm = await showConfirm(
      "Yakin ingin menghapus tagihan ini?",
      "warning",
      true
    );
    if (!confirm) return;

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

  return (
    <>
      <div className="p-6">
        <h2 className="text-xl font-semibold">Daftar Pembayaran</h2>

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

        {/* Table */}
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
              <TableHead className="px-4 py-2 text-center">#</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((pay) => (
              <TableRow key={pay.id}>
                <TableCell>{pay.number}</TableCell>
                <TableCell>{pay.customer}</TableCell>
                <TableCell>{pay.subscriptionNumber}</TableCell>
                <TableCell>
                  Rp {pay.amount.toLocaleString("id-ID")}
                  {pay.tax > 0 && ` + ${pay.tax}%`}
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
                <TableCell className="px-4 py-2 text-center flex justify-center gap-2">
                  <button
                    title="btnPaymentModal"
                    className="bg-primary text-white p-2 rounded hover:bg-primary/90"
                    onClick={() =>
                      setPaymentDetailModal({ id: pay.id, open: true })
                    }
                  >
                    <FaInfoCircle className="w-4 h-4" />
                  </button>

                  <button
                    title="btnBilledModal"
                    className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                    onClick={() => setBillingModal({ id: pay.id, open: true })}
                  >
                    <FaMoneyBillWave className="w-4 h-4" />
                  </button>

                  <button
                    title="btnDeletePayment"
                    className="bg-secondary text-white p-2 rounded hover:bg-secondary/70"
                    onClick={() => handleDelete(pay.id)}
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

      {/* Modal */}
      <PaymentFormModal
        open={paymentModal.open}
        paymentId={paymentModal.id}
        onClose={() => setPaymentModal({ id: "", open: false })}
        onSuccess={fetchPayments}
      />
      <PaymentDetailModal
        onClose={() =>
          setPaymentDetailModal((_prev) => ({ ..._prev, open: false }))
        }
        open={paymentDetailModal.open}
        id={paymentDetailModal.id}
      />
      <BillingModal
        onClose={() => {
          setBillingModal((_prev) => ({ ..._prev, open: false }));
        }}
        open={billingModal.open}
        id={billingModal.id}
        onSuccess={fetchPayments}
      />
    </>
  );
}
