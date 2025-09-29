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
import OdpSelectModal from "./OdpSelectModal";
import PackageSelectModal from "./PackageSelectModal";
import { Button } from "./ui/button";

// ✅ Address schema
const AddressSchema = z.object({
  street: z.string().min(1, "Jalan wajib diisi"),
  subDistrict: z.string().min(1, "Kelurahan wajib diisi"),
  district: z.string().min(1, "Kecamatan wajib diisi"),
  city: z.string().min(1, "Kota wajib diisi"),
  province: z.string().min(1, "Provinsi wajib diisi"),
  postalCode: z.string().min(1, "Kode pos wajib diisi"),
});

const SubscriptionSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().min(10, "Nomor telepon tidak valid"),
  address: AddressSchema,
  odpId: z.string().min(1, "ODP wajib dipilih"),
  packageId: z.string().min(1, "Paket wajib dipilih"),
  taxAmount: z.number().min(0),
  dueDate: z.string().optional(),
});

type SubscriptionFormData = z.infer<typeof SubscriptionSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscriptionId?: string;
};

const EMPTY_SUBS: SubscriptionFormData = {
  name: "",
  phone: "",
  address: {
    street: "",
    subDistrict: "",
    district: "",
    city: "",
    province: "",
    postalCode: "",
  },
  odpId: "",
  packageId: "",
  taxAmount: 0,
  dueDate: "",
};

export default function SubscriptionFormModal({
  open,
  onClose,
  onSuccess,
  subscriptionId,
}: Props) {
  const isEdit = !!subscriptionId;
  const [loading, setLoading] = useState(false);

  const [rootModal, setRootModal] = useState(open);
  useEffect(() => {
    setRootModal(open);
  }, [open]);

  const [odpModal, setOdpModal] = useState(false);
  const [packageModal, setPackageModal] = useState(false);
  const [odpName, setOdpName] = useState("");
  const [packageName, setPackageName] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(SubscriptionSchema),
    defaultValues: EMPTY_SUBS,
  });

  // ✅ Fetch & map data saat edit
  useEffect(() => {
    if (isEdit && open) {
      fetch(`/api/subscription/${subscriptionId}`)
        .then((res) => res.json())
        .then((res) => {
          const data = res.data;
          if (!data) return;

          reset({
            name: data.customerName || "",
            phone: data.customerPhone || "",
            address: {
              street: data.address?.street || "",
              subDistrict: data.address?.subDistrict || "",
              district: data.address?.district || "",
              city: data.address?.city || "",
              province: data.address?.province || "",
              postalCode: data.address?.postalCode || "",
            },
            odpId: data.odpId || "", // pakai ID dari API
            packageId: data.packageId || "", // pakai ID dari API
            taxAmount: 0,
            dueDate: data.dueDate || "",
          });

          setOdpName(data.odp || "");
          setPackageName(data.packageName || "");
        });
    } else if (!isEdit) {
      reset(EMPTY_SUBS);
      setOdpName("");
      setPackageName("");
    }
  }, [isEdit, open, reset, subscriptionId]);

  // ✅ Submit mapping ke API (langsung pakai id)
  const onSubmit = async (form: SubscriptionFormData) => {
    setLoading(true);
    try {
      const payload = {
        customerName: form.name,
        customerPhone: form.phone,
        address: form.address,
        odpId: form.odpId,
        packageId: form.packageId,
        taxAmount: form.taxAmount,
        dueDate: form.dueDate,
      };

      const res = await fetch(
        isEdit ? `/api/subscription/${subscriptionId}` : "/api/subscription",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        SwalToast.fire({ icon: "success", title: "Berhasil disimpan." });
        onSuccess();
        onClose();
        reset(EMPTY_SUBS);
      } else {
        SwalToast.fire({ icon: "error", title: "Gagal menyimpan data." });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      SwalToast.fire({ icon: "error", title: "Terjadi kesalahan server." });
    } finally {
      setLoading(false);
    }
  };

  const onSelectOdp = ({ name, id }: { name: string; id: string }) => {
    setRootModal(true);
    reset({
      ...watch(),
      odpId: id,
    });
    setOdpName(name);
  };

  const onSelectPackage = ({ name, id }: { name: string; id: string }) => {
    setRootModal(true);
    reset({
      ...watch(),
      packageId: id,
    });
    setPackageName(name);
  };

  return (
    <>
      <Dialog open={rootModal} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Subscription" : "Tambah Subscription"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* NAME & PHONE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Nama</label>
                <Input {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label>No HP</label>
                <Input {...register("phone")} />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* ADDRESS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(
                [
                  { label: "Jalan", name: "street" },
                  { label: "Kelurahan", name: "subDistrict" },
                  { label: "Kecamatan", name: "district" },
                  { label: "Kota", name: "city" },
                  { label: "Provinsi", name: "province" },
                  { label: "Kode Pos", name: "postalCode" },
                ] as const
              ).map((field) => (
                <div key={field.label}>
                  <label className="capitalize">{field.label}</label>
                  <Input {...register(`address.${field.name}`)} />
                  {errors.address?.[field.name] && (
                    <p className="text-sm text-red-500">
                      {errors.address[field.name]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* SELECT ODP & PACKAGE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>ODP</label>
                <div className="grid grid-cols-10 gap-2">
                  <Input className="col-span-9" value={odpName} disabled />
                  <Button
                    className="bg-secondary hover:bg-secondary/90 col-span-1"
                    type="button"
                    onClick={() => {
                      setRootModal(false);
                      setOdpModal(true);
                    }}
                  >
                    ....
                  </Button>
                </div>
                {errors.odpId && (
                  <p className="text-sm text-red-500">{errors.odpId.message}</p>
                )}
              </div>
              <div>
                <label>Paket</label>
                <div className="grid grid-cols-10 gap-2">
                  <Input className="col-span-9" value={packageName} disabled />
                  <Button
                    className="bg-secondary hover:bg-secondary/90 col-span-1"
                    type="button"
                    onClick={() => {
                      setRootModal(false);
                      setPackageModal(true);
                    }}
                  >
                    ....
                  </Button>
                </div>
                {errors.packageId && (
                  <p className="text-sm text-red-500">
                    {errors.packageId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TAX */}
              <div>
                <label>Tanggal Kontrak</label>
                <Input type="date" {...register("dueDate")} />
                {errors.dueDate && (
                  <p className="text-sm text-red-500">
                    {errors.dueDate.message}
                  </p>
                )}
              </div>
              <div>
                <label>PPN (%)</label>
                <Input
                  type="number"
                  {...register("taxAmount", { valueAsNumber: true })}
                />
                {errors.taxAmount && (
                  <p className="text-sm text-red-500">
                    {errors.taxAmount.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary/70"
                disabled={loading}
              >
                {loading ? "Menyimpan..." : isEdit ? "Update" : "Simpan"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <OdpSelectModal
        isOpen={odpModal}
        onClose={() => {
          setOdpModal(false);
          setRootModal(true);
        }}
        onSelect={onSelectOdp}
      />
      <PackageSelectModal
        isOpen={packageModal}
        onClose={() => {
          setPackageModal(false);
          setRootModal(true);
        }}
        onSelect={onSelectPackage}
      />
    </>
  );
}
