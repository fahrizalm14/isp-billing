import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// GET: List Users
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
        skip,
        take: limit,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return NextResponse.json({ users, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET users failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST: Create User
export async function POST(req: NextRequest) {
  try {
    const {
      name,
      email,
      password,
      role = "ADMIN",
      status = "ACTIVE",
    } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        status,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("POST user failed:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// PATCH: Bulk Status Update
export async function PATCH(req: NextRequest) {
  const { userIds, status } = await req.json();

  if (
    !Array.isArray(userIds) ||
    !["ACTIVE", "SUSPEND", "PENDING"].includes(status)
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { status },
    });

    return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update users" },
      { status: 500 }
    );
  }
}
