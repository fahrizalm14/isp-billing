"use client";

import OdpSelectModal from "@/components/OdpSelectModal";
import RichTextEditor from "@/components/RichTextEditor";
import SubscriptionSelectModal from "@/components/SubscriptionSelectModal";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod/v3";
import { availableVars, IMessageTemplate } from "../../../types/helper";

/* ==================== Schema ==================== */
const messageSchema = z
  .object({
    messageType: z.enum(["all", "direct", "odp"], {
      required_error: "Message type is required",
    }),
    user: z.string().optional(), // subscriptionId jika direct
    odp: z.string().optional(), // odpId jika type = odp
    content: z.string().min(1, "Content cannot be empty"),
  })
  .superRefine((data, ctx) => {
    if (data.messageType === "direct" && !data.user) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "User is required if message type is direct",
        path: ["user"],
      });
    }
    if (data.messageType === "odp" && !data.odp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ODP is required if message type is ODP",
        path: ["odp"],
      });
    }
  });

type MessageForm = z.infer<typeof messageSchema>;

interface FormMessageProps {
  templates: IMessageTemplate[];
}

/* ==================== Component ==================== */
const FormMessages: React.FC<FormMessageProps> = ({ templates }) => {
  const [loading, setLoading] = useState(false);

  // modals
  const [openSubModal, setOpenSubModal] = useState(false);
  const [openOdpModal, setOpenOdpModal] = useState(false);

  // selected display
  const [selectedUserLabel, setSelectedUserLabel] = useState("");
  const [selectedOdpLabel, setSelectedOdpLabel] = useState("");

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { messageType: "all", user: "", odp: "", content: "" },
  });

  const messageType = messageForm.watch("messageType");

  /* ==================== Submit ==================== */
  const handleSubmitMessage = async (data: MessageForm) => {
    try {
      setLoading(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        messageType: data.messageType,
        content: data.content,
      };
      if (data.messageType === "direct") payload.user = data.user;
      if (data.messageType === "odp") payload.odp = data.odp;

      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        SwalToast.fire({
          title: err.message || "Failed to send message",
          icon: "error",
        });
        return;
      }

      const result = await res.json();
      SwalToast.fire({
        title: result.message || "Message queued",
        icon: "success",
      });

      // reset form
      messageForm.reset({ messageType: "all", user: "", odp: "", content: "" });
      setSelectedUserLabel("");
      setSelectedOdpLabel("");
    } catch (err) {
      SwalToast.fire({
        title: "Network error",
        text: (err as Error).message,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ==================== Render ==================== */
  return (
    <>
      {/* Wrapper manual pengganti Card */}
      <section className="rounded-lg border bg-background">
        {/* Header manual */}
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold">
            Send Manual Message
          </h2>
          <p className="text-sm text-muted-foreground">
            Kirim pesan manual ke seluruh user, user tertentu, atau ODP
            tertentu.
          </p>
        </div>

        {/* Body manual */}
        <div className="p-4 sm:p-6">
          <Form {...messageForm}>
            <form
              onSubmit={messageForm.handleSubmit(handleSubmitMessage)}
              className="space-y-4"
            >
              {/* Message Type */}
              <FormField
                control={messageForm.control}
                name="messageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full border rounded p-2 bg-background"
                        onChange={(e) => {
                          const val = e.target.value as
                            | "all"
                            | "direct"
                            | "odp";
                          field.onChange(val);
                          // buka modal ketika perlu pilih entitas
                          if (val === "direct") {
                            setOpenSubModal(true);
                          } else if (val === "odp") {
                            setOpenOdpModal(true);
                          } else {
                            // reset selections utk tipe lain
                            setSelectedUserLabel("");
                            setSelectedOdpLabel("");
                            messageForm.setValue("user", "");
                            messageForm.setValue("odp", "");
                          }
                        }}
                      >
                        <option value="all">All Users</option>
                        <option value="direct">Specific User</option>
                        <option value="odp">Specific ODP</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selected badges */}
              <div className="grid gap-2">
                {messageType === "direct" && selectedUserLabel && (
                  <div className="p-2 border rounded bg-muted text-sm">
                    Selected User:{" "}
                    <span className="font-semibold">{selectedUserLabel}</span>
                  </div>
                )}
                {messageType === "odp" && selectedOdpLabel && (
                  <div className="p-2 border rounded bg-muted text-sm">
                    Selected ODP:{" "}
                    <span className="font-semibold">{selectedOdpLabel}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <FormField
                control={messageForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Content</FormLabel>
                    <FormControl>
                      <div className="border rounded">
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          minHeight={180}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info variabel */}
              <div className="text-sm text-muted-foreground">
                Variabel tersedia: {availableVars.join(", ")}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                {/* Quick apply template */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full sm:w-auto"
                    >
                      Choose Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg w-full">
                    <DialogHeader>
                      <DialogTitle>Select Template to Insert</DialogTitle>
                    </DialogHeader>

                    {/* List template manual (tanpa Card) */}
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {templates.map((tpl) => (
                        <div key={tpl.id} className="border rounded p-3">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 justify-between">
                            <strong className="text-sm flex-1 min-w-0 truncate">
                              {tpl.nama}
                            </strong>
                            <Button
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => {
                                messageForm.setValue("content", tpl.content, {
                                  shouldDirty: true,
                                });
                                SwalToast.fire({
                                  title: "Template applied",
                                  icon: "success",
                                });
                              }}
                            >
                              Use
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap break-words">
                            {tpl.content}
                          </p>
                        </div>
                      ))}
                      {templates.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No templates available
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground w-full sm:w-auto"
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </section>

      {/* Subscription Modal (select single subscription) */}
      <SubscriptionSelectModal
        open={openSubModal}
        onClose={() => setOpenSubModal(false)}
        onSelect={(subs) => {
          setSelectedUserLabel(`${subs.number} - ${subs.name}`);
          messageForm.setValue("user", subs.id, { shouldValidate: true });
          setOpenSubModal(false);
          SwalToast.fire({ title: "User selected", icon: "success" });
        }}
      />

      {/* ODP Modal (select ODP) */}
      <OdpSelectModal
        isOpen={openOdpModal}
        onClose={() => setOpenOdpModal(false)}
        onSelect={(odp) => {
          setSelectedOdpLabel(odp.name);
          messageForm.setValue("odp", odp.id, { shouldValidate: true });
          setOpenOdpModal(false);
          SwalToast.fire({ title: "ODP selected", icon: "success" });
        }}
      />
    </>
  );
};

export default FormMessages;
