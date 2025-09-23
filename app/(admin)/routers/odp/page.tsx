"use client";

import OdpFormModal, { OdpInput } from "@/components/OdpFormModal";
import { OdpMapData } from "@/components/OdpMap";
import { SwalToast } from "@/components/SweetAlert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirm-dialog";
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
    .filter((odp) => odp.latitude && odp.longitude)
    .map((odp) => ({
      id: odp.id ?? odp.routerId,
      name: odp.name,
      coordinate: `${odp.latitude},${odp.longitude}`,
      portCapacity: parseInt(odp.capacity || "0"),
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
  usedPort?: number;
};

export default function OdpListPage() {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOdp, setSelectedOdp] = useState<OdpInput | null>(null);
  const [odps, setOdps] = useState<IResOdp[]>([]);
  const [odp, setOdp] = useState({
    id: "",
    name: "",
    open: false,
  });

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
      setOdps(json.data ?? []);
      setTotalPages(Math.max(1, Math.ceil((json.total ?? 0) / 15)));
    } catch (error) {
      console.error("Gagal fetch data ODP", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOne = async (odpId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/router/odp/${odpId}`, { method: "DELETE" });
      const result = await res.json();

      if (res.ok) {
        SwalToast.fire({ icon: "success", title: "ODP berhasil dihapus!" });
        fetchData();
      } else {
        throw new Error(result?.error || "Gagal menghapus ODP.");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      SwalToast.fire({
        icon: "error",
        title: "Terjadi kesalahan saat menghapus ODP",
      });
    } finally {
      setLoading(false);
    }
  };

  const OdpMap = dynamic(
    () => import("@/components/OdpMap").then((m) => m.OdpMap),
    {
      ssr: false,
    }
  );

  return (
    <>
      <div className="px-4 sm:px-6 py-6">
        <h2 className="text-xl font-semibold mb-4">
          Optical Distribution Point
        </h2>

        <div className="grid gap-4 lg:grid-cols-7">
          {/* KIRI: daftar & kontrol */}
          <div className="lg:col-span-3 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                className="bg-primary text-primary-foreground px-3 py-2 rounded hover:bg-primary/90 w-full sm:w-auto"
                onClick={() => {
                  setSelectedOdp(null);
                  setModalOpen(true);
                }}
              >
                + Tambah ODP
              </button>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
                <input
                  type="text"
                  placeholder="Cari ODP…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded px-3 py-2 w-full sm:w-64"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchData();
                  }}
                />
                <button
                  className="bg-secondary text-secondary-foreground px-3 py-2 rounded hover:bg-secondary/90 flex items-center justify-center gap-2 w-full sm:w-auto"
                  title="Refresh data"
                  onClick={fetchData}
                >
                  <FaSyncAlt className="shrink-0" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* LIST MOBILE (cards) */}
            <div className="sm:hidden space-y-3">
              {odps.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center">
                    Tidak ada data ODP.
                  </CardContent>
                </Card>
              ) : (
                odps.map((_odp, index) => (
                  <Card key={_odp.id ?? index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{_odp.name}</CardTitle>
                      <CardDescription>{_odp.location}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm grid grid-cols-2 gap-y-1">
                      <div className="text-muted-foreground">Wilayah</div>
                      <div>{_odp.region}</div>
                      <div className="text-muted-foreground">Penggunaan</div>
                      <div>
                        {_odp.usedPort} / {_odp.capacity}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-end gap-4">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                          setSelectedOdp({
                            capacity: `${_odp.capacity}`,
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
                        className="text-gray-600 hover:underline"
                        onClick={() =>
                          setOdp({ id: _odp.id!, name: _odp.name, open: true })
                        }
                      >
                        Hapus
                      </button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>

            {/* LIST DESKTOP (table) */}
            <div className="hidden sm:block">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden border rounded">
                    <Table className="min-w-[720px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center w-14">No</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Lokasi</TableHead>
                          <TableHead className="whitespace-nowrap">
                            Wilayah
                          </TableHead>
                          <TableHead className="whitespace-nowrap">
                            Penggunaan
                          </TableHead>
                          <TableHead className="text-center w-40">
                            Aksi
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {odps.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-6">
                              Tidak ada data ODP.
                            </TableCell>
                          </TableRow>
                        ) : (
                          odps.map((_odp, index) => (
                            <TableRow key={_odp.id ?? index}>
                              <TableCell className="text-center">
                                {(page - 1) * 15 + index + 1}
                              </TableCell>
                              <TableCell className="max-w-[220px] truncate">
                                {_odp.name}
                              </TableCell>
                              <TableCell className="max-w-[260px] truncate">
                                {_odp.location}
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate">
                                {_odp.region}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {_odp.usedPort} / {_odp.capacity}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center gap-3">
                                  <button
                                    className="text-blue-600 hover:underline"
                                    onClick={() => {
                                      setSelectedOdp({
                                        capacity: `${_odp.capacity}`,
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
                                    className="text-gray-600 hover:underline"
                                    onClick={() =>
                                      setOdp({
                                        id: _odp.id!,
                                        name: _odp.name,
                                        open: true,
                                      })
                                    }
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
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
          </div>

          {/* KANAN: Peta */}
          <div className="lg:col-span-4 min-w-0">
            <Card className="h-full overflow-visible">
              {" "}
              {/* <-- penting */}
              <CardHeader>
                <CardTitle>Pemetaan</CardTitle>
              </CardHeader>
              {/* izinkan anak “keluar” */}
              <CardContent className="overflow-visible p-0">
                {" "}
                {/* <-- penting */}
                <div className="relative z-10 h-[50vh] min-h-[300px] max-h-[600px]">
                  <OdpMap
                    data={convertOdps(
                      odps.map((_odp) => ({
                        capacity: `${_odp.capacity}`,
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
              <CardFooter className="overflow-visible">
                <CardDescription className="text-xs sm:text-sm">
                  Peta menampilkan lokasi & kapasitas ODP di wilayah layanan.
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

      <ConfirmDialog
        open={odp.open}
        onOpenChange={(change) =>
          setOdp((_prev) => ({ ..._prev, open: change }))
        }
        title="Hapus item?"
        description={
          <>
            Tindakan ini tidak bisa dibatalkan. Untuk mengkonfirmasi, ketik nama
            item persis.
          </>
        }
        requiredText={odp.name}
        matchMode="equals" // tidak case sensitive
        confirmLabel="Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={() => handleDeleteOne(odp.id)}
      />
    </>
  );
}
