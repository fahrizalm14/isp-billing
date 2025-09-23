"use client";

import SubscriptionDetailModal from "@/components/SubscriptionDetailModal";
import SubscriptionFormModal from "@/components/SubscriptionFormModal";
import { SwalToast } from "@/components/SweetAlert";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Loader from "@/components/ui/custom/loader";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FaEdit,
  FaInfoCircle,
  FaPowerOff,
  FaSyncAlt,
  FaTrash,
} from "react-icons/fa";

interface SubscriptionSummary {
  id: string;
  number: string;
  name: string;
  phone: string;
  odpName: string;
  routerName: string;
  packageName: string;
  remainingDays: number;
  paymentId: string;
  status: boolean;
  expiredAt: string;
  createdAt: string;
}

export default function SubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [subscriptionModal, setSubscriptionModal] = useState({
    id: "",
    open: false,
  });
  const [subsDetailModal, setSubsDetailModal] = useState({
    id: "",
    open: false,
  });

  // ✅ Dialog bypass isolir
  const [bypassDialog, setBypassDialog] = useState(false);

  const [subsAction, setSubsAction] = useState({
    id: "",
    name: "",
    type: "",
    open: false,
    status: false,
  });

  useEffect(() => {
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/subscription?search=${search}&page=${page}&limit=10`
      );
      if (!res.ok) throw new Error("Gagal memuat data.");
      const result = await res.json();
      setSubscriptions(result.data);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error(err);
      SwalToast.fire({ icon: "error", title: "Gagal memuat data" });
    } finally {
      setLoading(false);
    }
  };

  // Checkbox handlers
  const isAllPageSelected =
    subscriptions.length > 0 &&
    subscriptions.every((sub) => selected.includes(sub.id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      setSelected((prev) =>
        prev.filter((id) => !subscriptions.some((sub) => sub.id === id))
      );
    } else {
      setSelected((prev) => [
        ...prev,
        ...subscriptions
          .filter((sub) => !prev.includes(sub.id))
          .map((sub) => sub.id),
      ]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleByPassIsolirSelected = () => {
    if (!selected.length) return;
    setBypassDialog(true);
  };

  const confirmBypass = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscription/bypass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        SwalToast.fire({
          icon: "error",
          title: data.error || "Gagal bypass isolir",
        });
      } else {
        SwalToast.fire({
          icon: "success",
          title: "Bypass isolir berhasil",
        });
        setSelected([]); // reset checkbox
        fetchSubscriptions(); // refresh data
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan server",
      });
    } finally {
      setBypassDialog(false);
      setLoading(false);
    }
  };

  const handleSingleActivate = async (id: string, status: boolean) => {
    try {
      setLoading(true);

      if (status) {
        const res = await fetch(`/api/subscription/${id}/deactivate`, {
          method: "PATCH",
        });
        const data = await res.json();

        if (data.error)
          return SwalToast.fire({
            icon: "warning",
            title: "Ooops!",
            text: `Gagal menonaktifkan langganan`,
          });

        SwalToast.fire({
          icon: "success",
          title: "Berhasil menonaktifkan langganan",
        });
      } else {
        const res = await fetch(`/api/subscription/${id}/activate`, {
          method: "PATCH",
        });

        const data = await res.json();

        if (data.error)
          return SwalToast.fire({
            icon: "warning",
            title: "Ooops!",
            text: `Gagal mengaktifkan langganan`,
          });

        SwalToast.fire({
          icon: "success",
          title: "Berhasil mengaktifkan langganan",
        });
      }
      fetchSubscriptions();
    } catch (error) {
      console.log(error);

      SwalToast.fire({
        icon: "warning",
        title: "Ooops!",
        text: `Gagal ${status ? "menonaktifkan" : "Mengaktifkan"} langganan.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscription/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) {
        SwalToast.fire("Ooops...", data.error, "error");
      } else {
        fetchSubscriptions();
        SwalToast.fire("Yess....", data.message, "success");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-6">
        <h2 className="text-xl font-semibold">Daftar Subscription</h2>

        {/* Tombol atas */}
        <div className="flex flex-col md:flex-row justify-between mt-4 mb-2 items-start md:items-center gap-2">
          <div className="w-full md:w-auto flex gap-2">
            <button
              className="w-full md:w-auto bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
              onClick={() => setSubscriptionModal({ id: "", open: true })}
            >
              + Tambah Langganan
            </button>

            <button
              className={`px-4 py-2 rounded transition ${
                selected.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-destructive text-white hover:bg-destructive/30"
              }`}
              onClick={handleByPassIsolirSelected}
              disabled={selected.length === 0}
            >
              Bypass Isolir ({selected.length})
            </button>
          </div>

          {/* Search + Refresh */}
          <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <input
              type="text"
              placeholder="Search langganan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-64 border rounded px-3 py-2"
            />
            <button
              className="w-full md:w-auto bg-primary text-white px-3 py-2 rounded hover:bg-primary/90 flex items-center justify-center gap-1"
              onClick={fetchSubscriptions}
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
              <TableHead>
                <input
                  title="checkBoxAllSubscriptions"
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={toggleSelectAllPage}
                />
              </TableHead>
              <TableHead>Nomor</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>ODP</TableHead>
              <TableHead>Router</TableHead>
              <TableHead>Paket</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Masa Aktif</TableHead>
              <TableHead>Tgl Kontrak</TableHead>
              <TableHead>Expired</TableHead>
              <TableHead className="px-4 py-2 text-center">#</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <input
                    title="checkboxSubscriptions"
                    type="checkbox"
                    checked={selected.includes(sub.id)}
                    onChange={() => toggleSelectOne(sub.id)}
                  />
                </TableCell>
                <TableCell>{sub.number}</TableCell>
                <TableCell>{sub.name}</TableCell>
                <TableCell>{sub.odpName}</TableCell>
                <TableCell>{sub.routerName}</TableCell>
                <TableCell>{sub.packageName}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      sub.status ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    {sub.status ? "Aktif" : "Tidak aktif"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      sub.remainingDays > 3 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {sub.remainingDays}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(sub.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell>
                  {new Date(sub.expiredAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell className="px-4 py-2 text-center flex justify-center gap-2">
                  <button
                    title="btnActivate"
                    className={`text-white p-2 rounded ${
                      !sub.status
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-destructive hover:bg-destructive/70"
                    }`}
                    onClick={() =>
                      setSubsAction((_prev) => ({
                        ..._prev,
                        id: sub.id,
                        name: sub.name,
                        open: true,
                        type: "activate",
                        status: sub.status,
                      }))
                    }
                  >
                    <FaPowerOff className="w-4 h-4" />
                  </button>
                  <button
                    title="btnSubscriptionsInfo"
                    className="text-white p-2 rounded bg-primary hover:bg-primary/70"
                    onClick={() =>
                      setSubsDetailModal({ id: sub.id, open: true })
                    }
                  >
                    <FaInfoCircle className="w-4 h-4" />
                  </button>
                  <button
                    title="btnSubscriptionsEdit"
                    className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                    onClick={() =>
                      setSubscriptionModal({ id: sub.id, open: true })
                    }
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    title="btnSubscriptionsDelete"
                    className="bg-secondary text-white p-2 rounded hover:bg-secondary/70"
                    onClick={() =>
                      setSubsAction((_prev) => ({
                        ..._prev,
                        id: sub.id,
                        name: sub.name,
                        open: true,
                        type: "delete",
                      }))
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

      {/* ✅ Dialog Bypass Isolir */}
      <Dialog open={bypassDialog} onOpenChange={setBypassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Bypass Isolir</DialogTitle>
          </DialogHeader>
          <p>
            Apakah kamu yakin ingin melakukan <b>bypass isolir</b> untuk{" "}
            {selected.length} langganan?
          </p>
          <DialogFooter>
            <Button
              className="hover:bg-secondary"
              variant="outline"
              onClick={() => setBypassDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={confirmBypass}>Ya, Bypass</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Modal Form Add / Update */}
      <SubscriptionFormModal
        open={subscriptionModal.open}
        subscriptionId={subscriptionModal.id}
        onClose={() => setSubscriptionModal({ id: "", open: false })}
        onSuccess={fetchSubscriptions}
      />
      <SubscriptionDetailModal
        isOpen={subsDetailModal.open}
        id={subsDetailModal.id}
        onClose={() => {
          setSubsDetailModal((_prev) => ({ ..._prev, open: false }));
        }}
      />
      <ConfirmDialog
        open={subsAction.open}
        onOpenChange={(change) =>
          setSubsAction((_prev) => ({ ..._prev, open: change }))
        }
        title={subsAction.type === "delete" ? "Hapus item?" : "Pindah status?"}
        description={
          <>
            Tindakan ini tidak bisa dibatalkan. Untuk mengkonfirmasi, ketik nama
            item persis.
          </>
        }
        requiredText={subsAction.name}
        matchMode="equals" // tidak case sensitive
        confirmLabel={subsAction.type === "delete" ? "Hapus" : "Proses"}
        cancelLabel="Batal"
        tone="danger"
        onConfirm={() => {
          if (subsAction.type === "delete") handleDelete(subsAction.id);
          if (subsAction.type === "activate")
            handleSingleActivate(subsAction.id, subsAction.status);
        }}
      />
    </>
  );
}
