"use client";

import CashflowDetailModal from "@/components/CashflowDetailModal";
import CashflowExportModal from "@/components/CashflowExportModal";
import CashflowFormModal from "@/components/CashflowFormModal";
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
import { FaInfoCircle, FaPencilAlt, FaSyncAlt, FaTrash } from "react-icons/fa";

interface CashflowSummary {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: string;
  reference?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CashflowPage() {
  const [cashflows, setCashflows] = useState<CashflowSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formModal, setFormModal] = useState({ id: "", open: false });
  const [detailModal, setDetailModal] = useState({ id: "", open: false });
  const [exportModal, setExportModal] = useState(false);

  const [deleteCashFlow, setDeleteCashFlow] = useState({
    id: "",
    name: "",
    open: false,
  });

  useEffect(() => {
    fetchCashflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Fetch data
  const fetchCashflows = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/cash-flow?search=${search}&page=${page}&limit=10`
      );
      if (!res.ok) throw new Error("Gagal memuat data.");
      const result = await res.json();
      setCashflows(result.data);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error(err);
      SwalToast.fire({ icon: "error", title: "Gagal memuat data" });
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cash-flow/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) {
        SwalToast.fire("Ooops...", data.error, "error");
      } else {
        fetchCashflows();
        // SwalToast.fire("Berhasil", data.message, "success");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-6">
        <h2 className="text-xl font-semibold">Manajemen Cashflow</h2>

        {/* Tombol atas */}
        <div className="flex flex-col md:flex-row justify-between mt-4 mb-2 items-start md:items-center gap-2">
          <div className="w-full md:w-auto flex gap-2">
            <button
              className="w-full md:w-auto bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
              onClick={() => setFormModal({ id: "", open: true })}
            >
              + Tambah Cashflow
            </button>
            <button
              className="w-full md:w-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={() => setExportModal(true)}
            >
              Export
            </button>
          </div>

          {/* Search + Refresh */}
          <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <input
              type="text"
              placeholder="Cari deskripsi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-64 border rounded px-3 py-2"
            />
            <button
              className="w-full md:w-auto bg-primary text-white px-3 py-2 rounded hover:bg-primary/90 flex items-center justify-center gap-1"
              onClick={fetchCashflows}
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
              <TableHead>Tipe</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Ref Payment</TableHead>
              <TableHead className="px-4 py-2 text-center">#</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashflows.map((cf) => (
              <TableRow key={cf.id}>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      cf.type === "INCOME"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {cf.type}
                  </span>
                </TableCell>
                <TableCell>Rp {cf.amount.toLocaleString("id-ID")}</TableCell>
                <TableCell>{cf.description || "-"}</TableCell>
                <TableCell>{formatDate(cf.date)}</TableCell>
                <TableCell>{cf.reference || "-"}</TableCell>
                <TableCell className="px-4 py-2 text-center flex justify-center gap-2">
                  <button
                    title="btnDetailodal"
                    className="bg-green-600 text-white p-2 rounded hover:bg-green-900"
                    onClick={() => setDetailModal({ id: cf.id, open: true })}
                  >
                    <FaInfoCircle className="w-4 h-4" />
                  </button>
                  {/* Tombol Update */}
                  <button
                    title="btnUpdateCashFlow"
                    className="bg-primary text-white p-2 rounded hover:bg-primary/70"
                    onClick={() => setFormModal({ id: cf.id, open: true })}
                  >
                    <FaPencilAlt className="w-4 h-4" />
                  </button>
                  <button
                    title="btnDeleteCashFlow"
                    className="bg-secondary text-white p-2 rounded hover:bg-secondary/70"
                    onClick={() =>
                      setDeleteCashFlow({
                        id: cf.id,
                        name: `${cf.amount}`,
                        open: true,
                      })
                    }
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
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
      <CashflowFormModal
        open={formModal.open}
        cashflowId={formModal.id}
        onClose={() => setFormModal({ id: "", open: false })}
        onSuccess={fetchCashflows}
      />
      <CashflowDetailModal
        open={detailModal.open}
        id={detailModal.id}
        onClose={() => setDetailModal({ id: "", open: false })}
      />

      <CashflowExportModal
        open={exportModal}
        onClose={() => setExportModal(false)}
        onExport={(range) => {
          // panggil API export dengan range.from & range.to
          window.open(
            `/api/cash-flow/export?from=${range.from}&to=${range.to}`,
            "_blank"
          );
        }}
      />

      <ConfirmDialog
        open={deleteCashFlow.open}
        onOpenChange={(change) =>
          setDeleteCashFlow((_prev) => ({ ..._prev, open: change }))
        }
        title="Hapus item?"
        description={
          <>
            Tindakan ini tidak bisa dibatalkan. Untuk mengkonfirmasi, ketik nama
            item persis.
          </>
        }
        requiredText={deleteCashFlow.name}
        matchMode="equals" // tidak case sensitive
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={() => handleDelete(deleteCashFlow.id)}
      />
    </>
  );
}
