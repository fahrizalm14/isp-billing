"use client";

import RichTextEditor from "@/components/RichTextEditor";
import { SwalToast } from "@/components/SweetAlert";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import {
  IMessageTemplate,
  availableVars,
  dummyContext,
  fillTemplate,
} from "../../../types/helper";

const templateSchema = z.object({
  name: z.string().min(1, "Nama template wajib diisi"),
  content: z.string().min(1, "Isi template wajib diisi"),
});
type TemplateForm = z.infer<typeof templateSchema>;

interface TemplateMessageProps {
  templates: IMessageTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<IMessageTemplate[]>>;
}

const TemplateMessages: React.FC<TemplateMessageProps> = ({
  setTemplates,
  templates,
}) => {
  const [loading, setLoading] = useState(false);

  const templateForm = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", content: "" },
  });

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/message/template");
      if (!res.ok) throw new Error("Failed to fetch templates");
      const result = await res.json();
      setTemplates(result.data || []);
    } catch (err) {
      SwalToast.fire({
        title: "Gagal memuat template",
        text: (err as Error).message,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [setTemplates]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const onTemplateSubmit = async (data: TemplateForm) => {
    try {
      setLoading(true);
      const res = await fetch("/api/message/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        SwalToast.fire({
          title: err.message || "Gagal menyimpan template",
          icon: "error",
        });
        return;
      }

      const result = await res.json();
      SwalToast.fire({ title: result.message, icon: "success" });
      templateForm.reset();
      fetchTemplates();
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string>("");

  async function handleDeleteConfirm() {
    if (!deletingId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/message/template?id=${encodeURIComponent(deletingId)}`,
        {
          method: "DELETE",
        }
      );
      const result = await res.json();
      if (!res.ok) {
        SwalToast.fire({
          title: result.message || "Gagal menghapus template",
          icon: "error",
        });
        return;
      }
      SwalToast.fire({
        title: result.message || "Template dihapus",
        icon: "success",
      });
      fetchTemplates();
    } catch (err) {
      SwalToast.fire({
        title: "Terjadi kesalahan jaringan",
        text: (err as Error).message,
        icon: "error",
      });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setDeletingId(null);
      setDeletingName("");
    }
  }

  return (
    <section className="rounded-lg border bg-background">
      {/* Header manual */}
      <div className="p-4 sm:p-6 border-b">
        <h2 className="text-lg sm:text-xl font-semibold">Template Pesan</h2>
        <p className="text-sm text-muted-foreground">
          Kelola template pesan dan pratinjau dengan data dummy.
        </p>
      </div>

      {/* Body manual */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Info variabel */}
        <div className="text-sm text-muted-foreground">
          Variabel tersedia: {availableVars.join(", ")}
        </div>

        {/* Form tambah template */}
        <Form {...templateForm}>
          <form
            onSubmit={templateForm.handleSubmit(onTemplateSubmit)}
            className="grid gap-4"
          >
            <FormField
              control={templateForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Template</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Contoh: Pembayaran Berhasil"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={templateForm.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Isi Template</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      minHeight={150}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-secondary text-secondary-foreground"
              >
                {loading ? "Menyimpan..." : "Simpan Template"}
              </Button>
            </div>
          </form>
        </Form>

        {/* List template + modal lihat (tanpa Card) */}
        <div className="space-y-2">
          {loading && <p className="text-sm">Loading...</p>}
          {!loading && templates.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada template</p>
          )}

          {/* MOBILE: list sederhana */}
          <div className="sm:hidden space-y-2">
            {templates.map((tpl) => {
              const preview = fillTemplate(tpl.content, dummyContext);
              return (
                <Dialog key={tpl.id}>
                  <DialogTrigger asChild>
                    <button
                      className="w-full text-left cursor-pointer p-3 border rounded bg-muted text-sm hover:bg-muted/70"
                      title="Lihat detail template"
                    >
                      <strong className="block truncate">{tpl.nama}</strong>
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {tpl.content}
                      </span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg w-full max-h-[80svh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Detail Template: {tpl.nama}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Raw (dengan variabel)
                        </div>
                        <pre className="text-sm whitespace-pre-wrap break-words">
                          {tpl.content}
                        </pre>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Preview (dummy data)
                        </div>
                        <div
                          className="text-sm border rounded p-2 bg-background"
                          dangerouslySetInnerHTML={{ __html: preview }}
                        />
                      </div>

                      {/* Delete button */}
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => {
                            setDeletingId(tpl.id);
                            setDeletingName(tpl.nama ?? tpl?.name ?? "");
                            setConfirmOpen(true);
                          }}
                        >
                          Hapus Template
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>

          {/* DESKTOP: grid ringan */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((tpl) => {
              const preview = fillTemplate(tpl.content, dummyContext);
              return (
                <Dialog key={tpl.id}>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer p-3 border rounded hover:bg-muted/40">
                      <strong className="block text-sm truncate">
                        {tpl.nama}
                      </strong>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {tpl.content}
                      </p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl w-full max-h-[80svh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Detail Template: {tpl.nama}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Raw (dengan variabel)
                        </div>
                        <pre className="text-sm whitespace-pre-wrap break-words">
                          {tpl.content}
                        </pre>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Preview (dummy data)
                        </div>
                        <div
                          className="text-sm border rounded p-2 bg-background"
                          dangerouslySetInnerHTML={{ __html: preview }}
                        />
                      </div>

                      {/* Delete button */}
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => {
                            setDeletingId(tpl.id);
                            setDeletingName(tpl.nama ?? tpl?.name ?? "");
                            setConfirmOpen(true);
                          }}
                        >
                          Hapus Template
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirm dialog (single instance) */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (!loading) setConfirmOpen(o);
          if (!o) {
            setDeletingId(null);
            setDeletingName("");
          }
        }}
        title="Hapus Template?"
        description={
          <span>
            Anda akan menghapus template <strong>{deletingName}</strong>.
            Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        requiredText={deletingName}
        inputPlaceholder={deletingName}
        hint="Ketik nama template (tidak case-sensitive) untuk konfirmasi."
        matchMode="iequals"
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={handleDeleteConfirm}
        disableInput={deletingName === ""}
      />
    </section>
  );
};

export default TemplateMessages;
