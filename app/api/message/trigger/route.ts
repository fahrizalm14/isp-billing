import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const triggerSchema = z.object({
  key: z.string().min(1),
  description: z.string().optional(),
  templateId: z.string().min(1),
  scope: z.enum(["ADMIN", "SUPPORT", "USER"]),
});

// GET: semua trigger
export async function GET() {
  try {
    const triggers = await prisma.trigger.findMany({
      include: { template: true },
      orderBy: { createdAt: "desc" },
    });

    const data = triggers.map((t) => ({
      id: t.id,
      key: t.key,
      description: t.description,
      templateName: t.template.name,
      isActive: t.isActive,
      scope: t.scope,
    }));

    return NextResponse.json({ message: "OK", data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to fetch triggers" },
      { status: 500 }
    );
  }
}

// POST: tambah trigger baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = triggerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { key, description, templateId, scope } = parsed.data;

    const trigger = await prisma.trigger.create({
      data: { key, description, templateId, scope },
      include: { template: true },
    });

    return NextResponse.json(
      {
        message: "Trigger created",
        data: {
          id: trigger.id,
          key: trigger.key,
          description: trigger.description,
          templateName: trigger.template.name,
          isActive: trigger.isActive,
          scope: trigger.scope,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error", error: (err as Error).message },
      { status: 500 }
    );
  }
}
