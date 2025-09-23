import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import z from "zod/v3";

const midtransSchema = z.object({
  midtransServerKey: z.string().min(1, "Server Key wajib diisi"),
  midtransSecretKey: z.string().min(1, "Secret Key wajib diisi"),
});

// POST: simpan config Midtrans
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = midtransSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Validasi gagal",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { midtransServerKey, midtransSecretKey } = result.data;

    const info = await prisma.websiteInfo.findFirst();
    if (!info) {
      return NextResponse.json(
        {
          message:
            "Setting WebsiteInfo tidak ditemukan, harap isi info di pengaturan!",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.websiteInfo.update({
      where: { id: info.id },
      data: { midtransServerKey, midtransSecretKey },
    });

    return NextResponse.json(
      {
        message: "Config Midtrans berhasil disimpan",
        data: {
          midtransServerKey: updated.midtransServerKey,
          midtransSecretKey: updated.midtransSecretKey,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST Midtrans error:", error);
    return NextResponse.json(
      {
        message: "Terjadi kesalahan server",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// GET: ambil config Midtrans
export async function GET() {
  try {
    const info = await prisma.websiteInfo.findFirst();

    if (!info || !info.midtransServerKey || !info.midtransSecretKey) {
      return NextResponse.json(
        {
          message: "Config Midtrans belum diatur",
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Config Midtrans ditemukan",
        data: {
          midtransServerKey: info.midtransServerKey,
          midtransSecretKey: info.midtransSecretKey,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Midtrans error:", error);
    return NextResponse.json(
      {
        message: "Terjadi kesalahan server",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
