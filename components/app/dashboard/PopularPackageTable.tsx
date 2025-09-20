"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PopularPackage = {
  no: number;
  name: string;
  speed: string;
  price: number;
  customers: number;
};

export default function PopularPackageTable({
  data,
}: {
  data: PopularPackage[];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        Tidak ada data paket terpopuler.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">No</TableHead>
            <TableHead>Nama Paket</TableHead>
            <TableHead>Kecepatan</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead className="text-center">Jumlah Pelanggan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((pkg) => (
            <TableRow key={pkg.no}>
              <TableCell className="text-center">{pkg.no}</TableCell>
              <TableCell>{pkg.name}</TableCell>
              <TableCell>{pkg.speed}</TableCell>
              <TableCell>Rp {pkg.price.toLocaleString("id-ID")}</TableCell>
              <TableCell className="text-center">{pkg.customers}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
