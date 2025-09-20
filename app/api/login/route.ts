import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    type WebsiteInfo = {
      name: string;
      description: string;
      address: string;
      phone: string;
      email: string;
      alias: string;
      logoUrl: string;
    };

    const website = await prisma.websiteInfo.findFirst();

    const websiteInfo: WebsiteInfo = {
      name: website?.name ?? "",
      description: website?.description ?? "",
      address: website?.address ?? "",
      phone: website?.phone ?? "",
      email: website?.email ?? "",
      logoUrl: website?.logoUrl ?? "",
      alias: website?.alias ?? "",
    };

    if (!user) {
      return NextResponse.json(
        { message: "Email tidak ditemukan" },
        { status: 401 }
      );
    }

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Password salah" }, { status: 401 });
    }

    const token = sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // "ADMIN" atau "CUSTOMER"
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
    const response = NextResponse.json({
      message: "Login berhasil",
      role: user.role,
      token,
      websiteInfo,
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = await cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };

    return NextResponse.json({ id: decoded.id, role: decoded.role });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
