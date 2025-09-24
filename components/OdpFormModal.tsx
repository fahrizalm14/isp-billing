"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SwalToast } from "./SweetAlert";
import Loader from "./ui/custom/loader";

const OdpSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama ODP wajib diisi"),
  location: z.string().min(1, "Lokasi wajib diisi"),
  longitude: z.string().optional(),
  latitude: z.string().optional(),
  region: z.string().min(1, "Wilayah wajib diisi"),
  capacity: z.string().min(1, "Kapasitas wajib diisi"),
  routerId: z.string().min(1, "Router ID wajib diisi"),
});

export type OdpInput = z.infer<typeof OdpSchema>;

type Props = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: OdpInput | null;
};

type Router = {
  id: string;
  name: string;
};

export default function OdpFormModal({
  show,
  onClose,
  onSuccess,
  initialData,
}: Props) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [routers, setRouters] = useState<Router[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OdpInput>({
    resolver: zodResolver(OdpSchema),
    defaultValues: {
      name: "",
      location: "",
      longitude: "",
      latitude: "",
      region: "",
      capacity: "1",
      routerId: "",
    },
  });

  // Optional: kunci scroll body saat modal terbuka
  // useEffect(() => {
  //   if (show) {
  //     const prev = document.body.style.overflow;
  //     document.body.style.overflow = "hidden";
  //     return () => { document.body.style.overflow = prev; };
  //   }
  // }, [show]);

  useEffect(() => {
    if (!show) return;
    const run = async () => {
      try {
        const res = await fetch("/api/router?limit=100");
        const data = await res.json();
        setRouters(data?.data ?? []);
      } catch {
        setRouters([]);
      }
      reset(
        initialData ?? {
          name: "",
          location: "",
          longitude: "",
          latitude: "",
          region: "",
          capacity: "1",
          routerId: "",
        }
      );
    };
    run();
  }, [show, initialData, reset]);

  const onSubmit = async (data: OdpInput) => {
    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/router/odp/${initialData?.id}` : "/api/router/odp",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            capacity: parseInt(data.capacity || "1", 10),
          }),
        }
      );

      if (res.ok) {
        onSuccess();
        onClose();
        SwalToast.fire({
          icon: "success",
          title: isEdit
            ? "ODP berhasil diperbarui"
            : "ODP berhasil ditambahkan",
        });
      } else {
        SwalToast.fire({ icon: "error", title: "Gagal menyimpan ODP" });
      }
    } catch {
      SwalToast.fire({ icon: "error", title: "Terjadi kesalahan" });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop (klik untuk tutup) */}
      <div
        className="fixed inset-0 z-[9999] bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Viewport container: IZINKAN SCROLL */}
      <div
        className="fixed inset-0 z-[10000] overflow-y-auto p-4 sm:p-6 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit ODP" : "Tambah ODP"}
      >
        {/* Modal card: batasi tinggi + scroll internal */}
        <div
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-lg shadow-lg outline-none max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()} // cegah klik dalam card menutup modal
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 p-2"
            aria-label="Tutup"
            type="button"
          >
            ✕
          </button>

          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">
              {isEdit ? "Edit ODP" : "Tambah ODP"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Nama ODP
                </label>
                <input
                  {...register("name")}
                  id="name"
                  placeholder="Contoh: ODP-001"
                  className="mt-1 w-full border px-3 py-2 rounded text-sm"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium">
                  Lokasi
                </label>
                <input
                  {...register("location")}
                  id="location"
                  placeholder="Contoh: Jl. Sudirman No. 10"
                  className="mt-1 w-full border px-3 py-2 rounded text-sm break-words"
                />
                {errors.location && (
                  <p className="text-sm text-red-500">
                    {errors.location.message}
                  </p>
                )}
              </div>

              {/* Longitude / Latitude side-by-side di ≥sm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="longitude"
                    className="block text-sm font-medium"
                  >
                    Longitude
                  </label>
                  <input
                    {...register("longitude")}
                    id="longitude"
                    inputMode="decimal"
                    placeholder="Contoh: 106.84513"
                    className="mt-1 w-full border px-3 py-2 rounded text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="latitude"
                    className="block text-sm font-medium"
                  >
                    Latitude
                  </label>
                  <input
                    {...register("latitude")}
                    id="latitude"
                    inputMode="decimal"
                    placeholder="Contoh: -6.21462"
                    className="mt-1 w-full border px-3 py-2 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-medium">
                  Wilayah / Region
                </label>
                <input
                  {...register("region")}
                  id="region"
                  placeholder="Contoh: Kec. Tanah Abang"
                  className="mt-1 w-full border px-3 py-2 rounded text-sm"
                />
                {errors.region && (
                  <p className="text-sm text-red-500">
                    {errors.region.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium">
                  Kapasitas (jumlah port)
                </label>
                <input
                  {...register("capacity")}
                  id="capacity"
                  type="number"
                  inputMode="numeric"
                  placeholder="Contoh: 16"
                  className="mt-1 w-full border px-3 py-2 rounded text-sm"
                />
                {errors.capacity && (
                  <p className="text-sm text-red-500">
                    {errors.capacity.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="routerId" className="block text-sm font-medium">
                  Router
                </label>
                {routers.length === 0 ? (
                  <select
                    title="selectRouter"
                    disabled
                    className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  >
                    <option>Memuat router...</option>
                  </select>
                ) : (
                  <select
                    {...register("routerId")}
                    id="routerId"
                    className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">Pilih Router</option>
                    {routers.map((router) => (
                      <option key={router.id} value={router.id}>
                        {router.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.routerId && (
                  <p className="text-red-600 text-sm">
                    {errors.routerId.message}
                  </p>
                )}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Menyimpan..." : isEdit ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Loader loading={loading} />
    </>
  );
}
