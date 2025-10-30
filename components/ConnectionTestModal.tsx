"use client";

import { RouterInput } from "@/app/(admin)/routers/list/page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { BsClipboard2 } from "react-icons/bs";

type Props = {
  show: boolean;
  onClose: () => void;
  data: RouterInput | null;
};

export default function ConnectionTestModal({ show, onClose, data }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const sshCommand = `/ip service set api port=${data?.port} disabled=no`;

  const testConnection = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`/api/router/mikrotik/${data?.id}`);
      const _data = await res.json();
      setStatus(_data.message || "Unknown result");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setStatus("Gagal koneksi ke router.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sshCommand);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  useEffect(() => {
    if (show) {
      setStatus(null);
      setCopySuccess(false);
    }
  }, [show]);

  return (
    <Dialog
      open={show}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="w-full max-w-md space-y-4 p-4 sm:p-6 text-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Tes Koneksi Router
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Perintah SSH MikroTik
          </label>
          <textarea
            value={sshCommand}
            readOnly
            className="w-full mt-1 resize-none bg-gray-100 dark:bg-zinc-800 border px-3 py-2 rounded text-sm text-gray-800 dark:text-gray-100"
            rows={2}
          />
          <button
            onClick={handleCopy}
            className="absolute right-2 top-10 inline-flex items-center justify-center rounded border border-transparent bg-white/80 p-2 text-gray-600 shadow-sm transition hover:bg-white hover:text-gray-800 dark:bg-zinc-900 dark:text-gray-200"
            title="Salin"
            type="button"
          >
            <BsClipboard2 className="w-4 h-4" />
          </button>
          {copySuccess && (
            <p className="text-xs text-green-600 mt-1">
              Tersalin ke clipboard!
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              IP Address
            </label>
            <input
              type="text"
              value={data?.ipAddress}
              readOnly
              className="w-full bg-gray-100 dark:bg-zinc-800 border px-3 py-2 rounded text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Port
            </label>
            <input
              type="text"
              value={data?.port}
              readOnly
              className="w-full bg-gray-100 dark:bg-zinc-800 border px-3 py-2 rounded text-sm"
            />
          </div>

          {status && (
            <p className="text-sm text-gray-700 dark:text-gray-300">{status}</p>
          )}
          <button
            onClick={testConnection}
            className={`w-full rounded px-4 py-2 text-sm text-primary-foreground transition ${
              loading
                ? "bg-primary/60 hover:bg-primary/60"
                : "bg-primary hover:bg-primary/90"
            }`}
            disabled={loading}
            type="button"
          >
            {loading ? "Testing..." : "Tes Koneksi"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
