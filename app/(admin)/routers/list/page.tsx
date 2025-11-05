"use client";

import ConnectionTestModal from "@/components/ConnectionTestModal";
import RouterFormModal from "@/components/RouterFormModal";
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
import { useCallback, useEffect, useState } from "react";
import { FaEdit, FaSyncAlt, FaTrash, FaWifi } from "react-icons/fa";

type Router = {
  id: string;
  name: string;
  ipAddress: string;
  apiUsername: string;
  description?: string;
  port: number;
  status: boolean;
  updatedAt: Date;
};

export interface RouterInput extends Router {
  apiPassword: string;
}

export default function RouterListPage() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRouter, setSelectedRouter] = useState<RouterInput | null>(
    null
  );

  const [connectionModal, setConnectionModal] = useState(false);
  const [router, setRouter] = useState({
    id: "",
    name: "",
    open: false,
    type: "delete",
  });

  const fetchRouters = useCallback(
    async (page = 1) => {
      try {
        const params = new URLSearchParams({
          search,
          page: page.toString(),
          limit: "10",
        });
        setLoading(true);
        const res = await fetch(`/api/router?${params}`);
        const data = await res.json();
        setRouters(data.data);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Failed to fetch routers:", error);

        SwalToast.fire({
          icon: "warning",
          title: String(error),
        });
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    fetchRouters(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleRefresh = async () => {
    await fetchRouters(); // fetch ulang data
  };

  const handleDeleteOne = async (routerId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/router/${routerId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (res.ok) {
        SwalToast.fire({
          icon: "success",
          title: "Router berhasil dihapus!",
        });
        fetchRouters();
      } else {
        throw new Error(result.error || "Gagal menghapus router");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan saat menghapus router",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Router Management</h2>
        <div className="flex flex-col md:flex-row justify-between mt-4 mb-2 items-start md:items-center gap-2">
          {/* Kiri - Tombol Tambah */}
          <div className="w-full md:w-auto">
            <button
              className="w-full md:w-auto bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
              onClick={() => {
                setSelectedRouter(null);
                setModalOpen(true);
              }}
            >
              + Tambah Router
            </button>
          </div>

          {/* Kanan - Search dan Refresh */}
          <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <input
              type="text"
              placeholder="Search router..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-64 border rounded px-3 py-2"
            />
            <button
              className="w-full md:w-auto bg-primary text-white px-3 py-2 rounded hover:bg-primary/90 flex items-center justify-center gap-1"
              title="Refresh data"
              onClick={handleRefresh}
            >
              <FaSyncAlt />
              Refresh
            </button>
          </div>
        </div>

        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Diperbarui</TableHead>
                <TableHead className="px-4 py-2 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routers.map((_router, _index) => (
                <TableRow key={_router.id}>
                  <TableCell className="text-center">
                    {(page - 1) * 10 + _index + 1}
                  </TableCell>
                  <TableCell>{_router.name}</TableCell>
                  <TableCell>{_router.description || "-"}</TableCell>
                  <TableCell>{_router.ipAddress}</TableCell>
                  <TableCell>{_router.apiUsername}</TableCell>
                  <TableCell>{_router.port}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        _router.status ? "bg-green-600" : "bg-destructive"
                      }`}
                    >
                      {_router.status ? "Online" : "Offline"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(_router.updatedAt).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Koneksi router"
                        title="Koneksi router"
                        className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-2 py-2 sm:px-3 rounded hover:bg-secondary/90"
                        onClick={() => {
                          setSelectedRouter({ ..._router, apiPassword: "" });
                          setConnectionModal(true);
                        }}
                      >
                        <FaWifi className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Connect</span>
                      </button>

                      <button
                        type="button"
                        aria-label="Edit router"
                        title="Edit router"
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-2 py-2 sm:px-3 rounded hover:bg-primary/90"
                        onClick={() => {
                          setSelectedRouter({ ..._router, apiPassword: "" });
                          setModalOpen(true);
                        }}
                      >
                        <FaEdit className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        type="button"
                        aria-label="Hapus router"
                        title="Hapus router"
                        className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground px-2 py-2 sm:px-3 rounded hover:bg-destructive/90"
                        onClick={() => {
                          setRouter({
                            id: _router.id,
                            name: _router.name,
                            open: true,
                            type: "delete",
                          });
                        }}
                      >
                        <FaTrash className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-between items-center">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="bg-muted px-3 py-1 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
                className="bg-muted px-3 py-1 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      </div>
      <Loader loading={loading} />
      <RouterFormModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchRouters(page)}
        initialData={
          selectedRouter
            ? { ...selectedRouter, port: String(selectedRouter.port) }
            : null
        }
      />
      <ConnectionTestModal
        show={connectionModal}
        onClose={() => {
          setSelectedRouter(null);
          setConnectionModal(false);
          fetchRouters(page);
        }}
        data={selectedRouter}
      />
      <ConfirmDialog
        open={router.open}
        onOpenChange={(change) =>
          setRouter((_prev) => ({ ..._prev, open: change }))
        }
        title="Hapus item?"
        description={
          <>
            Tindakan ini tidak bisa dibatalkan. Untuk mengkonfirmasi, ketik nama
            item persis.
          </>
        }
        // requiredText={router.name}
        matchMode="equals" // tidak case sensitive
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={() => handleDeleteOne(router.id)}
      />
    </>
  );
}
