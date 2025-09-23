"use client";

import { SwalToast } from "@/components/SweetAlert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod/v3";

const phoneNumberSchema = z
  .string()
  .regex(
    /^62\d{8,15}$/,
    "Nomor harus diawali 62 dan hanya angka, contoh: 628123456789"
  );

const configSchema = z.object({
  apiUrl: z.string().url("URL tidak valid"),
  apiKey: z.string().min(1, "API Key wajib diisi"),
  apiSecret: z.string().min(1, "Secret wajib diisi"),
  adminPhone: phoneNumberSchema,
  supportPhone: phoneNumberSchema,
});

type ConfigForm = z.infer<typeof configSchema>;

const ConfigMessage = () => {
  const [loading, setLoading] = useState(false);

  const configForm = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      apiUrl: "",
      apiKey: "",
      apiSecret: "",
      adminPhone: "",
      supportPhone: "",
    },
  });

  // GET config saat mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/website-info/message");
        if (!res.ok) return;
        const result = await res.json();
        if (result?.data) configForm.reset(result.data);
      } catch (err) {
        SwalToast.fire({
          title: "Gagal memuat konfigurasi",
          text: (err as Error).message,
          icon: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [configForm]);

  const onConfigSubmit = async (data: ConfigForm) => {
    try {
      setLoading(true);
      SwalToast.fire({ title: "Menyimpan konfigurasi...", icon: "info" });

      const res = await fetch("/api/website-info/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        SwalToast.fire({
          title: error.message || "Gagal menyimpan konfigurasi",
          icon: "error",
        });
        return;
      }

      const result = await res.json();
      SwalToast.fire({
        title: result.message || "Konfigurasi disimpan",
        icon: "success",
      });
    } catch (err) {
      SwalToast.fire({
        title: "Terjadi kesalahan jaringan",
        text: (err as Error).message,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border bg-background overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b">
        <h2 className="text-lg sm:text-xl font-semibold">Pengaturan API</h2>
        <p className="text-sm text-muted-foreground">
          Konfigurasi endpoint pengiriman pesan dan nomor admin/support.
        </p>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6">
        <Form {...configForm}>
          <form
            onSubmit={configForm.handleSubmit(onConfigSubmit)}
            className="grid gap-4"
          >
            {/* API URL */}
            <FormField
              control={configForm.control}
              name="apiUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="url"
                      placeholder="https://example.com/send"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* API Key */}
            <FormField
              control={configForm.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="your-api-key"
                      autoComplete="off"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Secret */}
            <FormField
              control={configForm.control}
              name="apiSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phones */}
            <div className="flex flex-col sm:flex-row gap-4">
              <FormField
                control={configForm.control}
                name="adminPhone"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Admin Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        placeholder="628123456789"
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="supportPhone"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Support Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        placeholder="628987654321"
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-primary text-primary-foreground"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </section>
  );
};

export default ConfigMessage;
