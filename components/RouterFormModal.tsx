"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { SwalToast } from "./SweetAlert";
import Loader from "./ui/custom/loader";

const UpdateRouterSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi"),
    ipAddress: z.string().min(1, "IP Address wajib diisi"),
    apiUsername: z.string().min(1, "Username wajib diisi"),
    apiPassword: z.string().optional(),
    description: z.string().optional(),
    port: z.string().min(1, "Port wajib diisi"),
  })
  .extend({
    id: z.string().optional(),
  });

const RouterSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi"),
    ipAddress: z.string().min(1, "IP Address wajib diisi"),
    apiUsername: z.string().min(1, "Username wajib diisi"),
    apiPassword: z.string().min(8, "Minimal 8 karakter"),
    description: z.string().optional(),
    port: z.string().min(1, "Port wajib diisi"),
  })
  .extend({
    id: z.string().optional(),
  });

type RouterForm = z.infer<typeof RouterSchema>;

type Props = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: RouterForm | null;
};

export default function RouterFormModal({
  show,
  onClose,
  onSuccess,
  initialData,
}: Props) {
  const isEdit = !!initialData;
  const schema = isEdit ? UpdateRouterSchema : RouterSchema;

  type FormType = typeof schema extends z.ZodTypeAny
    ? z.infer<typeof schema>
    : never;
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      ipAddress: "",
      apiUsername: "",
      apiPassword: "",
      description: "",
      port: "1",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        apiPassword: "", // Kosongkan untuk alasan keamanan
      });
    } else {
      reset({
        name: "",
        ipAddress: "",
        apiUsername: "",
        apiPassword: "",
        description: "",
        port: "1",
      });
    }
  }, [initialData, reset, show]);

  const onSubmit: SubmitHandler<FormType> = async (data) => {
    const payload: Partial<FormType> = { ...data };

    if (isEdit && !payload.apiPassword) {
      delete payload.apiPassword; // sekarang aman
    }

    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/router/${initialData?.id}` : `/api/router`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            port: parseInt(payload.port || "0"),
          }),
        }
      );

      if (res.ok) {
        onSuccess();
        onClose();
        SwalToast.fire({
          icon: "success",
          title: "Berhasil penyimpan router baru.",
        });
      } else {
        SwalToast.fire({
          icon: "warning",
          title: "Gagal menyimpan data.",
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      SwalToast.fire({
        icon: "warning",
        title: "Gagal menyimpan data.",
      });
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
            {isEdit ? "Edit Router" : "Tambah Router"}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <input
                {...register("name")}
                placeholder="Nama"
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div>
              <input
                {...register("ipAddress")}
                placeholder="IP Address"
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {errors.ipAddress && (
                <p className="text-sm text-red-500">
                  {errors.ipAddress.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...register("apiUsername")}
                placeholder="Username API"
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {errors.apiUsername && (
                <p className="text-sm text-red-500">
                  {errors.apiUsername.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...register("apiPassword")}
                placeholder="Password API (kosongkan jika tidak diubah)"
                type="password"
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {errors.apiPassword && (
                <p className="text-sm text-red-500">
                  {errors.apiPassword.message}
                </p>
              )}
            </div>
            <div>
              <input
                {...register("description")}
                placeholder="Deskripsi"
                className="w-full border px-3 py-2 rounded text-sm"
              />
            </div>
            <div>
              <input
                {...register("port")}
                type="number"
                placeholder="Port"
                className="w-full border px-3 py-2 rounded text-sm"
              />
              {errors.port && (
                <p className="text-sm text-red-500">{errors.port.message}</p>
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
