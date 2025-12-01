import {
  auditSubscription,
  checkInactiveConnections,
  generateInvoice,
} from "@/lib/task";
import { processMessages } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

// semua task harus fungsi async, return apa aja boleh
const tasks: Record<string, () => Promise<unknown>> = {
  invoice: generateInvoice, // Promise<number>
  audit: auditSubscription, // mungkin Promise<void>
  message: processMessages, // Promise<void>
  connection: checkInactiveConnections, // Promise<number>
};

export async function POST(req: Request) {
  try {
    const { taskType } = await req.json();

    if (!taskType || !tasks[taskType]) {
      return NextResponse.json(
        { error: `Task ${taskType || "unknown"} tidak dikenali!` },
        { status: 400 }
      );
    }

    const result = await tasks[taskType]();

    return NextResponse.json(
      {
        success: true,
        message: `✅ Berhasil menjalankan task ${taskType}`,
        result, // biar kalau ada return (contoh invoice count) bisa ikut dikirim
      },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("❌ Task error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const results: Record<string, unknown> = {};

    // jalankan semua task secara berurutan
    for (const [name, fn] of Object.entries(tasks)) {
      try {
        results[name] = await fn();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        results[name] = { error: err.message };
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "✅ Semua task berhasil dijalankan",
        results,
      },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("❌ Task error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
