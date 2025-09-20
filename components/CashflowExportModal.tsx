"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface CashflowExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (range: { from: string; to: string }) => void;
}

export default function CashflowExportModal({
  open,
  onClose,
  onExport,
}: CashflowExportModalProps) {
  const [from, setFrom] = useState(
    new Date().toISOString().split("T")[0] // default hari ini
  );
  const [to, setTo] = useState(
    new Date().toISOString().split("T")[0] // default hari ini
  );

  const handleExport = () => {
    if (!from || !to) return;
    onExport({ from, to });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Cashflow</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border rounded px-3 py-2"
              title="inputFromDate"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border rounded px-3 py-2"
              title="inputToDate"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border hover:bg-gray-100"
              title="btnCancelExport"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90"
              title="btnSubmitExport"
            >
              Export
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
