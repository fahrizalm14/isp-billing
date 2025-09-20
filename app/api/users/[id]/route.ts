import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// GET: Get single user
export async function GET(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT: Update single user
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { name, email, role, status, password } = await req.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      name,
      email,
      role,
      status,
    };

    if (password && password.trim() !== "") {
      const hashedPassword = await hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PUT /api/users/:id]", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE: Delete single user
export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
