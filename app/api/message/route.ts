import { prisma } from "@/lib/prisma";
import { fillTemplate } from "@/types/helper";
import { NextRequest, NextResponse } from "next/server";
import z from "zod/v3";

const createMessageSchema = z.object({
  messageType: z.enum(["all", "direct"]),
  user: z.string().optional(), // subscriptionId kalau direct
  content: z.string().min(1, "Content cannot be empty"), // ini template
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { messageType, user, content } = parsed.data;

    if (messageType === "direct") {
      if (!user)
        return NextResponse.json({ message: "User required" }, { status: 400 });

      const subs = await prisma.subscription.findUnique({
        where: { id: user },
        include: { userProfile: true, package: true, usersPPPOE: true },
      });

      if (!subs || !subs.userProfile?.phone) {
        return NextResponse.json(
          { message: "Subscription/phone not found" },
          { status: 404 }
        );
      }

      const parsedContent = fillTemplate(content, {
        nama: subs.userProfile.name,
        paket: subs.package.name,
        noLangganan: subs.number,
        userPPP: subs.usersPPPOE.length ? subs.usersPPPOE[0].username : "",
        passwordPPP: subs.usersPPPOE.length ? subs.usersPPPOE[0].password : "",
      });

      const message = await prisma.message.create({
        data: {
          triggerKey: null,
          toNumber: subs.userProfile.phone,
          content: parsedContent,
          status: "QUEUED",
        },
      });

      return NextResponse.json(
        { message: "Message created", data: message },
        { status: 201 }
      );
    }

    if (messageType === "all") {
      const subsList = await prisma.subscription.findMany({
        include: { userProfile: true, package: true },
      });

      const messages = await prisma.$transaction(
        subsList
          .filter((s) => s.userProfile?.phone)
          .map((s) =>
            prisma.message.create({
              data: {
                triggerKey: null,
                toNumber: s.userProfile!.phone!,
                content: fillTemplate(content, {
                  nama: s.userProfile?.name,
                  paket: s.package.name,
                  noLangganan: s.number,
                }),
                status: "QUEUED",
              },
            })
          )
      );

      return NextResponse.json(
        { message: `Queued for ${messages.length} users`, data: messages },
        { status: 201 }
      );
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error", error: (err as Error).message },
      { status: 500 }
    );
  }
}

// masker nomor kalau tidak ada nama
function maskNumber(num: string) {
  if (num.length <= 6) return num;
  return num.slice(0, 3) + "****" + num.slice(-3);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(
      100,
      parseInt(searchParams.get("pageSize") || "10", 10)
    );
    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      prisma.message.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.message.count(),
    ]);

    const numbers = [...new Set(rows.map((m) => m.toNumber))];
    const profiles = await prisma.userProfile.findMany({
      where: { phone: { in: numbers } },
      select: { phone: true, name: true },
    });
    const phoneToName = new Map(profiles.map((p) => [p.phone!, p.name]));

    const data = rows.map((m) => ({
      id: m.id,
      createdAt: m.createdAt.toISOString(),
      kategori: m.triggerKey ?? "Manual",
      user: phoneToName.get(m.toNumber) || maskNumber(m.toNumber),
      content: m.content,
      status: m.status as "QUEUED" | "SENT" | "FAILED",
    }));

    return NextResponse.json({
      message: "OK",
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error", error: (err as Error).message },
      { status: 500 }
    );
  }
}
