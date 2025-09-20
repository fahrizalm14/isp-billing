"use client";

import { useEffect, useState } from "react";

interface PaymentHistory {
  id: string;
  number: string;
  amount: number;
  tax: number;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
}

interface SubscriptionResponse {
  id: string;
  number: string;
  active: boolean;
  dueDate: string;
  expiredAt: string;
  odp: string;
  routerName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  packageName: string;
  packageSpeed: string;
  username?: string; // ✅ tambah
  password?: string; // ✅ tambah
  payments: PaymentHistory[];
}

interface SubscriptionModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionDetailModal({
  id,
  isOpen,
  onClose,
}: SubscriptionModalProps) {
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscription/${id}`);
      if (!res.ok) throw new Error("Gagal memuat detail langganan");
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full p-4 z-10 overflow-y-auto max-h-[85vh] text-sm">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2 mb-3">
          <h2 className="text-lg font-semibold">Detail Langganan</h2>
          <button
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <h3 className="font-medium mb-2 text-sm">Customer</h3>
                <InfoItem label="Nama" value={data.customerName} />
                <InfoItem label="Telepon" value={data.customerPhone} />
                <InfoItem label="Alamat" value={data.customerAddress} />
              </div>

              {/* Subscription Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <h3 className="font-medium mb-2 text-sm">Langganan</h3>
                <InfoItem label="No. Langganan" value={data.number} />
                <InfoItem
                  label="Status"
                  value={
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        data.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {data.active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  }
                />
                <InfoItem label="Jatuh Tempo" value={data.dueDate} />
                <InfoItem
                  label="Masa Aktif"
                  value={new Date(data.expiredAt).toLocaleDateString("id-ID")}
                />
              </div>
            </div>

            {/* Package, ODP & Secret Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <h3 className="font-medium mb-2 text-sm">Paket</h3>
                <InfoItem label="Nama" value={data.packageName} />
                <InfoItem label="Speed" value={data.packageSpeed} />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <h3 className="font-medium mb-2 text-sm">ODP & Router</h3>
                <InfoItem label="ODP" value={data.odp} />
                <InfoItem label="Router" value={data.routerName} />
              </div>
              {/* Secret Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <h3 className="font-medium mb-2 text-sm">PPPoE Secret</h3>
                <InfoItem label="Username" value={data.username || "-"} />
                <InfoItem label="Password" value={data.password || "-"} />
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <h3 className="font-medium mb-2 text-sm">Riwayat Pembayaran</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="text-left px-3 py-1.5">Tanggal</th>
                      <th className="text-left px-3 py-1.5">No. Tagihan</th>
                      <th className="text-left px-3 py-1.5">Jumlah</th>
                      <th className="text-left px-3 py-1.5">Status</th>
                      <th className="text-left px-3 py-1.5">Metode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-3 py-1.5">
                          {new Date(p.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-3 py-1.5">{p.number}</td>
                        <td className="px-3 py-1.5">
                          Rp {p.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="px-3 py-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.status === "SUCCESS"
                                ? "bg-green-100 text-green-700"
                                : p.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          {p.paymentMethod || "-"}
                        </td>
                      </tr>
                    ))}
                    {!data.payments.length && (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center text-gray-500 py-3"
                        >
                          Belum ada riwayat pembayaran
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">
            Data langganan tidak ditemukan.
          </p>
        )}
      </div>
    </div>
  );
}

// Info Item row
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-xs sm:text-sm text-right">{value}</span>
    </div>
  );
}
