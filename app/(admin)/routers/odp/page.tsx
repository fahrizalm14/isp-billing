"use client";

import OdpFormModal, { OdpInput } from "@/components/OdpFormModal";
import { OdpMapData } from "@/components/OdpMap";
import { showConfirm, SwalToast } from "@/components/SweetAlert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Loader from "@/components/ui/custom/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FaSyncAlt } from "react-icons/fa";

function convertOdps(oldOdps: OdpInput[]): OdpMapData[] {
  return oldOdps
    .filter((odp) => odp.latitude && odp.longitude) // pastikan data koordinat ada
    .map((odp) => ({
      id: odp.id ?? odp.routerId,
      name: odp.name,
      coordinate: `${odp.latitude},${odp.longitude}`,
      portCapacity: odp.capacity,
      districtName: odp.region,
    }));
}

export type IResOdp = {
  id?: string;
  name: string;
  location: string;
  longitude?: string;
  latitude?: string;
  region: string;
  capacity: number;
  routerId?: string;
  usedPort?: number; // ✅ tambahkan ini
};

export default function OdpListPage() {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOdp, setSelectedOdp] = useState<OdpInput | null>(null);
  const [odps, setOdps] = useState<IResOdp[]>([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/router/odp?search=${encodeURIComponent(
          search
        )}&page=${page}&limit=15`
      );
      const json = await res.json();
      setOdps(json.data); // asumsi: json.data adalah array of odp
      setTotalPages(Math.ceil(json.total / 15));
    } catch (error) {
      console.error("Gagal fetch data ODP", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOne = async (odpId: string) => {
    const confirm = await showConfirm(
      "Yakin ingin menghapus odp ini?",
      "warning",
      true
    );
    if (!confirm) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/router/odp/${odpId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (res.ok) {
        SwalToast.fire({
          icon: "success",
          title: "Odp berhasil dihapus!",
        });
        fetchData();
      } else {
        throw new Error(result.error || "Gagal menghapus odp.");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan saat menghapus user",
      });
    } finally {
      setLoading(false);
    }
  };

  const OdpMap = dynamic(
    () => import("@/components/OdpMap").then((mod) => mod.OdpMap),
    { ssr: false }
  );

  return (
    <>
      <div className="p-6">
        <h2 className="text-xl font-semibold">Optical Distribution Point</h2>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-7">
          <div className="lg:col-span-3">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 mb-4 flex-wrap">
              {/* Kiri - Tambah ODP */}
              <button
                className="bg-primary text-white px-3 py-2 rounded hover:bg-primary/90 flex items-center justify-center gap-2 w-full sm:w-auto"
                onClick={() => {
                  setSelectedOdp(null);
                  setModalOpen(true);
                }}
              >
                +
              </button>

              {/* Kanan - Search & Refresh */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <input
                  type="text"
                  placeholder="Search odp..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded px-3 py-2 w-full sm:w-64"
                />
                <button
                  className="bg-primary text-white px-3 py-2 rounded hover:bg-primary/90 flex items-center justify-center gap-2 w-full sm:w-auto"
                  title="Refresh data"
                  onClick={fetchData}
                >
                  <FaSyncAlt className="shrink-0" />
                  Refresh
                </button>
              </div>
            </div>

            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Wilayah</TableHead>
                    <TableHead>Penggunaan</TableHead>
                    <TableHead className="px-4 py-2 text-center">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {odps.length === 0 ? (
                    <TableRow>
                      <td colSpan={6} className="text-center py-4">
                        Tidak ada data ODP.
                      </td>
                    </TableRow>
                  ) : (
                    odps.map((_odp, index) => (
                      <TableRow key={_odp.id}>
                        <TableCell className="text-center">
                          {(page - 1) * 15 + index + 1}
                        </TableCell>
                        <TableCell>{_odp.name}</TableCell>
                        <TableCell>{_odp.location}</TableCell>
                        <TableCell>{_odp.region}</TableCell>
                        <TableCell>
                          {_odp.usedPort} / {_odp.capacity}
                        </TableCell>
                        <TableCell className="text-center space-x-2">
                          <button
                            className="text-sm text-blue-600 hover:underline"
                            onClick={() => {
                              setSelectedOdp({
                                capacity: _odp.capacity,
                                location: _odp.location,
                                name: _odp.name,
                                region: _odp.region,
                                routerId: _odp.routerId!,
                                id: _odp.id,
                                latitude: _odp.latitude!,
                                longitude: _odp.longitude,
                              });
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-sm text-gray-600 hover:underline"
                            onClick={() => {
                              handleDeleteOne(_odp.id!);
                            }}
                          >
                            Hapus
                          </button>
                          {/* Tambahkan tombol delete jika perlu */}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-between items-center">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="bg-muted px-3 py-1 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={page === totalPages}
                    className="bg-muted px-3 py-1 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          </div>{" "}
          <div className="col-span-1 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Pemetaan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <OdpMap
                    data={convertOdps(
                      odps.map((_odp) => ({
                        capacity: _odp.capacity,
                        location: _odp.location,
                        name: _odp.name,
                        region: _odp.region,
                        routerId: _odp.routerId!,
                        id: _odp.id,
                        latitude: _odp.latitude!,
                        longitude: _odp.longitude,
                      }))
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <CardDescription>
                  Peta di atas menampilkan lokasi dan kapasitas ODP (Optical
                  Distribution Point) yang tersedia di wilayah layanan. Setiap
                  titik pada peta menunjukkan posisi ODP dengan informasi
                  kapasitas port dan wilayah distriknya.
                </CardDescription>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <Loader loading={loading} />
      <OdpFormModal
        show={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedOdp(null);
        }}
        onSuccess={fetchData}
        initialData={selectedOdp ?? undefined}
      />
    </>
  );
}
