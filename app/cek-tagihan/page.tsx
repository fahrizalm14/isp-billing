"use client";

import { SwalToast } from "@/components/SweetAlert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Activity, CheckCircle, Info, Receipt } from "lucide-react";
import { useState } from "react";

interface TagihanData {
  customer: string;
  subsId: string;
  amount: number;
  month: string;
  paymentLink?: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  updatedAt: string;
  paymentMethod: string | null;
  number: string;
}

interface BandwidthUsage {
  isOnline: boolean;
  bytesIn: number;
  bytesOut: number;
  totalBytes: number;
  username?: string;
  address?: string;
  uptime?: string;
}

type TagihanState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "none" }
  | { status: "found"; data: TagihanData };

// Helper function untuk format bytes
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function CekTagihanPage() {
  const [subsId, setSubsId] = useState("");
  const [tagihan, setTagihan] = useState<TagihanState>({ status: "idle" });
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [bandwidth, setBandwidth] = useState<BandwidthUsage | null>(null);

  const handleCekTagihan = async () => {
    if (!subsId) {
      SwalToast.fire({
        icon: "warning",
        title: "Masukkan nomor pelanggan terlebih dahulu",
      });
      return;
    }

    setTagihan({ status: "loading" });

    try {
      // Fetch tagihan, riwayat pembayaran, dan bandwidth usage secara parallel
      const [tagihanRes, historyRes, bandwidthRes] = await Promise.all([
        fetch(`/api/payment/bill/${subsId}`),
        fetch(`/api/payment/history/${subsId}`),
        fetch(`/api/payment/bandwidth/${subsId}`),
      ]);

      const tagihanData = await tagihanRes.json();
      const historyData = await historyRes.json();
      const bandwidthData = await bandwidthRes.json();

      if (tagihanData.error) {
        SwalToast.fire({
          icon: "error",
          title: tagihanData.error,
        });
        setTagihan({ status: "none" });
      } else {
        setTagihan({ status: "found", data: tagihanData.data });
      }

      // Set riwayat pembayaran jika ada
      if (!historyData.error && historyData.data) {
        setPaymentHistory(historyData.data);
      }

      // Set bandwidth usage jika ada
      if (!bandwidthData.error && bandwidthData.data) {
        setBandwidth(bandwidthData.data);
      }
    } catch (error) {
      console.error(error);
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan saat cek tagihan",
      });
      setTagihan({ status: "idle" });
    }
  };

  const handleBayar = () => {
    if (tagihan.status !== "found") return;
    if (tagihan.data.paymentLink) {
      window.location.href = tagihan.data.paymentLink;
    } else {
      SwalToast.fire({
        icon: "info",
        title: "Hubungi admin untuk pembayaran",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 md:p-10">
      <h1 className="text-3xl md:text-5xl font-bold text-center text-primary mb-8">
        Cek Tagihan Internet Anda
      </h1>

      <div className="w-full max-w-md bg-card shadow-lg rounded-xl p-8">
        {/* Input */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Masukkan No. Pelanggan"
            value={subsId}
            onChange={(e) => setSubsId(e.target.value)}
            className="border-input bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Tombol Cek */}
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-4"
          onClick={handleCekTagihan}
          disabled={tagihan.status === "loading"}
        >
          {tagihan.status === "loading" ? "Memeriksa..." : "Cek Tagihan"}
        </Button>

        {/* Jika ada tagihan */}
        {tagihan.status === "found" && (
          <div className="border border-accent rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-6 h-6 text-accent" />
              <h2 className="text-accent font-semibold text-lg">
                Tagihan Ditemukan
              </h2>
            </div>
            <p className="text-foreground">
              Pelanggan:{" "}
              <span className="font-semibold">{tagihan.data.customer}</span>
            </p>
            <p className="text-foreground">
              Bulan: <span className="font-semibold">{tagihan.data.month}</span>
            </p>
            <p className="text-destructive font-bold text-xl">
              Rp {Intl.NumberFormat("id-ID").format(tagihan.data.amount)}
            </p>
            <Button
              className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleBayar}
            >
              Bayar Sekarang
            </Button>
          </div>
        )}

        {/* Jika tidak ada tagihan */}
        {tagihan.status === "none" && (
          <Alert className="mt-4 border-border bg-muted rounded-lg shadow-sm flex items-start gap-2 p-4">
            <Info className="h-6 w-6 text-secondary-foreground mt-1" />
            <div>
              <AlertTitle className="text-foreground font-semibold">
                Tidak Ada Tagihan
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Anda tidak memiliki tagihan pada bulan ini. Hubungi admin jika
                ada pertanyaan.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Bandwidth Usage */}
        {bandwidth && (
          <Card className="mt-6 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Activity className="w-5 h-5" />
                Pemakaian Bandwidth
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {bandwidth.isOnline
                  ? "Status: Online"
                  : "Status: Offline (Data sesi terakhir)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status Online */}
                {bandwidth.isOnline && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-muted-foreground">
                      Sedang terhubung
                    </span>
                  </div>
                )}

                {/* Download */}
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Download</p>
                    <p className="font-bold text-lg text-foreground">
                      {formatBytes(bandwidth.bytesIn)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Data diterima
                    </div>
                  </div>
                </div>

                {/* Upload */}
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Upload</p>
                    <p className="font-bold text-lg text-foreground">
                      {formatBytes(bandwidth.bytesOut)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Data dikirim
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Pemakaian
                    </p>
                    <p className="font-bold text-xl text-primary">
                      {formatBytes(bandwidth.totalBytes)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Sesi ini
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {bandwidth.isOnline && bandwidth.uptime && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Durasi Koneksi: {bandwidth.uptime}
                    </p>
                    {bandwidth.address && (
                      <p className="text-xs text-muted-foreground">
                        IP Address: {bandwidth.address}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Riwayat Pembayaran */}
        {paymentHistory.length > 0 && (
          <Card className="mt-6 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Receipt className="w-5 h-5" />
                Riwayat Pembayaran
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                5 Pembayaran terakhir Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-start p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {payment.number || "Invoice"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.updatedAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {payment.paymentMethod || "Manual"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        Rp {Intl.NumberFormat("id-ID").format(payment.amount)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Lunas
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        © 2025 ISP Anda – Semua Hak Dilindungi
      </p>
    </div>
  );
}
