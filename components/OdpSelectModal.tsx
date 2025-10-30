"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { OdpInput } from "./OdpFormModal";

interface OdpSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: { id: string; name: string }) => void;
}

export default function OdpSelectModal({
  isOpen,
  onClose,
  onSelect,
}: OdpSelectModalProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [odps, setOdps] = useState<OdpInput[]>([]);

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

      const res = await fetch(`/api/router/odp?${params}`, {
        signal: controller.signal,
      });
      const { data } = await res.json();
      setOdps(data || []);
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
      <DialogContent className="w-full max-w-2xl space-y-4 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">
            Pilih ODP
          </DialogTitle>
        </DialogHeader>

        <input
          type="text"
          placeholder="Cari nama atau lokasi ODP..."
          className="w-full border px-3 py-2 rounded text-xs md:text-sm"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <div className="overflow-hidden rounded-md border">
          <div className="max-h-[55vh] overflow-auto">
            <table className="w-full border-collapse text-xs md:text-sm">
              <thead className="sticky top-0 bg-primary text-left text-white">
                <tr>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2 hidden sm:table-cell">Lokasi</th>
                  <th className="px-3 py-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : odps.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      ODP tidak ditemukan
                    </td>
                  </tr>
                ) : (
                  odps.map((_odp) => (
                    <tr
                      key={_odp.id}
                      className="border-t hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                      <td className="px-3 py-2">{_odp.name}</td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        {_odp.location} - {_odp.region}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => {
                            onSelect({ id: _odp.id || "", name: _odp.name });
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

