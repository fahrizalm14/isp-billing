"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  profileName: "",
  localAddress: "",
  rateLimit: "",
  price: "",
  active: true,
};

const PackageSchema = z.object({
  name: z.string().min(1, "Nama paket wajib diisi"),
  description: z.string().optional(),
  routerId: z.string().min(1, "Router wajib dipilih"),
  poolName: z.string().min(1, "Profile belum ada pool"),
  localAddress: z.string().min(1, "Profile tidak mempunyai local address"),
  rateLimit: z.string().optional(),
  // .refine(
  //   (val) =>
  //     val.toLowerCase() === "unlimited" ||
  //     /^\d+[kKmMgG]\/\d+[kKmMgG]$/i.test(val),
  //   {
  //     message: 'Rate Limit harus "unlimited" atau format seperti 10M/10M',
  //   }
  // ),
  price: z.string().min(1),
  active: z.boolean().optional(),
  id: z.string().optional(),
  profileName: z.string().optional(),
});

export type PackageForm = z.infer<typeof PackageSchema>;

const sanitizeInitialData = (
  data?: Partial<PackageForm> | null
): PackageForm => ({
  ...EMPTY_PACKAGE,
  ...(data ?? {}),
  name: data?.name ?? "",
  description: data?.description ?? "",
  routerId: data?.routerId ?? "",
  poolName: data?.poolName ?? "",
  profileName: data?.profileName ?? "",
  localAddress: data?.localAddress ?? "",
  rateLimit: data?.rateLimit ?? "",
  price:
    data?.price === null || data?.price === undefined
      ? ""
      : typeof data.price === "number"
      ? `${data.price}`
      : data.price,
});

// type PoolResponse = {
//   name: string;
//   ranges: string;
//   localAddress: string;
// };

type ProfileResponse = {
  name: string;
  raw: string;
  localAddress?: string;
  remoteAddress?: string;
  rateLimit?: string;
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
  const [pools, setPools] = useState<ProfileResponse[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PackageForm>({
    resolver: zodResolver(PackageSchema),
    defaultValues: EMPTY_PACKAGE,
  });

  useEffect(() => {
    if (initialData) {
      reset(sanitizeInitialData(initialData));
    } else {
      reset({ ...EMPTY_PACKAGE });
    }
  }, [initialData, reset, show]);

  const selectedRouterId = watch("routerId");

  useEffect(() => {
    fetchPools(selectedRouterId);
  }, [isEdit, selectedRouterId]);

  const selectedProfile = watch("profileName");
  useEffect(() => {
    const selected = pools.find((p) => p.name === selectedProfile);
    if (selected) {
      setValue("localAddress", selected.localAddress ?? "", {
        shouldValidate: true,
      });
      setValue("poolName", selected.remoteAddress ?? "", {
        shouldValidate: true,
      });
      setValue("name", selected.name, { shouldValidate: true });
      setValue("rateLimit", selected.rateLimit ?? "", { shouldValidate: true });
    }
  }, [pools, selectedProfile, setValue]);

  const fetchPools = async (routerId: string) => {
    if (!routerId) {
      setPools([]);
      return;
    }
    setPoolLoading(true);

    try {
      const res = await fetch(`/api/router/mikrotik/${routerId}/profile`);
      if (res.ok) {
        const data = await res.json();
        setPools(data.result);
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

  return (
    <>
      <Dialog
        open={show}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
      >
        <DialogContent className="w-full max-w-xl p-0 sm:p-0 overflow-hidden">
          <div className="p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {isEdit ? "Edit Paket" : "Tambah Paket"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
              {/* <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Nama Paket
                </label>
                <input
                  id="name"
                  {...register("name")}
                  placeholder="Nama Paket"
                  className="w-full border px-3 py-2 rounded text-sm"
                />
                </div> */}
              {/* {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )} */}

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
                <p className="text-sm text-gray-500">
                  Memuat profile dari mikrotik...
                </p>
              ) : (
                <div>
                  <label
                    htmlFor="poolName"
                    className="block text-sm font-medium mb-1"
                  >
                    Profile
                  </label>
                  <select
                    id="profileName"
                    {...register("profileName")}
                    className="w-full border px-3 py-2 rounded text-sm"
                    // disabled={isEdit}
                  >
                    <option value="">Pilih profile</option>
                    {pools.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} {p.rateLimit} - {p.remoteAddress} -{" "}
                        {p.localAddress}
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

              <input
                id="localAddress"
                {...register("localAddress")}
                placeholder="Local Address"
                className="hidden"
                disabled
                type="hidden"
              />
              {errors.localAddress && (
                <p className="text-sm text-red-500">
                  {errors.localAddress.message}
                </p>
              )}
              <input id="poolName" {...register("poolName")} type="hidden" />
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

              {/* <div>
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
              </div> */}

              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium mb-1"
                >
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

              {/* <div className="flex items-center gap-2">
                <input
                  id="active"
                  type="checkbox"
                  {...register("active")}
                  className="border rounded"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Aktif
                </label>
              </div> */}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
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
        </DialogContent>
      </Dialog>
      <Loader loading={loading} />
    </>
  );
}
