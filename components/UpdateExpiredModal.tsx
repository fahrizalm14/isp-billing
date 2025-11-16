"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SwalToast } from "@/components/SweetAlert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";

const UpdateExpiredSchema = z.object({
  expiredAt: z.string().min(1, "Tanggal expired wajib diisi"),
});

type UpdateExpiredFormData = z.infer<typeof UpdateExpiredSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscriptionId: string;
  currentExpiredAt?: string;
};

export default function UpdateExpiredModal({
  open,
  onClose,
  onSuccess,
  subscriptionId,
  currentExpiredAt,
}: Props) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateExpiredFormData>({
    resolver: zodResolver(UpdateExpiredSchema),
    defaultValues: {
      expiredAt: "",
    },
  });

  useEffect(() => {
    if (open && currentExpiredAt) {
      // Format date to YYYY-MM-DD for input type="date"
      const date = new Date(currentExpiredAt);
      const formattedDate = date.toISOString().split("T")[0];
      reset({ expiredAt: formattedDate });
    } else if (!open) {
      reset({ expiredAt: "" });
    }
  }, [open, currentExpiredAt, reset]);

  const onSubmit = async (form: UpdateExpiredFormData) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/subscription/${subscriptionId}/update-expired`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expiredAt: form.expiredAt }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        SwalToast.fire({ icon: "success", title: "Tanggal expired berhasil diupdate." });
        onSuccess();
        onClose();
        reset({ expiredAt: "" });
      } else {
        SwalToast.fire({
          icon: "warning",
          title: data?.error ?? "Gagal mengupdate tanggal expired.",
        });
      }
    } catch (err) {
      console.error(err);
      SwalToast.fire({ icon: "error", title: "Terjadi kesalahan server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Tanggal Expired</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="block mb-1">Tanggal Expired</label>
            <Input type="date" {...register("expiredAt")} />
            {errors.expiredAt && (
              <p className="text-sm text-red-500 mt-1">{errors.expiredAt.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
