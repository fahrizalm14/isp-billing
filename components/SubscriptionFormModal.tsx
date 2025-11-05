"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
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
  street: z.string().min(1, "Alamat wajib diisi"),
  subDistrict: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
});

const SubscriptionSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().min(10, "Nomor telepon tidak valid"),
  address: AddressSchema,
  odpId: z.string().min(1, "ODP wajib dipilih"),
  packageId: z.string().min(1, "Paket wajib dipilih"),
  taxAmount: z.number().min(0),
  discount: z.number().min(0),
  additionalPrice: z.number().min(0),
  dueDate: z.string().optional(),
  pppoeUsername: z.string().optional(),
  pppoePassword: z.string().optional(),
});

type SubscriptionFormData = z.infer<typeof SubscriptionSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscriptionId?: string;
};

type PPPoESecretOption = {
  id: string;
  username: string;
  password: string;
  profile: string;
  status: "active" | "inactive";
  comment?: string;
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
  discount: 0,
  additionalPrice: 0,
  dueDate: "",
  pppoeUsername: "",
  pppoePassword: "",
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

  useEffect(() => {
    if (open) return;
    setSelectedRouterId("");
    setSelectedSecretKey("");
    setInitialSecretUsername("");
    setPppoeSecrets([]);
    setLoadingSecrets(false);
  }, [open]);

  const [odpModal, setOdpModal] = useState(false);
  const [packageModal, setPackageModal] = useState(false);
  const [odpName, setOdpName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [pppoeSecrets, setPppoeSecrets] = useState<PPPoESecretOption[]>([]);
  const [selectedSecretKey, setSelectedSecretKey] = useState("");
  const [selectedRouterId, setSelectedRouterId] = useState("");
  const [loadingSecrets, setLoadingSecrets] = useState(false);
  const [initialSecretUsername, setInitialSecretUsername] = useState("");

  const fetchSecrets = useCallback(async (routerId: string) => {
    if (!routerId) {
      setPppoeSecrets([]);
      return;
    }

    setLoadingSecrets(true);
    try {
      const res = await fetch(`/api/router/mikrotik/${routerId}/secrets`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal mengambil secret PPPoE");
      }

      const inactive: PPPoESecretOption[] = (json.secrets?.inactive || []).map(
        (secret: Record<string, string>, index: number) => ({
          id:
            secret.id ||
            secret.username ||
            `inactive-${index}-${secret.profile || "secret"}`,
          username: secret.username || "",
          password: secret.password || "",
          profile: secret.profile || "",
          status: "inactive",
          comment: secret.comment,
        })
      );

      const active: PPPoESecretOption[] = (json.secrets?.active || []).map(
        (secret: Record<string, string>, index: number) => ({
          id:
            secret.id ||
            secret.username ||
            `active-${index}-${secret.profile || "secret"}`,
          username: secret.username || "",
          password: secret.password || "",
          profile: secret.profile || "",
          status: "active",
          comment: secret.comment,
        })
      );

      const combined = [...inactive, ...active];
      setPppoeSecrets(combined);
    } catch (error) {
      console.error(error);
      setPppoeSecrets([]);
      SwalToast.fire({
        icon: "warning",
        title: "Gagal memuat PPPoE secret dari router.",
      });
    } finally {
      setLoadingSecrets(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedRouterId) {
      setPppoeSecrets([]);
      return;
    }

    fetchSecrets(selectedRouterId);
  }, [selectedRouterId, fetchSecrets]);

  useEffect(() => {
    if (!initialSecretUsername || selectedSecretKey) return;
    const match = pppoeSecrets.find(
      (secret) => secret.username === initialSecretUsername
    );
    if (match) {
      setSelectedSecretKey(match.id);
    }
  }, [initialSecretUsername, selectedSecretKey, pppoeSecrets]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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
            discount: data.discount || 0,
            additionalPrice: data.additionalPrice || 0,
            dueDate: data.dueDate || "",
            pppoeUsername: data.username || "",
            pppoePassword: data.password || "",
          });

          setOdpName(data.odp || "");
          setPackageName(data.packageName || "");
          setSelectedRouterId(data.routerId || "");
          setInitialSecretUsername(data.username || "");
          setSelectedSecretKey("");
        });
    } else if (!isEdit) {
      reset(EMPTY_SUBS);
      setOdpName("");
      setPackageName("");
      setSelectedRouterId("");
      setInitialSecretUsername("");
      setSelectedSecretKey("");
      setPppoeSecrets([]);
    }
  }, [isEdit, open, reset, subscriptionId]);

  // ✅ Submit mapping ke API (langsung pakai id)
  const onSubmit = async (form: SubscriptionFormData) => {
    setLoading(true);
    try {
      const trimmedUsername = form.pppoeUsername?.trim() || "";
      const trimmedPassword = form.pppoePassword?.trim() || "";

      const payload: Record<string, unknown> = {
        customerName: form.name,
        customerPhone: form.phone,
        address: form.address,
        odpId: form.odpId,
        packageId: form.packageId,
        taxAmount: form.taxAmount,
        discount: form.discount,
        additionalPrice: form.additionalPrice,
        dueDate: form.dueDate,
      };

      if (trimmedUsername) {
        payload.pppoeSecret = {
          username: trimmedUsername,
          password: trimmedPassword,
          fromRouter: Boolean(selectedSecretKey),
        };
      }

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
        setPackageName("");
        setOdpName("");
        setSelectedRouterId("");
        setSelectedSecretKey("");
        setPppoeSecrets([]);
        setInitialSecretUsername("");
      } else {
        const _msg = await res.json();
        SwalToast.fire({
          icon: "warning",
          title: _msg?.error ?? "Gagal menyimpan data.",
        });
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

  const onSelectPackage = ({
    name,
    id,
    routerId,
  }: {
    name: string;
    id: string;
    routerId: string;
  }) => {
    setRootModal(true);
    const current = watch();
    reset({
      ...current,
      packageId: id,
      pppoeUsername: "",
      pppoePassword: "",
    });
    setPackageName(name);
    setSelectedRouterId(routerId);
    setSelectedSecretKey("");
    setInitialSecretUsername("");
  };

  const usernameField = register("pppoeUsername");
  const passwordField = register("pppoePassword");
  const selectedSecret = selectedSecretKey
    ? pppoeSecrets.find((secret) => secret.id === selectedSecretKey)
    : null;

  const handleSecretSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedSecretKey(value);

    if (!value) {
      setValue("pppoeUsername", "");
      setValue("pppoePassword", "");
      return;
    }

    const secret = pppoeSecrets.find((item) => item.id === value);
    if (secret) {
      setValue("pppoeUsername", secret.username);
      setValue("pppoePassword", secret.password);
    }
  };

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedSecretKey("");
    usernameField.onChange(event);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedSecretKey("");
    passwordField.onChange(event);
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
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {(
                [
                  { label: "Alamat", name: "street" },
                  // { label: "Kelurahan", name: "subDistrict" },
                  // { label: "Kecamatan", name: "district" },
                  // { label: "Kota", name: "city" },
                  // { label: "Provinsi", name: "province" },
                  // { label: "Kode Pos", name: "postalCode" },
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

            {/* PPPoE Secret */}
            <div className="space-y-3 rounded-md border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
              <p className="text-sm font-medium">Assign PPPoE Secret</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label>User PPPoE</label>
                  <Input
                    {...usernameField}
                    placeholder="contoh: pelanggan01"
                    onChange={handleUsernameChange}
                    disabled={!!selectedSecretKey}
                  />
                  {errors.pppoeUsername && (
                    <p className="text-sm text-red-500">
                      {errors.pppoeUsername.message}
                    </p>
                  )}
                </div>
                <div>
                  <label>Password PPPoE</label>
                  <Input
                    type="text"
                    {...passwordField}
                    placeholder="Masukkan password PPPoE"
                    onChange={handlePasswordChange}
                    disabled={!!selectedSecretKey}
                  />
                  {errors.pppoePassword && (
                    <p className="text-sm text-red-500">
                      {errors.pppoePassword.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block">Pilih dari Secret Router</label>
                <select
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={selectedSecretKey}
                  onChange={handleSecretSelect}
                  disabled={
                    !selectedRouterId ||
                    loadingSecrets ||
                    (!!watch("pppoeUsername") && !!watch("pppoePassword"))
                  }
                >
                  <option value="">
                    {!selectedRouterId
                      ? "Pilih paket untuk memuat secret"
                      : loadingSecrets
                      ? "Memuat secrets..."
                      : watch("pppoeUsername") && watch("pppoePassword")
                      ? "— Input Manual Aktif —"
                      : "— Pilih Secret PPPoE —"}
                  </option>
                  {pppoeSecrets.map((secret) => (
                    <option key={secret.id} value={secret.id}>
                      {secret.username || "(tanpa nama)"} •{" "}
                      {secret.status === "active" ? "Active" : "Inactive"}
                    </option>
                  ))}
                </select>
                {selectedSecret && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Profil: {selectedSecret.profile || "-"} • Status:{" "}
                    {selectedSecret.status === "active" ? "Aktif" : "Nonaktif"}
                    {selectedSecret.comment
                      ? ` • Catatan: ${selectedSecret.comment}`
                      : ""}
                  </p>
                )}
                {!loadingSecrets &&
                  selectedRouterId &&
                  !pppoeSecrets.length && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tidak ada secret PPPoE yang tersedia pada router ini.
                    </p>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tanggal Kontrak */}
              <div>
                <label>Tanggal Kontrak</label>
                <Input type="date" {...register("dueDate")} />
                {errors.dueDate && (
                  <p className="text-sm text-red-500">
                    {errors.dueDate.message}
                  </p>
                )}
              </div>
              {/* PPN */}
              <div>
                <label>PPN (%)</label>
                <Input
                  type="number"
                  min={0}
                  {...register("taxAmount", { valueAsNumber: true, min: 0 })}
                />
                {errors.taxAmount && (
                  <p className="text-sm text-red-500">
                    {errors.taxAmount.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Diskon */}
              <div>
                <label>Diskon (Rp)</label>
                <Input
                  type="number"
                  min={0}
                  {...register("discount", { valueAsNumber: true, min: 0 })}
                />
                {errors.discount && (
                  <p className="text-sm text-red-500">
                    {errors.discount.message}
                  </p>
                )}
              </div>
              {/* Biaya Tambahan */}
              <div>
                <label>Biaya Tambahan (Rp)</label>
                <Input
                  type="number"
                  min={0}
                  {...register("additionalPrice", {
                    valueAsNumber: true,
                    min: 0,
                  })}
                />
                {errors.additionalPrice && (
                  <p className="text-sm text-red-500">
                    {errors.additionalPrice.message}
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
          <div className="mb-5"></div>
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
