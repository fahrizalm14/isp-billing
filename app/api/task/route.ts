import { auditSubscription, generateInvoice } from "@/lib/task";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { taskType } = await req.json();

    if (!taskType)
      return NextResponse.json(
        { error: "Tipe task tidak dikenali!" },
        { status: 400 }
      );

    if (taskType === "invoice") await generateInvoice();
    if (taskType === "audit") await auditSubscription();

    return NextResponse.json(
      {
        success: true,
        message: `Berhasil menjalankan tasks ${taskType}`,
      },
      {
        status: 201,
      }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
