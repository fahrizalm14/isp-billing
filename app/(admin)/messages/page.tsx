"use client";

import ConfigMessage from "@/components/app/messages/ConfigMessage";
import FormMessages from "@/components/app/messages/FormMessages";
import ListMessages from "@/components/app/messages/ListMessages";
import TemplateMessages from "@/components/app/messages/TemplateMessages";
import TriggerManagement from "@/components/app/messages/TriggerManagement";
import WhatsAppSettings from "@/components/app/messages/WhatsAppSettings";
import Loader from "@/components/ui/custom/loader";
import { IMessage, IMessageTemplate } from "@/types/helper";
import { useEffect, useState } from "react";

/* ==================== Component ==================== */
export default function MessagingDashboard() {
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [templates, setTemplates] = useState<IMessageTemplate[]>([]);

  useEffect(() => {
    // simulate wait render/mount
    const t = setTimeout(() => {
      setLoading(false); // matikan loading setelah komponen mount
    }, 300); // kasih delay kecil biar UX smooth
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div className="p-4 bg-background text-foreground">
        <div className="grid gap-6 md:grid-cols-12">
          {/* ===== Left (wide) column ===== */}
          <div className="md:col-span-8 space-y-6 mb-6">
            <FormMessages templates={templates} />
            <TriggerManagement {...{ templates }} />
            <ListMessages {...{ messages, setMessages }} />
          </div>

          {/* ===== Right (narrow) column ===== */}
          <div className="md:col-span-4 space-y-6">
            <WhatsAppSettings />
            <ConfigMessage />
            <TemplateMessages {...{ setTemplates, templates }} />
          </div>
        </div>
      </div>
      <Loader loading={loading} />
    </>
  );
}
