"use client";

import RichTextEditor from "@/components/RichTextEditor";
import { SwalToast } from "@/components/SweetAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Pesan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info variabel */}
        <div className="text-sm text-muted-foreground">
          Variabel tersedia: {availableVars.join(", ")}
        </div>

        {/* Form tambah template */}
        <Form {...templateForm}>
          <form
            onSubmit={templateForm.handleSubmit(onTemplateSubmit)}
            className="space-y-3"
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
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-secondary-foreground"
            >
              {loading ? "Menyimpan..." : "Simpan Template"}
            </Button>
          </form>
        </Form>

        {/* List template + modal lihat */}
        <div className="space-y-2">
          {loading && <p className="text-sm">Loading...</p>}
          {!loading && templates.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada template</p>
          )}
          {templates.map((tpl) => {
            const preview = fillTemplate(tpl.content, dummyContext);
            return (
              <Dialog key={tpl.id}>
                <DialogTrigger asChild>
                  <div className="cursor-pointer p-2 border rounded bg-muted text-sm hover:bg-muted/70">
                    <strong>{tpl.nama}</strong>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Detail Template: {tpl.nama}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Raw content */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Raw (dengan variabel)
                      </div>
                      <pre className="text-sm whitespace-pre-wrap">
                        {tpl.content}
                      </pre>
                    </div>

                    {/* Preview */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Preview (dummy data)
                      </div>
                      <div
                        className="text-sm border rounded p-2 bg-background"
                        dangerouslySetInnerHTML={{ __html: preview }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateMessages;
