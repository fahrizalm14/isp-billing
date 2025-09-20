"use client";

import { SwalToast } from "@/components/SweetAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useWebsiteInfoStore } from "@/stores/useWebsiteInfoStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const websiteInfoSchema = z.object({
  name: z.string().min(1, "Nama website wajib diisi"),
  alias: z.string().optional(),
  logoUrl: z
    .union([z.string().url("URL logo tidak valid"), z.literal("")])
    .optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z
    .union([
      z.string().min(8, "Nomor telepon tidak valid").max(20),
      z.literal(""),
    ])
    .optional(),
  email: z
    .union([z.string().email("Email tidak valid"), z.literal("")])
    .optional(),
  website: z
    .union([z.string().url("URL website tidak valid"), z.literal("")])
    .optional(),
});

type WebsiteInfoForm = z.infer<typeof websiteInfoSchema>;

export default function WebsiteInfoForm() {
  const [loading, setLoading] = useState(false);

  const { setWebsiteInfo } = useWebsiteInfoStore();
  const form = useForm<WebsiteInfoForm>({
    resolver: zodResolver(websiteInfoSchema),
    defaultValues: {
      name: "",
      alias: "",
      logoUrl: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      website: "",
    },
  });

  useEffect(() => {
    const fetchWebsiteInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/website-info");
        const data = await res.json();
        form.reset(data); // <-- mengisi form setelah fetch
      } catch (error) {
        console.error("Gagal fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteInfo();
  }, [form]);

  const onSubmit = async (data: WebsiteInfoForm) => {
    try {
      setLoading(true);
      const res = await fetch("/api/website-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan");
      }

      SwalToast.fire({
        title: "Berhasil memperbarui info website.",
        icon: "success",
      });
      setWebsiteInfo(data);
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
        <h2 className="text-xl font-semibold mb-4">Pengaturan</h2>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Website Info</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {[
                  {
                    name: "name",
                    label: "Nama Website",
                    placeholder: "Contoh: MyISP Provider",
                  },
                  { name: "alias", label: "Alias", placeholder: "Contoh: MIP" },
                  {
                    name: "logoUrl",
                    label: "URL Logo",
                    placeholder: "https://...",
                  },
                  {
                    name: "description",
                    label: "Deskripsi",
                    placeholder: "Deskripsi singkat...",
                  },
                  {
                    name: "address",
                    label: "Alamat Kantor",
                    placeholder: "Jl. Mawar No. 1",
                  },
                  {
                    name: "phone",
                    label: "No. Telepon",
                    placeholder: "08xxxxxxx",
                  },
                  {
                    name: "email",
                    label: "Email",
                    placeholder: "info@example.com",
                  },
                  {
                    name: "website",
                    label: "Website",
                    placeholder: "https://example.com",
                  },
                ].map(({ name, label, placeholder }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name as keyof WebsiteInfoForm}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={placeholder} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? "Menyimpan..." : "Simpan Website Info"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Loader loading={loading} />
    </>
  );
}
