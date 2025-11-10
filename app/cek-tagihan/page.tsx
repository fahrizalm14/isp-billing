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
import {
  Activity,
  CheckCircle,
  CreditCard,
  Info,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [bandwidthStatus, setBandwidthStatus] =
    useState<"idle" | "loading" | "ready" | "error">("idle");
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    document.title = "Cek Tagihan Internet | ISP Billing";
  }, []);

  const heroHighlights = useMemo(
    () => [
      {
        title: "Status Real-time",
        description: "Cek tagihan & status koneksi tanpa harus login.",
        icon: Activity,
      },
      {
        title: "Riwayat Otomatis",
        description: "Lihat pembayaran terakhir beserta metode yang digunakan.",
        icon: Receipt,
      },
      {
        title: "Pembayaran Nyaman",
        description: "Langsung diarahkan ke portal pembayaran resmi.",
        icon: CreditCard,
      },
      {
        title: "Jaringan Terlindungi",
        description: "Informasi berasal dari router ISP secara aman.",
        icon: ShieldCheck,
      },
    ],
    []
  );

  const defaultBandwidth: BandwidthUsage = {
    isOnline: false,
    bytesIn: 0,
    bytesOut: 0,
    totalBytes: 0,
  };

  const handleCekTagihan = async () => {
    if (!subsId) {
      SwalToast.fire({
        icon: "warning",
        title: "Masukkan nomor pelanggan terlebih dahulu",
      });
      return;
    }

    setTagihan({ status: "loading" });
    setBandwidth(null);
    setBandwidthStatus("loading");
    setHasChecked(true);

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
        setBandwidthStatus("ready");
      } else {
        setBandwidth(defaultBandwidth);
        setBandwidthStatus("error");
      }
    } catch (error) {
      console.error(error);
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan saat cek tagihan",
      });
      setTagihan({ status: "idle" });
      setBandwidth(defaultBandwidth);
      setBandwidthStatus("error");
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
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -top-24 right-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-80 w-80 rounded-full bg-secondary/20 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 md:px-8 lg:py-16">
        <div className="grid items-start gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-background/80 to-background/60 p-8 text-card-foreground shadow-2xl backdrop-blur">
            <div className="inline-flex items-center rounded-full border border-white/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              Portal Pelanggan
            </div>
            <h1 className="mt-5 text-3xl font-semibold text-white md:text-5xl">
              Cek Tagihan & Status Koneksi Dalam Satu Halaman
            </h1>
            <p className="mt-4 text-base text-white/80 md:text-lg">
              Masukkan nomor pelanggan untuk mengetahui total tagihan, akses
              riwayat pembayaran, serta pantau penggunaan bandwidth secara
              real-time.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {heroHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-lg backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-white" />
                    <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-white/70">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="border border-border/60 bg-background/85 shadow-2xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">
                Masukkan Nomor Pelanggan
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Nomor pelanggan dapat dilihat di dashboard pelanggan atau dari
                invoice terakhir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Input
                type="text"
                placeholder="Contoh: 2201-00123"
                value={subsId}
                onChange={(e) => setSubsId(e.target.value)}
                className="h-12 border border-border/70 bg-background/60 text-base placeholder:text-muted-foreground"
              />
              <Button
                className="h-12 w-full text-base font-semibold shadow-lg"
                onClick={handleCekTagihan}
                disabled={tagihan.status === "loading"}
              >
                {tagihan.status === "loading" ? "Memeriksa..." : "Cek Tagihan"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Dengan memeriksa tagihan, Anda menyetujui kebijakan privasi
                layanan kami.
              </p>

              {/* Jika ada tagihan */}
              {tagihan.status === "found" && (
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-5 shadow-inner">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <p className="font-semibold text-primary">
                      Tagihan Ditemukan
                    </p>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>
                      Pelanggan:{" "}
                      <span className="font-semibold text-foreground">
                        {tagihan.data.customer}
                      </span>
                    </p>
                    <p>
                      Bulan:{" "}
                      <span className="font-semibold text-foreground">
                        {tagihan.data.month}
                      </span>
                    </p>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-foreground">
                    Rp {Intl.NumberFormat("id-ID").format(tagihan.data.amount)}
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-4 w-full"
                    onClick={handleBayar}
                  >
                    Bayar Sekarang
                  </Button>
                </div>
              )}

              {/* Jika tidak ada tagihan */}
              {tagihan.status === "none" && (
                <Alert className="border border-border/70 bg-muted/60 text-foreground">
                  <div className="flex items-start gap-3">
                    <Info className="mt-1 h-5 w-5 text-foreground" />
                    <div>
                      <AlertTitle>Tidak Ada Tagihan</AlertTitle>
                      <AlertDescription className="text-sm">
                        Anda tidak memiliki tagihan pada bulan ini. Hubungi admin
                        jika memerlukan bantuan.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {(hasChecked || paymentHistory.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bandwidth Usage */}
            {hasChecked && (
              <Card className="border border-border/70 bg-background/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Activity className="h-5 w-5 text-primary" />
                    Pemakaian Bandwidth
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {bandwidthStatus === "loading"
                      ? "Sedang mengambil data dari router..."
                      : bandwidth && bandwidth.isOnline
                      ? "Sedang online, data diperbarui otomatis."
                      : "Status offline, menampilkan data sesi terakhir."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bandwidthStatus === "loading" && (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="h-16 animate-pulse rounded-2xl bg-muted/60"
                        />
                      ))}
                    </div>
                  )}
                  {bandwidthStatus !== "loading" && (
                    <div className="space-y-4">
                      {bandwidth && bandwidth.isOnline && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-muted-foreground">
                            Tersambung selama {bandwidth.uptime}
                          </span>
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Download
                          </p>
                          <p className="mt-2 text-2xl font-bold text-foreground">
                            {formatBytes((bandwidth || defaultBandwidth).bytesIn)}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            Data diterima
                          </span>
                        </div>
                        <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Upload
                          </p>
                          <p className="mt-2 text-2xl font-bold text-foreground">
                            {formatBytes((bandwidth || defaultBandwidth).bytesOut)}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            Data dikirim
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Total Pemakaian
                        </p>
                        <p className="mt-2 text-3xl font-bold text-accent-foreground">
                          {formatBytes(
                            (bandwidth || defaultBandwidth).totalBytes
                          )}
                        </p>
                        {bandwidth?.address && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            IP Address: {bandwidth.address}
                          </p>
                        )}
                      </div>
                      {bandwidthStatus === "error" && (
                        <p className="text-xs text-destructive">
                          Gagal memuat data bandwidth. Coba cek kembali beberapa
                          saat lagi.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Riwayat Pembayaran */}
            {paymentHistory.length > 0 && (
              <Card className="border border-border/70 bg-background/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Receipt className="h-5 w-5 text-primary" />
                    Riwayat Pembayaran
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Pembayaran terakhir Anda terekam otomatis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-start justify-between rounded-2xl border border-border/60 p-4 transition hover:bg-muted/60"
                    >
                      <div>
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
                        <p className="mt-1 text-xs text-muted-foreground">
                          {payment.paymentMethod || "Manual"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          Rp {Intl.NumberFormat("id-ID").format(payment.amount)}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-green-500">
                          <CheckCircle className="h-3 w-3" />
                          Lunas
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <p className="pb-6 text-center text-xs text-muted-foreground">
          © 2025 ISP Anda – Semua Hak Dilindungi
        </p>
      </div>
    </div>
  );
}
