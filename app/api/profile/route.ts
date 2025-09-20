export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const _user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          address: true,
        },
      },
    },
  });

  const userProfile = _user?.profile;

  const response = {
    name: _user?.name ?? "",
    phone: userProfile?.phone ?? "",
    street: userProfile?.address?.street ?? "",
    subDistrict: userProfile?.address?.subDistrict ?? "",
    district: userProfile?.address?.district ?? "",
    city: userProfile?.address?.city ?? "",
    province: userProfile?.address?.province ?? "",
    postalCode: userProfile?.address?.postalCode ?? "",
  };

  return NextResponse.json(response);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Flatten address before validation
    const parsed = profileSchema.parse({
      ...body,
      ...body.address,
    });

    const {
      userId,
      name,
      phone,
      street,
      subDistrict,
      district,
      city,
      province,
      postalCode,
    } = parsed;

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        phone,
        address: {
          create: {
            city,
            district,
            province,
            subDistrict,
            postalCode,
            street,
          },
        },
      },
      update: {
        phone,
        address: {
          update: {
            city,
            district,
            province,
            subDistrict,
            postalCode,
            street,
          },
        },
        user: {
          update: {
            name,
          },
        },
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
