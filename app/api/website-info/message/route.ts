import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import z from "zod/v3";

const configSchema = z.object({
  apiUrl: z.string().url("URL tidak valid"),
  apiKey: z.string().min(1, "API Key wajib diisi"),
  apiSecret: z.string().min(1, "Secret wajib diisi"),
  adminPhone: z.string().min(1, "Admin phone wajib diisi"),
  supportPhone: z.string().min(1, "Support phone wajib diisi"),
});

// POST: simpan config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = configSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          message: "Validasi gagal",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const config = result.data;

    const info = await prisma.websiteInfo.findFirst();
    if (!info) {
      return NextResponse.json(
        {
          message: "Setting tidak ditemukan, harap isi info di pengaturan!",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.websiteInfo.update({
      where: { id: info.id },
      data: config,
    });

    return NextResponse.json(
      {
        message: "Config berhasil disimpan",
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Terjadi kesalahan server",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// GET: ambil config
export async function GET() {
  try {
    const info = await prisma.websiteInfo.findFirst();
    if (!info) {
      return NextResponse.json(
        {
          message: "Config belum diatur",
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Config ditemukan",
        data: {
          apiUrl: info.apiUrl,
          apiKey: info.apiKey,
          apiSecret: info.apiSecret,
          adminPhone: info.adminPhone,
          supportPhone: info.supportPhone,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Terjadi kesalahan server",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
