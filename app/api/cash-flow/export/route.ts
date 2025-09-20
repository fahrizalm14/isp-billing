import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Parameter from dan to wajib diisi" },
        { status: 400 }
      );
    }

    // ✅ pastikan range dari awal hari sampai akhir hari
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T23:59:59.999Z`);

    // ambil data cashflow
    const cashflows = await prisma.cashflow.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: "asc" },
    });

    // buat workbook excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cashflow");

    // header
    worksheet.columns = [
      { header: "Tanggal", key: "date", width: 15 },
      { header: "Tipe", key: "type", width: 12 },
      { header: "Jumlah", key: "amount", width: 15 },
      { header: "Deskripsi", key: "description", width: 30 },
      { header: "Referensi", key: "reference", width: 20 },
    ];

    // isi data
    cashflows.forEach((cf) => {
      worksheet.addRow({
        date: new Date(cf.date).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        type: cf.type,
        amount: cf.amount,
        description: cf.description || "-",
        reference: cf.reference || "-",
      });
    });

    // styling header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" }, // abu-abu terang
      };
    });

    // generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="cashflow_${from}_to_${to}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengekspor cashflow" },
      { status: 500 }
    );
  }
}
