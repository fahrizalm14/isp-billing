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
import { useCallback, useEffect, useState } from "react";

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

// tipe data PPPoE secret dari router
type SecretRecord = {
  name: string;
  service?: string;
  profile?: string;
  status: "active" | "inactive";
  [key: string]: unknown; // simpan field lain bila ada
};

// tipe raw dari API (active/inactive arrays) untuk secrets
interface RawSecret {
  name: string;
  service?: string;
  profile?: string;
  [key: string]: unknown;
}

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
  // secrets state
  const [secretRecords, setSecretRecords] = useState<SecretRecord[]>([]);
  const [secretCounts, setSecretCounts] = useState({ active: 0, inactive: 0 });
  const [secretSortAsc, setSecretSortAsc] = useState(true); // true = active dulu

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
  const fetchRouterDetails = useCallback(
    async (routerId?: string) => {
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
          setSecretRecords([]);
          setSecretCounts({ active: 0, inactive: 0 });
          return;
        }

        // Bentuk baru: { secrets: { active: [...], inactive: [...] }, interfaces?: [...] }
        if (json.secrets) {
          const activeArr: SecretRecord[] = (json.secrets.active || []).map(
            (it: RawSecret): SecretRecord => ({ ...it, status: "active" })
          );
          const inactiveArr: SecretRecord[] = (json.secrets.inactive || []).map(
            (it: RawSecret): SecretRecord => ({ ...it, status: "inactive" })
          );
          const combined = [...activeArr, ...inactiveArr];
          setSecretRecords(combined);
          setSecretCounts({
            active: activeArr.length,
            inactive: inactiveArr.length,
          });
        } else {
          setSecretRecords([]);
          setSecretCounts({ active: 0, inactive: 0 });
        }

        // Interfaces untuk chart (jika memang disediakan API terpisah)
        if (Array.isArray(json.interfaces) && json.interfaces.length > 0) {
          setInterfaces(json.interfaces);
          setSelectedInterface((curr) =>
            curr && json.interfaces.includes(curr) ? curr : json.interfaces[0]
          );
        } else if (interfaces.length === 0) {
          // jangan override jika sudah ada dari fetch sebelumnya
          setInterfaces([]);
          setSelectedInterface("");
        }
      } catch (error) {
        SwalToast.fire({
          title: String(error),
          icon: "warning",
        });
        setSelectedInterface("");
        setInterfaces([]);
        setSystemInfo(null);
        setSecretRecords([]);
        setSecretCounts({ active: 0, inactive: 0 });
      } finally {
        setLoading(false);
      }
    },
    [interfaces.length]
  );

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
  }, [selectedRouterId, fetchRouterDetails]);

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

  // urutan ter-sort untuk reuse di table & mobile list
  const sortedSecrets = [...secretRecords].sort((a, b) => {
    if (a.status === b.status) return a.name.localeCompare(b.name);
    if (secretSortAsc) return a.status === "active" ? -1 : 1;
    return a.status === "inactive" ? -1 : 1;
  });

  return (
    <>
      <div className="flex-1 space-y-6 px-2 sm:px-4">
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

        {/* secrets counts cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Secrets Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonBox className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {secretCounts.active}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Secrets Non-Aktif
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonBox className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {secretCounts.inactive}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* charts & tables */}
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Bandwidth Monitor</CardTitle>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mt-2">
                <div className="min-w-[200px] sm:min-w-[180px] flex-1">
                  <label
                    htmlFor="router-select"
                    className="block text-sm font-medium mb-1"
                  >
                    Router
                  </label>
                  <select
                    id="router-select"
                    title="Pilih router"
                    className="border rounded px-3 py-2 text-sm w-full shadow-sm"
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
                <div className="min-w-[200px] sm:min-w-[180px] flex-1">
                  <label
                    htmlFor="interface-select"
                    className="block text-sm font-medium mb-1"
                  >
                    Interface
                  </label>
                  {loading ? (
                    <SkeletonBox className="h-9 w-full sm:w-40" />
                  ) : (
                    <select
                      id="interface-select"
                      title="Pilih interface"
                      className="border rounded px-3 py-2 text-sm w-full shadow-sm"
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
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 min-h-[220px]">
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

          <Card className="lg:col-span-4">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>PPPoE Secrets</CardTitle>
                <CardDescription>
                  Daftar secrets (aktif & non-aktif)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSecretSortAsc((p) => !p)}
                  className="text-xs px-3 py-1 rounded-md border hover:bg-muted"
                  title="Urutkan Active dulu / Non-Active dulu"
                >
                  Sort Status:{" "}
                  {secretSortAsc ? "Active→Inactive" : "Inactive→Active"}
                </button>
                <button
                  onClick={() => fetchRouterDetails(selectedRouterId)}
                  className="text-xs px-3 py-1 rounded-md border hover:bg-muted"
                  title="Refresh Secrets"
                >
                  Refresh
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonBox key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : secretRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tidak ada data secrets.
                </p>
              ) : (
                <div className="rounded-md border">
                  {/* horizontal scroll wrapper for small screens */}
                  <div className="overflow-x-auto">
                    <div className="overflow-y-auto max-h-[50vh] md:max-h-[60vh]">
                      {/* Mobile List (hidden on md+) */}
                      <div className="md:hidden divide-y">
                        {sortedSecrets.map((sec) => (
                          <div
                            key={sec.name}
                            className="p-3 flex flex-col gap-1 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="font-mono font-medium truncate max-w-[60%]"
                                title={sec.name}
                              >
                                {sec.name}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                                  sec.status === "active"
                                    ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                                }`}
                              >
                                {sec.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                              <span>
                                Service:{" "}
                                <span className="text-foreground">
                                  {sec.service || "-"}
                                </span>
                              </span>
                              <span>
                                Profile:{" "}
                                <span className="text-foreground">
                                  {sec.profile || "-"}
                                </span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Desktop Table */}
                      <table className="w-full text-sm min-w-[640px] hidden md:table">
                        <thead className="bg-muted/50">
                          <tr className="text-left">
                            <th className="px-3 py-2 font-medium sticky top-0 z-20 bg-muted/50">
                              Name
                            </th>
                            <th className="px-3 py-2 font-medium sticky top-0 z-20 bg-muted/50">
                              Service
                            </th>
                            <th className="px-3 py-2 font-medium sticky top-0 z-20 bg-muted/50">
                              Profile
                            </th>
                            <th
                              className="px-3 py-2 font-medium cursor-pointer select-none sticky top-0 z-20 bg-muted/50"
                              onClick={() => setSecretSortAsc((p) => !p)}
                              title="Klik untuk ubah urutan status"
                            >
                              Status {secretSortAsc ? "↑" : "↓"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSecrets.map((sec) => (
                            <tr
                              key={sec.name}
                              className="border-t hover:bg-muted/30"
                            >
                              <td
                                className="px-3 py-2 font-mono text-xs max-w-[180px] truncate"
                                title={sec.name}
                              >
                                {sec.name}
                              </td>
                              <td className="px-3 py-2">
                                {sec.service || "-"}
                              </td>
                              <td className="px-3 py-2">
                                {sec.profile || "-"}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                                    sec.status === "active"
                                      ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                                      : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                                  }`}
                                >
                                  {sec.status === "active"
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Loader loading={loading} />
    </>
  );
}
