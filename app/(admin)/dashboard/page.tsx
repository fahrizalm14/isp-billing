"use client";

import BandwidthChart from "@/components/app/dashboard/BandwidthChart";
import PopularPackageTable from "@/components/app/dashboard/PopularPackageTable";
import { SwalToast } from "@/components/SweetAlert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Loader from "@/components/ui/custom/loader";
import { useEffect, useState } from "react";

type Router = { id: string; name: string };

type DashboardData = {
  income: number;
  expense: number;
  totalSubscriptions: number;
  unpaidBills: number;
  topPackages: {
    no: number;
    name: string;
    speed: string;
    price: number;
    customers: number;
  }[];
};

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse ${className}`}
    />
  );
}

// ✅ Helper untuk konversi Date → "YYYY-MM-DD" lokal (tidak geser -1 hari)
function toLocalDateInputValue(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000; // offset dalam ms
  const localISOTime = new Date(date.getTime() - tzOffset)
    .toISOString()
    .slice(0, 10);
  return localISOTime;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [routers, setRouters] = useState<Router[]>([]);
  const [selectedRouterId, setSelectedRouterId] = useState<string>("");
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>("");

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  // default date range bulan ini (lokal)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(toLocalDateInputValue(firstDay));
  const [endDate, setEndDate] = useState(toLocalDateInputValue(lastDay));

  // fetch dashboard
  const fetchDashboard = async () => {
    try {
      setLoadingDashboard(true);
      const res = await fetch(
        `/api/dashboard?start=${startDate}&end=${endDate}`
      );
      if (!res.ok) throw new Error("Gagal memuat dashboard.");
      const json = await res.json();
      setDashboard(json);
    } catch (error) {
      SwalToast.fire({
        title: String(error),
        icon: "warning",
      });
    } finally {
      setLoadingDashboard(false);
    }
  };

  // fetch routers
  useEffect(() => {
    const fetchRouters = async () => {
      try {
        const res = await fetch("/api/router?search=&page=1&limit=1000");
        if (!res.ok) throw new Error("Gagal memuat data router.");
        const json = await res.json();
        if (json?.data?.length > 0) {
          setRouters(json.data);
          setSelectedRouterId(json.data[0].id);
        }
      } catch (error) {
        SwalToast.fire({
          title: String(error),
          icon: "warning",
        });
      }
    };
    fetchRouters();
  }, []);

  // fetch interfaces
  useEffect(() => {
    if (!selectedRouterId) return;

    const fetchInterfaces = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/router/mikrotik/${selectedRouterId}/interfaces`
        );
        const json = await res.json();
        if (!res.ok) {
          SwalToast.fire({
            title: json.error || "Gagal memuat interfaces.",
            icon: "warning",
          });
          setSelectedInterface("");
          setInterfaces([]);
          return;
        }
        if (json.success) {
          setInterfaces(json.interfaces);
          if (json.interfaces?.length) setSelectedInterface(json.interfaces[0]);
        }
      } catch (error) {
        SwalToast.fire({
          title: String(error),
          icon: "warning",
        });
        setSelectedInterface("");
        setInterfaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInterfaces();
  }, [selectedRouterId]);

  // reload dashboard saat date range berubah
  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  return (
    <>
      <div className="flex-1 space-y-6">
        {/* header + date range */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              title="Tanggal mulai"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm shadow-sm"
            />
            <span>-</span>
            <input
              type="date"
              title="Tanggal akhir"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm shadow-sm"
            />
            <button
              onClick={fetchDashboard}
              title="Terapkan filter tanggal"
              className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium shadow hover:bg-primary/90"
            >
              Apply
            </button>
          </div>
        </div>

        {/* summary cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Pendapatan", value: dashboard?.income, isCurrency: true },
            {
              title: "Pengeluaran",
              value: dashboard?.expense,
              isCurrency: true,
            },
            {
              title: "Pelanggan",
              value: dashboard?.totalSubscriptions,
              isCurrency: false,
            },
            {
              title: "Tagihan Belum Bayar",
              value: dashboard?.unpaidBills,
              isCurrency: true,
            },
          ].map((item, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDashboard ? (
                  <SkeletonBox className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold">
                    {typeof item.value === "number"
                      ? item.isCurrency
                        ? `Rp ${item.value.toLocaleString("id-ID")}`
                        : item.value
                      : 0}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* charts & tables */}
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Bandwidth Monitor</CardTitle>
              <div className="flex flex-wrap gap-4 mt-2">
                <div>
                  <label
                    htmlFor="router-select"
                    className="block text-sm font-medium mb-1"
                  >
                    Router
                  </label>
                  <select
                    id="router-select"
                    title="Pilih router"
                    className="border rounded px-3 py-2 text-sm min-w-[180px] shadow-sm"
                    value={selectedRouterId}
                    onChange={(e) => setSelectedRouterId(e.target.value)}
                  >
                    {routers.map((router) => (
                      <option key={router.id} value={router.id}>
                        {router.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="interface-select"
                    className="block text-sm font-medium mb-1"
                  >
                    Interface
                  </label>
                  {loading ? (
                    <SkeletonBox className="h-9 w-40" />
                  ) : (
                    <select
                      id="interface-select"
                      title="Pilih interface"
                      className="border rounded px-3 py-2 text-sm min-w-[180px] shadow-sm"
                      value={selectedInterface}
                      onChange={(e) => setSelectedInterface(e.target.value)}
                    >
                      {interfaces.map((iface) => (
                        <option key={iface} value={iface}>
                          {iface}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {selectedRouterId && selectedInterface ? (
                <BandwidthChart
                  routerId={selectedRouterId}
                  interfaces={selectedInterface}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pilih router dan interface untuk menampilkan chart.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Paket Terpopuler</CardTitle>
              <CardDescription>
                Paket terpopuler pada periode terpilih
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDashboard ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <SkeletonBox key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <PopularPackageTable data={dashboard?.topPackages ?? []} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Loader loading={loading} />
    </>
  );
}
