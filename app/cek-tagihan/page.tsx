"use client";

import { SwalToast } from "@/components/SweetAlert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Info } from "lucide-react";
import { useState } from "react";

interface TagihanData {
  customer: string;
  subsId: string;
  amount: number;
  month: string;
  paymentLink?: string;
}

type TagihanState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "none" }
  | { status: "found"; data: TagihanData };

export default function CekTagihanPage() {
  const [subsId, setSubsId] = useState("");
  const [tagihan, setTagihan] = useState<TagihanState>({ status: "idle" });

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
      const res = await fetch(`/api/payment/bill/${subsId}`);
      const data = await res.json();

      if (data.error) {
        SwalToast.fire({
          icon: "error",
          title: data.error,
        });
        setTagihan({ status: "none" });
      } else {
        setTagihan({ status: "found", data: data.data });
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
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        © 2025 ISP Anda – Semua Hak Dilindungi
      </p>
    </div>
  );
}
