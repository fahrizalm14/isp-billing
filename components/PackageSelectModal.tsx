"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package } from "@/app/(admin)/packages/page";
import { useEffect, useState } from "react";

interface PackageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: { id: string; name: string }) => void;
}

export default function PackageSelectModal({
  isOpen,
  onClose,
  onSelect,
}: PackageSelectModalProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    const fetchUsers = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: "10",
      });

      const res = await fetch(`/api/package?${params}`, {
        signal: controller.signal,
      });
      const { data } = await res.json();
      setPackages(data || []);
      setTotalPages(data.totalPages || 1);
      setLoading(false);
    };

    fetchUsers();
    return () => controller.abort();
  }, [search, page, isOpen]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-full max-w-3xl space-y-4 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">
            Pilih Paket
          </DialogTitle>
        </DialogHeader>

        <input
          type="text"
          placeholder="Cari nama user..."
          className="w-full border px-3 py-2 rounded text-xs md:text-sm"
          value={search}
          onChange={(e) => {
            setPage(1); // Reset ke halaman pertama ketika searching baru
            setSearch(e.target.value);
          }}
        />

        <div className="overflow-hidden rounded-md border">
          <div className="max-h-[55vh] overflow-auto">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead className="sticky top-0 bg-primary text-left text-white">
                <tr>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2 hidden sm:table-cell">
                    Router/Profile
                  </th>
                  <th className="px-3 py-2 hidden sm:table-cell">Harga</th>
                  <th className="px-3 py-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : packages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      Paket tidak ditemukan
                    </td>
                  </tr>
                ) : (
                  packages.map((_package) => (
                    <tr
                      key={_package.id}
                      className="border-t hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                      <td className="px-3 py-2">{_package.name}</td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        {_package.router.name}/{_package.poolName}
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        {_package.price}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => {
                            onSelect({
                              id: _package.id || "",
                              name: _package.name,
                            });
                            onClose();
                          }}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Pilih
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs md:text-sm">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Halaman {page} dari {totalPages}
            </span>
          </div>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
