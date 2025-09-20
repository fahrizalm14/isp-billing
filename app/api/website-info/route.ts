import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await prisma.websiteInfo.findFirst();

    const response = {
      name: data?.name || "",
      alias: data?.alias || "",
      logoUrl: data?.logoUrl || "",
      description: data?.description || "",
      address: data?.address || "",
      phone: data?.phone || "",
      email: data?.email || "",
      website: data?.website || "",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET WebsiteInfo error:", error);
    return NextResponse.json(
      { error: "Failed to fetch website info" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const existing = await prisma.websiteInfo.findFirst();

    let data;
    if (existing) {
      data = await prisma.websiteInfo.update({
        where: { id: existing.id },
        data: body,
      });
    } else {
      data = await prisma.websiteInfo.create({
        data: body,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("POST WebsiteInfo error:", error);
    return NextResponse.json(
      { error: "Failed to save website info" },
      { status: 500 }
    );
  }
}
