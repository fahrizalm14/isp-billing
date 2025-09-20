"use client";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg p-6 rounded-lg shadow-lg relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Pilih Odp</h2>
          <button onClick={onClose} className="text-sm text-gray-500">
            X
          </button>
        </div>

        <input
          type="text"
          placeholder="Cari nama user..."
          className="w-full border px-3 py-2 rounded text-sm mb-4"
          value={search}
          onChange={(e) => {
            setPage(1); // Reset to first page on new search
            setSearch(e.target.value);
          }}
        />

        <div className="overflow-x-auto min-h-[550px]">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-primary text-left">
                <th className="px-2 py-1 border">Nama</th>
                <th className="px-2 py-1 border">Lokasi</th>
                <th className="px-2 py-1 border text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : odps.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    Odp tidak ditemukan
                  </td>
                </tr>
              ) : (
                odps.map((_odp) => (
                  <tr key={_odp.id}>
                    <td className="px-2 py-1 border">{_odp.name}</td>
                    <td className="px-2 py-1 border">{`${_odp.location} - ${_odp.region}`}</td>
                    <td className="px-2 py-1 border text-center">
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

        <div className="flex justify-between items-center mt-4 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
