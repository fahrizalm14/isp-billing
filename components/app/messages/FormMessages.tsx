"use client";

import RichTextEditor from "@/components/RichTextEditor";
import SubscriptionSelectModal from "@/components/SubscriptionSelectModal";
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
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod/v3";
import { availableVars, IMessageTemplate } from "../../../types/helper";

/* ==================== Schema ==================== */
const messageSchema = z
  .object({
    messageType: z.enum(["all", "direct"], {
      required_error: "Message type is required",
    }),
    user: z.string().optional(), // subscriptionId jika direct
    content: z.string().min(1, "Content cannot be empty"),
  })
  .refine(
    (data) => {
      if (data.messageType === "direct") return !!data.user;
      return true;
    },
    {
      message: "User is required if message type is direct",
      path: ["user"],
    }
  );

type MessageForm = z.infer<typeof messageSchema>;

interface FormMessageProps {
  templates: IMessageTemplate[];
}

/* ==================== Component ==================== */
const FormMessages: React.FC<FormMessageProps> = ({ templates }) => {
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { messageType: "all", user: "", content: "" },
  });

  const messageType = messageForm.watch("messageType");

  /* ==================== Submit ==================== */
  const handleSubmitMessage = async (data: MessageForm) => {
    try {
      setLoading(true);

      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      messageForm.reset({ messageType: "all", user: "", content: "" });
      setSelectedUser("");
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
      <Card>
        <CardHeader>
          <CardTitle>Send Manual Message</CardTitle>
        </CardHeader>
        <CardContent>
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
                          field.onChange(e);
                          if (e.target.value === "direct") {
                            setOpenModal(true);
                          } else {
                            setSelectedUser("");
                            messageForm.setValue("user", "");
                          }
                        }}
                      >
                        <option value="all">All Users</option>
                        <option value="direct">Specific User</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Show selected user if direct */}
              {messageType === "direct" && selectedUser && (
                <div className="p-2 border rounded bg-muted">
                  <p className="text-sm">
                    Selected User:{" "}
                    <span className="font-semibold">{selectedUser}</span>
                  </p>
                </div>
              )}

              {/* Content */}
              <FormField
                control={messageForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Content</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        minHeight={180}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info variabel */}
              <div className="text-sm text-muted-foreground">
                Variabel tersedia: {availableVars.join(", ")}
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Quick apply template */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="secondary">
                      Choose Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Select Template to Insert</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {templates.map((tpl) => (
                        <div key={tpl.id} className="border rounded p-2">
                          <div className="flex items-center justify-between">
                            <strong className="text-sm">{tpl.nama}</strong>
                            <Button
                              size="sm"
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
                          <p className="text-xs text-muted-foreground mt-1">
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
                  className="bg-primary text-primary-foreground"
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Subscription Modal */}
      <SubscriptionSelectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSelect={(subs) => {
          setSelectedUser(`${subs.number} - ${subs.name}`);
          messageForm.setValue("user", subs.id, { shouldValidate: true });
          setOpenModal(false);
          SwalToast.fire({
            title: "User selected",
            icon: "success",
          });
        }}
      />
    </>
  );
};

export default FormMessages;
