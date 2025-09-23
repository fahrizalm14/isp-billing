"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import { IMessage } from "../../../types/helper";

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
interface ListMessageProps {
  messages: IMessage[];
  setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
}

const ListMessages: React.FC<ListMessageProps> = ({
  messages,
  setMessages,
}) => {
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/message?page=${page}&pageSize=10`)
      .then((res) => res.json())
      .then((res) => {
        if (ignore) return;
        setMessages(res.data ?? []);
        setPagination(res.pagination ?? null);
      })
      .catch(() => {
        setMessages([]);
        setPagination(null);
      });
    return () => {
      ignore = true;
    };
  }, [page, setMessages]);

  const badge = (status: IMessage["status"]) => {
    const base = "px-2 py-1 rounded text-xs";
    if (status === "SENT")
      return (
        <span className={`${base} bg-primary text-primary-foreground`}>
          SENT
        </span>
      );
    if (status === "FAILED")
      return (
        <span className={`${base} bg-destructive text-destructive-foreground`}>
          FAILED
        </span>
      );
    return <span className={`${base} bg-muted text-foreground`}>{status}</span>;
  };

  return (
    <section className="rounded-lg border bg-background">
      {/* Header manual */}
      <div className="p-4 sm:p-6 border-b">
        <h2 className="text-lg sm:text-xl font-semibold">Daftar Pesan</h2>
        <p className="text-sm text-muted-foreground">
          Riwayat pesan terkirim/tertunda.
        </p>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6">
        {/* MOBILE LIST */}
        <div className="sm:hidden space-y-3">
          {messages.length === 0 ? (
            <div className="border rounded-md p-4 text-center text-muted-foreground">
              Belum ada pesan
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="border rounded-md p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {msg.kategori}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleString("id-ID")}
                    </div>
                    <div className="text-xs mt-1 truncate">
                      <span className="text-muted-foreground">User:</span>{" "}
                      {msg.user ?? "-"}
                    </div>
                    <div className="mt-2">{badge(msg.status)}</div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="shrink-0">
                        Lihat
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg w-full max-h-[80svh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detail Pesan</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 text-sm">
                        <div>
                          <b>Tanggal:</b>{" "}
                          {new Date(msg.createdAt).toLocaleString("id-ID")}
                        </div>
                        <div>
                          <b>Kategori:</b> {msg.kategori}
                        </div>
                        <div>
                          <b>User:</b> {msg.user}
                        </div>
                        <div>
                          <b>Status:</b> {msg.status}
                        </div>
                        <div className="border-t pt-2">
                          <div className="text-xs text-muted-foreground mb-1">
                            Konten
                          </div>
                          <div
                            dangerouslySetInnerHTML={{ __html: msg.content }}
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="p-2 text-left">Tanggal</th>
                  <th className="p-2 text-left">Kategori</th>
                  <th className="p-2 text-left">User</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id} className="border-t align-top">
                    <td className="p-2 whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="p-2">{msg.kategori}</td>
                    <td className="p-2 max-w-[260px] truncate">{msg.user}</td>
                    <td className="p-2">{badge(msg.status)}</td>
                    <td className="p-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">Lihat</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg w-full max-h-[80svh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detail Pesan</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 text-sm">
                            <div>
                              <b>Tanggal:</b>{" "}
                              {new Date(msg.createdAt).toLocaleString("id-ID")}
                            </div>
                            <div>
                              <b>Kategori:</b> {msg.kategori}
                            </div>
                            <div>
                              <b>User:</b> {msg.user}
                            </div>
                            <div>
                              <b>Status:</b> {msg.status}
                            </div>
                            <div className="border-t pt-2">
                              <div className="text-xs text-muted-foreground mb-1">
                                Konten
                              </div>
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: msg.content,
                                }}
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-muted-foreground"
                    >
                      Belum ada pesan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <Button
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="order-2 sm:order-none"
            >
              Prev
            </Button>

            <span className="order-1 sm:order-none">
              Halaman {pagination.page} / {pagination.totalPages}
            </span>

            <Button
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPage((p) =>
                  pagination ? Math.min(pagination.totalPages, p + 1) : p
                )
              }
              className="order-3 sm:order-none"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ListMessages;
