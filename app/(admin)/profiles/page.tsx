"use client";

import { SwalToast } from "@/components/SweetAlert";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "@/components/ui/custom/loader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/stores/useUserStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// ✅ Validasi Zod schema
const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 karakter")
    .regex(/^0\d+$/, "Nomor telepon tidak valid"),
  street: z.string().optional(),
  subDistrict: z.string().min(2, "Kelurahan/Desa wajib diisi"),
  district: z.string().min(2, "Kecamatan wajib diisi"),
  city: z.string().min(2, "Kota/Kabupaten wajib diisi"),
  province: z.string().min(2, "Provinsi wajib diisi"),
  postalCode: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function UserProfile() {
  const { id, setUser, email: _email, role: _role } = useUserStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const res = await fetch(`/api/profile?userId=${id}`);
        if (!res.ok) {
          throw new Error(`Gagal fetch profile: ${res.status}`);
        }

        const data = await res.json();
        form.reset(data); // isi form dengan data dari backend
      } catch (error) {
        SwalToast.fire({
          title: String(error),
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      street: "",
      subDistrict: "",
      district: "",
      city: "",
      province: "",
      postalCode: "",
    },
  });

  const onSubmit = async (values: ProfileFormData) => {
    if (!id) {
      alert("User ID tidak ditemukan. Silakan login kembali.");
      return;
    }

    const payload = {
      userId: id,
      phone: values.phone,
      name: values.name,
      address: {
        street: values.street,
        subDistrict: values.subDistrict,
        district: values.district,
        city: values.city,
        province: values.province,
        postalCode: values.postalCode,
      },
    };

    try {
      setLoading(true);
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan");
      }
      setUser({
        email: _email,
        id: id,
        role: _role,
        name: values.name,
      });
      SwalToast.fire({
        title: "Berhasil memperbarui profil.",
        icon: "success",
      });
    } catch (error) {
      SwalToast.fire({
        title: String(error),
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-4 bg-background text-foreground min-h-screen transition-colors duration-200">
        <h2 className="text-xl font-semibold">Profil Pengguna</h2>

        <div className="grid gap-4 mt-4">
          <Card className="max-w-4xl w-full">
            <CardContent className="py-4 px-6 md:px-10">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {[
                    {
                      name: "name",
                      label: "Nama",
                      placeholder: "Nama lengkap",
                    },
                    {
                      name: "phone",
                      label: "No. Telepon",
                      placeholder: "08xxxxxxx",
                    },
                    {
                      name: "street",
                      label: "Jalan (Opsional)",
                      placeholder: "Jl. Contoh No.123",
                    },
                  ].map(({ name, label, placeholder }) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as keyof ProfileFormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={placeholder}
                              className="h-11 px-4 py-2 text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  {/* Kelurahan & Kecamatan */}
                  <div className="flex gap-4">
                    {[
                      {
                        name: "subDistrict",
                        label: "Kelurahan/Desa",
                        placeholder: "Ciputat",
                      },
                      {
                        name: "district",
                        label: "Kecamatan",
                        placeholder: "Ciputat Timur",
                      },
                    ].map(({ name, label, placeholder }) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name as keyof ProfileFormData}
                        render={({ field }) => (
                          <FormItem className="w-1/2">
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={placeholder}
                                className="h-11 px-4 py-2 text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  {/* Kota & Provinsi */}
                  <div className="flex gap-4">
                    {[
                      {
                        name: "city",
                        label: "Kota/Kabupaten",
                        placeholder: "Tangerang Selatan",
                      },
                      {
                        name: "province",
                        label: "Provinsi",
                        placeholder: "Banten",
                      },
                    ].map(({ name, label, placeholder }) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name as keyof ProfileFormData}
                        render={({ field }) => (
                          <FormItem className="w-1/2">
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={placeholder}
                                className="h-11 px-4 py-2 text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  {/* Kode Pos */}
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Pos</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="15419"
                            className="h-11 px-4 py-2 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-primary text-white px-5 py-2.5 rounded-md text-base hover:bg-primary/80 transition"
                      disabled={loading}
                    >
                      {loading ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Loader loading={loading} />
    </>
  );
}
