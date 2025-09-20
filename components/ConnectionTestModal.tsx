"use client";

import { RouterInput } from "@/app/(admin)/routers/list/page";
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

  const sshCommand = `/ip service set ssh port=${data?.port} disabled=no`;

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

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-lg p-6 relative shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Tes Koneksi Router</h2>

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
            className="absolute right-2 top-8"
            title="Salin"
          >
            <BsClipboard2 className="w-5 h-5" />
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
            className={`w-full ${
              loading
                ? "bg-primary/60 hover:bg-primary/60"
                : "bg-primary hover:bg-primary/90"
            } text-primary-foreground px-4 py-2 rounded text-sm`}
            disabled={loading}
          >
            {loading ? "Testing..." : "Tes Koneksi"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
