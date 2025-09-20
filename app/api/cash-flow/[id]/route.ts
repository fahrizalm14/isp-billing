import { updateCashFlow } from "@/lib/cashFlow";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    const data = await prisma.cashflow.findUnique({ where: { id } });
    if (!data)
      return NextResponse.json(
        { error: "Kas tidak ditemukan!" },
        { status: 400 }
      );
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Get cashflow error:", error);
    return NextResponse.json({ error: "Gagal get cashflow" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    const data = await prisma.cashflow.delete({ where: { id } });
    if (!data)
      return NextResponse.json(
        { error: "Kas tidak ditemukan!" },
        { status: 400 }
      );
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Delete cashflow error:", error);
    return NextResponse.json(
      { error: "Gagal hapus cashflow" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    const body = await req.json();
    const data = await updateCashFlow(id, {
      ...body,
      date: new Date(body.date),
    });
    if (!data)
      return NextResponse.json(
        { error: "Kas tidak ditemukan!" },
        { status: 400 }
      );
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Delete cashflow error:", error);
    return NextResponse.json(
      { error: "Gagal hapus cashflow" },
      { status: 500 }
    );
  }
}
