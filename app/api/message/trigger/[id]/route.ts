/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod/v3";

const triggerSchema = z.object({
  key: z.string().min(1, "Key wajib diisi"),
  description: z.string().optional(),
  templateId: z.string().min(1, "Template wajib diisi"),
  scope: z.enum(["ADMIN", "SUPPORT", "USER"]),
});

// PATCH (Update Trigger)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  // ✅ harus di-await sebelum destructure
  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = triggerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validasi gagal", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.trigger.update({
      where: { id },
      data: parsed.data,
      include: { template: true },
    });

    return NextResponse.json(
      {
        message: "Trigger berhasil diupdate",
        data: {
          id: updated.id,
          key: updated.key,
          description: updated.description,
          templateId: updated.templateId,
          templateName: updated.template.name,
          scope: updated.scope,
          isActive: updated.isActive,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PATCH Trigger Error:", err);
    return NextResponse.json(
      { message: "Gagal update trigger" },
      { status: 500 }
    );
  }
}

// DELETE (Remove Trigger)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const deleted = await prisma.trigger.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Trigger berhasil dihapus", data: deleted },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE Trigger Error:", err);
    return NextResponse.json(
      { message: "Gagal menghapus trigger" },
      { status: 500 }
    );
  }
}
