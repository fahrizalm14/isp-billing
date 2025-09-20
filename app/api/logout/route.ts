import { NextResponse } from "next/server";

export async function GET() {
  // Hapus cookie dengan mengatur expired ke masa lalu
  const response = NextResponse.json({ message: "Logout berhasil" });
  response.cookies.set("token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0), // expired langsung
  });

  return response;
}
