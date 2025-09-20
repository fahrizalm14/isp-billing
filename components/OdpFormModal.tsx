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
  capacity: z.number().min(1, "Kapasitas wajib diisi"),
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
      capacity: 1,
      routerId: "",
    },
  });

  useEffect(() => {
    if (show) {
      fetch("/api/router?limit=100")
        .then((res) => res.json())
        .then((data) => setRouters(data.data));

      reset(
        initialData ?? {
          name: "",
          location: "",
          longitude: "",
          latitude: "",
          region: "",
          capacity: 1,
          routerId: "",
        }
      );
    }
  }, [show, initialData, reset]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: "",
        location: "",
        longitude: "",
        latitude: "",
        region: "",
        capacity: 1,
        routerId: "",
      });
    }
  }, [initialData, reset, show]);

  const onSubmit = async (data: OdpInput) => {
    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/router/odp/${initialData?.id}` : "/api/router/odp",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
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
        SwalToast.fire({
          icon: "error",
          title: "Gagal menyimpan ODP",
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-lg p-6 rounded-lg shadow-lg relative">
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
                className="w-full border px-3 py-2 rounded text-sm"
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
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {errors.location && (
                <p className="text-sm text-red-500">
                  {errors.location.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="longitude" className="block text-sm font-medium">
                Longitude
              </label>
              <input
                {...register("longitude")}
                id="longitude"
                placeholder="Contoh: 106.84513"
                className="w-full border px-3 py-2 rounded text-sm"
              />
            </div>

            <div>
              <label htmlFor="latitude" className="block text-sm font-medium">
                Latitude
              </label>
              <input
                {...register("latitude")}
                id="latitude"
                placeholder="Contoh: -6.21462"
                className="w-full border px-3 py-2 rounded text-sm"
              />
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium">
                Wilayah / Region
              </label>
              <input
                {...register("region")}
                id="region"
                placeholder="Contoh: Kec. Tanah Abang"
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {errors.region && (
                <p className="text-sm text-red-500">{errors.region.message}</p>
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
                placeholder="Contoh: 16"
                className="w-full border px-3 py-2 rounded text-sm"
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
                  title="selecRouter"
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
