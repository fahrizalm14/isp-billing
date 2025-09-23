"use client";

import PackageFormModal, { PackageForm } from "@/components/PackageFormModal";
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
import { FaEdit, FaSyncAlt, FaTrash } from "react-icons/fa";

export interface Package {
  id: string;
  name: string;
  description?: string;
  routerId: string;
  router: { name: string };
  poolName: string;
  localAddress: string;
  rateLimit?: string;
  price: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

type Router = {
  id: string;
  name: string;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageForm | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [routers, setRouters] = useState<Router[]>([]);
  const [deletePackage, setDeletePackage] = useState({
    id: "",
    name: "",
    open: false,
  });

  // Ambil router list dari /api/router
  useEffect(() => {
    const fetchRouters = async () => {
      try {
        const res = await fetch("/api/router?search=&page=1&limit=1000");
        if (!res.ok) throw new Error("Gagal memuat data.");
        const json = await res.json();
        if (json?.data?.length > 0) {
          setRouters(json.data);
        }
      } catch (error) {
        console.error("Failed to load routers:", error);
        setRouters([]);
        SwalToast.fire({
          title: String(error),
          icon: "warning",
        });
      }
    };
    fetchRouters();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/package?search=${search}&page=${page}&limit=10`
      );
      const result = await res.json();
      setPackages(result.data);
      setTotalPages(result.totalPages);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      SwalToast.fire({ icon: "error", title: "Gagal memuat data" });
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (packageId: string) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/package/${packageId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Gagal menghapus package");
      }

      SwalToast.fire({
        icon: "success",
        title: "Package berhasil dihapus!",
      });

      fetchPackages(); // pastikan ini adalah fungsi refresh data table
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan saat menghapus package",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-6">
        <h2 className="text-xl font-semibold">Daftar Paket</h2>
        <div className="flex flex-col md:flex-row justify-between mt-4 mb-2 items-start md:items-center gap-2">
          {/* Kiri - Tombol Tambah */}
          <div className="w-full md:w-auto">
            <button
              className="w-full md:w-auto bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
              onClick={() => {
                setModalOpen(true);
              }}
            >
              + Tambah Paket
            </button>
          </div>

          {/* Kanan - Search dan Refresh */}
          <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <input
              type="text"
              placeholder="Search paket..."
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
              onClick={fetchPackages}
            >
              <FaSyncAlt />
              Refresh
            </button>
          </div>
        </div>

        <Table className="table-auto w-full">
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead className="w-[270px] max-w-[270px] truncate whitespace-nowrap overflow-hidden">
                Nama
              </TableHead>
              <TableHead className="w-[400px] max-w-[400px] truncate whitespace-nowrap overflow-hidden">
                Deskripsi
              </TableHead>
              <TableHead>Pool</TableHead>
              <TableHead>Rate Limit</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="px-4 py-2 text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg, index) => (
              <TableRow key={pkg.id}>
                <TableCell>{(page - 1) * 10 + index + 1}</TableCell>
                <TableCell className="w-[270px] max-w-[270px] truncate whitespace-nowrap overflow-hidden">
                  {pkg.name}
                </TableCell>
                <TableCell className="w-[400px] max-w-[400px] truncate whitespace-nowrap overflow-hidden">
                  {pkg.description || "-"}
                </TableCell>
                <TableCell>{pkg.poolName}</TableCell>
                <TableCell>{pkg.rateLimit || "-"}</TableCell>
                <TableCell>Rp {pkg.price.toLocaleString("id-ID")}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      pkg.active ? "bg-green-600" : "bg-gray-400"
                    }`}
                  >
                    {pkg.active ? "Aktif" : "Nonaktif"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2 flex items-center gap-2">
                  <button
                    title="edit"
                    className="p-2 bg-primary text-white rounded mr-2"
                    onClick={() => {
                      setSelectedPackage({
                        ...pkg,
                        rateLimit: pkg.rateLimit || "",
                        price: `${pkg.price}`,
                      });
                      setModalOpen(true);
                    }}
                  >
                    <FaEdit />
                  </button>
                  <button
                    title="hapus"
                    className="p-2 bg-destructive text-white rounded"
                    onClick={() =>
                      setDeletePackage({
                        id: pkg.id,
                        name: pkg.name,
                        open: true,
                      })
                    }
                  >
                    <FaTrash />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 flex justify-between items-center">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={page === 1}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
        <PackageFormModal
          show={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedPackage(null);
          }}
          onSuccess={fetchPackages}
          initialData={selectedPackage}
          routers={routers}
        />
      </div>
      <Loader loading={loading} />

      <ConfirmDialog
        open={deletePackage.open}
        onOpenChange={(change) =>
          setDeletePackage((_prev) => ({ ..._prev, open: change }))
        }
        title="Hapus item?"
        description={
          <>
            Tindakan ini tidak bisa dibatalkan. Untuk mengkonfirmasi, ketik nama
            item persis.
          </>
        }
        requiredText={deletePackage.name}
        matchMode="iequals" // tidak case sensitive
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={() => handleDelete(deletePackage.id)}
      />
    </>
  );
}
