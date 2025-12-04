"use client";

import { SwalToast } from "@/components/SweetAlert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { IMessageTemplate } from "@/types/helper";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v3";

/* ==================== Types ==================== */
interface Trigger {
  id: string;
  key: string;
  description?: string;
  templateName: string;
  templateId: string;
  isActive: boolean;
  scope: "ADMIN" | "SUPPORT" | "USER";
}

const triggerSchema = z.object({
  key: z.string().min(1, "Key wajib diisi"),
  description: z.string().optional(),
  templateId: z.string().min(1, "Template ID wajib diisi"),
  scope: z.enum(["ADMIN", "SUPPORT", "USER"]),
});
type TriggerForm = z.infer<typeof triggerSchema>;

interface TriggerManagementProps {
  templates: IMessageTemplate[];
}

const TriggerManagement: React.FC<TriggerManagementProps> = ({ templates }) => {
  const [editTriggerId, setEditTriggerId] = useState<string | null>(null);
  const [deleteTriggerId, setDeleteTriggerId] = useState<string | null>(null);
  const [triggers, setTriggers] = useState<Trigger[]>([]);

  const triggerForm = useForm<TriggerForm>({
    resolver: zodResolver(triggerSchema),
    defaultValues: { key: "", description: "", templateId: "", scope: "ADMIN" },
  });

  useEffect(() => {
    fetch("/api/message/trigger")
      .then((res) => res.json())
      .then((res) => setTriggers(res.data ?? []));
  }, []);

  /* ===== Submit Add Trigger ===== */
  const onTriggerSubmit = async (data: TriggerForm) => {
    const res = await fetch("/api/message/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) {
      setTriggers((prev) => [json.data, ...prev]);
      SwalToast.fire({ title: "Trigger ditambahkan", icon: "success" });
      triggerForm.reset({
        key: "",
        description: "",
        templateId: "",
        scope: "ADMIN",
      });
    } else {
      SwalToast.fire({ title: json.message, icon: "error" });
    }
  };

  /* ===== Submit Edit Trigger ===== */
  const onEditSubmit = async (id: string, data: TriggerForm) => {
    const res = await fetch(`/api/message/trigger/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok) {
      setTriggers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...json.data } : t))
      );
      SwalToast.fire({ title: "Trigger diupdate", icon: "success" });
      setEditTriggerId(null);
    } else {
      SwalToast.fire({ title: json.message, icon: "error" });
    }
  };

  /* ===== Delete Trigger ===== */
  const confirmDeleteTrigger = async (id: string) => {
    const res = await fetch(`/api/message/trigger/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      setTriggers((prev) => prev.filter((t) => t.id !== id));
      SwalToast.fire({ title: "Trigger dihapus", icon: "success" });
      setDeleteTriggerId(null);
    } else {
      SwalToast.fire({ title: json.message, icon: "error" });
    }
  };

  return (
    <section className="rounded-lg border bg-background">
      {/* Header manual */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between p-4 sm:p-6 border-b">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">
            Trigger Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Kelola trigger notifikasi aplikasi
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">Tambah Trigger</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm w-full">
            <DialogHeader>
              <DialogTitle>Tambah Trigger</DialogTitle>
            </DialogHeader>
            <Form {...triggerForm}>
              <form
                onSubmit={triggerForm.handleSubmit(onTriggerSubmit)}
                className="space-y-4"
              >
                {/* Key */}
                <FormField
                  control={triggerForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between hover:bg-secondary"
                            >
                              {field.value || "Pilih Key"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                            {[
                              "REGISTER_SUCCESS",
                              "PAYMENT_SUCCESS",
                              "DEACTIVATE_SUBSCRIPTION",
                              "ACTIVATE_SUBSCRIPTION",
                              "INVOICE_CREATED",
                              "INACTIVE_CONNECTION",
                              "ACTIVE_CONNECTION",
                            ].map((key) => (
                              <DropdownMenuItem
                                key={key}
                                onClick={() => field.onChange(key)}
                              >
                                {key}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={triggerForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Deskripsi trigger" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Template */}
                <FormField
                  control={triggerForm.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <FormControl>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between hover:bg-secondary"
                            >
                              {field.value
                                ? templates.find((t) => t.id === field.value)
                                    ?.nama
                                : "Pilih Template"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                            {templates.map((t) => (
                              <DropdownMenuItem
                                key={t.id}
                                onClick={() => field.onChange(t.id)}
                              >
                                {t.nama}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Scope */}
                <FormField
                  control={triggerForm.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scope</FormLabel>
                      <FormControl>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between hover:bg-secondary"
                            >
                              {field.value || "Pilih Scope"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                            {["ADMIN", "SUPPORT", "USER"].map((scope) => (
                              <DropdownMenuItem
                                key={scope}
                                onClick={() => field.onChange(scope)}
                              >
                                {scope}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground"
                >
                  Simpan
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Konten: tabel + list mobile */}
      <div className="p-4 sm:p-6">
        {/* MOBILE LIST (tanpa Card) */}
        <div className="space-y-3 sm:hidden">
          {triggers.length === 0 ? (
            <div className="border rounded-md p-4 text-center text-muted-foreground">
              Belum ada trigger
            </div>
          ) : (
            triggers.map((trg) => (
              <div key={trg.id} className="border rounded-md p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{trg.key}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {trg.description || "-"}
                    </div>
                    <div className="text-xs mt-1">
                      <span className="text-muted-foreground">Template:</span>{" "}
                      {trg.templateName}
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Scope:</span>{" "}
                      {trg.scope}
                    </div>
                    <div className="mt-2">
                      {trg.isActive ? (
                        <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500 text-white rounded text-xs">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {/* Edit */}
                    <Dialog
                      open={editTriggerId === trg.id}
                      onOpenChange={(open) =>
                        setEditTriggerId(open ? trg.id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm w-full">
                        <DialogHeader>
                          <DialogTitle>Edit Trigger</DialogTitle>
                        </DialogHeader>
                        <EditTriggerForm
                          templates={templates}
                          initial={trg}
                          onSave={(upd) => onEditSubmit(trg.id, upd)}
                        />
                      </DialogContent>
                    </Dialog>

                    {/* Delete */}
                    <Dialog
                      open={deleteTriggerId === trg.id}
                      onOpenChange={(open) =>
                        setDeleteTriggerId(open ? trg.id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full"
                        >
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm w-full">
                        <DialogHeader>
                          <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm">
                          Yakin ingin menghapus trigger <b>{trg.key}</b> ?
                        </p>
                        <div className="flex justify-end gap-2 mt-4 flex-wrap">
                          <Button
                            variant="outline"
                            onClick={() => setDeleteTriggerId(null)}
                          >
                            Batal
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => confirmDeleteTrigger(trg.id)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] text-xs sm:text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="p-2 text-left">Key</th>
                  <th className="p-2 text-left">Deskripsi</th>
                  <th className="p-2 text-left">Template</th>
                  <th className="p-2 text-left">Scope</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {triggers.map((trg) => (
                  <tr key={trg.id} className="border-t">
                    <td className="p-2 align-top">{trg.key}</td>
                    <td className="p-2 align-top">{trg.description}</td>
                    <td className="p-2 align-top">{trg.templateName}</td>
                    <td className="p-2 align-top">{trg.scope}</td>
                    <td className="p-2 align-top">
                      {trg.isActive ? (
                        <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500 text-white rounded text-xs">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      <div className="flex flex-wrap gap-2">
                        {/* Edit */}
                        <Dialog
                          open={editTriggerId === trg.id}
                          onOpenChange={(open) =>
                            setEditTriggerId(open ? trg.id : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" className="w-full sm:w-auto">
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm w-full">
                            <DialogHeader>
                              <DialogTitle>Edit Trigger</DialogTitle>
                            </DialogHeader>
                            <EditTriggerForm
                              templates={templates}
                              initial={trg}
                              onSave={(upd) => onEditSubmit(trg.id, upd)}
                            />
                          </DialogContent>
                        </Dialog>

                        {/* Delete */}
                        <Dialog
                          open={deleteTriggerId === trg.id}
                          onOpenChange={(open) =>
                            setDeleteTriggerId(open ? trg.id : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full sm:w-auto"
                            >
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm w-full">
                            <DialogHeader>
                              <DialogTitle>Konfirmasi Hapus</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm">
                              Yakin ingin menghapus trigger <b>{trg.key}</b> ?
                            </p>
                            <div className="flex justify-end gap-2 mt-4 flex-wrap">
                              <Button
                                variant="outline"
                                onClick={() => setDeleteTriggerId(null)}
                              >
                                Batal
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => confirmDeleteTrigger(trg.id)}
                              >
                                Hapus
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
                {triggers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Belum ada trigger
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ==================== Edit Form ==================== */
function EditTriggerForm({
  initial,
  templates,
  onSave,
}: {
  initial: Trigger;
  templates: IMessageTemplate[];
  onSave: (data: TriggerForm) => void;
}) {
  const form = useForm<TriggerForm>({
    resolver: zodResolver(triggerSchema),
    defaultValues: {
      key: initial.key,
      description: initial.description,
      templateId: initial.templateId,
      scope: initial.scope,
    },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => onSave(data))}
      >
        {/* Key */}
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key</FormLabel>
              <FormControl>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between hover:bg-secondary"
                    >
                      {field.value || "Pilih Key"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {[
                      "REGISTER_SUCCESS",
                      "PAYMENT_SUCCESS",
                      "DEACTIVATE_SUBSCRIPTION",
                      "ACTIVATE_SUBSCRIPTION",
                      "INVOICE_CREATED",
                    ].map((key) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => field.onChange(key)}
                      >
                        {key}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Template */}
        <FormField
          control={form.control}
          name="templateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template</FormLabel>
              <FormControl>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between hover:bg-secondary"
                    >
                      {field.value
                        ? templates.find((t) => t.id === field.value)?.nama
                        : "Pilih Template"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {templates.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => field.onChange(t.id)}
                      >
                        {t.nama}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Scope */}
        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope</FormLabel>
              <FormControl>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between hover:bg-secondary"
                    >
                      {field.value || "Pilih Scope"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {["ADMIN", "SUPPORT", "USER"].map((scope) => (
                      <DropdownMenuItem
                        key={scope}
                        onClick={() => field.onChange(scope)}
                      >
                        {scope}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground"
        >
          Update
        </Button>
      </form>
    </Form>
  );
}

export default TriggerManagement;
