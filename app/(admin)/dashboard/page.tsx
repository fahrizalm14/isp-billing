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

// tambahkan type untuk systemInfo
type SystemInfo = {
  boardName: string;
  version: string;
  memory: { totalMB: number; usedMB: number };
  cpuLoad: { load1: number; load5: number; load15: number };
  uptime: string;
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
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  // tambah state untuk last updated
  const [systemInfoUpdatedAt, setSystemInfoUpdatedAt] = useState<number | null>(
    null
  );

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

  // --- extracted fetch function (dapat dipanggil ulang untuk refresh) ---
  const fetchRouterDetails = async (routerId?: string) => {
    if (!routerId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/router/mikrotik/${routerId}/interfaces`);
      const json = await res.json();

      // simpan systemInfo jika ada
      if (json?.systemInfo) {
        setSystemInfo(json.systemInfo);
        setSystemInfoUpdatedAt(Date.now());
      } else {
        setSystemInfo(null);
      }

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
      setSystemInfo(null);
    } finally {
      setLoading(false);
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

  // useEffect untuk fetch ketika selectedRouterId berubah
  useEffect(() => {
    if (!selectedRouterId) return;
    fetchRouterDetails(selectedRouterId);
  }, [selectedRouterId]);

  // reload dashboard saat date range berubah
  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // ---------- NEW: konfigurasi & perhitungan estimasi MB ----------
  // 1 data point = MB_PER_DATA (ubah jika perlu)
  const MB_PER_DATA = 1;
  // raw MB berdasarkan jumlah data (kita gunakan interfaces.length sebagai contoh data point)
  const rawEstimatedMB = interfaces.length * MB_PER_DATA;
  // bulatkan ke kelipatan 3 (misal: 1 -> 3, 3 -> 3, 4 -> 6). Jika tidak mau pembulatan untuk nilai <3, ubah ceil -> langsung raw.
  const roundedToMultipleOf3MB =
    rawEstimatedMB === 0 ? 0 : Math.ceil(rawEstimatedMB / 3) * 3;
  // ----------------------------------------------------------------

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
          <Card className="lg:col-span-7">
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
                // modern layout: chart utama + system info panel
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 min-h-[220px]">
                    {/* NEW: estimasi di atas chart */}
                    <div className="flex items-center justify-end mb-2 gap-2">
                      <span className="text-xs text-muted-foreground">
                        Est. Bandwidth:
                      </span>
                      <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded">
                        {rawEstimatedMB} MB
                        {rawEstimatedMB !== roundedToMultipleOf3MB ? (
                          <span className="ml-2 text-[11px] text-muted-foreground">
                            (rounded → {roundedToMultipleOf3MB} MB)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <BandwidthChart
                      routerId={selectedRouterId}
                      interfaces={selectedInterface}
                    />
                  </div>

                  {/* --- Modern System Info panel --- */}
                  <aside className="w-full md:w-64">
                    <div className="border border-transparent hover:border-neutral-700 transition rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm">System Info</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {systemInfo?.boardName ?? "—"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            aria-label="Refresh system info"
                            onClick={() => fetchRouterDetails(selectedRouterId)}
                            className="inline-flex items-center justify-center p-1.5 rounded-md hover:bg-white/5"
                            title="Refresh"
                          >
                            {/* simple refresh icon */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 10-.88 4.02M4 16a8 8 0 10.88-4.02"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-3 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span className="font-semibold">Version</span>
                          <span>{systemInfo?.version ?? "—"}</span>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold text-xs">
                              Memory
                            </span>
                            <span className="text-xs">
                              {systemInfo
                                ? `${systemInfo.memory.usedMB} / ${systemInfo.memory.totalMB} MB`
                                : "—"}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-green-600"
                              style={{
                                width: systemInfo
                                  ? `${Math.min(
                                      100,
                                      Math.round(
                                        (systemInfo.memory.usedMB /
                                          Math.max(
                                            1,
                                            systemInfo.memory.totalMB
                                          )) *
                                          100
                                      )
                                    )}%`
                                  : "0%",
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold text-xs">
                              CPU (1m)
                            </span>
                            <span className="text-xs">
                              {systemInfo
                                ? `${systemInfo.cpuLoad.load1}%`
                                : "—"}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600"
                              style={{
                                width: systemInfo
                                  ? `${Math.min(
                                      100,
                                      Math.round(systemInfo.cpuLoad.load1)
                                    )}%`
                                  : "0%",
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <span className="font-semibold">Uptime</span>
                          <span>{systemInfo?.uptime ?? "—"}</span>
                        </div>

                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Last updated</span>
                          <span>
                            {systemInfoUpdatedAt
                              ? new Date(
                                  systemInfoUpdatedAt
                                ).toLocaleTimeString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
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
