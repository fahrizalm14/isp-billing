import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const templateSchema = z.object({
  name: z.string().min(1, "Nama template wajib diisi"),
  content: z.string().min(1, "Isi template wajib diisi"),
});

// GET all templates
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      message: "OK",
      data: templates.map((template) => ({ ...template, nama: template.name })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST create new template
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = templateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Validasi gagal",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: result.data,
    });

    return NextResponse.json(
      {
        message: "Template berhasil disimpan",
        data: { ...template, nama: template.name },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to create template" },
      { status: 500 }
    );
  }
}

// DELETE template by id (query param ?id=...)
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { message: "Parameter 'id' wajib diberikan" },
        { status: 400 }
      );
    }

    // attempt delete
    const deleted = await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        message: "Template berhasil dihapus",
        data: { ...deleted, nama: deleted.name },
      },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err);
    // Prisma will throw if not found
    if (err?.code === "P2025") {
      return NextResponse.json(
        { message: "Template tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Gagal menghapus template" },
      { status: 500 }
    );
  }
}
