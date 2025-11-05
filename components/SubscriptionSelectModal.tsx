"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface Subscription {
  id: string;
  number: string;
  name: string; // customer name
  phone: string;
  odpName: string;
  routerName: string;
  packageName: string;
  packagePrice: number;
  discount: number;
  additionalPrice: number;
  status: boolean;
  remainingDays: number;
  expiredAt: string;
  paymentId: string;
  createdAt: string;
}

interface SubscriptionSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (subs: Subscription) => void;
}

export default function SubscriptionSelectModal({
  open,
  onClose,
  onSelect,
}: SubscriptionSelectModalProps) {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, search]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscription?search=${search}`);
      if (!res.ok) throw new Error("Gagal memuat data subscription");
      const result = await res.json();
      setSubs(result.data);
    } catch (err) {
      console.error(err);
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pilih Subscription</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Cari subscription..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y">
            {subs.map((s) => (
              <div key={s.id} className="p-3 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      {s.number} - {s.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.packageName} ( Rp{" "}
                      {s.packagePrice.toLocaleString("id-ID")}
                      {s.discount
                        ? ` • Diskon Rp ${s.discount.toLocaleString("id-ID")}`
                        : ""}
                      ) | {s.routerName} / {s.odpName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.phone} • Expired:{" "}
                      {new Date(s.expiredAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <button
                    className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                    onClick={() => onSelect(s)}
                  >
                    Pilih
                  </button>
                </div>
              </div>
            ))}

            {!subs.length && (
              <p className="text-center text-gray-500 py-4">
                Tidak ada subscription
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
