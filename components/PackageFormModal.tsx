"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SwalToast } from "./SweetAlert";
import Loader from "./ui/custom/loader";

const EMPTY_PACKAGE = {
  name: "",
  description: "",
  routerId: "",
  poolName: "",
  localAddress: "",
  rateLimit: "",
  price: "",
  active: true,
};

const PackageSchema = z.object({
  name: z.string().min(1, "Nama paket wajib diisi"),
  description: z.string().optional(),
  routerId: z.string().min(1, "Router wajib dipilih"),
  poolName: z.string().min(1, "Pool wajib dipilih"),
  localAddress: z.string().min(1, "Local Address wajib diisi"),
  rateLimit: z
    .string()
    .refine(
      (val) =>
        val.toLowerCase() === "unlimited" ||
        /^\d+[kKmMgG]\/\d+[kKmMgG]$/i.test(val),
      {
        message: 'Rate Limit harus "unlimited" atau format seperti 10M/10M',
      }
    ),
  price: z.string().min(1),
  active: z.boolean().optional(),
  id: z.string().optional(),
});

export type PackageForm = z.infer<typeof PackageSchema>;

type PoolResponse = {
  name: string;
  ranges: string;
  localAddress: string;
};

type Props = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: PackageForm | null;
  routers: { id: string; name: string }[];
};

export default function PackageFormModal({
  show,
  onClose,
  onSuccess,
  initialData,
  routers,
}: Props) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<PoolResponse[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PackageForm>({
    resolver: zodResolver(PackageSchema),
    defaultValues: EMPTY_PACKAGE,
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset();
    }
  }, [initialData, reset, show]);

  const selectedRouterId = watch("routerId");

  useEffect(() => {
    fetchPools(selectedRouterId);
  }, [isEdit, selectedRouterId]);

  const selectedPool = watch("poolName");
  useEffect(() => {
    const selected = pools.find((p) => p.name === selectedPool);
    if (selected) {
      reset((prev) => ({
        ...prev,
        localAddress: selected.ranges,
      }));
    }
  }, [pools, reset, selectedPool]);

  const fetchPools = async (routerId: string) => {
    if (!routerId) {
      setPools([]);
      return;
    }
    setPoolLoading(true);

    try {
      const res = await fetch(`/api/router/mikrotik/${routerId}/pool`);
      if (res.ok) {
        const data = await res.json();
        setPools(data.pools);
      } else {
        SwalToast.fire({
          icon: "error",
          title: "Gagal mengambil data pool",
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan saat mengambil data pool",
      });
    } finally {
      setPoolLoading(false);
    }
  };

  const onSubmit = async (data: PackageForm) => {
    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/package/${data.id}` : "/api/package",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, price: parseInt(data.price || "0") }),
        }
      );

      if (res.ok) {
        onSuccess();
        onClose();
        reset({
          name: "",
          description: "",
          routerId: "",
          poolName: "",
          localAddress: "",
          rateLimit: "",
          price: "",
          active: true,
        });
        SwalToast.fire({ icon: "success", title: "Berhasil menyimpan paket." });
      } else {
        SwalToast.fire({ icon: "error", title: "Gagal menyimpan paket." });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      SwalToast.fire({ icon: "error", title: "Terjadi kesalahan." });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-lg p-6 rounded-lg shadow-lg relative">
          <h2 className="text-lg font-semibold mb-4">
            {isEdit ? "Edit Paket" : "Tambah Paket"}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nama Paket
              </label>
              <input
                id="name"
                {...register("name")}
                placeholder="Nama Paket"
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-1"
              >
                Deskripsi
              </label>
              <textarea
                id="description"
                {...register("description")}
                placeholder="Deskripsi"
                className="w-full border px-3 py-2 rounded text-sm"
              ></textarea>
            </div>

            <div>
              <label
                htmlFor="routerId"
                className="block text-sm font-medium mb-1"
              >
                Router
              </label>
              <select
                id="routerId"
                {...register("routerId")}
                className="w-full border px-3 py-2 rounded text-sm"
                disabled={isEdit}
              >
                <option value="">Pilih Router</option>
                {routers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.routerId && (
                <p className="text-sm text-red-500">
                  {errors.routerId.message}
                </p>
              )}
            </div>

            {poolLoading ? (
              "Memuat pool dari mikrotik..."
            ) : (
              <div>
                <label
                  htmlFor="poolName"
                  className="block text-sm font-medium mb-1"
                >
                  Pool
                </label>
                <select
                  id="poolName"
                  {...register("poolName")}
                  className="w-full border px-3 py-2 rounded text-sm"
                  disabled={isEdit}
                >
                  <option value="">Pilih Pool</option>
                  {pools.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.ranges})
                    </option>
                  ))}
                </select>
                {errors.poolName && (
                  <p className="text-sm text-red-500">
                    {errors.poolName.message}
                  </p>
                )}
              </div>
            )}

            <div>
              {/* <label
                htmlFor="localAddress"
                className="block text-sm font-medium mb-1"
              >
                Local Address
              </label> */}
              <input
                id="localAddress"
                {...register("localAddress")}
                placeholder="Local Address"
                className="w-full border px-3 py-2 rounded text-sm"
                disabled
                type="hidden"
              />
              {errors.localAddress && (
                <p className="text-sm text-red-500">
                  {errors.localAddress.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="rateLimit"
                className="block text-sm font-medium mb-1"
              >
                Rate Limit
              </label>
              <input
                id="rateLimit"
                {...register("rateLimit")}
                placeholder="Rate Limit"
                className="w-full border px-3 py-2 rounded text-sm"
                disabled={isEdit}
              />
              {errors.rateLimit && (
                <p className="text-sm text-red-500">
                  {errors.rateLimit.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Harga
              </label>
              <input
                id="price"
                {...register("price")}
                type="number"
                placeholder="Harga"
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                {...register("active")}
                className="border rounded"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Aktif
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Menyimpan..." : isEdit ? "Update" : "Simpan"}
              </button>
            </div>
          </form>

          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
      <Loader loading={loading} />
    </>
  );
}
