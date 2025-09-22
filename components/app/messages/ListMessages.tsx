"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    fetch(`/api/message?page=${page}&pageSize=10`)
      .then((res) => res.json())
      .then((res) => {
        setMessages(res.data);
        setPagination(res.pagination);
      });
  }, [page, setMessages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pesan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-muted">
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
                <tr key={msg.id} className="border-t">
                  <td className="p-2">
                    {new Date(msg.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="p-2">{msg.kategori}</td>
                  <td className="p-2">{msg.user}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        msg.status === "SENT"
                          ? "bg-primary text-primary-foreground"
                          : msg.status === "FAILED"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">Lihat</Button>
                      </DialogTrigger>
                      <DialogContent>
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

        {pagination && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <Button
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <span>
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
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListMessages;
