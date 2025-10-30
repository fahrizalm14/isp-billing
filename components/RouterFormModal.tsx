"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
                {isEdit ? "Edit Router" : "Tambah Router"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
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
